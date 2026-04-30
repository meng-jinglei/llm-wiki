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

wiki 页面支持两种声明格式：

**新格式（claims 代码块）：**
````markdown
```claims
clock_source(periph:WDT, source:PCLKB) %% → [来源: manual, p.134]
prescaler(periph:WDT, ratio:"1/256", default:true) %% → [来源: manual, p.512]
```
````

**旧格式（关键声明列表）：**
```markdown
## 关键声明
- 时钟源: PCLKB → [来源: R7F0C014_manual, p.134]
- 分频比: 1/256 (默认) → [来源: R7F0C014_manual, p.512]
```

编译器通过 `parse-claims.py` 同时兼容两种格式。新格式支持结构化参数和词汇表约束（谓词名+实体名双重验证），更适合机械验证。

### 4. 编译器是只读验证

编译不生成新产物——wiki 本身就是编译产物。编译器扫描现有 wiki，生成编译报告（`wiki/_compiled/report-*.md`），报告声明完整性、矛盾、覆盖进度。

### 5. 大文件增量导入

长篇手册和参考 PDF 通过来源地图（`raw/sources/*.map.md`）管理。来源地图跟踪每个章节的导入状态（pending/active/complete/skipped），支持中断恢复和按优先级处理。

### 6. 知识图谱与推理

基于 4 信号关系模型自动构建知识图谱：

| 信号 | 说明 |
|------|------|
| wikilink | 页面间的 `[[双向链接]]` |
| 来源重叠 | 引用同一来源的页面 |
| 声明关联 | 共享相同谓词的 claims |
| 类型亲和 | 同目录下的页面 |

通过 `build-graph.py` 构建图、Louvain 算法做社区检测，产出 GEXF 格式图文件及洞察报告（桥接节点、孤立页面、稀疏社区等）。

### 7. Datalog 演绎推理

`run-datalog.py` 执行 `derived:` 规则，从已有的 base claims 推导出新声明。支持：
- 纯演绎推理（不引入经验不确定性）
- 变量绑定冲突检测
- 推导链追溯 + 来源继承
- 与 claims 解析器集成

### 8. 模块化技能结构

SKILL.md 是入口和规则汇总。具体工作流定义在 `sub-skills/tasks/` 中。外部工具集成在 `sub-skills/tools/` 中。这保持了 SKILL.md 的紧凑性，同时允许子技能独立演化。

## 工作流关系

```
                         ┌──────────────┐
                         │   research   │
                         │ 自动搜索+下载  │
                         └──────┬───────┘
                                │
用户输入 → init/project-init → capture → ingest → query
                                    ↑         ↓
                                   sync ← compile ← review/curate
                                    │         ↓
                                    └──── graph（知识图谱）
                                              │
                                        Datalog 推理
```

- **init / project-init**: 初始化工作空间骨架
- **research**: 自动多渠道搜索、质量筛选、资源下载（无现成资料时）
- **capture**: 保存来源到 raw 层
- **ingest**: 将来源导入 wiki（核心编译动作）
- **query**: 意图路由 → 渐进式加载 → 声明交叉验证 → 反馈闭环
- **sync**: 来源变更检测 → 受影响页面定位 → 声明 diff → 过时标记
- **compile**: 三阶段编译验证（来源覆盖 → 声明完整性 → 矛盾检测）
- **review**: 9 项健康检查
- **curate**: 人工主导的合并、拆分、重命名
- **code-anchor**: 源码与 wiki 双向绑定
- **graph**: 知识图谱构建 + 社区检测 + 洞察报告 + Datalog 推理

## 编译阶段

编译是 `compile` 工作流执行的只读验证过程。v1.3 支持基于 claims 解析器的机械验证。

