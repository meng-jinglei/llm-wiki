---
name: project-init
description: 为现有项目构建 wiki 知识 — 扫描结构，创建 raw/wiki 骨架
---

## project-init（项目初始化）

当用户希望为现有项目构建 wiki 知识时使用。

示例：
- "我有一个带源代码和芯片手册的固件项目，帮我建 wiki"
- "为这个 MCU 项目初始化工作空间"

### 步骤

1. 扫描项目的模块结构（顶级目录、关键文件、构建配置）。
2. 识别外部依赖（SDK 头文件、芯片手册、数据表）。
3. 如果不存在，创建 llm-wiki 结构（raw/、wiki/）。
4. 使用项目地图创建或更新 `wiki/overview.md`。
5. 为主要模块或组件创建 `wiki/entities/` 条目。
6. 如果存在芯片/手册，在 `raw/sources/` 中创建轻量级来源地图。
7. 根据项目是否使用该章节，为每个来源地图章节设置 `project_relevance`。
8. 报告所有触及的路径并建议下一步（通常为 `code-anchor`）。

init 期间不要导入任何章节。目标是构建骨架并设置优先级。

project-init 完成后，说明具体的下一步步骤：
  1. 对 <manual-file> 执行 `map-document` → 创建 `raw/sources/<slug>.map.md`
  2. 对 <code-dir> 执行 `index-codebase` → 创建 `raw/sources/<slug>.codebase.md`
  3. 对来源地图中最高优先级的待处理章节执行 `ingest`

### 输出结构

```
<project-root>/
├── CLAUDE.md              ← 复制自 templates/vault-CLAUDE.md
├── index.md               ← 入口页（链接到 wiki/overview.md）
├── log.md                 ← 初始化记录
├── raw/
│   ├── sources/           ← （待建档时填充）
│   └── assets/            ← （附件/大文件）
└── wiki/
    ├── overview.md        ← 项目地图（模块、外设、关键文件）
    ├── sources/           ← 源记录（每份文档一个）
    ├── concepts/          ← 概念页
    ├── entities/          ← 实体页（模块、组件）
    ├── analyses/          ← 分析页
    └── comparisons/      ← 对比页
```
