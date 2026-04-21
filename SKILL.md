---
name: llm-wiki
description: "Build and maintain a personal LLM wiki inside your Obsidian vault — persistent, compounding knowledge base"
argument-hint: "<what you want to track, explore, or do>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - mcp__fetch__fetch
---

<objective>
Build and maintain a personal wiki inside an Obsidian vault — a structured, interlinked collection of markdown files that sits between you and your raw sources. The LLM writes and maintains the wiki via Obsidian; you curate sources, ask questions, and direct the analysis.

Based on the LLM Wiki pattern by Andrej Karpathy: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
</objective>

<core_concept>
Three layers:

1. **raw/** — Immutable source documents (articles, papers, notes). LLM reads them, never modifies them.
2. **wiki/** — LLM-generated markdown pages (entity pages, concept pages, source summaries, comparisons). LLM owns this layer entirely.
3. **CLAUDE.md** (at vault root) — The schema. Tells the LLM how the wiki is structured, what conventions to follow, and what workflows to execute.

The vault is the single source of truth. LLM operates on vault files directly (filesystem) and via Obsidian CLI when available. Obsidian auto-detects changes — no manual refresh needed.
</core_concept>

<vault_structure>
The wiki lives inside an Obsidian vault. The vault root contains:

```
vault-root/
├── .obsidian/               # Obsidian config — DO NOT MODIFY
├── CLAUDE.md               # ← Schema (this file's content lives here)
├── index.md                # Catalog of all wiki pages
├── log.md                  # Append-only activity log
├── raw/                    # Immutable sources (your curated collection)
│   ├── sources/            # Ingested articles, papers, notes
│   └── assets/             # Downloaded images/attachments
└── wiki/                   # LLM-generated pages
    ├── entities/           # People, organizations, products, papers
    ├── concepts/           # Ideas, techniques, frameworks
    ├── sources/            # Per-source summary pages
    ├── comparisons/        # Side-by-side comparison pages
    └── analyses/           # Saved exploration outputs, answers worth keeping
```

**Path notation:** All paths below are relative to the vault root. LLM must always annotate file operations with full relative paths.
</vault_structure>

<path_annotation_rules>
ALL workflows must annotate file operations with vault-relative paths:

- Before writing a file: `→ 写入: raw/sources/my-article.md`
- Before reading a file: `← 读取: wiki/concepts/attention.md`
- After creating files: list all new paths in the summary
- Search results: show file paths next to each match
- Workflow summary: every touched file gets its path listed

This lets you open any file in Obsidian instantly by path.
</path_annotation_rules>

<vault_config>
On skill startup:

1. Check if the current project directory has a `CLAUDE.md` with `obsidian_vault_path` set.
2. If not found, check if a `CLAUDE.md` exists at the vault root (current directory).
3. If still not configured, ask the user for their Obsidian vault path.
4. Write `obsidian_vault_path` into `CLAUDE.md` at the project root so future sessions auto-detect it.

The vault path is stored as:
```yaml
obsidian_vault_path: "/path/to/your-vault"
```

All file operations use this path as the root.
</vault_config>

<obsidian_cli_strategy>
**Obsidian CLI** (`obsidian` binary, requires Obsidian 1.12+ with CLI enabled in Settings):

| Command | Use case |
|---------|----------|
| `obsidian search query="..."` | Search vault for relevant pages |
| `obsidian eval code="..."` | Execute JS via Obsidian API (requires app running) |
| `obsidian vault` | Get vault info |

**Fallback:** Direct filesystem read/write. Obsidian auto-detects vault file changes — no sync command needed. Use filesystem operations as the reliable default; use CLI when it adds value (search, Obsidian-specific features).

**File writes:** Always prefer filesystem writes. They are instant, don't require Obsidian to be running, and Obsidian picks up changes automatically via its file watcher.

**Read operations:** Filesystem `Read` tool — works without Obsidian running.

**Search operations:** Try `obsidian search` first; fall back to `Glob` + `Grep` on the vault directory.
</obsidian_cli_strategy>

<index_convention>
`index.md` format — catalog of all wiki pages with one-line summaries.

```markdown
# LLM Wiki — Index

## Entities
- [[wiki/entities/attention-mechanism]] — Neural network component enabling models to focus on relevant tokens
- [[wiki/entities/transformer-architecture]] — Vaswani et al. 2017 — full architecture

## Concepts
- [[wiki/concepts/self-attention]] — Core mechanism of the Transformer
- [[wiki/concepts/chain-of-thought]] — Prompting technique eliciting step-by-step reasoning

## Sources
- [[wiki/sources/attention-is-all-you-need]] — Vaswani et al. 2017 | Paper summary

## Analyses
- [[wiki/analyses/transformer-vs-rnn-comparison]] — Architecture trade-offs side-by-side
```

LLM updates index.md after every ingest or creation. Read index.md first when answering queries.
</index_convention>

<log_convention>
`log.md` format — append-only, each entry starts with `## [YYYY-MM-DD]`.

```markdown
# LLM Wiki — Activity Log

## [2026-04-21] ingest | Attention Is All You Need
→ 写入: wiki/sources/attention-is-all-you-need.md
→ 写入: wiki/concepts/transformer.md (updated)
→ 写入: wiki/entities/attention-mechanism.md (new)
→ 写入: index.md (updated)
→ 写入: log.md (appended)

## [2026-04-21] query | How does self-attention scale with sequence length?
← 读取: index.md
← 读取: wiki/concepts/self-attention.md
→ 写入: wiki/analyses/self-attention-scaling.md
→ 写入: log.md (appended)
```

Parseable with: `grep "^## \[" log.md | tail -N`
</log_convention>

<page_template>
Use this template for all new wiki pages:

```markdown
---
title: <Page Title>
type: <entity | concept | source | analysis | comparison>
tags: [<relevant tags>]
sources: [<raw file reference>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <Page Title>

<One-paragraph summary>

## Key Points
- <Point 1>
- <Point 2>
- <Point 3>

## Details

<Body — use [[wiki/...]] wikilinks for cross-references>

## Related
- [[wiki/concepts/...]]
- [[wiki/entities/...]]
- [[wiki/sources/...]]
```
</page_template>

<workflows>

## init — Initialize the wiki inside an Obsidian vault

**Trigger:** No `CLAUDE.md` found at project root, or user says "init / setup the wiki".

**Steps:**
1. Ask the user for their Obsidian vault path (or confirm the detected one).
2. Verify the vault exists and contains `.obsidian/` directory.
3. Write the schema `CLAUDE.md` to the vault root (overwriting if exists).
4. Create all subdirectories: `raw/sources/`, `raw/assets/`, `wiki/entities/`, `wiki/concepts/`, `wiki/sources/`, `wiki/comparisons/`, `wiki/analyses/`.
5. Create `index.md` (empty catalog with section headers).
6. Create `log.md` (with header).
7. Create `wiki/wiki/overview.md` (starter overview page).
8. Output a summary listing every created path. Example:

```
初始化完成！创建了以下文件：
→ 写入: CLAUDE.md
→ 写入: index.md
→ 写入: log.md
→ 写入: wiki/wiki/overview.md
→ 写入: raw/sources/ (目录)
→ 写入: raw/assets/ (目录)
→ 写入: wiki/entities/ (目录)
→ 写入: wiki/concepts/ (目录)
→ 写入: wiki/sources/ (目录)
→ 写入: wiki/comparisons/ (目录)
→ 写入: wiki/analyses/ (目录)
```

**Path annotation required for every file created.**

---

## ingest — Process a new source

**Trigger:** User provides a URL, file path, or text content to ingest.

**Steps:**
1. `← 读取: index.md` — check existing wiki state
2. **Fetch source:**
   - If URL: use `mcp__fetch__fetch` to download content; extract title, author, date, main text
   - If local file path: read it directly
   - If pasted text: process directly
3. **Save raw source:**
   - Generate a slug from the title (e.g., `attention-is-all-you-need`)
   - `→ 写入: raw/sources/<slug>.md` — raw content with source metadata header
4. **Discuss with user:** Present key takeaways, ask what to emphasize, flag anything surprising.
5. **Create source summary page:**
   - `→ 写入: wiki/sources/<slug>.md` — structured summary (see page template)
   - Include: title, source metadata, 3-5 key claims, notable quotes, related concepts
6. **Update / create entity and concept pages:**
   - For each key concept/entity mentioned: `→ 写入: wiki/concepts/<slug>.md` or `→ 写入: wiki/entities/<slug>.md`
   - If page exists: read it first, then update with new information
   - Flag contradictions: if new source contradicts existing claims, add a `## Contradictions` section
7. **Update `index.md`:**
   - `← 读取: index.md`
   - `→ 写入: index.md` — add new pages to the catalog
8. **Append to `log.md`:**
   - `→ 写入: log.md` — append `## [YYYY-MM-DD] ingest | <Title>` entry with all file paths
9. **Report:** List every created/updated file with its path.

---

## query — Answer a question from the wiki

**Trigger:** User asks a question.

**Steps:**
1. `← 读取: index.md` — find relevant pages
2. **Search the vault:**
   - Try: `obsidian search query="..."` (requires Obsidian running)
   - Fallback: `Glob` + `Grep` on the vault directory
   - Show results with file paths: `  wiki/concepts/self-attention.md:12:matching line`
3. `← 读取:` each relevant page (annotate every read with path)
4. Synthesize answer with citations: `来源: [[wiki/concepts/...]]`
5. If the answer is a valuable insight, comparison, or analysis:
   - Ask: "Should I save this to the wiki?"
   - If yes: `→ 写入: wiki/analyses/<slug>.md`, update index.md and log.md
6. Report the answer.

---

## lint — Health-check the wiki

**Trigger:** User asks to review or maintain the wiki.

**Steps:**
1. `← 读取: index.md` — get full catalog
2. Scan all `wiki/` subdirectories:
   - `Glob` for all `.md` files in `wiki/`
   - `Grep` for orphan pages (no `[[wiki/...]]` links pointing to them)
   - `Grep` for missing cross-references (concepts mentioned but no own page)
   - `Grep` for contradictions (search for conflicting claims across pages)
   - `Grep` for stale claims (sources newer than page's `updated` date)
3. Report findings grouped by severity:
   - **Contradictions** (HIGH)
   - **Stale pages** (MEDIUM)
   - **Orphan pages** (MEDIUM)
   - **Missing cross-references** (LOW)
4. For each finding, show the file path and relevant excerpt.
5. If user approves fixes: apply them (annotate every write with path), update `log.md`.

---

## browse — Open a wiki page in Obsidian GUI

**Trigger:** User says "open X in Obsidian" or "show me page X".

**Steps:**
1. Resolve the page name to a vault-relative path.
2. Open in Obsidian via URI: `obsidian://open?vault=<vault>&file=<path>`
3. Report: `→ 打开: wiki/concepts/attention.md`

---

## clip — Capture a web article to raw/sources/

**Trigger:** User provides a URL to clip.

**Steps:**
1. `← 抓取: <URL>` — fetch article content via `mcp__fetch__fetch`
2. Extract: title, author, date, main body text
3. `→ 写入: raw/sources/<slug>.md` — save with YAML frontmatter (title, url, date, author)
4. Report: `→ 写入: raw/sources/<slug>.md` and prompt to run `/llm-wiki ingest` next.

</workflows>

<process>
1. Determine the vault path:
   - Read `CLAUDE.md` at project root for `obsidian_vault_path`
   - If not found, ask the user for their Obsidian vault path
   - Write `obsidian_vault_path` to project `CLAUDE.md` so future sessions detect it
2. Match the user's request to the most appropriate workflow (init / ingest / query / lint / browse / clip).
3. Execute the workflow end-to-end.
4. After each operation, confirm what changed — with every file path annotated.
5. Prompt for next action.
</process>
