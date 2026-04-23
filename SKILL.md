---
name: llm-wiki
description: Run a skill-first knowledge workflow inside a local Markdown workspace
argument-hint: "<url, file, text, question, page, or action>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__fetch__fetch
  - TaskCreate
  - TaskUpdate
  - TaskList
---

<objective>
Run a skill-first knowledge workflow inside a local Markdown workspace.
The workspace accumulates knowledge across sessions, projects, and sources —
not by re-discovering from raw documents on every query, but by compiling
and maintaining a persistent wiki that compounds over time.

Every claim in the wiki must cite its source. Every query must declare
where its answer comes from. Every large source must be processable in
sections with interruptible progress.

Works for: document ingestion, project-driven knowledge acquisition,
code-document binding, and large-file incremental wiki-building.
Obsidian is an optional interface, not a prerequisite.
</objective>

<inputs>
User input may be one of these:
- a URL to capture
- a local file path inside or outside the workspace
- pasted text content
- a question to answer from the wiki
- a request to review, reorganize, merge, split, rename, or refresh wiki pages
- a request to correct outdated or inaccurate wiki content
- a request to initialize wiki structure for an existing project
- a request to link source code and wiki pages bidirectionally
- a request to map a large document's structure or index a codebase
</inputs>

## 使用方式

直接告诉我要做什么：

| 用户意图示例 | 执行的工作流 | 说明 |
|-------------|-------------|------|
| "初始化这个项目的wiki" / "帮我建wiki结构" | `project-init` | 扫描项目，搭建 raw/wiki 骨架 |
| "把这个PDF建档" / "捕获这个URL" | `capture` | 保存到 raw 层，记录元数据 |
| "建档第5章" / "把这份文档消化进wiki" | `ingest` | 提取知识，更新 wiki 页面 |
| "问个问题" / "wiki里怎么说的" | `query` | 从 wiki 回答，声明来源 |
| "检查wiki一致性" / "review一下" | `review` | 9项健康检查，CRITICAL/WARN/INFO |
| "合并这两个页面" / "整理一下这个目录" | `curate` | 重组结构，保留关联 |
| "帮我绑定代码和手册" | `code-anchor` | 双向绑定：wiki知道代码，代码知道wiki |
| "画出手册结构" / "PDF目录提取" | `map-document` | 提取 PDF/DOCX/PPTX 大纲 |
| "索引这个代码目录" | `index-codebase` | 生成代码符号地图 |

Ambiguous requests default to the narrowest matching workflow.

<vault_assumptions>
- Work inside a local Markdown workspace that Claude can read and update.
- Prefer direct filesystem reads and writes for reliability.
- If the `obsidian` CLI is available, treat it as an optional enhancement for search and navigation.
- If the CLI is unavailable, fall back to `Glob` and `Grep`.
- Only use `obsidian://open` or GUI-opening behavior when the user explicitly asks for it.
</vault_assumptions>

## 配置说明

### Claude Code 设置

建议在 `~/.claude/settings.json` 中配置：

```json
{
  "permissions": {
    "allow": ["Bash(*)", "Read(*)", "Write(*)", "Edit(*)", "Glob(*)", "Grep(*)"],
    "deny": ["Bash(rm -rf:*)", "Bash(chmod:*)"]
  }
}
```

### 工作空间本地配置

在工作空间根目录创建 `.claude/settings.local.json`，可覆盖全局配置：

```json
{
  "permissions": {
    "deny": ["Bash(rm -rf:*)"]
  }
}
```

### 必需依赖

| 工具 | 用途 | 安装 |
|------|------|------|
| `uv` | Python 依赖隔离 | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| `tree-sitter-languages` | C/C++ AST 解析（代码符号索引） | `uv run --with tree-sitter-languages` |
| `pdfplumber` | PDF 结构提取 | `uv run --with pdfplumber` |
| `PyPDF2` | PDF 解析备用 | `uv run --with PyPDF2` |

### Windows 注意事项

- `/tmp/` 可能不可写，请使用项目内路径 `raw/.tmp/` 存放临时脚本
- 始终将文件路径作为命令行参数传递，避免 heredoc 中的 unicode 路径问题

<core_model>
The workflow assumes three layers:
1. `raw/` — captured sources and attachments
2. `wiki/` — maintained knowledge pages
3. `CLAUDE.md` + templates — schema and workflow rules

