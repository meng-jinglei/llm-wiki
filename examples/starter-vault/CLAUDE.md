# llm-wiki — Workspace Protocol

This workspace uses a **skill-first knowledge workflow**.

The goal is to keep a persistent wiki that becomes more useful over time:
- new sources are captured and traced
- maintained pages are refreshed instead of constantly recreated
- useful answers can be saved back into the workspace
- humans can always correct outdated or inaccurate pages

## Structure

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

Obsidian may be used as an optional interface for this same directory, but it is not required.

## Rules

- `raw/` is immutable after capture.
- `wiki/` is the maintained knowledge layer.
- Prefer updating existing pages over creating near-duplicates.
- Use the wiki first when answering questions.
- Return to sources when verification is needed.
- Surface contradictions and uncertainty instead of flattening them away.
- Keep `index.md` lightweight.
- Record meaningful actions in `log.md`.
- Humans can always request corrections, refreshes, or restructuring.

## Large-file protocol

When a source is too large or awkward to read in one pass:
- keep the original file in `raw/`
- prefer storing binary attachments in `raw/assets/`
- create or update a source record in `raw/sources/` before broad ingest
- create or update a source map when broad ingest would otherwise be wasteful or hard to verify
- preserve page anchors when writing claims
- say which section or page range needs review next if the source is only partially covered

This is especially useful for long manuals, scanned PDFs, large tables, logs, and source packs.

## Source map protocol

A source map is a lightweight working map for a large or awkward source.

Use one of these modes:
- `explicit_toc` — for sources with a reliable table of contents or stable headings
- `inferred_structure` — for sources with no reliable contents page but enough visible structure to infer working sections
- `coarse_map` — for sources where reliable structure cannot be extracted

A source map should record at least:
- file path
- source type
- structure mode
- structure basis
- confidence
- major sections or working sections
- useful page ranges or other anchors when known
- coverage status

Do not present inferred structure as if it were an official table of contents.

For a large manual PDF, start by making a lightweight source map rather than trying to summarize everything at once.

For a large deck with no contents page, use `inferred_structure` and mark uncertainty explicitly.

For noisy scans, logs, or weakly structured bundles, use `coarse_map` and point to the most useful next region to inspect.

If coverage is partial, say so clearly.

## Correction examples

Allowed prompts include:
- "This page is wrong, fix it."
- "This conclusion is outdated."
- "Refresh this concept using the latest source."
- "Rewrite this section to be more accurate."

## Path reporting

Use workspace-relative paths when reporting file operations.

Examples:
- `→ 写入: wiki/concepts/attention.md`
- `← 读取: raw/sources/transformer-paper.md`
