# 长篇网文分析方法论 v2 — 2026-04-30

## 问题

500万字小说全量 LLM 阅读不可能。纯计算指标太表层，纯手工分析太浅。
需要一种**既覆盖全文、又理解内容**的方法。

## 核心思路：双层混合分析

```
Layer 1: 计算指标层（快、便宜、全覆盖）
  Python 扫描全文 → 定量指纹 → 极端章定位 → 风格漂移检测
  回答: "怎么写"的量化面

Layer 2: Wiki 编译层（深、结构化、增量）
  llm-wiki 管线 → 逐章 ingest → 角色/情节/场景 wiki
  回答: "写了什么"和"为什么这样写"
```

两层互相喂养：
- Layer 1 告诉 Layer 2 **先 ingest 哪些章**（极端章、关键章优先）
- Layer 2 给 Layer 1 的**裸数据提供解释**（感叹号高 = 战斗章 ≠ 日常章）

## 小说 Wiki 结构

目标：把一部小说编译成可查询、可交叉引用的结构化知识库。
直接复用 llm-wiki 处理 1000 页技术手册的同一条管线。

```
wiki/novels/<slug>/
├── overview.md                  ← 文风总览
├── source-map.md                ← 章节地图（每章状态追踪）
│
├── characters/                  ← 角色档案（不只是列表，含风格标注）
│   ├── _index.md                ←   角色关系 + 出场频率
│   ├── 萧炎.md                  ←   成长弧线、话术变迁、场景偏好
│   ├── 萧薰儿.md                ←   出场模式、语言特征、叙事功能
│   └── 药老.md                  ←   金手指角色、触发条件、退场时机
│
├── plot-threads/                ← 情节线
│   ├── _index.md                ←   主线/支线/伏笔地图
│   ├── 主线-废柴逆袭.md         ←   等级提升路径 + 关键节点
│   ├── 支线-寻找异火.md         ←
│   ├── 支线-势力建设.md         ←
│   └── 伏笔-未回收.md           ←   可被 continuity-check 扫描
│
├── timeline/                    ← 时间线
│   └── events.md                ←   关键事件时间轴（可检测矛盾）
│
├── scenes/                      ← 场景分类目录
│   ├── _index.md                ←   场景频率 + 分布
│   ├── 测试考核.md              ←   每次测试的：结果/围观反应/叙事功能
│   ├── 拍卖会.md                ←   每次拍卖的：物品/对手/打脸方式
│   ├── 宗门大比.md              ←
│   ├── 秘境探索.md              ←
│   └── 日常过渡.md              ←   日常章的叙事功能（不可忽视）
│
├── style-dimensions/            ← 文风维度分析（定量+定性融合）
│   ├── syntax.md                ←   句法：分布曲线 + 摘录例证
│   ├── vocab.md                 ←   词汇：高频词 + 标志短语 + 成语密度
│   ├── pacing.md                ←   节奏：章末模式统计 + 场景交替分析
│   ├── atmosphere.md            ←   氛围：基于场景类型的氛围分布
│   ├── tropes.md                ←   套路：从 plot-threads 提取的模式
│   ├── dialogue.md              ←   对话：对话比例 + 角色话术对比
│   ├── scenes-analysis.md       ←   场景生态：频率 + 功能分析
│   └── ai-gaps.md               ←   AI 负空间：从对比中提取的反 AI 信号
│
├── style-drift.md               ← 风格漂移分析（定量 + 定性解释）
└── excerpts.md                  ← 关键摘录（按维度分类，含章号锚点）
```

### Wiki 页面的双重属性

每个 wiki 页面同时包含**内容知识**和**风格标注**。例如角色页：

```markdown
# 萧炎

## 角色状态
- 等级变化: 斗之力三段(ch1) → 斗者(chXX) → ... → 斗帝(ch1220)
- 年龄: 15岁(开篇) → 20+岁(结尾)

## 话术特征 [风格标注]
- 前期: 苦涩自嘲型 → [摘录: ch1 "我现在还有资格让你怎么叫么?"]
- 中期: 霸气宣言型 → [摘录: chXXX "..."]
- 后期: 淡然从容型 → [摘录: chXXX "...."]
→ 话术随等级提升而改变——土豆的角色成长 = 话术升级

## 场景偏好 [风格标注]
- 独处反思: ~15% 出场（月光山崖、修炼密室——减速信号）
- 战斗: ~35% 出场（加速信号）
- 社交/被围观: ~25% 出场（土豆的"观众系统"）
- 其他: ~25%

## 对话模式 [风格标注]
- 与萧薰儿: 被动接受 → 主动保护（关系弧线 = 等级差逆转）
- 与药老: 师徒型，"老师""小家伙"高频
- 与敌人: 挑衅→碾压→震惊 三步曲（土豆标准模板）
```

这种设计的好处：风格分析不是凭空写的，而是**有 wiki 知识支撑的**。"土豆的对话三步曲"这个判断，背后是 wiki 中几十个战斗场景的实例。

