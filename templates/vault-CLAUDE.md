# llm-wiki — Vault Protocol

This vault runs a **skill-first knowledge workflow** inside Obsidian.

The goal is to maintain a persistent Markdown wiki that compounds over time:
- raw sources stay traceable
- wiki pages are updated instead of constantly recreated
- useful answers can be saved back into the vault
- humans can always correct, refresh, or reorganize the maintained pages

## Core model

This vault has three layers:

1. **`raw/`** — captured source material and attachments
2. **`wiki/`** — maintained knowledge pages used for answering and synthesis
3. **`CLAUDE.md`** — workflow rules, page conventions, and maintenance protocol

## Vault structure

```text
vault-root/
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

## Workflow principles

- Keep `raw/` immutable after capture.
- Prefer updating existing wiki pages over creating near-duplicates.
- Use the wiki as the default answer surface.
- Return to raw sources when the wiki is missing evidence or needs verification.
- Surface contradictions and uncertainty instead of flattening them away.
- Treat human correction as a first-class workflow.
- Keep `index.md` lightweight.
- Append meaningful actions to `log.md`.

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
It should not try to be an exhaustive dump of everything in the vault.

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

When reporting work, use vault-relative paths.

Examples:
- `→ 写入: wiki/concepts/attention.md`
- `← 读取: raw/sources/transformer-paper.md`
