---
name: init
description: Initialize wiki workspace structure when missing required files and folders.
---

## init

Use when the workspace does not yet have the required workflow files and folders.

### Steps

1. Determine the workspace root.
2. Verify the path is a local workspace suitable for the llm-wiki structure.
3. Create these paths if missing:
   - `raw/sources/`
   - `raw/assets/`
   - `wiki/sources/`
   - `wiki/concepts/`
   - `wiki/entities/`
   - `wiki/analyses/`
   - `wiki/comparisons/`
4. Create or repair:
   - `CLAUDE.md`
   - `index.md`
   - `log.md`
   - `wiki/overview.md`
5. Report all touched paths.

### 输出结构

```
<workspace-root>/
├── CLAUDE.md
├── index.md
├── log.md
├── raw/
│   ├── sources/
│   └── assets/
└── wiki/
    ├── overview.md
    ├── sources/
    ├── concepts/
    ├── entities/
    ├── analyses/
    └── comparisons/
```