The wiki is the primary answer surface. Raw sources are traceable inputs, not the default response layer.
</core_model>

<tool_assumptions>
The skill delegates heavy work (PDF parsing, code indexing) to external tools.
All tool dependencies are declared here with fallbacks.

| Tool | Purpose | Required | Fallback |
|------|---------|----------|---------|
| `uv` | Python dependency isolation | Yes | None — must be installed |
| `tree-sitter-languages` | C/C++ AST parsing for symbol index | Via --with | (none — primary tool) |
| `pdfplumber` | PDF structure extraction | Via --with | PyPDF2 via --with |

**Install `uv`:** `curl -LsSf https://astral.sh/uv/install.sh | sh`
(Git Bash / Linux / macOS — same command on all three)

**Platform notes:**
- On Windows (Git Bash / MSYS): `/tmp/` may not be writable — write outputs to project-internal paths (`raw/sources/`) instead
- Always pass file paths as command-line arguments, never via stdin or heredoc — avoids quoting issues with spaces and unicode characters
</tool_assumptions>

<path_rule>
Always annotate meaningful file operations with workspace-relative paths.

Examples:
- `→ 写入: raw/sources/article-name.md`
- `← 读取: wiki/concepts/self-attention.md`
- search results should include file paths
- summaries should list every created or updated path

**Windows / non-ASCII path compatibility:**
- When old_string in Edit contains non-ASCII characters (Chinese, Japanese, etc.), the Edit tool may fail silently.
  Workaround: use `uv run python` to perform the replacement, or break edits into smaller pieces that avoid non-ASCII strings in old_string.
- Always pass file paths as command-line arguments to Python scripts, never via heredoc or stdin — avoids quoting issues with unicode filenames.
- Write Python script files to `raw/.tmp/` (project-internal), not `/tmp/`, on Windows.
</path_rule>

<global_rules>
- Keep `raw/` immutable after capture.
- Prefer updating existing pages over creating near-duplicates.
- Use the wiki first when answering questions.
- Surface contradictions and uncertainty instead of flattening them away.
- Treat human correction as a first-class workflow.
- Update `log.md` for meaningful capture, ingest, save-back, review, curate, and correction actions.
  For long-running or multi-session tasks, include a `task_status` block at the end of the log entry so interrupted sessions can resume:
  ```markdown
  ## [2026-04-23] ingest | R7F0C014 ch12 WDT
  - Created wiki/sources/r7f0c014-manual-ch12-wdt.md ✅
  - Updated wiki/peripherals/wdt.md ✅
  - **task_status: s12 (complete) → next: s14 (pending) | coverage: partial**
  ```
- Keep `index.md` as a lightweight entry point, not a giant exhaustive registry.
- Default to the smallest coherent change set that satisfies the workflow.
- If a request could fit multiple workflows, choose the narrowest workflow that preserves the user's intent.
- If a workflow writes files, always report touched paths grouped by created, updated, or unchanged.
- If a query result is worth keeping, ask before saving it back into the workspace.
- Every factual claim written into the wiki must include a source anchor.
  Format: `→ [Source: raw/sources/filename.md]` or `→ [Source: filename.md:p.XX]`.
  Example: `→ [Source: RA4M2_manual.pdf, p.134]`. No claim should exist
  without a traceable source. This applies to all wiki pages and all workflows
  that produce wiki content.
- Every query answer must declare its sources. Read the wiki before answering.
  After answering, state which wiki pages informed the response, even if the
  answer also draws on training knowledge. If the wiki is silent on a topic,
  say so rather than fabricating a wiki-backed answer.
</global_rules>

## 安全规则

- **不修改 raw 层** — capture 后 raw/ 内容不可更改，源文件永远是 traceable 锚点
- **不静默丢弃信息** — 矛盾和不一致必须显式 surface，不悄悄选择一个版本
- **不经用户确认不删除** — curate/review 发现孤儿页面或重复页面时，必须先报告再处理
- **不暴露敏感内容** — source anchor 中不包含内网路径、密钥或凭证
- **人类修正优先** — 用户说"这个页面错了"等同于最高优先级信号，立即响应

<large_file_protocol>
Treat a source as large when it is impractical or wasteful to read end-to-end in one pass.

Common cases:
- long manuals and reference PDFs
- scanned PDFs that may need OCR
- large tables, spreadsheets, or register maps
- logs, traces, or long generated reports
- archives or multi-attachment source packs

