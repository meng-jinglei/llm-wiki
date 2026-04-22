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
- `Initialize this workspace for llm-wiki.`
- `Repair the llm-wiki structure in this workspace without overwriting existing notes.`

### Expected behavior
- create or repair the required folders and protocol files
- report touched paths

## 2. Capture

### Example prompts
- `Capture this article into the raw layer: <url>`
- `Capture this PDF, keep the original file in raw/assets, and record it in raw/sources.`
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

## 3A. Large-file capture

### Example prompts
- `Capture this Renesas hardware manual PDF and create a source map before any broad ingest.`
- `Save this large PDF into the raw layer, keep the original file in raw/assets, and record the key sections we should use later.`
- `Capture this scanned manual and note any OCR or extraction limitations in the source record.`

### Expected behavior
- save the original file into `raw/assets/` when appropriate
- create or update a source record in `raw/sources/`
- record the file path, source type, and major sections or page ranges when known
- avoid pretending the whole document has already been reviewed
- append a capture entry to `log.md`

## 3A-1. Source map with explicit structure

### Example prompts
- `Create a source map for this manual using its table of contents.`
- `Map this standard document by its official sections and page ranges before we ingest it.`

### Expected behavior
- use `explicit_toc` mode
- derive the section map from the document's own structure
- preserve official section names and page anchors

## 3A-2. Source map with inferred structure

### Example prompts
- `This 240-page slide deck has no table of contents. Create an inferred source map first.`
- `Group this lecture PDF into working sections and mark the result as inferred structure.`

### Expected behavior
- use `inferred_structure` mode
- infer sections from titles, repeated labels, divider pages, or topic continuity
- mark the structure basis and confidence explicitly

## 3A-3. Coarse source map

### Example prompts
- `This scan is noisy. Make a coarse source map and tell me what page ranges are worth checking next.`
- `Create only a rough map for this large log bundle; do not pretend the structure is reliable.`

### Expected behavior
- use `coarse_map` mode
- record only rough clusters, high-value regions, or likely next inspection targets
- make low confidence and partial coverage explicit

## 3B. Large-file ingest

### Example prompts
- `Ingest only the UART section from this hardware manual and update the relevant wiki pages.`
- `Use the source map for this manual, then ingest the clock tree and low-power sections into the wiki.`
- `Review this large source by section and tell me which page ranges still need coverage.`

### Expected behavior
- read the source map or create one first
- ingest by relevant section, page range, or topic rather than by full-document pass
- preserve page anchors when writing claims
- keep dense detail in source-facing pages unless it needs to become durable knowledge
- report remaining uncovered sections when the source is only partially processed

## 3B-1. Large-file ingest from an inferred map

### Example prompts
- `Use the inferred source map for this deck, then ingest only the pages about interrupt handling.`
- `From this inferred map, update the concept pages for the clock system and leave the rest unprocessed.`

### Expected behavior
- respect the inferred structure instead of presenting it as official structure
- preserve page anchors and uncertainty markers when writing claims
- state what still needs review next

## 4. Query

### Example prompts
- `Based on this wiki, what are the main differences between RAG and an LLM wiki?`
- `Answer from the maintained wiki first: how does this workspace currently describe tool-backed workflows?`
- `What does the wiki currently say about page correction and refresh?`

### Expected behavior
- search the wiki first
- cite wiki page paths in the answer
- consult raw sources only when necessary
- offer to save the result if it seems durable

## 4A. Query with source map fallback

### Example prompts
- `Answer from the wiki first. If the wiki is missing evidence, use the source map to tell me which section of the manual to inspect next.`
- `What does the wiki currently say about DMA on this MCU? If coverage is partial, tell me which page range the source map points to next.`

### Expected behavior
- use the wiki first
- use the source map before re-reading a large source broadly
- name the next section or page range when evidence is still missing

## 5. Save after query

### Example prompts
- `Save that answer as an analysis page.`
- `Turn the previous answer into a comparison page.`
- `Keep this result in the workspace as a durable note.`

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

## 6A. Review a source map

### Example prompts
- `Review this source map and tell me whether the inferred sections are still coherent.`
- `Check whether this coarse map is too weak for further ingest and tell me what should be remapped.`

### Expected behavior
- evaluate whether the map mode still matches the source quality
- return gaps, weak sections, and the next remapping target without pretending full certainty

## 7. Curate

### Example prompts
- `Merge these two concept pages.`
- `Split this page into two narrower topics.`
- `Rename this entity page and update the links.`
- `Rewrite the overview page so it reflects the current workspace better.`

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
- whether to save results back into the workspace

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
- `Review this workspace for outdated claims, but do not modify files yet.`

## 11. Source map prompt patterns

Use prompts that specify:
- the desired map mode when you know it
- whether the source has a real table of contents
- whether structure should be inferred or kept coarse
- whether the source map should highlight remaining coverage

Examples:
- `Create an explicit_toc source map for this manual and preserve official section names.`
- `Make an inferred_structure source map for this slide deck and mark confidence levels.`
- `Create only a coarse_map for this noisy scan and tell me what page range to inspect next.`

Do not ask for a full-document summary when the real goal is to navigate a large source reliably.

## 12. Avoid vague source-map prompts

Less reliable:
- `Read this whole manual and summarize it.`
- `Map this file somehow.`
- `Figure out this deck.`

More reliable:
- `Create a source map for this manual from its table of contents before any ingest.`
- `Build an inferred source map for this directory-less deck and stop after the map.`
- `Create a coarse source map for this OCR-poor scan and list the most promising page ranges.`
