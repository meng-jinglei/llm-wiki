#!/usr/bin/env python3
"""
Claims 代码块解析器。

解析 wiki 页面中 ```claims 代码块（新格式）或 ## 关键声明 列表（旧格式）
为结构化三元组，输出 JSON 供 compile 阶段二/三使用。

用法:
  python parse-claims.py wiki/peripherals/wdt.md              # 单文件
  python parse-claims.py wiki/                                 # 目录扫描
  python parse-claims.py wiki/ --format json                   # JSON 输出（默认）
  python parse-claims.py wiki/ --format table                  # 表格输出
  python parse-claims.py wiki/ --source manual.pdf             # 查找受影响页面
  python parse-claims.py wiki/ --diff old_wiki/                # 对比两个目录声明差异
"""

import sys, os, re, json, glob

SOURCE_ANCHOR_RE = re.compile(r'→\s*\[(?:来源|Source):\s*([^\]]+)\]')
OLD_CLAIM_RE = re.compile(r'^-\s+(.+?)\s*→\s*\[(?:来源|Source):\s*([^\]]+)\]')

def parse_source_anchor(text: str) -> tuple[str, str]:
    """提取 (文件名, 定位符) 从来源锚点文本。"""
    m = SOURCE_ANCHOR_RE.search(text)
    if not m:
        return ("", "")
    parts = m.group(1).rsplit(",", 1) if "," in m.group(1) else m.group(1).rsplit(" ", 1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return parts[0].strip(), ""


def parse_new_claims_block(block_text: str) -> list[dict]:
    """解析 ```claims 代码块（新格式）。"""
    claims = []
    for line in block_text.strip().split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # 推导规则
        if line.startswith("derived:"):
            rule = line[len("derived:"):].strip()
            claims.append({"type": "derived_rule", "rule": rule})
            continue
        # 事实声明
        if "%%" not in line:
            continue
        fact_part, anchor_part = line.split("%%", 1)
        fact_part = fact_part.strip()
        anchor_part = anchor_part.strip()
        # 解析谓词表达式
        pred_match = re.match(r'(\w+)\((.*)\)', fact_part)
        if not pred_match:
            continue
        predicate = pred_match.group(1)
        params_str = pred_match.group(2)
        # 解析参数
        params = {}
        for param in params_str.split(","):
            param = param.strip()
            if ":" not in param:
                continue
            k, v = param.split(":", 1)
            params[k.strip()] = v.strip()
        # 解析来源锚点
        source_path, locator = parse_source_anchor(anchor_part)
        # 构建三元组
        subject = next(iter(params.values()), "?") if params else "?"
        obj = {k: v for k, v in params.items()}
        claims.append({
            "type": "claim",
            "format": "new",
            "predicate": predicate,
            "subject": subject,
            "params": obj,
            "source_path": source_path,
            "locator": locator,
            "raw": line
        })
    return claims


def parse_old_list_format(section_text: str) -> list[dict]:
    """解析 ## 关键声明 下的旧列表格式。"""
    claims = []
    for line in section_text.strip().split("\n"):
        line = line.strip()
        m = OLD_CLAIM_RE.match(line)
        if not m:
            continue
        claim_text = m.group(1).strip()
        anchor_text = m.group(2).strip()
        source_path, locator = parse_source_anchor(f"→ [来源: {anchor_text}]")
        # 旧格式：解析为 claim(subject:, value:) 三元组
        if ":" in claim_text:
            subject, value = claim_text.split(":", 1)
        else:
            subject, value = claim_text, ""
        claims.append({
            "type": "claim",
            "format": "old",
            "predicate": "claim",
            "subject": subject.strip(),
            "value": value.strip(),
            "source_path": source_path,
            "locator": locator,
            "raw": line
        })
    return claims


def parse_page(filepath: str) -> dict:
    """解析单个 wiki 页面的关键声明。"""
    if not os.path.exists(filepath):
        return {"file": filepath, "error": "file not found", "claims": []}
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    claims = []
    # 方式1：查找 ```claims 代码块
    claims_block_match = re.search(r'```claims\s*\n(.*?)```', content, re.DOTALL)
    if claims_block_match:
        claims = parse_new_claims_block(claims_block_match.group(1))

    # 方式2：回退到旧列表格式
    if not claims:
        section_match = re.search(r'##\s*关键声明\s*\n(.*?)(?=\n##|\Z)', content, re.DOTALL)
        if section_match:
            claims = parse_old_list_format(section_match.group(1))

    # 统计
    direct = [c for c in claims if c.get("type") == "claim"]
    missing_src = [c for c in direct if not c.get("source_path")]
    rules = [c for c in claims if c.get("type") == "derived_rule"]

    has_new = any(c.get("format") == "new" for c in direct)
    has_old = any(c.get("format") == "old" for c in direct)

    return {
        "file": filepath,
        "format": "new" if has_new else ("old" if has_old else "none"),
        "total_claims": len(claims),
        "direct_claims": len(direct),
        "missing_source": len(missing_src),
        "derived_rules": len(rules),
        "claims": claims
    }


def scan_directory(dirpath: str) -> list[dict]:
    """扫描 wiki 目录下所有 .md 文件。"""
    results = []
    pattern = os.path.join(dirpath, "**/*.md")
    for filepath in glob.glob(pattern, recursive=True):
        if "_compiled" in filepath:
            continue
        results.append(parse_page(filepath))
    return results


def detect_conflicts(claims_by_page: list[dict]) -> list[dict]:
    """
    矛盾检测：跨页面收集所有声明，按谓词+主体分组，
    检测同一谓词+主体的不同值（来自不同页面、不同来源）。
    """
    from collections import defaultdict

    # 按 (predicate, subject) 分组
    groups = defaultdict(list)
    for page_result in claims_by_page:
        for claim in page_result.get("claims", []):
            if claim.get("type") != "claim":
                continue
            key = (claim["predicate"], claim["subject"])
            groups[key].append({
                "file": page_result["file"],
                "claim": claim
            })

    conflicts = []
    for (pred, subj), entries in groups.items():
        if len(entries) < 2:
            continue
        # 收集所有不同的值
        values = set()
        for e in entries:
            if e["claim"].get("format") == "new":
                # 新格式：值在 params 中（排除第一个参数，它是 subject）
                val = tuple(sorted((k, v) for k, v in e["claim"]["params"].items()))
            else:
                val = e["claim"].get("value", "")
            values.add(val)

        if len(values) > 1:
            conflicts.append({
                "predicate": pred,
                "subject": subj,
                "entries": entries,
                "value_count": len(values)
            })

    return conflicts


def find_affected_pages(dirpath: str, source_path: str) -> list[dict]:
    """
    找到所有引用指定来源的 wiki 页面。

    Args:
        dirpath: wiki/ 目录路径
        source_path: 来源文件名（如 "R7F0C014_manual.pdf"）或来源 slug

    Returns:
        受影响页面列表，每项包含 file、匹配的声明、匹配类型
    """
    results = scan_directory(dirpath)
    affected = []
    source_basename = os.path.basename(source_path)

    for page_result in results:
        if page_result.get("error"):
            continue
        matched_claims = []
        for claim in page_result.get("claims", []):
            if claim.get("type") != "claim":
                continue
            src = claim.get("source_path", "")
            # 模糊匹配：来源路径包含目标文件名
            if source_basename in src or source_path in src:
                matched_claims.append(claim)

        if matched_claims:
            affected.append({
                "file": page_result["file"],
                "matched_count": len(matched_claims),
                "total_claims": page_result["direct_claims"],
                "claims": matched_claims
            })

    return affected


def diff_claims(old_dir: str, new_dir: str) -> dict:
    """
    对比两个 wiki 目录的声明差异。
    用于检测来源更新后哪些声明发生了变化。

    Returns:
        {added, removed, changed, unchanged} 四类声明差异
    """
    old_results = {r["file"]: r for r in scan_directory(old_dir) if not r.get("error")}
    new_results = {r["file"]: r for r in scan_directory(new_dir) if not r.get("error")}

    diff = {"added": [], "removed": [], "changed": [], "unchanged": []}

    all_files = set(old_results.keys()) | set(new_results.keys())
    for f in all_files:
        old_claims = {
            (c["predicate"], c["subject"]): c
            for c in old_results.get(f, {}).get("claims", [])
            if c.get("type") == "claim"
        }
        new_claims = {
            (c["predicate"], c["subject"]): c
            for c in new_results.get(f, {}).get("claims", [])
            if c.get("type") == "claim"
        }

        old_keys = set(old_claims.keys())
        new_keys = set(new_claims.keys())

        for key in new_keys - old_keys:
            diff["added"].append({"file": f, "key": key, "claim": new_claims[key]})
        for key in old_keys - new_keys:
            diff["removed"].append({"file": f, "key": key, "claim": old_claims[key]})
        for key in old_keys & new_keys:
            old_params = {k: v for k, v in old_claims[key].get("params", {}).items()}
            new_params = {k: v for k, v in new_claims[key].get("params", {}).items()}
            if old_params != new_params:
                diff["changed"].append({
                    "file": f, "key": key,
                    "old": old_claims[key], "new": new_claims[key]
                })
            else:
                diff["unchanged"].append({"file": f, "key": key})

    return diff


def main():
    if len(sys.argv) < 2:
        print("用法: python parse-claims.py <file-or-dir> [--format json|table] [--source <source-path>] [--diff <other-dir>]")
        sys.exit(1)

    target = sys.argv[1]
    fmt = "json"
    if "--format" in sys.argv:
        idx = sys.argv.index("--format")
        fmt = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else "json"

    # --source: find pages affected by a source change
    if "--source" in sys.argv:
        idx = sys.argv.index("--source")
        source_path = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else ""
        affected = find_affected_pages(target, source_path)
        output = {
            "source": source_path,
            "affected_pages": len(affected),
            "pages": affected
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
        return

    # --diff: compare two wiki directories
    if "--diff" in sys.argv:
        idx = sys.argv.index("--diff")
        other_dir = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else ""
        diff = diff_claims(target, other_dir)
        summary = {
            "added": len(diff["added"]),
            "removed": len(diff["removed"]),
            "changed": len(diff["changed"]),
            "unchanged": len(diff["unchanged"])
        }
        output = {"summary": summary, "details": diff}
        print(json.dumps(output, ensure_ascii=False, indent=2))
        return

    if os.path.isfile(target):
        results = [parse_page(target)]
    else:
        results = scan_directory(target)

    conflicts = detect_conflicts(results)

    if fmt == "table":
        print(f"{'文件':<50} {'格式':<5} {'总数':<5} {'缺源':<5} {'规则':<5}")
        print("-" * 75)
        for r in results:
            if r.get("error"):
                continue
            print(f"{r['file']:<50} {r['format']:<5} {r['direct_claims']:<5} "
                  f"{r['missing_source']:<5} {r['derived_rules']:<5}")
        if conflicts:
            print(f"\n⚠️  矛盾: {len(conflicts)} 组")
            for c in conflicts:
                files = [e["file"] for e in c["entries"]]
                print(f"  [{c['predicate']}] {c['subject']} → "
                      f"{c['value_count']} 个不同值 @ {', '.join(files)}")
    else:
        output = {
            "pages": [{k: v for k, v in r.items() if k != "claims"} for r in results if not r.get("error")],
            "conflicts": conflicts,
            "details": results
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
