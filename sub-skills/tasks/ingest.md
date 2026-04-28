---
name: ingest
description: 将来源转化为 wiki 更新 — 提取知识，创建或更新 wiki 页面
---

## ingest（导入）

当用户希望将来源转化为 wiki 更新时使用。

### 步骤

1. 读取 `index.md` 和任何明显相关的 wiki 页面。
2. 从 `raw/sources/`、URL、文件路径或粘贴文本加载来源。
3. 如果来源较大（根据 large_file_protocol），先读取或创建来源地图，确定与用户目标最相关的章节或页码范围。

   如果来源地图中有 `status: pending` 的章节且用户未指定章节，优先使用 `priority: high` 的章节。

   如果用户指定了章节，导入该章节并将其 `status` 更新为 `complete`，然后继续。

   如果来源没有来源地图且太大无法一次导入，在写入任何 wiki 内容之前先创建来源地图（见 large_file_protocol）。
4. 创建或更新 `wiki/sources/<slug>.md`。

   **所有 wiki 页面必须有 frontmatter。** 每个页面必须以 YAML frontmatter 块开头，至少包含：
   ```yaml
   ---
   title: "<页面标题>"
   type: <页面类型>
   ---
   ```

   已识别的 `type` 值：
   - `source_record` — 每份来源的提取声明
   - `peripheral_page` — MCU 外设文档
   - `concept_page` — 概念主题
   - `entity_page` — 命名实体或组件
   - `overview_page` — 项目或领域概述
   - `source_map` — 大文件结构地图
   - `codebase_map` — 代码符号索引

   按类型附加字段：
   - `source_record`：`source_type`、`chapter`、`page_range`、`source_file`、`status`
   - `peripheral_page`：`mcu`、`chapter`
   - `source_map` / `codebase_map`：`structure_mode` / `index_tool`、`coverage_status`

   写入后，验证文件以 frontmatter 块开头，且不包含重复的标题行（标题仅存在于 frontmatter 中，不在其下方作为单独的 `# 标题` 标题）。
5. 识别相关的概念和实体页面。
6. 优先更新现有页面，而非创建新页面。
7. 仅当概念或实体有实质性区别时才创建新页面。
8. 更新触及页面之间的链接。
9. 如果添加了新的入口点或重要页面，更新 `index.md`。
10. 在 `log.md` 中追加一条导入记录。
11. 报告所有触及的路径。
12. 如果来源仍需更多覆盖，说明哪些章节或页码范围仍有待处理，而非暗示整个来源已被完全处理。

### 输出结构

```
wiki/sources/<slug>.md         ← 源记录（每份源文档一个，保留页码锚点）
wiki/<type>/<name>.md         ← 知识页面（peripherals/concepts/entities 等）
index.md                       ← 入口页更新（如有必要）
log.md                         ← ingest 记录
```
