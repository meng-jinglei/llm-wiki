# llm-wiki — 开发航线图

记录项目的目标、当前状态与演进方向。

---

## 目标定位

**终极目标：** LLM as a knowledge compiler — LLM 在一个持续积累的本地 Markdown wiki 上工作，每次提问都基于已有的知识层，不每次从原始文档从零检索。

**类比：** 编译器将源代码编译为可执行文件，llm-wiki 将原始来源编译为结构化 wiki。编译是一次性的，后续查询基于编译产物。

---

## 当前状态：v1.3 — Phase 2-5 全部完成，知识编译全链路闭环

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
| **compile** | 三阶段编译验证 + claims 解析器机械验证 + last_checked 过期检测 |
| **research** | 自动研究——多渠道搜索、中英文双语、agent-browser 自动下载 |
| **query** | 意图路由、渐进式加载、声明交叉验证、query→compile 反馈闭环 |
| **sync** | 增量同步——来源变更检测、受影响页面定位、声明 diff、过时标记 |
| **claims 解析器** | parse-claims.py：新旧格式兼容 + 矛盾检测 + 受影响页面 + diff |
| **知识图谱** | build-graph.py：4 信号关系模型 + Louvain 社区检测 + 图谱洞察 |
| **Datalog 推理** | run-datalog.py：derived 规则执行 + 变量绑定冲突检测 + 推导链追溯 |
| **全中文化** | SKILL.md、sub-skills 全部翻译为中文 |

### 还不完善

| 能力 | 现状 | 差距 |
|------|------|------|
| **关键声明采用率** | 0%（实战项目 AD152） | 事实散落于散文，compile 阶段二三依赖结构化声明 |
| **query 渐进式加载** | 已设计，未实战验证 | 需在大型 wiki 场景下测试 |
| **Datalog 推理引擎** | 已实现，基础验证 | 变量绑定冲突检测正确，待复杂规则场景测试 |

---

## 演进路线

### Phase 2: 知识编译管线 ✅（已完成）

实现 `compile` 工作流 + `## 关键声明` 约定，并在真实项目（AD152）上实战验证：

- 来源覆盖检查：来源地图章节进度追踪 ✅
- 声明完整性检查：每条事实声明必须有可解析的来源锚点 ✅
- 矛盾检测：跨页面同一话题的冲突声明 ✅
- 编译报告：`wiki/_compiled/report-YYYY-MM-DD.md` ✅
- 锚点格式兼容：同时支持 `→ [来源:` 和 `→ [Source:` ✅

实战发现：当前 wiki 页面缺少 `## 关键声明` 结构化区块，事实散落于散文。
编译管线可以检测到这一点并给出明确的改进路线。

相关文件：
- `sub-skills/tasks/compile.md`（已实现并实战验证）
- `templates/page-template.md`（含关键声明区块模板）
- `SKILL.md`（已注册 compile 工作流）

### Phase 3: query 强化 ✅（v1.3 已完成）

从"搜索"进化为"推理"：
- 意图路由（事实/关系/对比/因果/探索）✅
- 渐进式多轮加载（R1→R2→R3→R4）✅
- 多文档联合回答 ✅
- 声明交叉验证与编译报告感知 ✅
- query→compile 反馈闭环 ✅
- 多轮追问协议 ✅
- research 工作流（自动研究）✅

相关文件：
- `sub-skills/tasks/query.md`（已增强）
- `sub-skills/tasks/research.md`（新增）
- `.planning/phase-3-deep-dive.md`（设计分析）
- `.planning/phase-3-5-research.md`（整体方向研究）

### Phase 4: 增量同步 + 编译强化 ✅（v1.3 已完成）

来源更新后 wiki 如何 diff/refresh，以及编译从"检查"到"推理"的升级：

**编译强化**：
- claims 代码块格式规范 ✅（`templates/claims-format-spec.md`）
- claims 解析器 ✅（`sub-skills/tools/parse-claims.py`，新旧兼容 + 受影响页面扫描 + diff）
- compile 阶段一/二/三增强 ✅（`last_checked` 检查 + 结构化验证 + 机械矛盾检测）
- 页面模板升级 ✅（`templates/page-template.md` 使用 claims 代码块）

**增量同步**：
- sync 工作流 ✅（`sub-skills/tasks/sync.md`）
- 来源地图 `last_checked` 标注 ✅
- 受影响页面定位 ✅（parse-claims.py --source）
- 声明 diff ✅（parse-claims.py --diff）
- 过时声明标记 ✅（`status: outdated` + `needs_refresh` frontmatter）

**待后续 Phase 5 考虑**：
- Datalog 推理引擎集成（Google Mangle 或 pyDatalog）

相关文件：
- `sub-skills/tasks/compile.md`（已增强）
- `sub-skills/tasks/sync.md`（新增）
- `sub-skills/tools/parse-claims.py`（新增）
- `templates/claims-format-spec.md`（新增）
- `.planning/datalog-reliability-analysis.md`（推理可靠性分析）
- `.planning/scalability-evaluation.md`（分层抽象扩展性评估）

### Phase 5: 知识图谱 ✅（v1.3 已完成）

entity 之间建立关系边，图遍历支持跨文档推理：

**图构建与分析**：
- 4 信号关系模型（wikilink / 来源重叠 / 声明关联 / 类型亲和）✅
- Louvain 社区检测 + 凝聚度评分 ✅
- 图谱洞察（桥接节点、孤立页面、稀疏社区、意外连接）✅
- GEXF 图导出 ✅
- graph 工作流 ✅（`sub-skills/tasks/graph.md`）

**Datalog 推理引擎**：
- `derived:` 规则执行（纯演绎、变量绑定冲突检测）✅
- 推导链追溯 + 来源继承 ✅
- claims 解析器集成 ✅

相关文件：
- `sub-skills/tools/build-graph.py`（新增）
- `sub-skills/tools/run-datalog.py`（新增）
- `sub-skills/tasks/graph.md`（新增）
- `.planning/phase-5-plan.md`（规划文档）

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
