---
name: compile
description: 三阶段编译验证 — 来源覆盖、声明完整性、矛盾检测，生成只读报告
---

## compile（编译）

当用户希望运行编译验证、检查 wiki 质量或生成编译报告时使用。

按顺序执行三个阶段：

### 阶段一：来源覆盖与增量同步检查

1. 搜索 `raw/sources/` 和 `wiki/sources/` 下所有 frontmatter 中 `type: source_map` 的文件。
2. 如果没有找到任何来源地图 → 输出一条 INFO 后跳到阶段二。
3. 对每份来源地图：

   **章节覆盖**：
   - 解析 `sections[]` 列表，统计各状态的数量
   - 标记所有 `status: pending` 且 `priority: high` 的章节 → **WARN**："高优先级章节待导入"
   - 标记所有 `status: pending` 且 `priority: medium` 的章节 → **INFO**："中优先级章节待导入"
   - 检查 `coverage_status` 与实际章节状态是否一致 → **INFO**："coverage_status 需更新"

   **增量同步检查（新增）**：
   - 检查来源地图的 `last_checked` 字段
   - 如果无 `last_checked` → **INFO**："来源未标记 last_checked，建议运行 sync"
   - 如果 `last_checked` 距今超过 30 天 → **WARN**："来源超过 30 天未检查同步"
   - 如果来源文件修改时间晚于 `last_checked` → **CRITICAL**："来源已更新但 wiki 未同步"，附带：
     - 来源路径
     - 最后检查日期
     - 文件修改时间
     - 建议：运行 `sync` 工作流定位受影响页面

4. **受影响页面扫描**（新增）：
   对每个 `last_checked` 过期的来源，使用 claims 解析器扫描受影响页面：
   ```bash
   uv run python sub-skills/tools/parse-claims.py wiki/ --source <source-filename>
   ```
   统计受影响页面数，纳入编译报告。

### 阶段二：声明完整性检查

**增强版——基于 claims 解析器的机械验证。**

1. **运行 claims 解析器**：
   ```bash
   uv run python sub-skills/tools/parse-claims.py wiki/
   uv run python sub-skills/tools/parse-claims.py wiki/ --vocab
   ```
   解析器自动检测每个页面的声明格式（新 claims 代码块 / 旧列表格式）。
   `--vocab` 检查谓词命名一致性（对照 `templates/claims-vocab.md` 词汇表）。
   见 `templates/claims-format-spec.md` 了解格式详情。

2. 基于解析器输出进行分级检查：

   **CRITICAL（阻断级）**：
   - `missing_source > 0` → "声明缺少来源锚点"（列出具体页面和声明）
   - 来源锚点存在但解析出的路径指向不存在的文件 → 进一步检查

   **WARN（警告级）**：
   - `direct_claims = 0` 但页面包含事实内容（数值、寄存器名、配置参数等）→ "页面无关键声明区块"
   - 来源锚点中的路径无法定位到 `raw/sources/`、`raw/assets/`、`wiki/sources/` → "来源锚点无法解析"
   - `format: old` → "使用旧列表格式，建议升级为 claims 代码块"

   **WARN（词汇表）**：
   - `--vocab` 检出未在 `templates/claims-vocab.md` 中注册的谓词 → **WARN**："谓词未在词汇表中注册"（列出谓词名和出现位置）

   **INFO（信息级）**：
   - `derived_rules > 0` → "页面包含推导规则"（正面标记，说明页面有推理能力）
   - `format: new` → 新格式页面数 / 总页面数统计

3. 对页面中不在关键声明区块内但包含事实陈述的段落，检查是否有 `→ [来源:]` 或 `→ [Source:]` 锚点。缺少 → **WARN**："事实段落缺少来源锚点"

4. 统计输出：
   - 总页面数、含声明页面数、新格式 / 旧格式 / 无声明分布
   - 总声明数、缺失来源数、包含推导规则的页面数
   - 升级建议：列出所有使用旧格式的页面

### 阶段三：矛盾检测

**增强版——基于结构化声明的机械矛盾检测。**

1. **运行矛盾检测**：claims 解析器内置 `detect_conflicts()` 函数，
   按 `(predicate, subject)` 分组，自动发现同一谓词+主体的不同值声明。

2. 如果解析到的声明条目数 < 2 → 输出一条 INFO 后结束。

3. **结构化矛盾检测**（新格式）：
   - 同一 `(predicate, subject)` 组中，来自不同页面的声明具有不同的 `params` → **WARN**："声明冲突"
   - 附带：每个冲突方的页面路径、声明原文、来源锚点、谓词名

