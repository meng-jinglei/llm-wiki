---
name: style-profile
description: 从 wiki 编译文风抽象化文件——硬前置条件检查确保 wiki 完整性，compile 集成验证声明质量
---

## style-profile（文风文件生成）

当用户希望从完整的 wiki 分析编译出可供写作 agent 使用的文风文件时使用。

### 核心约束

**Profile 是 wiki 的编译产物，不是独立文件。** 不能在 wiki 为空或不完整的情况下生成 profile。
诡秘之主的实战已验证：跳过 wiki → profile 无证据支撑 → 产出空洞无用。

**Profile 生成前必须通过前置条件检查。不通过 = 拒绝生成。**

---

### 阶段 0: 硬前置条件检查（门控）

逐一验证以下条件。任何一项不通过 → **中止生成**，列出缺失清单，引导回 `style-analyze` 阶段 3。

#### 检查清单

| # | 检查项 | 检查方式 | 缺失时的操作 |
|---|--------|---------|------------|
| 1 | `wiki/novels/<slug>/overview.md` 存在 | Glob 验证 | **BLOCK** — 需要完成 style-analyze 阶段 3 |
| 2 | `wiki/novels/<slug>/source-map.md` 存在且 ≥80% high priority 章节 `status: complete` | Grep `status: complete` 计数 | **BLOCK** — 列出未完成的 high priority 章节 |
| 3 | `wiki/novels/<slug>/characters/_index.md` 存在且至少 5 个角色 | Read + 计数 | **BLOCK** — 需要 ingest 更多角色章节 |
| 4 | `wiki/novels/<slug>/plot-threads/_index.md` 存在且至少 3 条主线/支线 | Read + 计数 | **BLOCK** — 需要 ingest 更多情节章节 |
| 5 | `wiki/novels/<slug>/scenes/_index.md` 存在且至少 3 种场景类型 | Read + 计数 | **BLOCK** — 需要 ingest 更多场景章节 |
| 6 | `wiki/novels/<slug>/excerpts.md` 存在且至少 20 条摘录 | Grep `→ [摘录:` 计数 | **BLOCK** — 需要从 wiki 补充摘录 |
| 7 | `wiki/novels/<slug>/style-dimensions/` 至少 6/8 维度已完成 | Glob `*.md` 计数 | **BLOCK** — 需要完成 style-analyze 阶段 4 |

#### 检查执行

```
1. Glob wiki/novels/<slug>/ 确认目录存在
2. 逐项验证 7 个条件
3. 汇总结果：
   - 全部通过 → 进入阶段 1
   - 任何一项不通过 → 输出缺失报告 + 中止
```

#### 缺失报告格式

```markdown
## Profile 生成被阻止 — <slug>

以下前置条件未满足：

| # | 条件 | 状态 | 需要的操作 |
|---|------|------|-----------|
| 3 | characters/_index.md ≥5 角色 | ❌ 当前 1 个 | 回到 style-analyze 阶段 3，ingest 角色相关章节 |
| 5 | scenes/_index.md ≥3 场景类型 | ❌ 不存在 | 回到 style-analyze 阶段 3，创建场景分类 |

**下一步**：运行 `style-analyze` 阶段 3，优先处理 source-map.md 中 `status: pending` 的 high priority 章节。
```

---

### 阶段 1: Compile 预检查

前置条件全部通过后，运行 compile 验证 wiki 声明质量。

1. 执行 compile 工作流（三阶段编译检查）
2. 检查编译报告：
   - 有 CRITICAL 项 → **中止**，先修复声明缺失来源问题
   - 有 WARN 项 → 列出警告，询问用户是否继续（降级生成，标记 `quality: warn`）
   - 全部通过 → 进入阶段 2

---

### 阶段 2: Profile 编译

基于完整的 wiki + 定量数据，编译 profile YAML 文件。

**输入**：
- `wiki/novels/<slug>/style-dimensions/*.md`（维度分析）
- `wiki/novels/<slug>/excerpts.md`（关键摘录）
- `wiki/novels/<slug>/characters/`（角色 wiki）
- `wiki/novels/<slug>/plot-threads/`（情节 wiki）
- `wiki/novels/<slug>/scenes/`（场景 wiki）
- `raw/.tmp/<slug>_metrics.json`（定量数据）

**Profile 必须包含的节**（每节必须引用 wiki 证据）：

```yaml
# === 定量锚点 ===
quantitative:
  # 来自阶段 1 的 _metrics.json
  # 每项指标标注来源

# === 开篇模式 ===
opening:
  # 来自 wiki 中 ch1-10 的 ingest 分析
  # 必须有摘录支撑

# === 句法规则 ===
syntax:
  # 来自 style-dimensions/syntax.md
  # 必须有定量数据 + 摘录例证

# === 叙事规则 ===
narrative:
  # 来自 style-dimensions/pacing.md + plot-threads/
  # 必须有情节线分析支撑

# === 对话规则 ===
dialogue:
  # 来自 style-dimensions/dialogue.md + characters/
  # 必须有角色话术摘录支撑

# === 氛围规则 ===
atmosphere:
  # 来自 style-dimensions/atmosphere.md + scenes/
  # 必须有场景摘录支撑

# === 世界构建规则 ===
world_building:
  # 来自 wiki 中 world-building 分析（如适用）

# === 反 AI 信号 ===
anti_ai_signals:
  # 来自 style-dimensions/ai-gaps.md
  # 每一条必须有原作 vs AI 对比支撑
```

**Profile 中的每条规则必须满足**：
- 有 wiki 页面作为来源
- wiki 页面中的判断有摘录支撑
- 摘录有章号锚点

**格式约束**：
- YAML 格式，可直接作为 agent system prompt 的风格参考
- 顶层 key 使用中文
- 每个 section 包含 `source:` 字段指向 wiki 页面

---

### 阶段 3: 使用说明

输出 profiles/ 的同时，确保 `profiles/使用说明.md` 存在且更新，包含：
- Profile 的使用方式（作为 agent system prompt 的风格参考）
- Profile 中每节的解读方式
- 定量锚点的容差范围（用于定量验收）
- 常见误用模式

---

### 输出结构

```
profiles/<slug>_文风.yml    ← 文风抽象化文件
profiles/使用说明.md          ← 使用指南（如首次创建）
log.md                        ← profile 生成记录
```

---

### 与 style-analyze 的关系

```
style-analyze（五阶段管线）
    ↓
   阶段 1-5 全部完成
    ↓
style-profile（本文档）
    ↓
   阶段 0: 前置条件检查 ← 检查 style-analyze 的产物是否完整
   阶段 1: Compile 预检查 ← 验证 wiki 声明质量
   阶段 2: Profile 编译   ← 从 wiki 提取可执行规则
   阶段 3: 使用说明       ← 确保可用性
```

**Profile 必须从 wiki 重新编译，而不是手工编写。** 如果 wiki 更新了（style-analyze 重新运行），profile 必须重新生成。