## 为什么 Wiki Ingest 不可跳过（2026-04-30 实战教训）

诡秘之主的实战验证了一个关键原则：**wiki ingest（阶段 3）是整条管线的认知基础，跳过它 = profile 成为空中楼阁。**

### 实际执行 vs 方法论要求

| 阶段 | 方法论要求 | 诡秘之主实际 |
|------|-----------|------------|
| 1. 定量扫描 | ✅ 必须 | ✅ 完成（guimi_metrics.json） |
| 2. Source Map | ✅ 必须 | ✅ 完成 |
| 3. Wiki Ingest | ✅ 必须 | ❌ **跳过** |
| 4. 维度分析 | ✅ 必须 | ❌ **跳过** |
| 5. Compile | ✅ 必须 | ❌ **跳过** |
| Profile 生成 | 从 wiki 编译 | ❌ **直接从定量数据 + 已知风格模式生成** |

### 后果

产出的 `profiles/诡秘之主_文风.yml` 存在以下问题：

1. **规则缺乏证据根基** — "对话占 45%"有定量支撑，但"角色话术反映身份和阶级"这个判断在 wiki 中没有实例——它来自训练知识，而非对原文的系统分析
2. **规则不可验证** — "波浪型节奏"这个描述无法被定位到具体章节。哪些章节是波峰？哪些是波谷？没有 source map 追踪
3. **反 AI 信号无法量化** — "乌贼的文字有'人味'"——这是一个读后感，不是一个 agent 能执行的约束
4. **测试写作大量借用原作世界观** — 因为没有通过 wiki ingest 建立对"诡秘风格真正独特之处"的理解，agent 只能复制表面元素（序列体系、值夜者、贝克兰德）

### 教训

五阶段的顺序不是任意的——它反映了认知依赖关系：

```
定量数据 → 告诉你去读哪些章
Source Map → 组织阅读顺序
Wiki Ingest → 建立证据层（角色/情节/场景/摘录）   ← 这是认知基础
维度分析 → 基于证据层的归纳
Compile → 验证归纳的一致性
Profile → 编译产物
```

**跳过阶段 3 = 跳过证据收集 = 后面的所有阶段都是空中楼阁。**

### 阶段 3 最小完成标准

以下条件全部满足，阶段 3 才算完成：

- 所有 `priority: high` 的章节 `status: complete`（至少 25 章）
- `characters/_index.md` 存在且至少 5 个主要角色
- `plot-threads/_index.md` 存在且至少 3 条主线/支线
- `scenes/_index.md` 存在且至少 3 种场景类型
- `excerpts.md` 存在且至少 20 条带章号锚点的摘录
- 每条声明有 `→ [摘录: 第X章]` 来源锚点

---

## 完整管线（五阶段）

### 阶段 1: 全量计算扫描（Python, 0 token, 10秒）

```
TXT → style_metrics.py → 定量指纹 JSON
```

产出：
- 句子长度分布（avg/std/min/max per chapter）
- 感叹号密度（per chapter）
- 对话比例（per chapter，需修中文引号检测）
- 章末模式统计
- 段落类型分布（独句段/短段/中段/长段）
- 场景关键词密度（battle/auction/cultivation/dialogue/emotional）
- 风格漂移检测（前N章 vs 后N章）
- **极端章列表**：每个指标上的 Top-5/Bottom-5

### 阶段 2: Source Map 创建（LLM, ~5K tokens）

基于阶段 1 的数据 + 章节标题扫描，创建 `source-map.md`：

```yaml
sections:
  - id: s01
    chapters: "1-10"
    title: "开篇：废柴揭露 + 金手指激活"
    priority: high
    style_signals: [establishing_tone, first_humiliation, ring_reveal]
    status: pending

  - id: s02
    chapters: "11-30"
    title: "初次逆袭：修炼起步 + 家族比试"
    priority: high
    style_signals: [first_power_up, first_public_win]
    status: pending

  - id: s03
    chapters: "31-100"
    title: "离开家族：历练成长"
    priority: medium
    ...

  - id: s_extreme_01
    chapters: "996"
    title: "丹之战争（感叹号密度最高章）"
    priority: high
    style_signals: [emotional_peak, battle_climax]
    status: pending
```

优先级规则：
- `high`：开头10章 + 结尾10章 + 每个指标的极端章 + 风格漂移关键节点
- `medium`：每 100 章的中间抽样 + 场景类型代表章
- `low`：其余章节（不被 ingest，仅被计算指标覆盖）

总计约 30-50 章标记为 high，50-80 章标记为 medium。

### 阶段 3: 增量 Wiki Ingest（LLM, ~30-100K tokens, 可分 session）

按 source map 优先级，逐章/逐场景执行 ingest。
**完全遵循 llm-wiki 的 ingest 工作流 + 大文件增量导入协议。**

