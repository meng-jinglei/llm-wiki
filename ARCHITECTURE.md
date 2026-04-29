# 架构设计

llm-wiki 的设计原理、架构决策和未来演进方向。

## 核心理念

**知识编译 > 知识检索。** 传统 RAG 相当于解释器——每次查询时重新从原始文档中发现知识。llm-wiki 相当于编译器——将原始来源一次编译为结构化的 wiki，后续查询基于编译产物，不重复推导。

## 三层架构

```
raw/  ──→ wiki/  ──→ 编译报告
源码      中间表示    验证结果
（不可变）  （持久化）   （只读诊断）
```

| 层 | 目录 | 角色 | 维护者 |
|---|------|------|--------|
| 原始来源 | `raw/` | 不可变的真相来源 | 人类（LLM 只读） |
| Wiki | `wiki/` | 编译后的知识页面 | LLM 主要维护 |
| 规则 | `CLAUDE.md` + `SKILL.md` | 工作流协议和模式 | 人+LLM 共同演进 |

## 关键设计决策

### 1. Markdown 即存储

不引入数据库、JSON 中间格式或向量索引。wiki 是唯一的知识存储——可直接 `grep`、`git diff`、`git blame`。编译器只做只读验证，不生成新格式的产物。

### 2. 来源不可变

`raw/` 在捕获后不可修改。所有知识追溯链：wiki 声明 → 来源锚点 → raw 文件 → 原始文档页码。

### 3. 声明层约定

wiki 页面在散文概述之外，可包含 `## 关键声明` 区块，用列表格式声明原子化事实。每行以 `→ [来源: path, p.XX]` 结尾。编译器依赖此约定做机械验证。

```markdown
## 关键声明
- 时钟源: PCLKB → [来源: R7F0C014_manual, p.134]
- 分频比: 1/256 (默认) → [来源: R7F0C014_manual, p.512]
```

### 4. 编译器是只读验证

编译不生成新产物——wiki 本身就是编译产物。编译器扫描现有 wiki，生成编译报告（`wiki/_compiled/report-*.md`），报告声明完整性、矛盾、覆盖进度。

### 5. 大文件增量导入

长篇手册和参考 PDF 通过来源地图（`raw/sources/*.map.md`）管理。来源地图跟踪每个章节的导入状态（pending/active/complete/skipped），支持中断恢复和按优先级处理。

### 6. 模块化技能结构

SKILL.md 是入口和规则汇总。具体工作流定义在 `sub-skills/tasks/` 中。外部工具集成（map-document、index-codebase）在 `sub-skills/tools/` 中。这保持了 SKILL.md 的紧凑性，同时允许子技能独立演化。

## 工作流关系

```
用户输入 → init/capture → ingest → query
                         ↑          ↓
                        compile ← review/curate
```

- **init**: 初始化工作空间骨架
- **capture**: 保存来源到 raw 层
- **ingest**: 将来源导入 wiki（核心编译动作）
- **query**: 从 wiki 回答，声明来源
- **compile**: 三阶段编译验证（来源覆盖 → 声明完整性 → 矛盾检测）
- **review**: 9 项健康检查
- **curate**: 人工主导的重组优化
- **project-init**: 为现有项目构建 wiki 骨架
- **code-anchor**: 源码与 wiki 双向绑定

## 编译阶段

编译是 `compile` 工作流执行的只读验证过程。v1.3+ 支持基于 claims 解析器的机械验证。

| 阶段 | 检查目标 | 工具 | 严重度 |
|------|---------|------|--------|
| 来源覆盖 | 来源地图进度、高优先级章节是否遗漏 | 手动扫描 | WARN/INFO |
| 声明完整性 | 每条声明是否有可解析的来源锚点 | `parse-claims.py` | CRITICAL/WARN |
| 矛盾检测 | 按 (谓词, 主体) 分组检测冲突声明值 | `parse-claims.py` | WARN/INFO |

### Claims 解析流程

```
wiki/*.md → parse-claims.py → 结构化三元组 (JSON)
  │                              │
  ├── 新格式: ```claims 代码块    ├── predicate: clock_source
  │   clock_source(periph:WDT,    ├── subject: WDT
  │     source:PCLKB) %% → [...]  ├── params: {periph:WDT, source:PCLKB}
  │                              └── source: manual, p.134
  └── 旧格式: ## 关键声明
      - 时钟源: PCLKB → [...]

格式规范: templates/claims-format-spec.md
解析器: sub-skills/tools/parse-claims.py
```

编译产物：`wiki/_compiled/report-YYYY-MM-DD.md`

## 未来方向

见 [ROADMAP.md](ROADMAP.md)。当前阶段目标：实现知识编译管线（声明层 + compile 工作流）。
