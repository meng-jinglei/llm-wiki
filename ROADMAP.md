# llm-wiki — 开发航线图

记录项目的目标、当前状态与演进方向。

---

## 目标定位

**终极目标：** LLM as a knowledge compiler — LLM 在一个持续积累的本地 Markdown wiki 上工作，每次提问都基于已有的知识层，不每次从原始文档从零检索。

**类比：** 编译器将源代码编译为可执行文件，llm-wiki 将原始来源编译为结构化 wiki。编译是一次性的，后续查询基于编译产物。

---

## 当前状态：v1.1 — 全中文技能定义 + 项目结构优化

### 已实现

| 能力 | 说明 |
|------|------|
| **capture** | URL/文件/文本保存到 raw 层 |
| **ingest** | 来源地图驱动的增量导入 |
| **source map** | explicit_toc / inferred_structure / coarse_map 三种模式 |
| **code-anchor** | 源码与 wiki 双向绑定 |
| **review** | 9 项一致性检查 |
| **curate** | 人工主导的合并、拆分、重命名 |
| **map-document** | PDF/DOCX/PPTX 大纲提取 |
| **index-codebase** | C/C++ AST 符号索引 |
| **全中文化** | SKILL.md、sub-skills 全部翻译为中文 |

### 还不完善

| 能力 | 现状 | 差距 |
|------|------|------|
| **compile** | 设计完成，待实现 | 三阶段编译验证（来源覆盖→声明完整性→矛盾检测）|
| **query** | 极简 — wiki 搜索 + 声明来源 | 无推理链、多文档联合回答 |
| **增量同步** | 无 | source 更新后 wiki 无法 diff/refresh |
| **知识图谱** | 无 | entity 之间无关系边 |

---

## 演进路线

### Phase 2: 知识编译管线（当前阶段）

实现 `compile` 工作流 + `## 关键声明` 约定：

- 来源覆盖检查：来源地图章节进度追踪
- 声明完整性检查：每条事实声明必须有可解析的来源锚点
- 矛盾检测：跨页面同一话题的冲突声明
- 编译报告：`wiki/_compiled/report-YYYY-MM-DD.md`

相关文件：
- `sub-skills/tasks/compile.md`（新增）
- `templates/page-template.md`（加入关键声明区块）
- `SKILL.md`（注册 compile 工作流）

### Phase 3: query 强化

从"搜索"进化为"推理"：
- 多轮追问
- 多文档联合回答
- 利用声明层做交叉验证

### Phase 4: 增量同步

来源更新后 wiki 如何 diff/refresh：
- 来源地图标注 `last_checked`
- 基于声明层定位受影响页面
- 标记过时声明

### Phase 5: 知识图谱

entity 之间建立关系边：
- `uses` / `depends_on` / `configures` 等关系类型
- 图遍历支持跨文档推理

---

## 应用场景

### 最适场景：单文档、大规模、多次查询

固件项目：1000+ 页手册 → source map → 增量 ingest → wiki → code-anchor → 双向可追溯

### 薄弱场景：多源交叉、推理型查询

需要 Phase 3+5 才能完整支撑。

---

## 项目元数据

- **仓库:** https://github.com/meng-jinglei/llm-wiki
- **当前分支:** main
- **Skill 入口:** `SKILL.md`
- **工作流:** `sub-skills/tasks/*.md`
- **工具:** `sub-skills/tools/*.md`
