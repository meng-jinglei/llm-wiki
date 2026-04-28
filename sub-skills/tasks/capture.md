---
name: capture
description: 将 URL、文件或粘贴文本保存到 raw 层，供后续 wiki 导入
---

## capture（捕获）

当用户提供 URL、文件或粘贴文本并希望将其保存到 raw 层时使用。

### 步骤

1. 将输入标准化为来源记录。
2. 尽可能提取标题和有用的元数据。
3. 将来源保存到 `raw/sources/<slug>.md`。
4. 在适当时将引用的附件保存到 `raw/assets/`。
5. 如果来源较大或难以一次性读完，在 `raw/sources/<slug>.md` 中记录轻量级来源地图，包含文件路径、来源类型、主要章节和已知的有用页码范围。
6. 在 `log.md` 中追加一条捕获记录。
7. 报告保存路径，并在适当时建议执行 ingest。
   如果已创建来源地图，读取它并说明：
   - 哪个章节的状态为 `pending` 且优先级为 `high`
   - 下一步 `ingest` 命令应针对什么目标

### 输出结构

```
raw/sources/<slug>.md         ← 捕获的源记录（URL内容 / 文本摘要）
raw/assets/<original-file>    ← 大文件附件（PDF/DOCX等）
```
