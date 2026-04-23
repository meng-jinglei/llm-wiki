---
name: ingest
description: Turn a source into wiki updates — extract knowledge, create or update wiki pages.
---

## ingest

Use when the user wants a source turned into wiki updates.

### Steps

1. Read `index.md` and any obviously relevant wiki pages.
2. Load the source from `raw/sources/`, URL, file path, or pasted text.
3. If the source is large (per large_file_protocol), read or create a source map first and identify the sections or page ranges most relevant to the user's goal.

   If the source map has sections with `status: pending` and the user did not specify a section, use `priority: high` sections first.

   If the user specified a section, ingest that section and update its `status` to `complete` before moving on.

   If the source has no source map and is too large to ingest in one pass, create a source map first (see large_file_protocol) before writing any wiki content.
4. Create or update `wiki/sources/<slug>.md`.

   **Frontmatter is mandatory for all wiki pages.** Every page must begin with a YAML frontmatter block containing at minimum:
   ```yaml
   ---
   title: "<page title>"
   type: <page_type>
   ---
   ```

   Recognized `type` values:
   - `source_record` — per-source extracted claims
   - `peripheral_page` — MCU peripheral documentation
   - `concept_page` — conceptual topic
   - `entity_page` — named entity or component
   - `overview_page` — project or domain overview
   - `source_map` — large-file structure map
   - `codebase_map` — code symbol index

   Additional fields by type:
   - `source_record`: `source_type`, `chapter`, `page_range`, `source_file`, `status`
   - `peripheral_page`: `mcu`, `chapter`
   - `source_map` / `codebase_map`: `structure_mode` / `index_tool`, `coverage_status`

   After writing, verify the file begins with the frontmatter block and contains no duplicate title line (the title lives in frontmatter only, not as a separate `# Title` heading below it).
5. Identify related concept and entity pages.
6. Prefer updating existing pages before creating new ones.
7. Create new pages only when the concept or entity is meaningfully distinct.
8. Update links between touched pages.
9. Update `index.md` if a new entry point or important page was added.
10. Append an ingest entry to `log.md`.
11. Report all touched paths.
12. If the source still needs more coverage, state which sections or page ranges remain instead of implying the whole source has been fully processed.

### 输出结构

```
wiki/sources/<slug>.md         ← 源记录（每份源文档一个，保留页码锚点）
wiki/<type>/<name>.md         ← 知识页面（peripherals/concepts/entities 等）
index.md                       ← 入口页更新（如有必要）
log.md                         ← ingest 记录
```