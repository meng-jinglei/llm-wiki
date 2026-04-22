# llm-wiki Usage Examples

This document shows how to invoke the `llm-wiki` skill in a way that keeps the workflow consistent across different models.

## General rule

Phrase requests in terms of the workflow you want Claude to execute:
- initialize
- capture
- ingest
- query
- review
- curate
- correct or refresh an existing page

If the request is ambiguous, the skill should choose the narrowest workflow that preserves the user's intent.

## 1. Init

### Example prompts
- `Initialize this Obsidian vault for llm-wiki.`
- `Repair the llm-wiki structure in this vault without overwriting existing notes.`

### Expected behavior
- create or repair the required folders and protocol files
- report touched paths

## 2. Capture

### Example prompts
- `Capture this article into the raw layer: <url>`
- `Capture this PDF into raw/sources and keep the original file traceable.`
- `Capture the following pasted notes before we decide how to ingest them.`

### Expected behavior
- save source material into `raw/sources/`
- save attachments into `raw/assets/` when needed
- append a capture entry to `log.md`
- suggest ingest if appropriate

## 3. Ingest

### Example prompts
- `Ingest raw/sources/transformer-notes.md into the wiki.`
- `Use this captured source to update the relevant concept and entity pages.`
- `Ingest this article and update any existing pages before creating new ones: <url>`

### Expected behavior
- create or update a source page
- update related concept and entity pages
- prefer existing pages over new duplicates
- update `index.md` when needed
- append an ingest entry to `log.md`
- report touched paths

## 4. Query

### Example prompts
- `Based on this wiki, what are the main differences between RAG and an LLM wiki?`
- `Answer from the maintained wiki first: how does this vault currently describe tool-backed workflows?`
- `What does the wiki currently say about page correction and refresh?`

### Expected behavior
- search the wiki first
- cite wiki page paths in the answer
- consult raw sources only when necessary
- offer to save the result if it seems durable

## 5. Save after query

### Example prompts
- `Save that answer as an analysis page.`
- `Turn the previous answer into a comparison page.`
- `Keep this result in the vault as a durable note.`

### Expected behavior
- write to `wiki/analyses/` or `wiki/comparisons/`
- update `index.md` when needed
- append a save entry to `log.md`
- report touched paths

## 6. Review

### Example prompts
- `Review this wiki for contradictions, stale claims, and missing links.`
- `Do a maintenance pass on the concept pages.`
- `Check whether index.md still matches the current wiki structure.`

### Expected behavior
- inspect the requested scope
- return findings with file paths
- only apply fixes if asked

## 7. Curate

### Example prompts
- `Merge these two concept pages.`
- `Split this page into two narrower topics.`
- `Rename this entity page and update the links.`
- `Rewrite the overview page so it reflects the current vault better.`

### Expected behavior
- read the nearby context first
- perform the smallest coherent structural change
- update links and `index.md` if needed
- append a curation entry to `log.md`

## 8. Correct or refresh a page

### Example prompts
- `This page is wrong. Fix it: wiki/concepts/attention.md`
- `This conclusion is outdated. Refresh it using the latest source page.`
- `Rewrite this section to be more accurate and keep the existing links.`

### Expected behavior
- treat the request as correction or curation, not as a fresh ingest
- verify against related wiki pages and sources as needed
- update the page
- append a correction entry to `log.md`

## 9. Good prompt patterns

Use prompts that specify:
- the workflow action
- the target source or page
- whether to preserve existing structure
- whether to save results back into the vault

Examples:
- `Ingest this source, update existing pages first, and list touched paths.`
- `Answer from the wiki first, and if the result is worth keeping, ask before saving it.`
- `Review only wiki/concepts/ for stale claims and missing links.`

## 10. Avoid vague prompts when precision matters

Less reliable:
- `Do something with this article.`
- `Organize my wiki.`
- `Read this and update stuff.`

More reliable:
- `Capture this URL into raw/sources/ and stop there.`
- `Ingest this source and update the relevant concept pages.`
- `Review this vault for outdated claims, but do not modify files yet.`
