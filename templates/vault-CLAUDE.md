# llm-wiki — Workspace Protocol

This workspace runs a **skill-first knowledge workflow**.

The goal is to maintain a persistent Markdown wiki that compounds over time:
- raw sources stay traceable
- wiki pages are updated instead of constantly recreated
- useful answers can be saved back into the workspace
- humans can always correct, refresh, or reorganize the maintained pages

## Core model

This workspace has three layers:

1. **`raw/`** — captured source material and attachments
2. **`wiki/`** — maintained knowledge pages used for answering and synthesis
3. **`CLAUDE.md`** — workflow rules, page conventions, and maintenance protocol

## Workspace structure

```text
workspace-root/
├── CLAUDE.md
├── index.md
├── log.md
├── raw/
│   ├── sources/
│   └── assets/
└── wiki/
    ├── sources/
    ├── concepts/
    ├── entities/
    ├── analyses/
    ├── comparisons/
    └── overview.md
```

Obsidian may be used as an optional interface for the same directory, but it is not required for the workflow to work.

## Workflow principles

- Keep `raw/` immutable after capture.
- Prefer updating existing wiki pages over creating near-duplicates.
- Use the wiki as the default answer surface.
- Return to raw sources when the wiki is missing evidence or needs verification.
- Surface contradictions and uncertainty instead of flattening them away.
- Treat human correction as a first-class workflow.
- Keep `index.md` lightweight.
- Append meaningful actions to `log.md`.

## Large-file protocol

When a source is too large or awkward to read end-to-end in one pass:
- keep the original file in `raw/` and do not rewrite it
- prefer storing binary or attached files in `raw/assets/`
- create or update a source record in `raw/sources/` before broad ingest
- create or update a source map when broad ingest would otherwise be wasteful or hard to verify
- read structure first, then ingest by relevant section or topic
- preserve page ranges, section names, and similar anchors when writing claims
- keep dense tables and unstable implementation detail in source-facing pages unless they need to become durable knowledge
- if evidence is still missing, say which section or page range should be checked next

Typical examples include long manuals, scanned PDFs, large tables, logs, and multi-file source packs.

If the source is only partially processed, make that explicit instead of implying full coverage.

## Source map protocol

A source map is a lightweight working map for a large or awkward source. It helps later ingest and query work find the right section without repeatedly re-reading the whole source.

### Required fields

A source map should record at least:
- file path
- source type
- structure mode
- structure basis
- confidence
- major sections or working sections
- useful page ranges or other source anchors when known
- coverage status

### Structure modes

Use one of these modes:

1. `explicit_toc`
   - Use when the source already exposes reliable structure.
   - Examples: manuals with a table of contents, standards, long reports with stable headings.
   - Build the source map from the document's own chapter, section, and page structure.

2. `inferred_structure`
   - Use when the source has no reliable table of contents, but meaningful structure can still be inferred.
   - Examples: long slide decks, chapterless lecture notes, exported web documents.
   - Build the source map by scanning headings, repeated labels, section-divider pages, topic continuity, or other visible signals.

3. `coarse_map`
   - Use when reliable structure cannot be extracted.
   - Examples: OCR-poor scans, image-heavy PDFs, logs, traces, mixed attachment packs.
   - Build a rough map of high-value regions, obvious clusters, or likely next places to inspect.

### Required markings

A source map must make these things explicit:
- whether the structure is document-derived or inferred
- how confident the structure is
- whether coverage is partial, mapped, or broad enough for the current task
- what still needs review next

### Minimum source map shape

A source map may live inside `raw/sources/<slug>.md`. A simple shape is enough:

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

## Page types

- `wiki/sources/` — per-source summaries and extracted claims
- `wiki/concepts/` — durable concept pages that evolve over time
- `wiki/entities/` — people, organizations, products, models, papers, etc.
- `wiki/analyses/` — saved answers and topic analyses worth keeping
- `wiki/comparisons/` — structured comparisons across related subjects

## Minimum frontmatter

Use at least:

```yaml
title:
type:
sources:
created:
updated:
status: stable | needs_review | outdated
```

## Human correction protocol

Humans can always say things like:
- "This page is wrong, fix it"
- "This conclusion is outdated"
- "Refresh this page using the latest source"
- "Rewrite this section"

When that happens:
1. Read the target page and nearby context.
2. Re-check the relevant source pages when needed.
3. Decide whether to:
   - directly correct the page
   - mark it as outdated or needing review
   - preserve the disagreement and add clarification
4. Update the page.
5. Add a correction entry to `log.md`.

## `index.md`

`index.md` is a lightweight entry point.
It should point people toward the main overview, major topics, and important pages.
It should not try to be an exhaustive dump of everything in the workspace.

## `log.md`

`log.md` is the chronological record of meaningful work.
Record:
- capture
- ingest
- saved query results
- review passes
- curation
- corrections

## Path reporting

When reporting work, use workspace-relative paths.

Examples:
- `→ 写入: wiki/concepts/attention.md`
- `← 读取: raw/sources/transformer-paper.md`
