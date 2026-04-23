---
name: index-codebase
description: Generate a symbol index for a source code directory using ctags or Python regex fallback.
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
| Python stdlib | Yes (for Option B) | Built-in, no install needed |

**Windows (Git Bash/MSYS) notes:**
- Use `raw/.tmp/` for all temporary files (script files, intermediate data) — never rely on `/tmp/`
- If `ctags` is not available, Option B (Python regex) works without any external dependencies

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

### Option B: Python regex fallback (no ctags needed)

**Step B1:** Use Write tool to create `raw/.tmp/llm_wiki_index_code.py` (the project already has a `raw/` directory from init):

```python
import sys, os, re, json
from pathlib import Path

C_DIR = Path(sys.argv[1])
OUTPUT = Path(sys.argv[2])

FUNCTION_RE = re.compile(
    r'^(?:static\s+|extern\s+|inline\s+)*'
    r'(?:\w+\s+)*'
    r'(\w+)\s*\([^)]*\)\s*[{;]',
    re.MULTILINE
)
STRUCT_RE = re.compile(r'^typedef\s+(?:struct|union)\s*\w*\s*\{[^}]*\}\s*(\w+)\s*;', re.MULTILINE | re.DOTALL)
ENUM_RE = re.compile(r'^typedef\s+enum\s*\w*\s*\{[^}]*\}\s*(\w+)\s*;', re.MULTILINE | re.DOTALL)
MACRO_RE = re.compile(r'^\s*#\s*define\s+(\w+)\s*(?:$|[/\(])', re.MULTILINE)

symbols = {"functions": [], "structs": [], "enums": [], "macros": []}

for cfile in C_DIR.rglob("*.c"):
    content = cfile.read_text(encoding='utf-8', errors='ignore')
    for m in FUNCTION_RE.finditer(content):
        symbols["functions"].append({"name": m.group(1), "file": str(cfile), "line": content[:m.start()].count('\n') + 1})
    for m in STRUCT_RE.finditer(content):
        symbols["structs"].append({"name": m.group(1), "file": str(cfile), "line": 0})
    for m in ENUM_RE.finditer(content):
        symbols["enums"].append({"name": m.group(1), "file": str(cfile), "line": 0})
    for m in MACRO_RE.finditer(content):
        symbols["macros"].append({"name": m.group(1), "file": str(cfile), "line": 0})

for hfile in C_DIR.rglob("*.h"):
    content = hfile.read_text(encoding='utf-8', errors='ignore')
    for m in MACRO_RE.finditer(content):
        symbols["macros"].append({"name": m.group(1), "file": str(hfile), "line": 0})
    for m in STRUCT_RE.finditer(content):
        symbols["structs"].append({"name": m.group(1), "file": str(hfile), "line": 0})
    for m in ENUM_RE.finditer(content):
        symbols["enums"].append({"name": m.group(1), "file": str(hfile), "line": 0})

for kind in symbols:
    seen = set()
    symbols[kind] = [x for x in symbols[kind] if x["name"] not in seen and not seen.add(x["name"])]

result = {"total": sum(len(v) for v in symbols.values()), "counts": {k: len(v) for k, v in symbols.items()}, "summary": {k: v[:50] for k, v in symbols.items()}}
OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Done: {result['total']} symbols indexed")
```

**Step B2:** Run with uv, passing directory and output paths as arguments:

```bash
uv run python raw/.tmp/llm_wiki_index_code.py "<directory>" "raw/sources/<slug>.codebase.json"
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
index_tool: <universal-ctags | python-regex>
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

8. **After reporting the map file path, state the next action:**
   - "Suggested next: run `code-anchor` to bind key functions to their wiki pages, then `ingest` on the highest-priority section from the source map"

### Output

Report these paths:
- Created: `raw/sources/<slug>.codebase.md`
- Raw data: `raw/sources/<slug>.codebase.json`
- Temp script: `raw/.tmp/llm_wiki_index_code.py` (session-scoped, Option B only)
