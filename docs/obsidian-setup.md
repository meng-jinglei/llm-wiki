# Obsidian Setup Guide for llm-wiki

This guide explains how to make `llm-wiki` work smoothly inside an Obsidian vault.

## 1. Prepare your vault

Make sure you already have an Obsidian vault that Claude can read and update.

The expected workflow structure is:

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

You can let `llm-wiki` initialize or repair this structure with the `init` workflow.

## 2. Optional: enable the Obsidian CLI

The Obsidian CLI is an optional enhancement. It is useful for search and navigation, but `llm-wiki` should still work through direct filesystem reads and writes when the CLI is unavailable.

To enable it:

1. Open Obsidian.
2. Go to `Settings → General → Command line interface`.
3. Turn the CLI on.

You can test it with:

```bash
obsidian search query="example"
```

If it returns matching file paths, CLI search is available.

## 3. Optional: configure the attachment folder

If you plan to capture web pages with attachments, set Obsidian's attachment folder path to `raw/assets`.

In Obsidian:
1. Open `Settings → Files & Links`
2. Set **Attachment folder path** to `raw/assets`

## 4. Recommended workflow habits

### Capture
Use capture when you want to preserve a URL, file, or pasted text in the raw layer first.

### Ingest
Use ingest when you want Claude to turn a source into wiki updates:
- source summary pages
- concept pages
- entity pages
- index and log updates

### Query
Use query when you want an answer from the maintained wiki first.
If a result is worth keeping, let Claude save it into `wiki/analyses/` or `wiki/comparisons/`.

### Review
Use review when you want to inspect:
- contradictions
- stale claims
- missing links
- duplicate pages
- drift between `index.md` and the actual wiki

### Curate and correct
Use curate when you want to merge, split, rename, reorganize, or explicitly fix a page.

Examples:
- "This page is wrong, fix it."
- "Refresh this concept using the latest source."
- "Merge these two pages."
- "Split this page into two topics."

## 5. Recommended plugins

These are optional enhancements, not core requirements.

### Dataview
Useful for dynamic lists and views derived from page frontmatter.

### Templater
Useful if you want additional note templates beyond the default `llm-wiki` templates.

## 6. Graph view

Once the wiki grows, Obsidian Graph View can help you inspect how concepts, entities, and analyses connect over time.

## 7. Important operational note

The most reliable default is:
- direct filesystem reads and writes for content changes
- Obsidian CLI as an optional helper
- GUI-opening actions only when explicitly requested
