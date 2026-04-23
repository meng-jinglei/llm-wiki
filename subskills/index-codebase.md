---
name: index-codebase
description: Generate a symbol index for a source code directory using ctags.
argument-hint: "<directory>"
allowed-tools: [Bash, Read, Write]
---

## index-codebase

Generate a symbol index for a source code directory and create a
codebase map at `raw/sources/<slug>.codebase.md`.

### When to use

- User provides a directory of source code and wants it indexed
- User says "index this codebase" or "map this source tree"
- `project-init` identified a code directory that needs indexing

### Prerequisites

The `ctags` tool must be installed. On macOS: `brew install universal-ctags`.
On Linux: `apt install universal-ctags` or equivalent.
On Windows: install via package manager (e.g. `scoop install ctags`).

### Steps

1. Confirm the directory exists and contains source files.
2. Check for `ctags`: run `ctags --version`. If not found, instruct the user
   to install it and stop.
3. Derive the slug from the directory name (kebab-case).
4. Run ctags to generate a tags file:

```bash
ctags -R --fields=+nKz --extras=+q --output-format=json -f /tmp/llm-wiki-tags.json "<directory>"
```

5. Parse the JSON tags file and generate a summary:

```bash
python - << 'PYEOF'
import sys, json
from pathlib import Path

tags_file = Path('/tmp/llm-wiki-tags.json')
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

# Group by kind
by_kind = {}
for s in symbols:
    by_kind.setdefault(s['kind'], []).append(s)

# Pick top 30 per kind for the summary
summary = {kind: items[:30] for kind, items in by_kind.items()}

# Detect primary languages
langs = sorted(set(s['language'] for s in symbols if s['language']))

output = {
    'total': len(symbols),
    'languages': langs,
    'kinds': list(by_kind.keys()),
    'summary': summary
}
json.dump(output, sys.stdout)
PYEOF
```

6. Parse the JSON output from step 5. It contains `total`, `languages`,
   `kinds`, and `summary` (top 30 symbols per kind).
7. Write the codebase map at `raw/sources/<slug>.codebase.md`:

```
---
title: "<directory name, title-cased>"
type: codebase_map
root_path: "<absolute path>"
file_count: <estimated from tags>
primary_languages: [<language1>, <language2>]
index_tool: universal-ctags
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
Top symbols from the ctags index. Full index available at `/tmp/llm-wiki-tags.json`.

### Functions
| Symbol | File | Line |
|--------|------|------|
<for each function in summary['function'] sorted by name:>
| `<name>` | `<path>` | `<line>` |

### Data Structures
| Symbol | File | Line |
|--------|------|------|
<for each struct/class in summary:>
| `<name>` | `<path>` | `<line>` |

### Macros / Defines
| Symbol | File | Line |
|--------|------|------|
<for each macro in summary:>
| `<name>` | `<path>` | `<line>` |

## How to Use This Map
- Run `code-anchor` to link a specific symbol to its wiki page.
- Run `ingest --from-codebase <slug> --symbol <name>` to ingest a symbol's definition.
- The full tags file is at `/tmp/llm-wiki-tags.json` for ad-hoc queries.
```

8. Save the map file.
9. Append a log entry to `log.md`:
   `## [YYYY-MM-DD] index-codebase | <dirname> — N symbols indexed (N languages)`

10. Report the created map file path.

### Output

Report these paths:
- Created: `raw/sources/<slug>.codebase.md`
- Index: `/tmp/llm-wiki-tags.json` (temporary, session-scoped)
