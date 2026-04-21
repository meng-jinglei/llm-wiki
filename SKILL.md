---
name: llm-wiki
description: Build and maintain an LLM-powered wiki inside an Obsidian vault
argument-hint: "<url, file, text, question, or action>"
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
Build and maintain a persistent, interlinked wiki inside an Obsidian vault. Treat the vault as the source of truth, keep wiki pages updated as new sources arrive, and answer questions from the accumulated wiki instead of re-deriving everything from raw documents each time.
</objective>

<inputs>
User input may be one of these:
- a URL to clip or ingest
- a local file path inside or outside the vault
- pasted text content
- a question to answer from the wiki
- a maintenance request such as lint, review, or open a page in Obsidian
</inputs>

<vault_assumptions>
- Work inside an Obsidian vault.
- Prefer direct filesystem reads and writes for reliability.
- If the `obsidian` CLI is available, prefer `obsidian search` for vault search.
- If the CLI is unavailable, fall back to `Glob` and `Grep`.
- Only use `obsidian://open` when the user explicitly wants to open a page in Obsidian.
</vault_assumptions>

<path_rule>
Always annotate file operations with vault-relative paths.

Examples:
- `→ 写入: raw/sources/article-name.md`
- `← 读取: wiki/concepts/self-attention.md`
- search results should include file paths
- summaries should list every created or updated path
</path_rule>

<workflows>

## init
Use when the vault wiki has not been initialized yet.

Steps:
1. Determine the Obsidian vault path.
2. Verify the path points to an Obsidian vault.
3. Create these paths if missing:
   - `raw/sources/`
   - `raw/assets/`
   - `wiki/entities/`
   - `wiki/concepts/`
   - `wiki/sources/`
   - `wiki/comparisons/`
   - `wiki/analyses/`
4. Create or update:
   - `CLAUDE.md`
   - `index.md`
   - `log.md`
   - `wiki/overview.md`
5. Report all created paths.

## clip
Use when the user gives a URL and wants to capture it into the vault first.

Steps:
1. Fetch the page content.
2. Extract title and main text.
3. Save it to `raw/sources/<slug>.md`.
4. Report the saved path.
5. Suggest ingest if appropriate.

## ingest
Use when the user wants to process a source into the wiki.

Steps:
1. Read `index.md` if it exists.
2. Load the source from URL, file path, or pasted text.
3. Save raw source material to `raw/sources/<slug>.md` if not already present.
4. Create or update `wiki/sources/<slug>.md`.
5. Create or update related pages under `wiki/entities/` and `wiki/concepts/`.
6. Update `index.md`.
7. Append an entry to `log.md`.
8. Report all touched paths.

## query
Use when the user asks a question about the wiki.

Steps:
1. Read `index.md`.
2. Search the vault for relevant pages.
3. Read the relevant pages.
4. Synthesize an answer with references to wiki pages.
5. If the result is worth keeping, offer to save it under `wiki/analyses/` or `wiki/comparisons/`.

## lint
Use when the user asks to review, maintain, or health-check the wiki.

Check for:
- contradictions between pages
- stale claims
- orphan pages
- missing cross-references
- concepts mentioned without their own pages

Report findings with file paths. If the user wants fixes, apply them and update `log.md`.

## browse
Use when the user wants to open a page in Obsidian.

Steps:
1. Resolve the target page path.
2. Open it with Obsidian if possible.
3. Report the opened path.

</workflows>

<process>
1. Determine whether the request is init, clip, ingest, query, lint, or browse.
2. Resolve the vault path before touching files.
3. Execute the matching workflow.
4. Keep raw sources immutable after capture.
5. Prefer updating existing wiki pages over creating duplicates.
6. Always report paths for reads, writes, and search results.
</process>
