# llm-wiki

A Claude Code skill for building and maintaining an LLM-powered wiki inside your Obsidian vault.

It follows the LLM Wiki pattern: raw sources stay immutable, the LLM maintains structured wiki pages, and answers can be fed back into the vault so knowledge compounds over time.

## What this repository contains

- `SKILL.md` — the publishable Claude Code skill
- `docs/` — user-facing setup and usage documentation
- `templates/` — files the skill can use when initializing a vault wiki
- `examples/` — a starter vault example showing the intended output shape

## Install

Copy the skill into your Claude Code skills directory:

```bash
cp SKILL.md ~/.claude/skills/llm-wiki/SKILL.md
```

Or clone this repository into your skills directory:

```bash
git clone https://github.com/meng-jinglei/llm-wiki.git ~/.claude/skills/llm-wiki
```

## What the skill does

The skill supports these workflows:

- `init` — initialize wiki structure inside an Obsidian vault
- `clip` — capture a web page into `raw/sources/`
- `ingest` — turn a source into structured wiki pages
- `query` — answer questions from the accumulated wiki
- `lint` — review the wiki for contradictions and maintenance issues
- `browse` — open a target page in Obsidian

## Obsidian integration

The skill is designed to work inside an Obsidian vault.

- Prefer direct filesystem reads and writes for reliability
- Use `obsidian search` when the Obsidian CLI is available
- Fall back to file search when the CLI is unavailable
- Only use GUI-opening actions when explicitly requested

See setup details in [docs/obsidian-setup.md](docs/obsidian-setup.md).

## Repository structure

```text
llm-wiki/
├── SKILL.md
├── README.md
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

- `templates/` contains reusable initialization inputs for the skill
- `examples/` contains a human-readable sample result for reference

## Requirements

- Claude Code
- Obsidian
- An Obsidian vault

## License

MIT
