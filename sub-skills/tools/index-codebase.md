---
name: index-codebase
description: 使用 ctags 或 tree-sitter 后备方案为源代码目录生成符号索引
argument-hint: "<directory>"
allowed-tools: [Bash, Read, Write]
---

## index-codebase（代码库索引）

为源代码目录生成符号索引，并在 `raw/sources/<slug>.codebase.md` 创建代码库地图。

### 工具依赖

| 工具 | 必需 | 安装 |
|------|----------|---------|
| `uv` | 是 | `curl -LsSf https://astral.sh/uv/install.sh \| sh`（Git Bash / Linux / macOS） |
| `ctags` | 否（首选） | macOS：`brew install universal-ctags`；Linux：`apt install universal-ctags`；Windows：`scoop install ctags` 或从 github.com/universal-ctags/ctags-win32 下载 |
| `tree-sitter-languages` | 否（用于方案 B） | `uv run --with tree-sitter-languages` |

**Windows（Git Bash/MSYS）说明：**
- 所有临时文件（脚本文件、中间数据）使用 `raw/.tmp/` — 切勿依赖 `/tmp/`
- 如果 `ctags` 不可用，方案 B（tree-sitter）无需上述包之外的外部依赖即可工作

### 何时使用

- 用户提供源代码目录并希望建立索引
- 用户说"索引这个代码库"或"映射这个源码树"
- `project-init` 识别出需要索引的代码目录

### 步骤

1. 确认目录存在且包含源文件。
2. 从目录名派生出 slug（kebab-case）。
3. 检查 `ctags`：
   - 运行 `ctags --version`
   - 如果找到 → 使用下面的**方案 A**
   - 如果未找到 → 使用下面的**方案 B**

---

### 方案 A：ctags（首选）

运行 ctags 生成 tags 文件。将输出写入项目目录（而非 `/tmp/`）：

```bash
ctags -R --fields=+nKz --extras=+q --output-format=json -f "raw/sources/<slug>.tags.json" "<directory>"
```

解析 JSON tags 文件：

```bash
python - << 'PYEOF'
import sys, json
from pathlib import Path

tags_file = Path('raw/sources/<slug>.tags.json')
if not tags_file.exists():
    sys.stderr.write('ctags output not found\n')
    sys.exit(1)

symbols = []
with open(tags_file, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
            symbols.append({
                'name': entry.get('name', ''),
                'kind': entry.get('kind', '?'),
                'path': entry.get('path', ''),
                'line': entry.get('line', 0),
                'language': entry.get('language', '')
            })
        except json.JSONDecodeError:
            continue

by_kind = {}
for s in symbols:
    by_kind.setdefault(s['kind'], []).append(s)

summary = {kind: items[:30] for kind, items in by_kind.items()}
langs = sorted(set(s['language'] for s in symbols if s['language']))

output = {'total': len(symbols), 'languages': langs, 'kinds': list(by_kind.keys()), 'summary': summary}
json.dump(output, sys.stdout)
PYEOF
```

---

### 方案 B：tree-sitter（需要 tree-sitter 和 tree-sitter-c）

**步骤 B1：** 先将 Python 脚本写入临时文件（避免 heredoc 引号问题）：

```
使用 Write 工具将以下脚本创建为 `raw/.tmp/llm_wiki_index_code.py`。
```

