---
name: index-codebase
description: Generate a symbol index for a source code directory using ctags or tree-sitter fallback.
argument-hint: "<directory>"
allowed-tools: [Bash, Read, Write]
---

## index-codebase

Generate a symbol index for a source code directory and create a
codebase map at `raw/sources/<slug>.codebase.md`.

### Tool Assumptions

| Tool | Required | Install |
|------|----------|---------|
| `uv` | Yes | `curl -LsSf https://astral.sh/uv/install.sh \| sh` (Git Bash / Linux / macOS) |
| `ctags` | No (preferred) | macOS: `brew install universal-ctags`; Linux: `apt install universal-ctags`; Windows: `scoop install ctags` or download from github.com/universal-ctags/ctags-win32 |
| `tree-sitter-languages` | No (for Option B) | `uv run --with tree-sitter-languages` |

**Windows (Git Bash/MSYS) notes:**
- Use `raw/.tmp/` for all temporary files (script files, intermediate data) — never rely on `/tmp/`
- If `ctags` is not available, Option B (tree-sitter) works without any external dependencies beyond the packages above

### When to use

- User provides a directory of source code and wants it indexed
- User says "index this codebase" or "map this source tree"
- `project-init` identified a code directory that needs indexing

### Steps

1. Confirm the directory exists and contains source files.
2. Derive the slug from the directory name (kebab-case).
3. Check for `ctags`:
   - Run `ctags --version`
   - If found → use **Option A** below
   - If not found → use **Option B** below

---

### Option A: ctags (preferred)

Run ctags to generate a tags file. Write output to the project directory (not `/tmp/`):

```bash
ctags -R --fields=+nKz --extras=+q --output-format=json -f "raw/sources/<slug>.tags.json" "<directory>"
```

Parse the JSON tags file:

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

### Option B: tree-sitter (requires tree-sitter and tree-sitter-c)

**Step B1:** Write the Python script to a temp file first (avoids heredoc quoting issues):

```
Use Write tool to create `raw/.tmp/llm_wiki_index_code.py` with the script below.
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

**Step B2:** Run with uv, passing directory and output paths as arguments:

```bash
uv run --with tree-sitter-languages python raw/.tmp/llm_wiki_index_code.py "<directory>" "raw/sources/<slug>.codebase.json"
```

---

4. Parse the JSON output from Option A or B. It contains `total`, `counts`,
   `kinds`, and `summary` (top 30-50 symbols per kind).
5. Write the codebase map at `raw/sources/<slug>.codebase.md`:

```
---
title: "<directory name, title-cased>"
type: codebase_map
root_path: "<absolute path>"
file_count: <estimated from directory scan>
primary_languages: [<language1>, <language2>]
index_tool: <universal-ctags | tree-sitter>
coverage_status: indexed
---

# <title>

## Overview
Brief description of this codebase (infer from directory structure).

## Directory Structure
```
<first 2 levels of directory tree>
```

## Key Symbols Index
Top symbols from the index. Full data at `raw/sources/<slug>.codebase.json`.

### Functions
| Symbol | File | Line |
|--------|------|------|
<for each function in summary['functions'] sorted by name:>
| `<name>` | `<file>` | `<line>` |

### Data Structures
| Symbol | File | Line |
|--------|------|------|
<for each struct in summary['structs'] sorted by name:>
| `<name>` | `<file>` | `<line>` |

### Enums
| Symbol | File |
|--------|------|
<for each enum in summary['enums'] sorted by name:>
| `<name>` | `<file>` |

### Macros / Defines
Top 30 macros by appearance:
| Symbol | File |
|--------|------|
<for each macro in summary['macros'] sorted by name:>
| `<name>` | `<file>` |

## How to Use This Map
- Run `code-anchor` to link a specific symbol to its wiki page.
- Run `ingest` on the highest-priority section from the source map next.
- Full symbol data: `raw/sources/<slug>.codebase.json`
```

6. Save the map file.
7. Append a log entry to `log.md`:
   `## [YYYY-MM-DD] index-codebase | <dirname> — N symbols indexed (N functions, N structs, N enums, N macros)`
   Note: `typedefs` are counted under `structs` in the log summary.

8. **After reporting the map file path, state the next action:**
   - "Suggested next: run `code-anchor` to bind key functions to their wiki pages, then `ingest` on the highest-priority section from the source map"

### Output

Report these paths:
- Created: `raw/sources/<slug>.codebase.md`
- Raw data: `raw/sources/<slug>.codebase.json`
- Temp script: `raw/.tmp/llm_wiki_index_code.py` (session-scoped, Option B only)
