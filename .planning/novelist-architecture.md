# llm-wiki-novelist — 架构设计

## 定位

llm-wiki-novelist 是 llm-wiki 的特化分支技能。目标：让 AI agent 能够独立或半独立地完成 100 万字以上网文连载，包括文风一致、情节连贯、角色不漂移。

## 两大子系统

```
llm-wiki-novelist
├── 文风研究 (writing-style wiki)    ← 外部研究，建立文风知识库
└── 创作引擎 (novelist workflows)    ← 写作执行，wiki 作为持久记忆
```

**文风研究**回答："这个作者的文风是什么样的？怎么用 wiki 描述它？"
**创作引擎**回答："现在要写第 57 章，wiki 里有什么？写完后 wiki 要更新什么？"

二者通过 wiki 的交叉引用机制连接——文风维度页既是研究工具，也是写作 agent 的参考。

## 核心设计：Wiki 兼容的文风维度

### 为什么不用 YAML/JSON

YAML 字段 = 填空题 → agent 填空 → 输出模板化。这不是我们要的。

### Wiki 页面作为维度定义

每个文风维度是一个 wiki 页面，包含：
- **维度定义**：这个维度衡量什么
- **识别方法**：如何在文本中发现这个维度的特征
- **变化光谱**：这个维度的极端到极端是什么样的
- **代表作品**：wiki 链接到各小说的该维度分析
- **AI 对比**：AI 在这个维度上常见什么模式

维度之间通过 wiki 链接建立关联：
```
[[句法肌理]] ←→ [[叙事节奏]]  （句子长度直接影响节奏感）
[[词汇光谱]] ←→ [[氛围质地]]  （用词选择决定氛围）
[[AI负空间]] ←→ [[句法肌理]]  （AI 在句法上的典型特征）
```

### 交叉引用能力

这是 wiki 优于 YAML 的关键：

```
查询："斗破苍穹的句法特征是什么？"
→ novels/斗破苍穹/syntax.md

查询："哪些小说的句法肌理偏短句主导？"
→ dimensions/句法肌理.md → 反向链接 → [斗破苍穹, 大王饶命, ...]

查询："短句节奏 + 热血氛围 + 废柴逆袭套路 → 还有哪些类似作品？"
→ 从三个维度分别出发 → 求交集 → 发现 cross-comparison 机会

查询："土豆和番茄的文风差异在哪？"
→ authors/天蚕土豆/ vs authors/我吃西红柿/ → comparisons/土豆-vs-番茄.md
```

未来 `compile` 工作流可以检测：哪些维度页缺少足够的代表作品链接？哪些小说分析页遗漏了关键维度？

## 文风维度体系

### 八个核心维度

| 维度 | wiki 页 | 研究内容 |
|------|---------|---------|
| 句法肌理 | `dimensions/syntax.md` | 句子长度、段落节奏、标点使用、断句习惯 |
| 词汇光谱 | `dimensions/vocab.md` | 白话-古风位置、成语密度、标志性词汇、专业术语 |
| 叙事节奏 | `dimensions/pacing.md` | 高潮间距、过渡处理、章末钩子类型、信息释放策略 |
| 氛围质地 | `dimensions/atmosphere.md` | 情绪基调、感官侧重、场景的情绪功能 |
| 场景生态 | `dimensions/scene-ecosystem.md` | 偏爱的场景类型、场景承担的叙事功能 |
| 套路指纹 | `dimensions/trope-fingerprint.md` | 爽点模式、金手指类型、冲突升级结构 |
| 对话纹理 | `dimensions/dialogue-texture.md` | 对话比例、对话功能（推进/展示/搞笑） |
| AI 负空间 | `dimensions/ai-negative-space.md` | AI 难以模仿的人类特征、可作为"反AI检测"的信号 |

每个维度页链接到所有已分析小说的对应分析。

## 创作引擎设计（前瞻）

### 写作 Session 流程

```
Session 开始
├── 1. 读取 wiki/novels/<作品>/characters/ → 刷新角色记忆
├── 2. 读取 wiki/novels/<作品>/timeline/ → 确认当前时间点
├── 3. 读取 wiki/novels/<作品>/plot-threads/ → 检视未回收伏笔
├── 4. 读取 profiles/<target-style>.yml → 获取文风参考
├── 5. 读取上一章摘要 → 承接上文
└── 6. 开始写作

Session 结束（每写 1-N 章后）
├── 7. 更新章节摘要 → wiki/novels/<作品>/chapters/
├── 8. 更新角色状态 → 角色位置/情绪/关系变化
├── 9. 更新时间线 → 新事件 + 日期推进
├── 10. 更新情节线 → 新伏笔 / 已回收伏笔
├── 11. 运行 continuity-check → 一致性验证
└── 12. 写 log.md 记录本次 session
```

### 关键子工作流（前瞻）

| 工作流 | 功能 | wiki 交互 |
|--------|------|-----------|
| `chapter-write` | 基于 wiki 记忆写新章 | 读角色+时间线+情节 → 写 → 更新 wiki |
| `continuity-check` | 跨章节一致性检查 | 扫描角色/时间线/设定的矛盾 |
| `plot-track` | 情节线+伏笔管理 | 增删伏笔、标记回收、追踪未回收 |
| `character-arc` | 角色发展弧线追踪 | 角色状态快照、成长轨迹 |
| `timeline-sync` | 时间线一致性维护 | 提取新章时间信息、检测冲突 |
| `style-check` | 文风漂移检测 | 对比新章与 profile 的偏离度 |

## 技术决策

### 1. Wiki 作为唯一真相源

不引入数据库、不引入外部状态管理。wiki 就是 agent 的记忆体。好处：
- `grep` 可搜索
- `git diff` 可对比
- 人类可阅读和修正
- 跨 session 持久化

### 2. profiles/ 是派生产物

文风分析的主数据在 wiki/，profiles/ 是从 wiki 编译出的"使用文件"。wiki 更新后重新编译 profile。

### 3. 文风维度是 living documents

维度页随研究深入而演进——新小说被分析后，维度页更新"已知变化光谱"，变得更丰富。

### 4. 与 llm-wiki 的关系

llm-wiki-novelist 沿用 llm-wiki 的三层架构（raw → wiki → profiles/compile），但 wiki 内容从"技术知识"变为"叙事知识"。工作流从 capture/ingest/query 扩展为 style-analyze/chapter-write/continuity-check。