Rules:
- capture the original file first and keep it immutable under `raw/`
- when the source is a file attachment, prefer storing the original artifact in `raw/assets/`
- create or update a source record in `raw/sources/` before broad ingest
- create or update a source map when broad ingest would otherwise be wasteful or hard to verify
- for manuals and similar references, record the file path, source type, version if known, page count if known, and the most important sections or page ranges
- read the structure first: table of contents, headings, page ranges, filenames, or nearby index notes
- ingest by relevant section or topic, not by blind full-document passes
- preserve page ranges, section names, or other source anchors when writing summaries and claims
- keep dense tables and volatile implementation detail in source-facing pages when possible, and only promote stable conclusions into maintained wiki pages
- if the wiki is still missing evidence, say which page range, section, or attachment should be checked next instead of pretending the whole source has been reviewed

<source_map_protocol>
A source map is a lightweight working map for a large or awkward source. It helps later ingest and query work find the right section without repeatedly re-reading the whole source.

Required fields:
- file path
- source type
- structure mode
- structure basis
- confidence
- major sections or working sections
- useful page ranges or other source anchors when known
- coverage status

Structure modes:
1. `explicit_toc`
   - Use when the source already exposes reliable structure.
   - Examples: manuals with a table of contents, standards, and long reports with stable headings.
2. `inferred_structure`
   - Use when the source has no reliable table of contents, but meaningful structure can still be inferred.
   - Examples: long slide decks, chapterless lecture notes, and exported web documents.
3. `coarse_map`
   - Use when reliable structure cannot be extracted.
   - Examples: OCR-poor scans, image-heavy PDFs, logs, traces, and mixed attachment packs.

Required markings:
- whether the structure is document-derived or inferred
- how confident the structure is
- whether coverage is partial, mapped, or broad enough for the current task
- what still needs review next

Minimum source map shape:
```yaml
title:
type: source_map
source_type:
file_path:
structure_mode: explicit_toc | inferred_structure | coarse_map
structure_basis:
confidence: high | medium | low
coverage_status: partial | mapped | focused_ingest_complete
```

Suggested sections:
- Overview
- Structure notes
- Section map
- High-value ranges
- Extraction caveats
- Remaining coverage

Do not present inferred structure as if it were an official table of contents.

## Large-File Incremental Ingest

When a source exceeds what can be processed in one pass, use the source map
as a progress tracker and process it section by section.

### Section execution fields

Each entry in `sections[]` gains these fields:

```yaml
sections:
  - id: s01
    title: "Chapter 3: Clock Generation Circuit"
    page_range: "120-156"
    priority: high          # high | medium | low — ingest order
    status: pending         # pending | active | complete | skipped
    claim_anchor_format: "p.134"  # how to cite this section in wiki claims
    open_questions: []      # questions that arose during ingest but weren't answered
    next_action: ""          # what to do next: e.g. "check p.142 for register table"
```

### Incremental ingest rules

- On every section ingest, update the section's `status` in the source map.
- Process sections in `priority` order: `high` first, then `medium`, then `low`.
- A section with `status: skipped` was reviewed but produced no wiki-relevant content.
- A section with `status: complete` has been fully ingested; its claims are in the wiki.
- `open_questions` accumulate unanswerable questions during ingest; they do not block progress.
- When ingest is interrupted, report: the next `pending` section's `id`,
  its `page_range`, and the current `coverage_status` so the next session can resume.

### Resuming interrupted ingest

On resume, read the source map and find the first section where `status: pending`.
Ingest from that section forward. Do not re-ingest completed sections.
After completing a section, update its `status` to `complete` before moving on.

### Code-anchor pattern

When the source is a hardware manual and the workspace contains project source code,
use the `code-anchor` workflow (see workflows) to establish bidirectional links between
wiki pages and source files.
</source_map_protocol>
</large_file_protocol>

<workflows>

## init
See `sub-skills/tasks/init.md` for the full workflow.

## capture
See `sub-skills/tasks/capture.md` for the full workflow.

### 输出结构

```
raw/sources/<slug>.md         ← 捕获的源记录（URL内容 / 文本摘要）
raw/assets/<original-file>    ← 大文件附件（PDF/DOCX等）
```

## ingest
Use when the user wants a source turned into wiki updates.

