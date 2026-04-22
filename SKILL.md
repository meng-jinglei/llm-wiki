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
---

<objective>
Run a persistent, skill-first knowledge workflow inside a local Markdown workspace. Treat raw sources as traceable inputs, maintain wiki pages as the main knowledge layer, and help the user keep the wiki current through capture, ingest, query, review, curation, and correction. Obsidian is an optional interface and enhancement layer, not a workflow prerequisite.
</objective>

<inputs>
User input may be one of these:
- a URL to capture
- a local file path inside or outside the workspace
- pasted text content
- a question to answer from the wiki
- a request to review, reorganize, merge, split, rename, or refresh wiki pages
- a request to correct outdated or inaccurate wiki content
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

## ingest
Use when the user wants a source turned into wiki updates.

Steps:
1. Read `index.md` and any obviously relevant wiki pages.
2. Load the source from `raw/sources/`, URL, file path, or pasted text.
3. If the source is large, read or create a source map first and identify the sections or page ranges most relevant to the user's goal.
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

</workflows>

<process>
1. Determine whether the request is init, capture, ingest, query, review, or curate.
2. Resolve the workspace root before touching files.
3. Prefer editing existing pages over creating duplicates.
4. Keep raw sources immutable once captured.
5. Treat user corrections as high-priority signals for page refresh.
6. Always report touched paths for meaningful writes.
7. When saving new knowledge pages, prefer the existing page types and paths before inventing a new structure.
8. When the user asks a question, answer from the maintained wiki first and only widen to raw sources when needed.
9. When the user flags a page as wrong or outdated, treat that as a correction or curation workflow rather than a fresh ingest.
</process>
