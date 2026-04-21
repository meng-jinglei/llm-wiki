# llm-wiki

A Claude Code skill for building and maintaining a personal LLM-powered wiki inside your Obsidian vault — persistent, compounding knowledge base.

Based on the [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) pattern by Andrej Karpathy.

## What it does

Drop an article, paper, or note into your vault and the LLM:

1. Reads and analyzes it
2. Creates structured summary pages in `wiki/sources/`
3. Updates or creates entity/concept pages in `wiki/entities/` and `wiki/concepts/`
4. Maintains cross-references, flags contradictions, and keeps `index.md` current
5. Logs every action to `log.md`

The wiki is a **persistent, compounding artifact** — cross-references are pre-built, synthesis accumulates over time. The LLM never re-derives knowledge from scratch.

## Features

- **Ingest** — Process URLs, files, or pasted text into the wiki
- **Query** — Ask questions; LLM searches the wiki and synthesizes answers
- **Lint** — Health-check for contradictions, stale pages, orphan pages
- **Browse** — Open any wiki page in Obsidian GUI
- **Clip** — Capture web articles to `raw/sources/`

All file operations are annotated with vault-relative paths so you can locate any file instantly in Obsidian.

## Requirements

- [Claude Code](https://claude.ai/code) (latest)
- [Obsidian](https://obsidian.md/) 1.12+ with CLI enabled (`Settings → General → Command line interface`)
- An Obsidian vault (new or existing)

## Quick Start

### 1. Clone / copy this skill

Copy the `SKILL.md` to your Claude Code skills directory:

```bash
# Claude Code scans ~/.claude/skills/ for skills
cp SKILL.md ~/.claude/skills/llm-wiki/SKILL.md
```

Or clone this repo and symlink:

```bash
git clone https://github.com/meng-jinglei/llm-wiki.git ~/.claude/skills/llm-wiki
```

### 2. Initialize the wiki

```bash
/llm-wiki init
```

Enter your Obsidian vault path when prompted. The skill creates:

```
vault-root/
├── CLAUDE.md              # Schema (tells LLM how the wiki works)
├── index.md               # Catalog of all wiki pages
├── log.md                 # Activity log
├── raw/                   # Immutable sources
│   ├── sources/           # Ingested articles, papers
│   └── assets/            # Downloaded images
└── wiki/                  # LLM-generated pages
    ├── entities/
    ├── concepts/
    ├── sources/
    ├── comparisons/
    └── analyses/
```

### 3. Start building your wiki

```bash
# Clip a web article
/llm-wiki clip https://example.com/article

# Ingest and process it
/llm-wiki ingest

# Ask questions
/llm-wiki query What does the article say about X?

# Health-check
/llm-wiki lint
```

## Obsidian Setup

See [obsidian-setup.md](obsidian-setup.md) for:
- Enabling Obsidian CLI
- Configuring attachment folders
- Recommended plugins (Dataview, QuickAdd)

## Architecture

Three layers:

| Layer | Description |
|-------|-------------|
| `raw/` | Immutable source documents — LLM reads, never modifies |
| `wiki/` | LLM-generated pages — summaries, entities, concepts, analyses |
| `CLAUDE.md` | Schema — defines conventions and workflows |

## License

MIT