```python
# llm_wiki_index_code.py — tree-sitter based C/C++ symbol indexer
# Run: uv run --with tree-sitter-languages python raw/.tmp/llm_wiki_index_code.py <dir> <output.json>
import sys, json
from pathlib import Path
from tree_sitter_languages import get_language, get_parser

lang_c = get_language('c')
parser_c = get_parser('c')

C_DIR = Path(sys.argv[1])
OUTPUT = Path(sys.argv[2])

def parse_file(filepath):
    content = filepath.read_text(encoding='utf-8', errors='ignore')
    source_bytes = bytes(content, 'utf8')
    tree = parser_c.parse(source_bytes)
    return tree, source_bytes

def walk_tree(tree, source_bytes, filepath):
    symbols = {"functions": [], "structs": [], "enums": [], "macros": [], "typedefs": []}
    stack = [(tree.root_node, False)]  # (node, children_processed)

    while stack:
        node, children_processed = stack.pop()

        if not children_processed:
            if node.type == 'function_definition':
                decl = node.child_by_field_name('declarator')
                if decl:
                    fn_name = None
                    if decl.type == 'identifier':
                        fn_name = source_bytes[decl.start_byte:decl.end_byte].decode('utf8')
                    elif decl.type == 'function_declarator':
                        inner = decl.child_by_field_name('declarator')
                        if inner and inner.type == 'identifier':
                            fn_name = source_bytes[inner.start_byte:inner.end_byte].decode('utf8')
                    if fn_name:
                        symbols["functions"].append({
                            "name": fn_name,
                            "file": str(filepath),
                            "line": node.start_point[0] + 1
                        })
            elif node.type == 'type_definition':
                decl = node.child_by_field_name('declarator')
                if decl and decl.type == 'type_identifier':
                    typedef_name = source_bytes[decl.start_byte:decl.end_byte].decode('utf8')
                    symbols["typedefs"].append({
                        "name": typedef_name,
                        "file": str(filepath),
                        "line": node.start_point[0] + 1
                    })
            elif node.type in ('struct_specifier', 'union_specifier'):
                name_node = node.child_by_field_name('name')
                if name_node:
                    sname = source_bytes[name_node.start_byte:name_node.end_byte].decode('utf8')
                    symbols["structs"].append({
                        "name": sname,
                        "file": str(filepath),
                        "line": node.start_point[0] + 1
                    })
            elif node.type == 'enum_specifier':
                name_node = node.child_by_field_name('name')
                if name_node:
                    ename = source_bytes[name_node.start_byte:name_node.end_byte].decode('utf8')
                    symbols["enums"].append({
                        "name": ename,
                        "file": str(filepath),
                        "line": node.start_point[0] + 1
                    })
            elif node.type == 'preproc_def':
                name_node = node.child_by_field_name('name')
                if name_node:
                    mname = source_bytes[name_node.start_byte:name_node.end_byte].decode('utf8')
                    symbols["macros"].append({
                        "name": mname,
                        "file": str(filepath),
                        "line": node.start_point[0] + 1
                    })

            num_children = node.child_count
            if num_children > 0:
                stack.append((node, True))  # marker to process children
                for i in range(num_children - 1, -1, -1):
                    stack.append((node.child(i), False))

    return symbols

all_symbols = {"functions": [], "structs": [], "enums": [], "macros": [], "typedefs": []}
for cfile in C_DIR.rglob("*.c"):
    tree, source_bytes = parse_file(cfile)
    syms = walk_tree(tree, source_bytes, cfile)
    for k in all_symbols:
        all_symbols[k].extend(syms[k])
for hfile in C_DIR.rglob("*.h"):
    tree, source_bytes = parse_file(hfile)
    syms = walk_tree(tree, source_bytes, hfile)
    for k in all_symbols:
        all_symbols[k].extend(syms[k])

for k in all_symbols:
    seen = set()
    all_symbols[k] = [x for x in all_symbols[k] if x["name"] not in seen and not seen.add(x["name"])]

result = {
    "total": sum(len(v) for v in all_symbols.values()),
    "counts": {k: len(v) for k, v in all_symbols.items()},
    "summary": {k: v[:50] for k, v in all_symbols.items()}
}
OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Done: {result['total']} symbols indexed")
```

**步骤 B2：** 使用 uv 运行，将目录和输出路径作为参数传递：

```bash
uv run --with tree-sitter-languages python raw/.tmp/llm_wiki_index_code.py "<directory>" "raw/sources/<slug>.codebase.json"
```

---

4. 解析方案 A 或 B 的 JSON 输出。包含 `total`、`counts`、`kinds` 和 `summary`（每类前 30-50 个符号）。
5. 在 `raw/sources/<slug>.codebase.md` 写入代码库地图：

```
---
title: "<目录名，标题式大写>"
type: codebase_map
root_path: "<绝对路径>"
file_count: <从目录扫描估算>
primary_languages: [<语言1>, <语言2>]
index_tool: <universal-ctags | tree-sitter>
coverage_status: indexed
---

# <标题>

## 概述
此代码库的简要描述（从目录结构推断）。

## 目录结构
```
<目录树前2层>
```

## 关键符号索引
索引中的顶级符号。完整数据见 `raw/sources/<slug>.codebase.json`。

### 函数
| 符号 | 文件 | 行号 |
|--------|------|------|
<在 summary['functions'] 中按名称排序的每个函数：>
| `<名称>` | `<文件>` | `<行号>` |

### 数据结构
| 符号 | 文件 | 行号 |
|--------|------|------|
<在 summary['structs'] 中按名称排序的每个结构体：>
| `<名称>` | `<文件>` | `<行号>` |

### 枚举
| 符号 | 文件 |
|--------|------|
<在 summary['enums'] 中按名称排序的每个枚举：>
| `<名称>` | `<文件>` |

### 宏 / 定义
出现最多的前 30 个宏：
| 符号 | 文件 |
|--------|------|
<在 summary['macros'] 中按名称排序的每个宏：>
| `<名称>` | `<文件>` |

## 如何使用此地图
- 运行 `code-anchor` 将特定符号链接到其 wiki 页面。
- 接下来对来源地图中最高优先级章节执行 `ingest`。
- 完整符号数据：`raw/sources/<slug>.codebase.json`
```

6. 保存地图文件。
7. 在 `log.md` 中追加日志条目：
   `## [YYYY-MM-DD] index-codebase | <dirname> — N 个符号已索引（N 个函数，N 个结构体，N 个枚举，N 个宏）`
   注意：`typedefs` 在日志摘要中计入 `structs`。

8. **报告地图文件路径后，说明下一步操作：**
   - "建议下一步：运行 `code-anchor` 将关键函数绑定到其 wiki 页面，然后对来源地图中最高优先级章节执行 `ingest`"

### 输出

报告以下路径：
- 已创建：`raw/sources/<slug>.codebase.md`
- 原始数据：`raw/sources/<slug>.codebase.json`
- 临时脚本：`raw/.tmp/llm_wiki_index_code.py`（会话范围，仅方案 B）
