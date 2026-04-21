# Obsidian Setup Guide for LLM Wiki

This guide helps you configure Obsidian to work with the LLM Wiki skill.

## 1. Enable Obsidian CLI

The LLM Wiki skill uses Obsidian's built-in CLI for search and advanced operations.

**Steps:**
1. Open Obsidian
2. Go to `Settings → General → Command line interface`
3. Toggle **Command line interface** to ON
4. Note the `obsidian` binary path shown (usually `C:\Users\<you>\AppData\Local\Obsidian\Obsidian.exe` on Windows)

> **Note:** Obsidian must be running (or launched) for CLI commands to work. File writes work without Obsidian running.

## 2. Configure Attachment Folder

The LLM Wiki saves images to `raw/assets/`. Configure Obsidian to use this folder:

1. `Settings → Files & Links → Attachment folder path`
2. Set to: `raw/assets`

This makes Obsidian store all pasted/dropped images in `raw/assets/` automatically.

## 3. Recommended Hotkey: Download Attachments

When clipping articles, images have online URLs. Use this hotkey to download them locally:

1. `Settings → Hotkeys` (search for "Download")
2. Find **"Download attachments for current file"**
3. Set hotkey: `Ctrl+Shift+D` (or your preference)

After clipping an article, press this hotkey — all images in the note are downloaded to `raw/assets/`.

## 4. Recommended Plugins

### Dataview (highly recommended)

Generates dynamic views from YAML frontmatter.

- Install: Community plugins → search "Dataview"
- After installing, LLM can add frontmatter tags to pages and you can query them with Dataview queries

### QuickAdd (optional)

Macro automation for rapid note creation. Useful if you want hotkey-triggered capture workflows.

### Templater (optional)

Advanced template syntax with JavaScript. Useful for complex note templates.

## 5. Vault Structure Verification

Your vault should look like this after running `/llm-wiki init`:

```
your-vault/
├── .obsidian/               ← Obsidian config (auto-generated)
├── CLAUDE.md                ← Wiki schema
├── index.md                 ← Wiki catalog
├── log.md                   ← Activity log
├── raw/
│   ├── sources/             ← Drop articles here
│   └── assets/              ← Images saved here
└── wiki/
    ├── entities/
    ├── concepts/
    ├── sources/
    ├── comparisons/
    └── analyses/
```

## 6. Quick Test

1. Open Obsidian and open your vault
2. Open a terminal and run:
   ```bash
   obsidian search query="attention"
   ```
   (You should see matching file paths)
3. If it works, the CLI integration is ready

## 7. Graph View

Once your wiki has content, use Obsidian's built-in **Graph View** to see the structure:
- `Ctrl+Shift+G` (or click the graph icon in the sidebar)
- Nodes = wiki pages, Edges = `[[wikilinks]]`
- Use filters to focus on specific types (entities, concepts, etc.)

This is the best way to visualize your wiki's growth over time.
