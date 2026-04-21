# LLM Wiki — Schema

This vault is an **LLM Wiki** — a persistent, compounding knowledge base maintained inside Obsidian.

## Core Principle

The wiki is a persistent artifact. Cross-references are maintained over time, synthesis accumulates, and new sources update existing understanding instead of starting from scratch.

## Structure

```text
vault-root/
├── CLAUDE.md
├── index.md
├── log.md
├── raw/
│   ├── sources/
│   └── assets/
└── wiki/
    ├── entities/
    ├── concepts/
    ├── sources/
    ├── comparisons/
    ├── analyses/
    └── overview.md
```

## Conventions

- Keep `raw/` immutable after capture.
- Put generated knowledge pages under `wiki/`.
- Update `index.md` after ingesting or creating pages.
- Append meaningful actions to `log.md`.
- Use Obsidian-style wikilinks like `[[wiki/concepts/example]]`.
- Annotate file operations with vault-relative paths when reporting work.

## Workflows

- Ingest new sources into `raw/sources/` and summarize them under `wiki/sources/`.
- Update related entity and concept pages when new information appears.
- Save valuable answers under `wiki/analyses/` or `wiki/comparisons/`.
- Periodically lint the wiki for contradictions, stale claims, and missing links.
