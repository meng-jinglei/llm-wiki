#!/usr/bin/env python3
"""
Wiki 知识图谱构建工具。

从 wiki/ 目录构建 networkx 图，支持：
- 4 信号边提取（wikilink / 来源重叠 / 声明关联 / 类型亲和）
- Louvain 社区检测 + 凝聚度评分
- 图谱洞察（桥接节点、孤立页面、意外连接、知识缺口）

用法:
  python build-graph.py wiki/                          # 构建图并输出分析
  python build-graph.py wiki/ --format json             # JSON 输出
  python build-graph.py wiki/ --format table             # 表格概览
  python build-graph.py wiki/ --output graph.gexf        # 导出 GEXF
"""

import sys, os, re, json, glob
from collections import defaultdict

try:
    import networkx as nx
except ImportError:
    print("需要 networkx: uv run --with networkx python build-graph.py ...")
    sys.exit(1)

try:
    from networkx.algorithms import community as nx_community
except ImportError:
    nx_community = None


WIKILINK_RE = re.compile(r'\[\[([^\]|#]+)(?:[|#][^\]]+)?\]\]')


def extract_frontmatter(content: str) -> dict:
    """提取 YAML frontmatter。"""
    if not content.startswith("---"):
        return {}
    end = content.find("---", 3)
    if end == -1:
        return {}
    fm_text = content[3:end]
    fm = {}
    for line in fm_text.split("\n"):
        line = line.strip()
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
    return fm


def extract_wikilinks(content: str) -> list[str]:
    """提取所有 [[wikilink]] 目标。"""
    return [m.group(1).strip() for m in WIKILINK_RE.finditer(content)]


def extract_sources(fm: dict) -> list[str]:
    """从 frontmatter sources 字段提取来源列表。"""
    raw = fm.get("sources", "")
    if not raw:
        return []
    # 支持 YAML 列表格式: [a, b] 或 - a\n- b
    if raw.startswith("["):
        items = raw.strip("[]").split(",")
    else:
        items = raw.split("\n")
    return [s.strip().strip("'\"") for s in items if s.strip()]


def page_slug(filepath: str) -> str:
    """页面标识：提取 wiki/ 之后的相对路径（去掉 .md）。"""
    slug = filepath.replace("\\", "/")
    # 找到 wiki/ 的位置，取其后部分
    idx = slug.find("/wiki/")
    if idx != -1:
        slug = slug[idx + 6:]  # 跳过 "/wiki/"
    elif slug.startswith("wiki/"):
        slug = slug[5:]
    if slug.endswith(".md"):
        slug = slug[:-3]
    return slug


def build_graph(wiki_dir: str) -> nx.Graph:
    """从 wiki 目录构建加权知识图谱。"""
    G = nx.Graph()
    pattern = os.path.join(wiki_dir, "**/*.md")
    pages = {}

    for filepath in glob.glob(pattern, recursive=True):
        if "_compiled" in filepath:
            continue
        slug = page_slug(filepath)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        fm = extract_frontmatter(content)
        wikilinks = extract_wikilinks(content)
        sources = extract_sources(fm)
        page_type = fm.get("type", "unknown")

        pages[slug] = {
            "filepath": filepath,
            "type": page_type,
            "status": fm.get("status", "stable"),
            "wikilinks": wikilinks,
            "sources": sources,
            "fm": fm
        }

        G.add_node(slug, type=page_type, status=fm.get("status", "stable"))

    # 信号 1: 直接链接 (×3.0)
    for slug, page in pages.items():
        for target in page["wikilinks"]:
            target_slug = target.replace("wiki/", "").rstrip("/")
            if target_slug in pages:
                G.add_edge(slug, target_slug, weight=3.0, signal="direct_link")

    # 信号 2: 来源重叠 (×4.0)
    source_to_pages = defaultdict(set)
    for slug, page in pages.items():
        for src in page["sources"]:
            if src:
                source_to_pages[src].add(slug)

    for src, sharing_pages in source_to_pages.items():
        sharing = list(sharing_pages)
        for i in range(len(sharing)):
            for j in range(i + 1, len(sharing)):
                existing = G.get_edge_data(sharing[i], sharing[j])
                new_weight = 4.0
                if existing:
                    new_weight = max(existing.get("weight", 0), 4.0)
                G.add_edge(sharing[i], sharing[j], weight=new_weight, signal="shared_source")

    # 信号 3: 类型亲和 (×1.0)
    type_to_pages = defaultdict(set)
    for slug, page in pages.items():
        type_to_pages[page["type"]].add(slug)

    for ptype, same_type_pages in type_to_pages.items():
        same = list(same_type_pages)
        for i in range(len(same)):
            for j in range(i + 1, len(same)):
                if not G.has_edge(same[i], same[j]):
                    G.add_edge(same[i], same[j], weight=1.0, signal="same_type")

    return G, pages


def detect_communities(G: nx.Graph) -> dict:
    """Louvain 社区检测 + 凝聚度评分。"""
    if nx_community is None:
        return {"error": "networkx community module not available", "communities": []}

    communities = list(nx_community.louvain_communities(G, seed=42))
    result = []
    for i, members in enumerate(communities):
        subgraph = G.subgraph(members)
        n = len(members)
        possible_edges = n * (n - 1) / 2 if n > 1 else 1
        actual_edges = subgraph.number_of_edges()
        cohesion = actual_edges / possible_edges if possible_edges > 0 else 0

        top_node = max(members, key=lambda m: G.degree(m)) if members else "?"

        result.append({
            "id": i,
            "members": list(members),
            "size": n,
            "cohesion": round(cohesion, 4),
            "top_node": top_node,
            "warning": cohesion < 0.15 and n >= 3
        })

    result.sort(key=lambda c: c["size"], reverse=True)
    return {"communities": result, "count": len(result)}