每个 ingest session 处理 3-5 章，产出：
```
→ 更新: wiki/novels/<slug>/characters/<name>.md     (新出场、状态变化、新对话摘录)
→ 更新: wiki/novels/<slug>/timeline/events.md         (新事件)
→ 创建/更新: wiki/novels/<slug>/plot-threads/<thread>.md
→ 更新: wiki/novels/<slug>/scenes/<type>.md           (新场景实例)
→ 更新: wiki/novels/<slug>/excerpts.md                 (按维度分类的关键摘录)
→ 更新: wiki/novels/<slug>/source-map.md               (标记章节 status: complete)
```

**中断恢复**：source map 中下一个 `status: pending` 且 `priority: high` 的章节继续。
这是 llm-wiki 的标准能力——和中断恢复导入 1000 页 PDF 完全一样的逻辑。

### 阶段 4: 风格维度分析（LLM, ~20K tokens）

基于完整的 wiki + 阶段 1 的定量数据，撰写每个维度分析页。

和之前手写分析的区别：每个判断都有 wiki 中的实例支撑。
"土豆的对话三步曲" → 可以在 wiki 中找到 15+ 个具体实例 → 摘录到分析页。

```
句子长度分布曲线(来自阶段1) + character页面中的话术实例(来自wiki)
  → syntax.md（定量+定性融合）
  
章末模式统计(来自阶段1) + plot-threads页面中的高潮间距(来自wiki)
  → pacing.md
  
场景关键词分布(来自阶段1) + scenes页面中的场景实例(来自wiki)
  → scenes-analysis.md
```

### 阶段 5: Compile & 交叉验证（LLM, ~5K tokens）

llm-wiki 的 compile 工作流适配为叙事一致性验证：

- **角色一致性**：同一角色在不同章节的描述是否一致（外貌、能力、关系）
- **时间线矛盾**：事件时间轴是否有冲突
- **场景模式验证**：场景分类是否完整覆盖
- **维度覆盖**：八个维度是否都有足够的实例支撑
- **风格漂移解释**：定量检测到的漂移能否在 wiki 中找到解释

## 与 llm-wiki 工作流的映射

这个五阶段管线不是重新发明——它完全映射到 llm-wiki 的现有工作流：

| 阶段 | llm-wiki 工作流 | novelist 适配 |
|------|----------------|--------------|
| 1. 计算扫描 | `map-document`（工具层） | `style-metrics.py` 替代 PDF 大纲提取 |
| 2. Source Map | `map-document` + `ingest` 前置 | 基于章节标题 + 计算指标 |
| 3. Wiki Ingest | **`ingest`**（核心编译动作） | 逐章 → 角色/情节/场景 wiki 页 |
| 4. 维度分析 | `ingest` + `query` | 定量+定性融合撰写 |
| 5. Compile | **`compile`**（三阶段验证） | 叙事一致性检查 |

novelist 没有发明新范式——它只是把 llm-wiki 的"技术文档编译"范式应用到"小说编译"。

## Token 预算估算

以斗破苍穹（1234章, 532万字）为例：

| 阶段 | Token 消耗 | 说明 |
|------|-----------|------|
| 1. 计算扫描 | 0 | Python 本地运行 |
| 2. Source Map | ~5K | 一次性，基于章节标题 |
| 3. Wiki Ingest | ~30-100K | 可分 5-10 个 session，每个 session 3-5K |
| 4. 维度分析 | ~20K | 一次性，基于完整 wiki |
| 5. Compile | ~5K | 一次性验证 |
| **总计** | **~60-130K** | 对比全量阅读的 250 万+ tokens |

## 这套方案能回答的问题

纯计算指标答不了、纯手工分析也答不了的问题：

| 问题 | 依赖的数据 |
|------|-----------|
| 土豆的拍卖会场景有什么固定结构？ | scenes/拍卖会.md（wiki）+ 定量节奏数据 |
| 萧炎的话术在哪个等级段发生了质变？ | characters/萧炎.md（wiki）+ 等级-话术交叉分析 |
| 斗破的主线-日常交替频率是多少章？ | plot-threads + scenes 统计 |
| 后期为什么句子变长了？ | style-drift 定量 + wiki 内容解释（后期势力建设多、说明性内容增加） |
| 诡秘之主和斗破苍穹的对话功能分布对比？ | 两部小说的 wiki 交叉查询 |

## 与之前方案的关键区别

| | v1（纯计算） | v2（双层混合） |
|---|---|---|
| 能回答"怎么写" | ✅ 定量 | ✅ 定量 + 定性 |
| 能回答"写了什么" | ❌ | ✅ wiki 结构化知识 |
| 能回答"为什么这样写" | ❌ | ✅ wiki 支撑的解释 |
| 分析深度 | 表层指标 | 深层知识 + 指标 |
| 风格文件可用性 | 只有数据 | 数据 + 实例 + 结构模式 |
| 可交叉引用 | ❌ | ✅ 同一套 wiki 体系 |
| 中断恢复 | N/A | ✅ llm-wiki 增量协议 |
| Token 消耗 | 0 | ~60-130K（可控） |
