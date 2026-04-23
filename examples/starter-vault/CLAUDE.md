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

Typical examples: long manuals, scanned PDFs, large tables, logs, and multi-file source packs.

If the source is only partially processed, make that explicit instead of implying full coverage.

## Source map protocol

A source map is a lightweight working map for a large or awkward source.

### Structure modes

| Mode | When to use |
|------|------------|
| `explicit_toc` | Source has a reliable table of contents (manuals, standards, long reports) |
| `inferred_structure` | No ToC, but visible structure can be inferred (slide decks, lecture notes) |
| `coarse_map` | No reliable structure can be extracted (OCR-poor scans, logs, mixed bundles) |

### Required fields

Every source map must record:
- `file_path`, `source_type`, `structure_mode`, `structure_basis`
- `confidence: high | medium | low`
- `coverage_status: partial | mapped | focused_ingest_complete`
- major sections with `status: pending | active | complete | skipped`

### Incremental ingest

When a source is processed section by section:
- update each section's `status` after ingest
- report the next `pending` section and its page range on interruption
- do not re-ingest sections already marked `complete`

Do not present inferred structure as if it were an official table of contents.

## Page types

| Path | Purpose |
|------|---------|
| `wiki/sources/` | Per-source summaries and extracted claims |
| `wiki/concepts/` | Durable concept pages that evolve over time |
| `wiki/entities/` | Named entities: people, organizations, products, models, papers |
| `wiki/analyses/` | Saved answers and topic analyses worth keeping |
| `wiki/comparisons/` | Structured comparisons across related subjects |

## Frontmatter (required)

Every wiki page must begin with YAML frontmatter:

```yaml
---
title: "<page title>"
type: <page_type>
---
```

Recognized `type` values:
- `source_record` — per-source extracted claims
- `peripheral_page` — MCU peripheral documentation
- `concept_page` — conceptual topic
- `entity_page` — named entity or component
- `overview_page` — project or domain overview
- `source_map` — large-file structure map
- `codebase_map` — code symbol index

Additional fields by type:
- `source_record`: `source_type`, `chapter`, `page_range`, `source_file`, `status`
- `peripheral_page`: `mcu`, `chapter`
- `source_map` / `codebase_map`: `structure_mode` / `index_tool`, `coverage_status`

## Human correction protocol

Humans can always say things like:
- "This page is wrong, fix it"
- "This conclusion is outdated"
- "Refresh this page using the latest source"
- "Rewrite this section"

When that happens:
1. Read the target page and nearby context.
2. Re-check the relevant source pages when needed.
3. Decide whether to: directly correct, mark outdated, or preserve the disagreement with clarification.
4. Update the page and append a correction entry to `log.md`.

## `index.md`

`index.md` is a lightweight entry point.
Point toward the main overview, major topics, and important pages.
Do not try to list everything.

## `log.md`

`log.md` is the chronological record of meaningful work.
Record: capture, ingest, saved query results, review passes, curation, corrections.

For long-running or multi-session tasks, include a `task_status` block:
```markdown
## [2026-04-23] ingest | R7F0C014 ch12 WDT
- Created wiki/sources/r7f0c014-manual-ch12-wdt.md ✅
- Updated wiki/peripherals/wdt.md ✅
- **task_status: s12 (complete) → next: s14 (pending) | coverage: partial**
```

## Path reporting

When reporting work, use workspace-relative paths.

Examples:
- `→ 写入: wiki/concepts/attention.md`
- `← 读取: raw/sources/transformer-paper.md`
