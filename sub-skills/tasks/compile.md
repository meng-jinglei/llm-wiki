---
name: compile
description: 三阶段编译验证 — 来源覆盖、声明完整性、矛盾检测，生成只读报告
---

## compile（编译）

当用户希望运行编译验证、检查 wiki 质量或生成编译报告时使用。

按顺序执行三个阶段：

### 阶段一：来源覆盖检查

1. 搜索 `raw/sources/` 和 `wiki/sources/` 下所有 frontmatter 中 `type: source_map` 的文件。
2. 如果没有找到任何来源地图 → 输出一条 INFO 后跳到阶段二。
3. 对每份来源地图，解析其中的 `sections[]` 列表，统计各状态的数量。
4. 标记所有 `status: pending` 且 `priority: high` 的章节 → **WARN**："高优先级章节待导入"
5. 标记所有 `status: pending` 且 `priority: medium` 的章节 → **INFO**："中优先级章节待导入"
6. 检查 `coverage_status` 与实际章节状态是否一致（例如所有章节 `complete` 但 `coverage_status` 仍为 `partial`）→ **INFO**："coverage_status 需更新"

### 阶段二：声明完整性检查

1. 搜索 `wiki/` 下所有 `.md` 文件（排除 `wiki/_compiled/` 自身和 `type: source_record` 页面）。
2. 如果没有 wiki 页面（只有 overview.md 和 source_record）→ 输出一条 INFO 后跳到阶段三。
3. 对每个页面，定位 `## 关键声明` 区块：
   - 如果页面没有 `## 关键声明` 区块 → **INFO**："页面无关键声明区块"（仅当页面包含事实内容时才提示）
   - 如果有关键声明区块但为空（无列表项）→ **WARN**："关键声明区块为空"
4. 对关键声明区块中的每行列表项（以 `- ` 开头）：
   - 检查是否包含 `→ [来源:` 锚点。缺少 → **CRITICAL**："声明缺少来源锚点"
   - 检查锚点中的文件路径是否可定位。提取 `→ [来源:` 后的文件名部分，搜索其在 `raw/sources/`、`raw/assets/`、`wiki/sources/` 中是否存在。找不到对应的文件或资源 → **WARN**："来源锚点无法解析"
5. 对页面中不在关键声明区块内但包含事实陈述的段落（含有数值、寄存器名、配置参数等），检查是否有 `→ [来源:]` 锚点。缺少 → **WARN**："事实段落缺少来源锚点"
6. 统计：总声明数、有锚点数、缺失锚点数、无法解析锚点数、可选区块缺失数。

### 阶段三：矛盾检测

1. 收集所有页面 `## 关键声明` 区块中的声明条目。
2. 如果声明条目数 < 2 → 输出一条 INFO 后结束。
3. 按声明键聚类：提取每条声明 `→ [来源:` 之前的内容（去掉列表符号 `- ` 前缀），将语义相同的声明归为一组。
4. 按 wikilink 聚类：扫描 `[[wiki/...]]` 链接，对共享同一链接目标的页面，将其声明放在同一组中做交叉比较。
5. 同一聚类中，若同一主题存在不同的声明值 → **WARN**："声明冲突"，附带：
   - 页面 A 的路径、声明原文、来源锚点
   - 页面 B 的路径、声明原文、来源锚点
6. 含有不确定性标记的声明（"可能"、"待确认"、"推测"、"TBD"等）不触发矛盾检测。
7. 若其中一页已在 frontmatter 中标记 `status: outdated` → 不标记为冲突，改为 **INFO**："声明差异（其中一页已标记为过时）"

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
