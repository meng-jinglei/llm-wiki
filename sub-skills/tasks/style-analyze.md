---
name: style-analyze
description: 五阶段文风分析管线——定量扫描 → Source Map → Wiki Ingest → 维度分析 → Compile。wiki ingest 是认知基础，不可跳过。
---

## style-analyze（文风分析）

当用户提供一部网文并希望分析其文风时使用。

### 核心约束

**五阶段管线不可跳过。** 这是强制性约束——没有捷径，没有"快速版"。

阶段 3（Wiki Ingest）是整条管线的认知基础。跳过 wiki ingest =
跳过证据收集 = profile 成为无源之水。诡秘之主的实战已验证：跳过 wiki 直接生成
profile，产出的是"读后感"而非可用的技术规范。

每个阶段有明确的完成标准。下一阶段开始前必须验证前一阶段的完成状态。

### 前置条件

- 网文 TXT 已下载到 `raw/assets/<slug>.txt`（不可变）
- 来源记录 `raw/sources/<slug>.md` 已创建
- 用户已确认分析目标

---

### 阶段 1: 全量计算扫描

**执行方式**：Python 脚本，本地运行，零 token 消耗。

```
TXT → style_metrics.py → 定量指纹 JSON
```

**产出**：
- `raw/.tmp/<slug>_metrics.json` — 句子长度分布、感叹号密度、对话比例等
- `raw/.tmp/<slug>_summary.txt` — 人类可读的摘要

**完成标准**：JSON 文件存在且包含所有 8 个核心指标（句长、感叹号密度、对话比例、章长、段落类型分布、场景关键词密度、风格漂移、极端章列表）。

**步骤**：
1. 运行 `uv run python raw/.tmp/style_metrics.py "raw/assets/<slug>.txt"`
2. 验证 JSON 输出完整性
3. 记录关键发现（极端章、漂移趋势）

**⚠️ 阶段 1 不可跳过。** 定量数据为阶段 2-5 提供客观锚点。

---

### 阶段 2: Source Map 创建

**执行方式**：LLM，~5K tokens，一次性。

基于阶段 1 的数据 + 章节标题扫描，创建 `wiki/novels/<slug>/source-map.md`。

**输入**：
- 阶段 1 的 `_metrics.json`（极端章列表、指标分布）
- 章节标题列表

**产出**：
```yaml
# wiki/novels/<slug>/source-map.md
sections:
  - id: s01
    chapters: "1-10"
    title: "开篇段落"
    priority: high
    style_signals: [establishing_tone, first_conflict]
    status: pending
  # ... 30-50 个 section，按 priority 分级
```

**优先级规则**：
- `high`：开头 10 章 + 结尾 10 章 + 每个指标的极端章（Top-3/Bottom-3）+ 风格漂移关键节点
- `medium`：每 100 章的中间抽样 + 场景类型代表章
- `low`：其余章节（不被 ingest，仅被计算指标覆盖）

**完成标准**：
- `coverage_status: mapped` 或 `focused_ingest_complete`
- 所有 high priority 章节已标记
- 每个 high priority section 包含 `style_signals` 说明

**⚠️ 全部 high priority 章节必须在阶段 3 中完成 ingest 后，才能进入阶段 4。**

---

### 阶段 3: 增量 Wiki Ingest（⚠️ 不可跳过）

**执行方式**：LLM，~30-100K tokens（可分 5-10 个 session）。

这是管线的**认知核心**。严格遵循 llm-wiki 的 ingest 工作流 + 大文件增量导入协议。

**输入**：
- 阶段 2 的 `source-map.md`（按 priority 顺序处理）
- `raw/assets/<slug>.txt`（只读原文）

**每个 ingest session（3-5 章）产出**：
```
→ 创建/更新: wiki/novels/<slug>/characters/<name>.md    (新出场、状态变化、话术摘录)
→ 创建/更新: wiki/novels/<slug>/characters/_index.md     (角色关系 + 出场频率)
→ 更新: wiki/novels/<slug>/timeline/events.md             (新事件)
→ 创建/更新: wiki/novels/<slug>/plot-threads/<thread>.md  (情节线 + 伏笔)
→ 创建/更新: wiki/novels/<slug>/plot-threads/_index.md    (主线/支线/伏笔地图)
→ 创建/更新: wiki/novels/<slug>/scenes/<type>.md          (场景类型实例)
→ 创建/更新: wiki/novels/<slug>/scenes/_index.md          (场景频率 + 分布)
→ 更新: wiki/novels/<slug>/excerpts.md                     (按维度分类的关键摘录)
→ 更新: wiki/novels/<slug>/source-map.md                   (标记章节 status: complete)
```

**每条文风相关声明必须有文本摘录作为证据**：
```markdown
→ [摘录: 第X章, 第Y段] "原文片段..."
```

**处理顺序**：
1. 先处理所有 `priority: high` 且 `status: pending` 的章节
2. 再按需处理 `priority: medium` 的章节
3. `priority: low` 的章节不 ingest（已被计算指标覆盖）