| 阶段 | 检查目标 | 工具 | 严重度 |
|------|---------|------|--------|
| 来源覆盖 | 来源地图进度、高优先级章节是否遗漏、`last_checked` 过期检测 | 手动扫描 | WARN/INFO |
| 声明完整性 | 每条声明是否有可解析的来源锚点、谓词+实体名是否在词汇表中 | `parse-claims.py` | CRITICAL/WARN |
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
词汇表:   templates/claims-vocab.md（谓词名+实体名双重约束）
解析器:   sub-skills/tools/parse-claims.py
图构建:   sub-skills/tools/build-graph.py
推理引擎: sub-skills/tools/run-datalog.py
```

编译产物：`wiki/_compiled/report-YYYY-MM-DD.md`

## 知识图谱架构

```
wiki/*.md → build-graph.py → graph.json → GEXF 导出
                │                  │
                │                  ├── nodes: wiki 页面
                │                  ├── edges: 4 信号加权关系
                │                  └── communities: Louvain 分区
                │
                └── 洞察报告
                    ├── 桥接节点（跨社区连接）
                    ├── 孤立页面（无连接）
                    ├── 稀疏社区（凝聚度 < 阈值）
                    └── 意外连接（跨类型强关联）
```

## Datalog 推理架构

```
claims.json + derived 规则 → run-datalog.py → derived claims
                                  │
                                  ├── 变量绑定冲突检测
                                  ├── 推导链追溯
                                  └── 来源继承（从 base claim 传递）
```

推理规则写在 wiki 页面中：
```markdown
```claims
## derived
clock_domain(periph:X, domain:Y) :-
  clock_source(periph:X, source:Z),
  clock_belongs_to(source:Z, domain:Y).
```
```

## llm-wiki-novelist 扩展架构

以下内容仅适用于 `llm-wiki-novelist` 分支。

### 文风维度体系

novelist 将"文风"拆解为八个可交叉引用的 wiki 维度页。每个维度页包含维度定义、识别方法、变化光谱、代表作品链接。

维度之间通过 `[[wiki链接]]` 形成知识网络：
```
[[句法肌理]] ←→ [[叙事节奏]]  ← 句子长度直接影响节奏感
[[词汇光谱]] ←→ [[氛围质地]]  ← 用词选择决定氛围色调
[[AI负空间]] ←→ 全部维度    ← AI 在每个维度上的特征
```

### 两大子系统

```
llm-wiki-novelist
├── 文风研究 (style analysis)     ← 分析已有网文 → wiki/novels/
└── 创作引擎 (writing engine)     ← wiki 记忆 → 写作 → 更新 wiki
```

交叉引用能力是 wik 优于 YAML 的关键：
- 从维度出发：找所有短句主导型小说
- 从小说出发：看所有维度的分析
- 从对比出发：取两部小说的维度交集/差异
- 未来 compile 可验证维度覆盖完整性

### 工作流关系（扩展）

```
llm-wiki 基础工作流:
  用户输入 → init → capture → ingest → query
              ↑                   ↓
             sync ← compile ← review/curate
              │                   ↓
              └──────── graph + Datalog

novelist 扩展工作流:
  用户输入 → style-analyze → style-profile (文风研究)
  用户输入 → chapter-write → continuity-check (创作引擎)
              ↓               ↓
         plot-track    character-manage
              ↓
        timeline-sync
```

### profiles/ 是派生产物

文风分析的主数据在 wiki/，profiles/ 是从 wiki 编译出的"使用文件"。wiki 更新后重新编译 profile。这保证了：
- 主数据（wiki）可交叉引用、可被 compile 验证
- 产物（profiles）可被写作 agent 直接使用
- 两者保持同步（通过 style-profile 工作流）

### 长篇创作的 wiki 记忆模型

```
每次写作 session:
  写作前 → 读取 wiki 记忆
    ├── 角色状态（位置/情绪/关系）
    ├── 当前时间线位置
    ├── 未回收伏笔
    ├── 上一章摘要
    └── 目标文风参考（profiles/*.yml）

  写作后 → 更新 wiki
    ├── 新章节摘要
    ├── 角色状态变更
    ├── 时间线新事件
    └── 新伏笔/已回收伏笔
```

## 未来方向

见 [ROADMAP.md](ROADMAP.md)。llm-wiki main 分支当前阶段目标：v1.3 全链路闭环已实现。
llm-wiki-novelist 分支当前阶段：Phase 0 → Phase 1，架构设计完成，文风维度定义完成。
