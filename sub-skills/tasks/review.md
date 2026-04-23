---
name: review
description: Health check and consistency review of the wiki — frontmatter, anchors, contradictions, orphans.
---

## review

Use when the user wants a health check, maintenance pass, or consistency review.

Run these checks in order:

1. **Frontmatter check** — Every wiki page must begin with a YAML frontmatter block:
   - Missing frontmatter → add it (see ingest Step 4 for schema)
   - Duplicate title line after frontmatter → remove it
   - Invalid `type` value → correct to known type

2. **Source anchor check** — Every factual claim must have a `→ [Source: ...]` anchor.
   Missing anchors → add them or mark the claim for human review.

3. **Contradiction check** — Same fact stated differently across pages.
   Surface differences; do not silently pick one.

4. **Stale claim check** — Claims that no longer match the current source or code.
   Flag for refresh or mark as outdated.

5. **Orphan page check** — Pages not linked from `index.md` or any other page.
   Add a link or delete the orphan.

6. **Cross-reference check** — Pages that mention a concept or entity without linking.
   Add wikilinks (`[[page]]` or relative paths) where missing.

7. **Duplicate page check** — Multiple pages covering the same topic.
   Suggest merging; apply only if user approves.

8. **index.md drift check** — Entries in `index.md` that no longer exist on disk.
   Remove stale entries; add missing high-value pages.

9. **Source map status check** — Source maps with all sections `status: complete`.
   Mark `coverage_status: focused_ingest_complete`.

Report findings with file paths grouped by severity: CRITICAL / WARN / INFO.
If the user wants fixes, apply the changes and update `log.md`.

### 输出结构

无文件写入（仅报告）。如用户要求修复：
```
<修改的页面>                 ← frontmatter 补充 / 重复行删除 / 链接添加
log.md                       ← review 记录
```