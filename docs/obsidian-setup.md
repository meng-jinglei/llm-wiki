# Obsidian Setup Guide for LLM Wiki

This guide explains how to configure Obsidian for the `llm-wiki` skill.

## Enable the Obsidian CLI

1. Open Obsidian.
2. Go to `Settings → General → Command line interface`.
3. Turn the CLI on.

If the `obsidian` command is available, the skill can use it for vault search. If not, the skill still works with direct filesystem reads and writes.

## Configure the attachment folder

To keep downloaded images and attachments in a predictable place:

1. Open `Settings → Files & Links`.
2. Set **Attachment folder path** to `raw/assets`.

## Recommended hotkey

To download article images into the vault after clipping:

1. Open `Settings → Hotkeys`.
2. Search for `Download attachments for current file`.
3. Bind a hotkey such as `Ctrl+Shift+D`.

## Recommended plugins

### Dataview
Useful if you want dynamic tables and filtered views based on page frontmatter.

### Templater
Useful if you want more advanced note templates inside the vault.

## CLI verification

Run this after enabling the CLI:

```bash
obsidian search query="example"
```

If it returns matching file paths, CLI search is available.

## Graph view

Once the wiki has content, use Obsidian Graph View to inspect how pages connect over time.