**中断恢复**：
- 读取 `source-map.md`，找到第一个 `status: pending` 且 `priority: high` 的章节
- 从该章节继续，不重复处理已完成的章节

**完成标准（阶段 3 的最低通过条件）**：
- [ ] 所有 `priority: high` 的章节 `status: complete`（至少 25 章）
- [ ] `wiki/novels/<slug>/overview.md` 已创建
- [ ] `wiki/novels/<slug>/characters/_index.md` 存在且至少包含 5 个主要角色
- [ ] `wiki/novels/<slug>/plot-threads/_index.md` 存在且至少 3 条主线/支线
- [ ] `wiki/novels/<slug>/scenes/_index.md` 存在且至少 3 种场景类型
- [ ] `wiki/novels/<slug>/excerpts.md` 存在且至少 20 条带章号锚点的摘录
- [ ] 每条声明有来源锚点（`→ [摘录: 第X章, 第Y段]`）

**⚠️ 未达到以上完成标准，禁止进入阶段 4。**

---

### 阶段 4: 风格维度分析

**执行方式**：LLM，~20K tokens，一次性。

**前置条件检查（阶段 4 的门控）**：
- [ ] 阶段 3 的所有完成标准已达成
- [ ] `source-map.md` 中所有 high priority 章节 `status: complete`

**输入**：
- 阶段 1 的定量数据（`_metrics.json`）
- 阶段 3 的 wiki 知识库（角色/情节/场景 wikis）
- `wiki/novels/<slug>/excerpts.md`（关键摘录）

**产出（8 个维度分析页）**：
```
wiki/novels/<slug>/style-dimensions/
├── syntax.md              ← 句法：分布曲线 + 摘录例证
├── vocab.md               ← 词汇：高频词 + 标志短语 + 成语密度
├── pacing.md              ← 节奏：章末模式统计 + 场景交替分析
├── atmosphere.md          ← 氛围：基于场景类型的氛围分布
├── tropes.md              ← 套路：从 plot-threads 提取的模式
├── dialogue.md            ← 对话：比例 + 角色话术对比
├── scenes-analysis.md     ← 场景生态：频率 + 功能分析
└── ai-gaps.md             ← AI 负空间：从对比中提取的反 AI 信号
```

每个维度页必须：
- 引用定量数据（来自阶段 1）
- 引用 wiki 实例（来自阶段 3）
- 引用关键摘录（来自 excerpts.md）

**完成标准**：至少 6/8 维度页已完成（含 ai-gaps.md 和 pacing.md）。

---

### 阶段 5: Compile & 交叉验证

**执行方式**：LLM，~5K tokens，一次性。

基于完整 wiki 运行叙事一致性验证：

- **角色一致性**：同一角色在不同章节的描述是否一致
- **时间线矛盾**：事件时间轴是否有冲突
- **场景模式验证**：场景分类是否完整覆盖
- **维度覆盖**：八个维度是否都有足够的实例支撑
- **风格漂移解释**：定量检测到的漂移能否在 wiki 中找到定性解释

**产出**：
```
wiki/novels/<slug>/_compiled/report-YYYY-MM-DD.md
```

**完成标准**：编译报告无 CRITICAL 项。

---

### 中断恢复

整个五阶段管线可能跨多个 session。恢复时：
1. 读取 `wiki/novels/<slug>/source-map.md` 判断当前阶段
2. 如果阶段 3 未完成 → 从第一个 `status: pending` 的 high priority 章节继续
3. 如果阶段 3 已完成但阶段 4 未完成 → 进入阶段 4
4. 如果全部完成 → 可进入 style-profile

### 输出结构

```
raw/.tmp/<slug>_metrics.json                        ← 阶段 1: 定量指纹
raw/.tmp/<slug>_summary.txt                          ← 阶段 1: 人类可读摘要
wiki/novels/<slug>/source-map.md                     ← 阶段 2: 章节地图
wiki/novels/<slug>/overview.md                       ← 阶段 3: 文风总览
wiki/novels/<slug>/characters/_index.md              ← 阶段 3: 角色索引
wiki/novels/<slug>/characters/<name>.md              ← 阶段 3: 角色档案
wiki/novels/<slug>/plot-threads/_index.md            ← 阶段 3: 情节索引
wiki/novels/<slug>/plot-threads/<thread>.md          ← 阶段 3: 情节线
wiki/novels/<slug>/timeline/events.md                ← 阶段 3: 时间线
wiki/novels/<slug>/scenes/_index.md                  ← 阶段 3: 场景索引
wiki/novels/<slug>/scenes/<type>.md                  ← 阶段 3: 场景分类
wiki/novels/<slug>/excerpts.md                       ← 阶段 3: 关键摘录
wiki/novels/<slug>/style-dimensions/<8-files>.md     ← 阶段 4: 维度分析
wiki/novels/<slug>/_compiled/report-YYYY-MM-DD.md    ← 阶段 5: 编译报告
```
