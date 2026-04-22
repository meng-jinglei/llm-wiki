---
name: llm-wiki
description: Run a skill-first knowledge workflow inside an Obsidian vault
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
Run a persistent, skill-first knowledge workflow inside an Obsidian vault. Treat raw sources as traceable inputs, maintain wiki pages as the main knowledge layer, and help the user keep the wiki current through capture, ingest, query, review, curation, and correction.
</objective>

<inputs>
User input may be one of these:
- a URL to capture
- a local file path inside or outside the vault
- pasted text content
- a question to answer from the wiki
- a request to review, reorganize, merge, split, rename, or refresh wiki pages
- a request to correct outdated or inaccurate wiki content
</inputs>

<vault_assumptions>
- Work inside an Obsidian vault.
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
Always annotate meaningful file operations with vault-relative paths.

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
- If a query result is worth keeping, ask before saving it back into the vault.
</global_rules>

<workflows>

## init
Use when the vault does not yet have the required workflow files and folders.

Steps:
1. Determine the Obsidian vault path.
2. Verify the path points to an Obsidian vault.
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
5. Append a capture entry to `log.md`.
6. Report the saved path and suggest ingest when appropriate.

## ingest
Use when the user wants a source turned into wiki updates.

Steps:
1. Read `index.md` and any obviously relevant wiki pages.
2. Load the source from `raw/sources/`, URL, file path, or pasted text.
3. Create or update `wiki/sources/<slug>.md`.
4. Identify related concept and entity pages.
5. Prefer updating existing pages before creating new ones.
6. Create new pages only when the concept or entity is meaningfully distinct.
7. Update links between touched pages.
8. Update `index.md` if a new entry point or important page was added.
9. Append an ingest entry to `log.md`.
10. Report all touched paths.

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
2. Resolve the vault path before touching files.
3. Prefer editing existing pages over creating duplicates.
4. Keep raw sources immutable once captured.
5. Treat user corrections as high-priority signals for page refresh.
6. Always report touched paths for meaningful writes.
7. When saving new knowledge pages, prefer the existing page types and paths before inventing a new structure.
8. When the user asks a question, answer from the maintained wiki first and only widen to raw sources when needed.
9. When the user flags a page as wrong or outdated, treat that as a correction or curation workflow rather than a fresh ingest.
</process>
