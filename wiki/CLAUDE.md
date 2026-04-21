# LLM Wiki — Schema

This vault is an **LLM Wiki** — a persistent, compounding knowledge base maintained by an LLM inside Obsidian. Built on the pattern described by Andrej Karpathy:
https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

## Core Principle

The wiki is a **persistent artifact**. Cross-references are pre-built. Contradictions are flagged. Synthesis accumulates over time. The LLM never re-derives knowledge from scratch — it works from the wiki pages.

## Three Layers

1. **raw/** — Immutable source documents. Read only. Never modify.
2. **wiki/** — LLM-generated pages. Owned entirely by the LLM.
3. **This file (CLAUDE.md)** — The schema. Defines structure, conventions, and workflows.

## Vault Structure

```
vault-root/
├── CLAUDE.md               ← Schema (you are here)
├── index.md                # Catalog of all wiki pages
├── log.md                  # Append-only activity log
├── raw/                    # Immutable sources
│   ├── sources/            # Ingested articles, papers, notes
│   └── assets/             # Downloaded images/attachments
└── wiki/                   # LLM-generated pages
    ├── entities/           # People, orgs, products, papers
    ├── concepts/           # Ideas, techniques, frameworks
    ├── sources/            # Per-source summary pages
    ├── comparisons/        # Side-by-side comparisons
    ├── analyses/           # Saved exploration outputs
    └── overview.md         # High-level synthesis
```

## Conventions

- Pages use `[[wiki/...]]` wikilinks for cross-references.
- Every page has YAML frontmatter: `title`, `type`, `tags`, `created`, `updated`.
- `index.md` is updated after every ingest or creation.
- `log.md` entries use `## [YYYY-MM-DD] <type> | <title>` format.
- All wiki pages go under `wiki/` subdirectories.
- Never modify `raw/` files.
- Answers worth keeping → save to `wiki/analyses/`.

## Path Annotation

LLM always annotates file operations with vault-relative paths:
- Writing: `→ 写入: wiki/concepts/attention.md`
- Reading: `← 读取: wiki/concepts/attention.md`

## Workflows

| Trigger | Action |
|---------|--------|
| New source (URL/file/text) | `/llm-wiki ingest` |
| Question | `/llm-wiki query` |
| Request to review | `/llm-wiki lint` |
| Open in Obsidian GUI | `/llm-wiki browse <page>` |
| Capture web article | `/llm-wiki clip <URL>` |

## Obsidian CLI

Enable in Obsidian: `Settings → General → Command line interface`

Useful commands:
- `obsidian search query="..."` — Search vault
- `obsidian eval code="..."` — Run JS (app must be running)

File operations use direct filesystem I/O (works without Obsidian running). Obsidian auto-detects changes.
