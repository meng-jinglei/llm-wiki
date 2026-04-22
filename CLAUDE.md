## Project

**llm-wiki**

`llm-wiki` is a skill-first knowledge workflow for Claude Code + Obsidian.

The repository is not a standalone runtime application. Its primary purpose is to define and distribute the workflow protocol, vault schema, and starter templates for maintaining a persistent Markdown wiki inside an Obsidian vault.

**Core value:** New sources should update and improve an existing knowledge layer instead of becoming one-off summaries.

### Constraints

- **Operating model:** Work inside Claude Code and a normal Obsidian vault.
- **Primary artifact:** The maintained Markdown wiki is the main knowledge layer.
- **Human role:** Humans can always correct, refresh, and reorganize maintained pages.
- **Adoption:** Setup should remain lightweight enough for personal use and easy friend trials.
- **Repository shape:** This repo should stay focused on skill definitions, schema files, templates, examples, and usage guidance.

## Workflow Contract

The main workflow actions are:
- `init`
- `capture`
- `ingest`
- `query`
- `review`
- `curate`

### Core rules

- Keep `raw/` immutable after capture.
- Prefer updating existing pages over creating near-duplicates.
- Use the wiki first when answering questions.
- Surface contradictions and uncertainty instead of silently flattening them.
- Record meaningful actions in `log.md`.
- Keep `index.md` lightweight.
- Treat human correction as a first-class workflow.

## Vault Structure

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

## Page Types

- `wiki/sources/` — per-source summaries and extracted claims
- `wiki/concepts/` — maintained concept pages
- `wiki/entities/` — maintained entity pages
- `wiki/analyses/` — saved answers and topic analyses
- `wiki/comparisons/` — structured comparisons

## Project Skills

No project-local skills are currently defined.

## Git Version Management

Treat this repository as a real project under git version control, not as a disposable skill folder.

- Keep changes coherent, reviewable, and suitable for normal git history.
- Prefer clean, intentional commits over ad-hoc local-only edits when the user wants changes to persist.
- When reporting completed work, be ready to summarize the git-visible change set.
- Preserve repository hygiene so the skill, templates, examples, and protocol docs can evolve as a maintained project.
- When `SKILL.md` changes, do not immediately update the installed Claude Code skill or push the change. Show the change first, confirm with the user, and only then apply or publish it.

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
