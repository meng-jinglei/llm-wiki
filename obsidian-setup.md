# Obsidian Setup Guide for LLM Wiki

This guide helps you configure Obsidian to work with the LLM Wiki skill.

## 1. Enable Obsidian CLI

The LLM Wiki skill uses Obsidian's built-in CLI for search and advanced operations.

**Steps:**
1. Open Obsidian
2. Go to `Settings → General → Command line interface`
3. Toggle **Command line interface** to ON

> **Note:** Obsidian must be running (or launched) for CLI commands to work. File writes work without Obsidian running.

## 2. Configure Attachment Folder

The LLM Wiki saves images to `raw/assets/`. Configure Obsidian to use this folder:

1. `Settings → Files & Links → Attachment folder path`
2. Set to: `raw/assets`

## 3. Recommended Hotkey: Download Attachments

After clipping an article, press this hotkey to download all images locally:

1. `Settings → Hotkeys` → search "Download"
2. Find **"Download attachments for current file"**
3. Set hotkey: `Ctrl+Shift+D`

## 4. Recommended Plugins

### Dataview (recommended)

Generates dynamic views from YAML frontmatter.
Install: Community plugins → search "Dataview"

### Templater (optional)

Advanced template syntax with JavaScript for complex note templates.

## 5. Vault Structure

After `/llm-wiki init`, your vault looks like:

```
vault-root/
├── CLAUDE.md               ← Wiki schema
├── index.md                ← Wiki catalog
├── log.md                  ← Activity log
├── raw/
│   ├── sources/           ← Drop articles here
│   └── assets/            ← Images saved here
└── wiki/
    ├── entities/
    ├── concepts/
    ├── sources/
    ├── comparisons/
    └── analyses/
```

## 6. Verify CLI

Open a terminal and run:

```bash
obsidian search query="attention"
```

If you see matching file paths, the CLI is working.

## 7. Graph View

Once your wiki has content, use Obsidian's built-in Graph View:
- `Ctrl+Shift+G` or click the graph icon in the sidebar
- Nodes = wiki pages, Edges = `[[wikilinks]]`

Use filters to focus on specific types (entities, concepts, etc.).