See `sub-skills/tasks/ingest.md` for the full workflow.

### 输出结构

```
wiki/sources/<slug>.md         ← 源记录（每份源文档一个，保留页码锚点）
wiki/<type>/<name>.md         ← 知识页面（peripherals/concepts/entities 等）
index.md                       ← 入口页更新（如有必要）
log.md                         ← ingest 记录
```

## query
Use when the user asks a question about the wiki.

See `sub-skills/tasks/query.md` for the full workflow.

### 输出结构

无文件写入。如用户同意保存，输出至：
```
wiki/analyses/<slug>.md     ← 保存的分析结果
wiki/comparisons/<slug>.md   ← 保存的对比结果
```

## review
Use when the user wants a health check, maintenance pass, or consistency review.

See `sub-skills/tasks/review.md` for the full workflow with 9-point checklist.

### 输出结构

无文件写入（仅报告）。如用户要求修复：
```
<修改的页面>                 ← frontmatter 补充 / 重复行删除 / 链接添加
log.md                       ← review 记录
```

## curate
Use when the user wants human-led restructuring or refinement.

See `sub-skills/tasks/curate.md` for the full workflow.

### 输出结构

```
<修改的页面>                ← 合并/拆分/重命名后的页面
index.md                    ← 链接更新（如有必要）
log.md                      ← curation 记录
```

## project-init
Use when the user wants to build wiki knowledge around an existing project.

See `sub-skills/tasks/project-init.md` for the full workflow.

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

## code-anchor
Use when the user points to a source file and wants wiki knowledge about it,
or when the user points to a wiki page and wants to know which source code uses it.

Examples:
- "What does the clock_config.c file configure? What manual section covers it?"
- "I want to link the PWM wiki page to the actual code that uses it"

See `sub-skills/tasks/code-anchor.md` for the full workflow.

Key principle: the wiki page knows which code uses it, and the code knows which wiki page explains it.

### 输出结构

```
wiki/<type>/<name>.md        ← 添加了代码片段块和源码锚点
<source-file>.c/.h           ← 添加了 wiki 回指注释 /* → wiki/... */
log.md                        ← code-anchor 记录
```

## map-document
Use when the user provides a large document (PDF, DOCX, PPTX) and wants to create
a navigable structure map before ingesting.

See `sub-skills/tools/map-document.md` for the full workflow, including the
Python script that extracts outline structure via `uv run --with PyPDF2 --with pdfplumber --with python-docx --with python-pptx`.

Steps:
1. Confirm file exists and is `.pdf`, `.docx`, or `.pptx`.
2. Run the extraction script in `subskills/map-document.md`.
3. Parse JSON output.
4. Write source map to `raw/sources/<slug>.map.md`.
5. Log the operation.

### 输出结构

```
raw/sources/<slug>.map.md    ← 大文件结构地图（章节/页码/优先级）
raw/.tmp/llm_wiki_map_doc.py  ← 临时脚本（会话内）
```

## index-codebase
Use when the user provides a directory of source code and wants a symbol index.

See `sub-skills/tools/index-codebase.md` for the full workflow, using
tree-sitter-languages for C/C++ AST parsing via `uv run --with tree-sitter-languages`.

Steps:
1. Confirm directory exists.
2. Run the tree-sitter indexer and parse output.
3. Write codebase map to `raw/sources/<slug>.codebase.md`.
4. Log the operation.

### 输出结构

```
raw/sources/<slug>.codebase.md  ← 代码符号地图（函数/结构体/枚举/宏）
raw/sources/<slug>.codebase.json ← 原始索引数据（会话内）
raw/.tmp/llm_wiki_index_code.py  ← 临时脚本（会话内，Option B）
```

</workflows>

<process>
1. Determine whether the request is init, capture, ingest, query, review, curate, project-init, code-anchor, map-document, or index-codebase.
2. Resolve the workspace root before touching files.
3. Prefer editing existing pages over creating duplicates.
4. Keep raw sources immutable once captured.
5. Treat user corrections as high-priority signals for page refresh.
6. Always report touched paths for meaningful writes.
7. When saving new knowledge pages, prefer the existing page types and paths before inventing a new structure.
8. When the user asks a question, answer from the maintained wiki first and only widen to raw sources when needed.
9. When the user flags a page as wrong or outdated, treat that as a correction or curation workflow rather than a fresh ingest.
</process>
