# llm-wiki

[English](README.md) · [简体中文](README.zh-CN.md)

A Claude Code skill for running a skill-first knowledge workflow inside a local Markdown workspace.

Instead of treating every question as a fresh retrieval task, `llm-wiki` helps Claude maintain a persistent Markdown wiki that compounds over time:

- raw sources stay traceable
- wiki pages are updated instead of constantly recreated
- useful answers can be saved back into the workspace
- humans keep the right to correct, refresh, and reorganize the wiki

## What this repository is

This repository is a **skill protocol repository**, not a standalone runtime application.

It contains:

- `SKILL.md` — the publishable Claude Code skill
- `docs/` — filesystem-first workflow guidance, optional Obsidian integration, and usage examples
- `templates/` — canonical workspace files and page templates
- `examples/` — a starter workspace showing the intended output shape

## Core model

`llm-wiki` works with three layers:

1. **Raw layer** — source capture and attachments under `raw/`
2. **Wiki layer** — maintained knowledge pages under `wiki/`
3. **Schema layer** — workflow and maintenance rules in `CLAUDE.md` and the skill itself

The wiki is meant to be a persistent, compounding knowledge artifact rather than a pile of one-off summaries.

## Main workflows

The v1 workflow contract exposes these main actions:

- `init` — initialize or repair the workspace structure and core protocol files
- `capture` — save a URL, file, or pasted text into the raw layer
- `ingest` — turn a source into wiki updates
- `query` — answer from the wiki first, then optionally save the result back
- `review` — inspect the wiki for contradictions, drift, stale claims, and missing links
- `curate` — perform human-led restructuring such as merging, splitting, renaming, or reorganizing pages

## Workflow principles

- Keep `raw/` immutable after capture
- Prefer updating existing pages over creating near-duplicates
- Use the wiki as the primary answer surface, not raw material
- Surface contradictions instead of silently flattening them
- Treat human correction as a first-class workflow
- Record meaningful actions in `log.md`
- Keep `index.md` as a lightweight entry point, not a giant registry of everything

## Install

Copy the skill into your Claude Code skills directory:

```bash
mkdir -p ~/.claude/skills/llm-wiki
cp SKILL.md ~/.claude/skills/llm-wiki/SKILL.md
```

Or clone this repository into your skills directory:

```bash
git clone https://github.com/meng-jinglei/llm-wiki.git ~/.claude/skills/llm-wiki
```

## Filesystem-first workflow

This skill is designed to work directly on a normal local Markdown workspace.

- Prefer direct filesystem reads and writes for reliability
- Keep the llm-wiki schema under the workspace root
- Use workspace-relative paths when reporting meaningful file operations
- Treat Obsidian as optional rather than required

## Optional Obsidian integration

If you already use Obsidian, it can serve as a convenient interface for browsing, searching, and navigating the same workspace.

- Use the Obsidian CLI as an optional enhancement when available
- Fall back to file search when the CLI is unavailable
- Only trigger GUI-opening actions when explicitly requested

See [docs/obsidian-setup.md](docs/obsidian-setup.md) for optional integration guidance and [docs/usage-examples.md](docs/usage-examples.md) for workflow-oriented prompt examples.

## Repository structure

```text
llm-wiki/
├── SKILL.md
├── README.md
├── README.zh-CN.md
├── docs/
│   └── obsidian-setup.md
├── templates/
│   ├── index.md
│   ├── log.md
│   ├── page-template.md
│   └── vault-CLAUDE.md
└── examples/
    └── starter-vault/
        ├── CLAUDE.md
        ├── index.md
        ├── log.md
        └── wiki/
            └── overview.md
```

## Templates vs examples

- `templates/` contains reusable protocol files and page templates used during initialization
- `examples/` contains a readable starter workspace that demonstrates the intended structure and tone

## Requirements

- Claude Code
- A local Markdown workspace

## License

MIT
