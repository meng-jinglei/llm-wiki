---
name: capture
description: Preserve URL, file, or pasted text into raw layer before wiki ingestion.
---

## capture

Use when the user gives a URL, file, or pasted text and wants it preserved in the raw layer first.

### Steps

1. Normalize the input into a source record.
2. Extract title and useful metadata when available.
3. Save the source to `raw/sources/<slug>.md`.
4. Save referenced attachments to `raw/assets/` when appropriate.
5. If the source is large or hard to read end-to-end, record a lightweight source map in `raw/sources/<slug>.md` with the file path, source type, major sections, and useful page ranges when known.
6. Append a capture entry to `log.md`.
7. Report the saved path and suggest ingest when appropriate.
   If a source map was created, read it and state:
   - which section has `status:pending` and `priority:high`
   - what the next `ingest` command should target

### 输出结构

```
raw/sources/<slug>.md         ← 捕获的源记录（URL内容 / 文本摘要）
raw/assets/<original-file>    ← 大文件附件（PDF/DOCX等）
```