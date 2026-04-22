# llm-wiki — Vault Protocol

This vault uses a **skill-first knowledge workflow** inside Obsidian.

The goal is to keep a persistent wiki that becomes more useful over time:
- new sources are captured and traced
- maintained pages are refreshed instead of constantly recreated
- useful answers can be saved back into the vault
- humans can always correct outdated or inaccurate pages

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
    ├── sources/
    ├── concepts/
    ├── entities/
    ├── analyses/
    ├── comparisons/
    └── overview.md
```

## Rules

- `raw/` is immutable after capture.
- `wiki/` is the maintained knowledge layer.
- Prefer updating existing pages over creating near-duplicates.
- Use the wiki first when answering questions.
- Return to sources when verification is needed.
- Keep `index.md` lightweight.
- Record meaningful actions in `log.md`.
- Humans can always request corrections, refreshes, or restructuring.

## Correction examples

Allowed prompts include:
- "This page is wrong, fix it."
- "This conclusion is outdated."
- "Refresh this concept using the latest source."
- "Rewrite this section to be more accurate."

## Path reporting

Use vault-relative paths when reporting file operations.
