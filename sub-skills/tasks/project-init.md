---
name: project-init
description: Build wiki knowledge around an existing project — scan structure, create raw/wiki skeleton.
---

## project-init

Use when the user wants to build wiki knowledge around an existing project.

Examples:
- "I have a firmware project with source code and a chip manual, set up the wiki"
- "Initialize the workspace for this MCU project"

### Steps

1. Scan the project for module structure (top-level dirs, key files, build config).
2. Identify external dependencies (SDK headers, chip manuals, data sheets).
3. Create the llm-wiki structure (raw/, wiki/) if not present.
4. Create or update `wiki/overview.md` with the project map.
5. Create `wiki/entities/` entries for major modules or components.
6. If a chip/manual is present, create a lightweight source map in `raw/sources/`.
7. Set `project_relevance` on each source map section based on whether the project uses it.
8. Report all touched paths and suggest the next step (likely `code-anchor`).

Do not ingest any section during init. The goal is to build the skeleton and set priorities.

After project-init, state the concrete next steps:
  1. `map-document` on <manual-file> → creates `raw/sources/<slug>.map.md`
  2. `index-codebase` on <code-dir> → creates `raw/sources/<slug>.codebase.md`
  3. `ingest` on the highest-priority pending section from the source map

### 输出结构

```
<project-root>/
├── CLAUDE.md              ← 复制自 templates/vault-CLAUDE.md
├── index.md               ← 入口页（链接到 wiki/overview.md）
├── log.md                 ← 初始化记录
├── raw/
│   ├── sources/           ← （待建档时填充）
│   └── assets/            ← （附件/大文件）
└── wiki/
    ├── overview.md        ← 项目地图（模块、外设、关键文件）
    ├── sources/           ← 源记录（每份文档一个）
    ├── concepts/          ← 概念页
    ├── entities/          ← 实体页（模块、组件）
    ├── analyses/          ← 分析页
    └── comparisons/      ← 对比页
```