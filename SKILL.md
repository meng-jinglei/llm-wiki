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

<vault_assumptions>
- Work inside a local Markdown workspace that Claude can read and update.
- Prefer direct filesystem reads and writes for reliability.
- If the `obsidian` CLI is available, treat it as an optional enhancement for search and navigation.
- If the CLI is unavailable, fall back to `Glob` and `Grep`.
- Only use `obsidian://open` or GUI-opening behavior when the user explicitly asks for it.
</vault_assumptions>

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
| `ctags` | Code symbol indexing | No (preferred) | tree-sitter (Option B in index-codebase) |
| `tree-sitter` + `tree-sitter-c` | C/C++ AST parsing for symbol index | Via --with | Python regex (legacy, deprecated) |
| `pdfplumber` | PDF structure extraction | Via --with | PyPDF2 via --with |

**Install `uv`:** `curl -LsSf https://astral.sh/uv/install.sh | sh`
(Git Bash / Linux / macOS — same command on all three)

**Install `ctags`:**
- macOS: `brew install universal-ctags`
- Linux: `apt install universal-ctags`
- Windows: `scoop install ctags` or download from github.com/universal-ctags/ctags-win32

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
</path_rule>

<global_rules>
- Keep `raw/` immutable after capture.
- Prefer updating existing pages over creating near-duplicates.
- Use the wiki first when answering questions.
- Surface contradictions and uncertainty instead of flattening them away.
- Treat human correction as a first-class workflow.
- Update `log.md` for meaningful capture, ingest, save-back, review, curate, and correction actions.
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
Use when the workspace does not yet have the required workflow files and folders.

Steps:
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

## capture
Use when the user gives a URL, file, or pasted text and wants it preserved in the raw layer first.

Steps:
1. Normalize the input into a source record.
2. Extract title and useful metadata when available.
3. Save the source to `raw/sources/<slug>.md`.
4. Save referenced attachments to `raw/assets/` when appropriate.
5. If the source is large or hard to read end-to-end, record a lightweight source map in `raw/sources/<slug>.md` with the file path, source type, major sections, and useful page ranges when known.
6. Append a capture entry to `log.md`.
7. Report the saved path and suggest ingest when appropriate.
   If a source map was created, read it and state:
   - which section has `status:pending` and `priority:high`
   - what the next `ingest` command should target

## ingest
Use when the user wants a source turned into wiki updates.

Steps:
1. Read `index.md` and any obviously relevant wiki pages.
2. Load the source from `raw/sources/`, URL, file path, or pasted text.
3. If the source is large (per large_file_protocol), read or create a source map first and identify the sections or page ranges most relevant to the user's goal.

   If the source map has sections with `status: pending` and the user did not specify a section, use `priority: high` sections first.

   If the user specified a section, ingest that section and update its `status` to `complete` before moving on.

   If the source has no source map and is too large to ingest in one pass, create a source map first (see large_file_protocol) before writing any wiki content.
4. Create or update `wiki/sources/<slug>.md`.
5. Identify related concept and entity pages.
6. Prefer updating existing pages before creating new ones.
7. Create new pages only when the concept or entity is meaningfully distinct.
8. Update links between touched pages.
9. Update `index.md` if a new entry point or important page was added.
10. Append an ingest entry to `log.md`.
11. Report all touched paths.
12. If the source still needs more coverage, state which sections or page ranges remain instead of implying the whole source has been fully processed.

## query
Use when the user asks a question about the wiki.

Steps:
1. Read `index.md`.
2. Search for relevant wiki pages.
3. Read the best matching pages first.
4. Return to raw sources only when the wiki is missing evidence or needs verification.
5. Answer with references to wiki page paths.
6. If the answer seems worth keeping, offer to save it as:
   - `wiki/analyses/<slug>.md`
   - `wiki/comparisons/<slug>.md`
7. If the answer reveals outdated or incorrect wiki content, offer to refresh the affected pages.

## review
Use when the user wants a health check, maintenance pass, or consistency review.

Check for:
- contradictions between pages
- stale or outdated claims
- orphan pages
- missing cross-references
- duplicated concepts or entities
- concepts or entities mentioned without their own pages
- `index.md` drifting away from the actual wiki structure

Report findings with file paths. If the user wants fixes, apply the changes and update `log.md`.

## curate
Use when the user wants human-led restructuring or refinement.

Examples:
- merge duplicate pages
- split overly large pages
- rename pages
- reorganize topic structure
- rewrite a summary or overview page
- refresh a page that the user says is wrong or outdated

Steps:
1. Read the target pages and nearby context.
2. Explain the proposed structural change if it is non-trivial.
3. Apply the smallest coherent set of edits.
4. Update `index.md` and links if needed.
5. Append a curation or correction entry to `log.md`.
6. Report all touched paths.

## project-init
Use when the user wants to build wiki knowledge around an existing project.

Examples:
- "I have a firmware project with source code and a chip manual, set up the wiki"
- "Initialize the workspace for this MCU project"

Steps:
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

## code-anchor
Use when the user points to a source file and wants wiki knowledge about it,
or when the user points to a wiki page and wants to know which source code uses it.

Examples:
- "What does the clock_config.c file configure? What manual section covers it?"
- "I want to link the PWM wiki page to the actual code that uses it"

This workflow binds source code and wiki knowledge bidirectionally.

Steps:
1. Read the target source file or wiki page.
2. Identify the key symbols, registers, peripherals, or concepts it references.
3. For each identified element:
   a. Find or create the corresponding `wiki/peripherals/<name>.md` or `wiki/concepts/<name>.md`.
   b. Add a code snippet block with file path and line reference.
   c. Add a manual anchor: `→ [Source: RA4M2_manual.pdf, p.512]`.
   d. Add a back-reference: in the source file, append a comment line pointing to the wiki page.
4. Update `wiki/overview.md` if the project map needs refreshing.
5. Log the anchor operation to `log.md`.

Key principle: the wiki page knows which code uses it, and the code knows which wiki page explains it.

## map-document
Use when the user provides a large document (PDF, DOCX, PPTX) and wants to create
a navigable structure map before ingesting.

See `subskills/map-document.md` for the full workflow, including the
Python script that extracts outline structure via `uv run --with PyPDF2 --with pdfplumber --with python-docx --with python-pptx`.

Steps:
1. Confirm file exists and is `.pdf`, `.docx`, or `.pptx`.
2. Run the extraction script in `subskills/map-document.md`.
3. Parse JSON output.
4. Write source map to `raw/sources/<slug>.map.md`.
5. Log the operation.

## index-codebase
Use when the user provides a directory of source code and wants a symbol index.

See `subskills/index-codebase.md` for the full workflow, including the
ctags-based indexing script.

Prerequisite: `ctags` must be installed. Instruct user to install if missing.

Steps:
1. Confirm directory exists.
2. Check `ctags --version`. If missing, stop and instruct user.
3. Run ctags and parse output.
4. Write codebase map to `raw/sources/<slug>.codebase.md`.
5. Log the operation.

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