def find_insights(G: nx.Graph, communities: list[dict]) -> dict:
    """图谱洞察：桥接节点、孤立页面、意外连接、知识缺口。"""
    # 桥接节点：连接 3+ 社区
    node_to_community = {}
    for c in communities:
        for member in c["members"]:
            node_to_community[member] = c["id"]

    bridge_nodes = []
    for node in G.nodes():
        neighbor_communities = set()
        for neighbor in G.neighbors(node):
            if neighbor in node_to_community:
                neighbor_communities.add(node_to_community[neighbor])
        if len(neighbor_communities) >= 3:
            bridge_nodes.append({
                "node": node,
                "type": G.nodes[node].get("type", "?"),
                "bridges": len(neighbor_communities),
                "communities": list(neighbor_communities)
            })
    bridge_nodes.sort(key=lambda b: b["bridges"], reverse=True)

    # 孤立页面：度 ≤ 1
    isolated = []
    for node in G.nodes():
        if G.degree(node) <= 1:
            isolated.append({
                "node": node,
                "type": G.nodes[node].get("type", "?"),
                "degree": G.degree(node)
            })
    isolated.sort(key=lambda i: i["degree"])

    # 稀疏社区
    sparse = [c for c in communities if c.get("warning")]

    # 意外连接：跨社区 + 跨类型 + 低权重
    surprising = []
    for u, v, data in G.edges(data=True):
        u_comm = node_to_community.get(u)
        v_comm = node_to_community.get(v)
        u_type = G.nodes[u].get("type", "?")
        v_type = G.nodes[v].get("type", "?")
        weight = data.get("weight", 0)

        surprise_score = 0
        if u_comm is not None and v_comm is not None and u_comm != v_comm:
            surprise_score += 2  # 跨社区
        if u_type != v_type:
            surprise_score += 1  # 跨类型
        if weight <= 1.0:
            surprise_score += 1  # 弱连接但依然存在

        if surprise_score >= 2:
            surprising.append({
                "u": u, "v": v,
                "u_type": u_type, "v_type": v_type,
                "signal": data.get("signal", "?"),
                "weight": weight,
                "surprise_score": surprise_score
            })
    surprising.sort(key=lambda s: s["surprise_score"], reverse=True)

    return {
        "bridge_nodes": bridge_nodes[:10],
        "isolated_pages": isolated,
        "sparse_communities": sparse,
        "surprising_connections": surprising[:10],
        "stats": {
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "density": round(nx.density(G), 4),
            "connected_components": nx.number_connected_components(G)
        }
    }


def main():
    if len(sys.argv) < 2:
        print("用法: python build-graph.py wiki/ [--format json|table] [--output graph.gexf]")
        sys.exit(1)

    wiki_dir = sys.argv[1]
    fmt = "json"
    out_path = None

    args = sys.argv[2:]
    i = 0
    while i < len(args):
        if args[i] == "--format" and i + 1 < len(args):
            fmt = args[i + 1]; i += 2
        elif args[i] == "--output" and i + 1 < len(args):
            out_path = args[i + 1]; i += 2
        else:
            i += 1

    if not os.path.isdir(wiki_dir):
        print(f"目录不存在: {wiki_dir}")
        sys.exit(1)

    G, pages = build_graph(wiki_dir)
    communities = detect_communities(G)
    insights = find_insights(G, communities.get("communities", []))

    if out_path:
        nx.write_gexf(G, out_path)
        print(f"图已导出: {out_path}")

    if fmt == "table":
        print(f"节点: {insights['stats']['total_nodes']} | "
              f"边: {insights['stats']['total_edges']} | "
              f"密度: {insights['stats']['density']} | "
              f"连通分量: {insights['stats']['connected_components']}")
        print()

        clusters = communities.get("communities", [])
        if clusters:
            print(f"{'社区':<6} {'大小':<5} {'凝聚度':<8} {'代表节点':<30} {'警告'}")
            print("-" * 60)
            for c in clusters:
                warn = "[SPARSE]" if c["warning"] else ""
                print(f"{c['id']:<6} {c['size']:<5} {c['cohesion']:<8} "
                      f"{c['top_node']:<30} {warn}")

        bridge = insights.get("bridge_nodes", [])
        if bridge:
            print(f"\n[BRIDGE] 桥接节点 ({len(bridge)}):")
            for b in bridge[:5]:
                print(f"  [{b['type']}] {b['node']} -> {b['bridges']} communities")

        isolated = insights.get("isolated_pages", [])
        if isolated:
            print(f"\n[ISOLATED] 孤立页面 ({len(isolated)}):")
            for i in isolated[:5]:
                print(f"  [{i['type']}] {i['node']} (deg={i['degree']})")

        surprising = insights.get("surprising_connections", [])
        if surprising:
            print(f"\n[SURPRISING] 意外连接 ({len(surprising)}):")
            for s in surprising[:5]:
                print(f"  [{s['u_type']}] {s['u']} <-> [{s['v_type']}] {s['v']} "
                      f"(score={s['surprise_score']}, via {s['signal']})")

    else:
        output = {
            "stats": insights["stats"],
            "communities": communities,
            "insights": insights
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
