---
name: sync
description: 增量同步——检测来源更新、定位受影响页面、标记过时声明
---

## sync（增量同步）

当来源文件更新后，检测哪些 wiki 页面受影响，标记过时声明并建议刷新。

示例：
- "手册更新了，帮我检查哪些页面需要刷新"
- "检查 wiki 同步状态"
- "raw/sources/ 有人放了新版，帮忙 diff"

### 步骤

#### 1. 检测来源变更

1. 扫描 `raw/sources/` 下所有 `.md` 来源记录和来源地图。
2. 对每个来源：
   - 如果来源记录中标注了 `file_path`，检查对应文件的修改时间
   - 如果来源地图中有 `last_checked` 字段，与当前时间比较
   - 如果文件修改时间晚于 `last_checked` → 标记为 `changed`
3. 汇总变更来源列表。

#### 2. 定位受影响页面

1. 对每个变更来源，搜索 `wiki/` 中引用该来源的所有页面：
   ```bash
   # 搜索来源锚点引用
   Grep pattern="来源:.*<source-filename>" wiki/
   # 搜索 frontmatter sources 引用
   Grep pattern="raw/sources/<source-slug>" wiki/
   ```
2. 也可使用 claims 解析器的受影响页面检测：
   ```bash
   uv run python sub-skills/tools/parse-claims.py wiki/ --source <source-path>
   ```
3. 收集所有受影响页面列表。

#### 3. 判断影响程度

对每个受影响页面，判断是否需要刷新：

| 场景 | 影响程度 | 动作 |
|------|---------|------|
| 来源新增章节 | 低 | 页面保持 stable，建议可选更新 |
| 来源修正了错误数据 | 高 | 标记 `status: needs_review` |
| 来源的声明值变化 | CRITICAL | 标记 `status: outdated` |
| 来源仅排版/格式变化 | 无 | 仅更新 `last_checked` |

判断依据：
- 如果新来源中同一 `(predicate, subject)` 声明的 `params` 不同 → 声明值变化
- 如果新来源增加了新的 `(predicate, subject)` → 新增内容
- 如果旧来源中的声明在新来源中消失 → 可能的错误修正

#### 4. 执行同步

1. 更新受影响页面的 frontmatter：
   ```yaml
   status: outdated          # 从 stable 改为 outdated
   needs_refresh: true       # 新增标记
   refresh_reason: "<原因>"  # 说明为什么需要刷新
   ```
2. 更新来源地图的 `last_checked` 为当前日期。
3. 写入编译报告：
   - 如果 `wiki/_compiled/` 中已有当天日期的报告 → 追加 "## 增量同步" 区块到末尾
   - 如果没有 → 创建新报告（最小模板：标题 + 日期 + 增量同步区块，compile 可后续补充）
4. 追加 `log.md` 同步记录。

#### 5. 报告

输出格式：
```
增量同步报告 — YYYY-MM-DD

变更来源:
  - raw/sources/manual.md (last_checked: 2026-04-01 → 2026-04-29)

受影响页面:
  ⚠️ wiki/peripherals/wdt.md — 声明值变化 (clock_source 更新)
  ⚠️ wiki/peripherals/timer.md — 新增内容 (divider 声明新增)
  ✅ wiki/concepts/clock.md — 无影响 (仅格式变化)

建议操作:
  1. 运行 ingest 刷新 outdated 页面
  2. 运行 compile 验证同步后的完整性
```

### 中断恢复

来源地图的 `last_checked` 标注了每个来源的最后检查时间。
中断后重新运行时，只检查 `last_checked` 为空或早于来源修改时间的项。

### 输出结构

```
<受影响页面>.md             ← frontmatter 更新 (status/needs_refresh)
raw/sources/<slug>.md       ← last_checked 更新
wiki/_compiled/report-*.md  ← 追加同步报告区块
log.md                       ← sync 记录
```
