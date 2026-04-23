# llm-wiki — 开发航线图

> 记录项目的目标、当前状态与演进方向。供项目维护者和协作者参考。

---

## 目标定位

**终极目标：** LLM as a knowledge compiler — 让 LLM 在一个持续积累的本地 Markdown wiki 上工作，每次提问都基于已有的知识层，而不是每次从原始文档从零检索。

**类比：** 像编译器一样，wiki 是"编译后的知识"，原始来源是"源代码"。知识的精炼是一次性的，后续查询基于已编译的输出。

---

## 当前状态：v1.0 — 初始基础设施完成

### 已实现的能力

| 能力 | 说明 |
|------|------|
| **capture** | 将 URL、文件、文本保存到 raw 层 |
| **ingest** | 从 source map 驱动增量提取，沉淀到 wiki |
| **source map** | 支持 `explicit_toc` / `inferred_structure` / `coarse_map` 三种大文件分段模式 |
| **code-anchor** | 源码与 wiki 双向绑定（代码知道 wiki，wiki 知道代码）|
| **review** | 9 项一致性检查（frontmatter、anchor、矛盾、过时、孤儿、交叉引用等）|
| **curate** | 人工主导的合并、拆分、重命名 |
| **map-document** | PDF/DOCX/PPTX 大纲提取（via PyMuPDF/pdfplumber）|
| **index-codebase** | C/C++ AST 符号索引（via tree-sitter-languages）|

### 还不完善的

| 能力 | 现状 | 差距 |
|------|------|------|
| **query** | 极简 — wiki 搜索 + 声明来源 | 无推理链、无交叉验证、多文档联合回答 |
| **curate** | 人工主导 | 自动化程度低，无冲突解决策略 |
| **增量同步** | 无 | source 更新后 wiki 无法 diff/refresh |
| **知识图谱** | 无 | entity 之间无关系边，纯 flat wiki |

---

## Commit 历史回顾

```
86f4288 feat: restructure SKILL.md — 四阶段大改（路由表+目录重构+瘦身后+文档）
91e61a3 refactor: tree-sitter 替换 Python 正则 — C/C++ AST 解析准确率提升
1b54502 feat: 大文件增量 ingest + code anchor — section 级别进度追踪
52a5718 docs: 添加 source map protocol — explicit_toc/inferred/coarse_map 三模式
fb3aea0 docs: 切为 filesystem-first — 移除运行时依赖，纯文件协议
73647ce feat: 初始 llm-wiki skill — 有 Obsidian 强依赖
```

---

## 应用场景分析

### 最适合的场景：单文档、大规模、多次查询

典型案例：AD152(JAKE) 固件项目
- R7F0C014 用户手册 1000+ 页，分章节逐步 ingest
- code-anchor 绑定源码与手册寄存器描述
- source map 驱动增量处理，避免每次从零读取手册

这类场景下 source map + 增量 ingest + code-anchor 的价值链完整：
> PDF → source map → section ingest → wiki → code-anchor → wiki + 源码双向可追溯

### 支撑较弱的场景：多源交叉、推理型查询

例如："根据这三份文档比较两种 MCU 方案的时钟树设计"

当前 `query` 工作流无法处理这种需求。

---

## 演进路线

> 以下方向按优先级排序，仅供参考，不代表承诺。

### Phase 2: query 强化

让 query 从"搜索"进化为"推理"：
- 声明来源（已有基础）
- 支持多轮追问
- 多文档联合回答
- 矛盾 surfacing（已有基础）

**关键问题：** 是否引入推理链格式？是否需要 wiki 级别的知识图谱？

### Phase 3: 增量同步机制

当 source 更新后，wiki 如何 diff/refresh：
- source map 标注 `last_checked`
- ingest 时比较 source 时间戳
- 标记过时的 wiki claim

### Phase 4: 知识冲突解决

多源矛盾时的 surfacing 策略：
- 显式 surface 矛盾，不静默选一
- 提供冲突报告供人类仲裁
- 保留多方观点，标注置信度

### Phase 5: 从 flat wiki 到知识图谱

entity 之间建立关系边：
- `uses` / `conflicts_with` / `implements` 等关系类型
- 图遍历回答"哪个外设用了这个时钟？"
- 支持更复杂的跨文档推理

---

## 版本历史

| 版本 | 日期 | 里程碑 |
|------|------|--------|
| v0.1.0 | 2026-04-22 | 初始 release，9 个工作流 + source map 协议 |
| v1.0 | 2026-04-23 | 基础设施完成，SKILL.md 瘦身为索引路由，目录结构重构，文档完善 |

---

## 项目元数据

- **仓库:** https://github.com/meng-jinglei/llm-wiki
- **当前分支:** main
- **最新 commit:** `86f4288`
- **Skill 入口:** `SKILL.md`（493 行，索引 + 路由）
- **工作流正文:** `sub-skills/tasks/*.md`
- **工具脚本:** `sub-skills/tools/*.md`