4. **语义矛盾检测**（旧格式回退）：
   - 按声明键聚类：提取 `→ [来源:]` 之前的内容，将语义相同的声明归为一组
   - 同一聚类中不同值 → **WARN**："声明冲突"
   - 效果等同于原阶段三，但借助解析器更可靠

5. **推导规则记录**（为 Phase 5 推理引擎做准备）：
   - 如果页面包含 `derived:` 规则 → **INFO**："页面包含推导规则"
   - 当前解析器不执行推导——仅记录规则供未来 Datalog 引擎处理
   - `derived:` 行在矛盾检测中被跳过（无 predicate/subject 可分组）

6. 过滤规则：
   - 含有不确定性标记的声明（"可能"、"待确认"、"推测"、"TBD"等）不触发矛盾检测
   - 若其中一页 `status: outdated` → 降级为 **INFO**："声明差异（其中一页已标记为过时）"
   - 声明来自同一来源（同一 source_path + locator）但不同页面 → 不算冲突（同源引用）

### 阶段四（可选）：图谱结构检查

如果 wiki 规模足够大（>20 页），运行图分析：

```bash
uv run --with networkx python sub-skills/tools/build-graph.py wiki/ --format json
```

基于图谱输出检查：
- **孤立页面**（度 ≤ 1）→ **INFO**："页面孤立，建议添加 [[wikilinks]]"
- **稀疏社区**（凝聚度 < 0.15）→ **INFO**："社区内部交叉引用不足"
- **桥接节点** → **INFO**："枢纽页面（连接 N 个社区）"——这些是关键维护目标

图谱检查不阻断编译（全部 INFO 级别），因为它依赖 [[wikilinks]] 密度。

### 阶段五（可选）：Datalog 推导验证

如果 wiki 包含 `derived:` 规则，运行推理引擎：

```bash
uv run python sub-skills/tools/run-datalog.py wiki/
```

检查：
- 推导声明是否与直接声明一致
- 推导链是否完整（所有前提事实都存在）
- 推导数量是否合理（过多推导可能暗示规则过于宽泛）

### 输出

编译不修改任何 wiki 页面。生成报告至：

```
wiki/_compiled/report-YYYY-MM-DD.md
```

如果 `wiki/_compiled/` 目录不存在，先创建该目录。

报告模板：

```markdown
---
title: "编译报告"
type: compile_report
compiled_at: YYYY-MM-DDTHH:MM
sources_checked: <N>
pages_checked: <N>
claims_checked: <N>
---

# 编译报告 — YYYY-MM-DD

## 摘要

| 指标 | 值 |
|------|-----|
| 来源地图 | N 份 |
| 已检查页面 | N 页 |
| 关键声明 | N 条 |
| 编译状态 | ✅ 通过 / ⚠️ WARN / ❌ CRITICAL |

## CRITICAL

- **声明缺少来源锚点** — `wiki/peripherals/example.md` 第 N 行："<声明原文>"
- （如无 CRITICAL 项，写"无"）

## WARN

- **高优先级章节待导入** — `raw/sources/xxx.map.md`：s03（第3章: 时钟生成，p.120-156）
- **来源锚点无法解析** — `wiki/peripherals/example.md`："→ [来源: nonexistent_file.pdf]"
- **声明冲突** — "时钟源"在以下页面中存在不一致：
  - `wiki/peripherals/wdt.md`：时钟源: PCLKB → [来源: manual, p.134]
  - `wiki/peripherals/timer.md`：时钟源: PCLKB/2 → [来源: manual, p.512]
- （如无 WARN 项，写"无"）

## INFO

- **中优先级章节待导入** — `raw/sources/xxx.map.md`：s07（第7章: DMA，p.200-230）
- **页面无关键声明区块** — `wiki/concepts/example.md`
- （如无 INFO 项，写"无"）

## 阶段统计

| 阶段 | CRITICAL | WARN | INFO |
|------|----------|------|------|
| 来源覆盖 | 0 | 2 | 3 |
| 声明完整性 | 1 | 1 | 2 |
| 矛盾检测 | 0 | 1 | 0 |
```

保存报告后，在 `log.md` 中追加一条记录：
`## [YYYY-MM-DD] compile — compile report generated（N CRITICAL / N WARN / N INFO）`

### 输出结构

```
wiki/_compiled/report-YYYY-MM-DD.md  ← 编译报告
log.md                                ← compile 记录
```

如果用户要求修复发现的问题：
- CRITICAL 项（缺失来源锚点）→ 补充对应的 `→ [来源:]` 锚点
- WARN 项中的矛盾 → 标记相关页面供人类仲裁，不自动修改
