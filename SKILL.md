---
name: llm-wiki-novelist
description: 网文写作特化版——基于 llm-wiki 知识编译管线，构建文风知识库与长篇创作引擎
argument-hint: "<url, file, text, question, page, or action>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - mcp__fetch__fetch
  - TaskCreate
  - TaskUpdate
  - TaskList
---

<objective>
**基于 [llm-wiki](https://github.com/meng-jinglei/llm-wiki) 技能**，在本地 Markdown 工作空间中运行网文写作知识工作流。

继承 llm-wiki 的全部能力（capture、ingest、query、research、compile 等），并扩展为网文写作专用工具链。

两个核心目标：
1. **文风研究**：分析已有网文，建立可交叉引用的文风维度 wiki，产出文风抽象化文件（profiles/）
2. **长篇创作**：以 wiki 为持久记忆，支持 100 万+ 字连载写作——角色不漂移、情节不改设定、文风保持一致

适用场景：网文文风分析、TXT 建档、角色/情节/时间线管理、连续性检查、长篇章节写作。
Obsidian 是可选的界面，而非先决条件。
</objective>

## 免责声明

本项目仅供个人学习与创作辅助使用。文风分析与小说下载应遵守相关版权法律。
生成内容的知识产权归属由用户自行决定。

<base_skill>
**依赖声明：** 本技能是 llm-wiki 的特化扩展，必须与 llm-wiki 同时安装。
所有 llm-wiki 的工作流（capture、ingest、query、research、review、compile、curate、sync、
graph、project-init、code-anchor、map-document、index-codebase）在本技能中均完整可用。

本文档仅记录 novelist 扩展内容。基础工作流的规则和用法继承自 llm-wiki，详见其 SKILL.md。
如有冲突，novelist 扩展规则优先。
</base_skill>

<inputs>
用户输入可以是以下之一：
- 要捕获的 URL
- 工作空间内外的本地文件路径
- 粘贴的文本内容
- 要从 wiki 回答的问题
- 审查、重组、合并、拆分、重命名或刷新 wiki 页面的请求
- 纠正过时或不准确 wiki 内容的请求
- 为现有项目初始化 wiki 结构的请求
- 在源代码和 wiki 页面之间建立双向链接的请求
- 大型文档结构映射或代码库索引的请求
- **网文专用**：要分析的网文名称或作者
- **网文专用**：要下载的 TXT 来源 URL（需用户验证）
- **网文专用**：章节写作、连续性检查、角色管理、情节追踪、时间线同步等创作操作
</inputs>

## 使用方式

直接告诉我要做什么：

| 用户意图示例 | 执行的工作流 | 说明 |
|-------------|-------------|------|
| "初始化这个项目的wiki" / "帮我建wiki结构" | `project-init` | 扫描项目，搭建 raw/wiki 骨架 |
| "把这个PDF建档" / "捕获这个URL" | `capture` | 保存到 raw 层，记录元数据 |
| "建档第5章" / "把这份文档消化进wiki" | `ingest` | 提取知识，更新 wiki 页面 |
| "问个问题" / "wiki里怎么说的" | `query` | 意图路由、渐进式加载、声明交叉验证、反馈闭环 |
| "帮我研究一个主题" / "我想学习XX" | `research` | 自动搜索、筛选、下载、导入 |
| "来源更新了" / "检查同步状态" | `sync` | 增量同步、受影响页面定位、过时标记 |

| "检查wiki一致性" / "review一下" | `review` | 9项健康检查，CRITICAL/WARN/INFO |
| "编译验证" / "编译wiki" | `compile` | 三阶段编译检查 — 来源覆盖、声明完整性、矛盾检测 |
| "合并这两个页面" / "整理一下这个目录" | `curate` | 重组结构，保留关联 |
| "帮我绑定代码和手册" | `code-anchor` | 双向绑定：wiki知道代码，代码知道wiki |
| "画出手册结构" / "PDF目录提取" | `map-document` | 提取 PDF/DOCX/PPTX 大纲 |
| "索引这个代码目录" | `index-codebase` | 生成代码符号地图 |
| **"分析斗破苍穹的文风"** | `style-analyze` | **novelist 扩展**：从 TXT 按维度分析文风 |
| **"生成文风文件"** | `style-profile` | **novelist 扩展**：从 wiki 编译 profiles/*.yml |
| **"写下一章" / "写第57章"** | `chapter-write` | **novelist 扩展**：读取wiki→写作→更新wiki |
| **"检查连续性" / "有没有bug"** | `continuity-check` | **novelist 扩展**：扫描跨章节矛盾 |
| **"还有哪些伏笔没回收"** | `plot-track` | **novelist 扩展**：伏笔与情节线管理 |
| **"更新角色卡" / "林若现在什么状态"** | `character-manage` | **novelist 扩展**：角色状态追踪 |
| **"更新时间线"** | `timeline-sync` | **novelist 扩展**：从新章提取时间事件 |

歧义请求默认选择最窄的匹配工作流。

<vault_assumptions>
- 在 Claude 能够读取和更新的本地 Markdown 工作空间中工作。
- 优先使用直接的文件系统读写以确保可靠性。
- 如果 `obsidian` CLI 可用，将其视为搜索和导航的可选增强工具。
- 如果 CLI 不可用，回退到 `Glob` 和 `Grep`。
- 仅当用户明确要求时才使用 `obsidian://open` 或 GUI 打开行为。
</vault_assumptions>

## 配置说明

### Claude Code 设置

建议在 `~/.claude/settings.json` 中配置：

```json
{
  "permissions": {
    "allow": ["Bash(*)", "Read(*)", "Write(*)", "Edit(*)", "Glob(*)", "Grep(*)"],
    "deny": ["Bash(rm -rf:*)", "Bash(chmod:*)"]
  }
}
```

### 工作空间本地配置

在工作空间根目录创建 `.claude/settings.local.json`，可覆盖全局配置：

```json
{
  "permissions": {
    "deny": ["Bash(rm -rf:*)"]
  }
}
```

### 必需依赖

| 工具 | 用途 | 安装 |
|------|------|------|
| `uv` | Python 依赖隔离与动态库安装 | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

**动态工具发现原则：** 不在 SKILL.md 中硬编码特定 Python 库列表。
Claude Code 根据实际要处理的文件类型，自行判断需要哪些 Python 库，
通过 `uv run --with <library>` 动态安装。`uv` 的 `--with` 机制使得无需预装即可使用任意 PyPI 包。

常见场景参考（非强制列表，Claude Code 自行判断实际需要的库）：

| 文件类型 | 可能需要 |
|---------|---------|
| PDF（有目录） | `PyPDF2` |
| PDF（无目录/扫描件） | `pdfplumber`（或 `PyPDF2` 备用） |
| DOCX | `python-docx` |
| PPTX | `python-pptx` |
| C/C++ 源码 | `tree-sitter-languages` |
| 其他语言源码 | 对应的 tree-sitter 语言包（如 `tree-sitter-python`、`tree-sitter-rust` 等） |

项目自带工具脚本（`sub-skills/tools/*.py`）使用 Python 标准库，无额外依赖，
通过 `uv run python sub-skills/tools/<script>.py` 运行。

### Windows 注意事项

- 始终将文件路径作为命令行参数传递，避免 heredoc 中的 unicode 路径问题

<core_model>
工作流假设三个层次：
1. `raw/` — 捕获的原始来源和附件
2. `wiki/` — 维护的知识页面
3. `CLAUDE.md` + 模板 — 模式定义和工作流规则

wiki 是主要的回答层面。原始来源是可追溯的输入，而非默认的响应层面。
</core_model>

<tool_assumptions>
繁重的工作（PDF 解析、代码索引）委托给外部工具。
`uv` 是唯一的必需依赖，其他 Python 库按需动态安装。

| 工具 | 用途 | 必需 | 后备 |
|------|---------|----------|---------|
| `uv` | Python 依赖隔离与动态库安装 | 是 | 无 — 必须安装 |

**安装 `uv`：** `curl -LsSf https://astral.sh/uv/install.sh | sh`
（Git Bash / Linux / macOS — 三个平台命令相同）

**动态工具发现：** Claude Code 根据要处理的文件类型自行判断需要哪些 Python 库，
通过 `uv run --with <library>` 即时安装使用，无需预装。
每个工作流定义中可给出该场景常用的库建议，但不作为硬性依赖。

**平台说明：**
- 在 Windows 上（Git Bash / MSYS），始终将文件路径作为命令行参数传递，切勿通过 stdin 或 heredoc — 避免空格和 unicode 字符的引号问题
</tool_assumptions>

<path_rule>
始终使用工作空间相对路径注释有意义的文件操作。

示例：
- `→ 写入: raw/sources/article-name.md`
- `← 读取: wiki/concepts/self-attention.md`
- 搜索结果应包含文件路径
- 摘要应列出每个创建或更新的路径

**Windows / 非 ASCII 路径兼容性：**
- 当 Edit 的 old_string 包含非 ASCII 字符（中文、日文等）时，Edit 工具可能静默失败。
  解决方法：使用 `uv run python` 执行替换，或将编辑拆分为避免在 old_string 中使用非 ASCII 字符串的较小片段。
- 始终将文件路径作为命令行参数传递给 Python 脚本，切勿通过 heredoc 或 stdin — 避免 unicode 文件名的引号问题。
- 临时文件位置遵循全局规则：所有临时文件写入 `raw/.tmp/`。
</path_rule>

<global_rules>
- 捕获后保持 `raw/` 不可变。
- 优先更新现有页面，而非创建近似重复。
- 回答问题时先查阅 wiki。
- 显式呈现矛盾和不确定性，而非默默抹平。
- 将人类修正视为一等工作流。
- 对于有意义的捕获、导入、保存、审查、整理和修正操作，更新 `log.md`。
  对于长时间运行或多会话任务，在日志条目末尾包含 `task_status` 块，以便中断的会话可以恢复：
  ```markdown
  ## [2026-04-23] ingest | R7F0C014 ch12 WDT
  - Created wiki/sources/r7f0c014-manual-ch12-wdt.md ✅
  - Updated wiki/peripherals/wdt.md ✅
  - **task_status: s12 (complete) → next: s14 (pending) | coverage: partial**
  ```
- 保持 `index.md` 为轻量级入口点，而非巨型详尽注册表。
- 默认选择满足工作流的最小连贯变更集。
- 如果请求可能匹配多个工作流，选择保留用户意图的最窄工作流。
- 如果工作流写入文件，始终报告按创建、更新或未变化分组的触及路径。
- 如果查询结果值得保存，在保存回工作空间之前先询问。
- **临时文件必须写入 `raw/.tmp/`。** 所有工作流产生的临时脚本、
  中间 JSON 数据、缓存文件等，一律放入项目内的 `raw/.tmp/` 目录。
  禁止写入 `/tmp/`（Windows 不可靠）、项目根目录、或其他系统临时目录。
  `raw/.tmp/` 内容为会话级别，不保证持久化，不计入 wiki 知识。
- 写入 wiki 的每条事实声明都必须包含来源锚点。
  格式：`→ [来源: raw/sources/filename.md]` 或 `→ [来源: filename.md:第XX页]`。
  示例：`→ [来源: RA4M2_manual.pdf, 第134页]`。任何声明都不能
  没有可追溯的来源。这适用于所有 wiki 页面和所有生成 wiki 内容的工作流。
- 每次查询回答都必须声明其来源。先阅读 wiki 再回答。
  回答后，说明哪些 wiki 页面为回答提供了信息，即使回答也利用了训练知识。
  如果 wiki 对某个主题没有记录，应如实说明，而非编造一个 wiki 支持的答案。
</global_rules>

## 安全规则

- **不修改 raw 层** — capture 后 raw/ 内容不可更改，源文件永远是 traceable 锚点
- **不静默丢弃信息** — 矛盾和不一致必须显式 surface，不悄悄选择一个版本
- **不经用户确认不删除** — curate/review 发现孤儿页面或重复页面时，必须先报告再处理
- **不暴露敏感内容** — source anchor 中不包含内网路径、密钥或凭证
- **人类修正优先** — 用户说"这个页面错了"等同于最高优先级信号，立即响应

<large_file_protocol>
当一次性从头到尾读取某个来源不切实际或浪费时，将其视为大型来源。

常见场景：
- 长篇手册和参考 PDF
- 可能需要 OCR 的扫描 PDF
- 大型表格、电子表格或寄存器映射表
- 日志、跟踪记录或长篇幅生成报告
- 压缩包或多附件来源包

规则：
- 首先捕获原始文件并保持其在 `raw/` 下不可变
- 当来源是文件附件时，优先将原始文件存储在 `raw/assets/` 中
- 在广泛导入之前，在 `raw/sources/` 中创建或更新来源记录
- 当广泛导入会浪费资源或难以验证时，创建或更新来源地图
- 对于手册和类似参考资料，记录文件路径、来源类型、版本（如已知）、页数（如已知），以及最重要的章节或页码范围
- 先读取结构：目录、标题、页码范围、文件名或附近的索引说明
- 按相关章节或主题导入，而非盲目地全文通读
- 编写摘要和声明时保留页码范围、章节名称或其他来源锚点
- 尽可能将密集表格和不稳定的实现细节保留在面向来源的页面中，仅将稳定结论提升到维护的 wiki 页面
- 如果 wiki 仍缺少证据，说明下一步应检查哪个页码范围、章节或附件，而非假装整个来源已被审查完毕

<source_map_protocol>
来源地图是大型或难以处理的来源的轻量级工作地图。它帮助后续的导入和查询工作找到正确的章节，而无需反复重读整个来源。

必填字段：
- 文件路径
- 来源类型
- 结构模式
- 结构依据
- 置信度
- 主要章节或工作章节
- 已知的有用页码范围或其他来源锚点
- 覆盖状态

结构模式：
1. `explicit_toc`（显式目录）
   - 当来源已暴露可靠结构时使用。
   - 示例：带有目录的手册、标准文档、具有稳定标题的长篇报告。
2. `inferred_structure`（推断结构）
   - 当来源没有可靠目录，但仍可推断出有意义的结构时使用。
   - 示例：长篇幻灯片、无章节的讲义笔记、导出的网页文档。
3. `coarse_map`（粗略地图）
   - 当无法提取可靠结构时使用。
   - 示例：OCR 质量差的扫描件、图片密集型 PDF、日志、跟踪记录、混合附件包。

必需标记：
- 结构是源自文档还是推断的
- 结构的置信度
- 覆盖状态是部分、已映射还是当前任务足够
- 下一步仍需审查的内容

最小来源地图格式：
```yaml
title:
type: source_map
source_type:
file_path:
structure_mode: explicit_toc | inferred_structure | coarse_map
structure_basis:
confidence: high | medium | low
coverage_status: partial | mapped | focused_ingest_complete
```

建议章节：
- 概述
- 结构说明
- 章节地图
- 高价值范围
- 提取注意事项
- 剩余覆盖范围

不要将推断结构呈现为官方目录。

## 大文件增量导入

当来源超出一轮处理的容量时，使用来源地图作为进度追踪器，逐章节处理。

### 章节执行字段

`sections[]` 中的每个条目获得以下字段：

```yaml
sections:
  - id: s01
    title: "第3章：时钟生成电路"
    page_range: "120-156"
    priority: high          # high | medium | low — 导入顺序
    status: pending         # pending | active | complete | skipped
    claim_anchor_format: "第134页"  # 在 wiki 声明中引用此章节的方式
    open_questions: []      # 导入过程中产生但未回答的问题
    next_action: ""          # 下一步操作：例如"检查第142页的寄存器表"
```

### 增量导入规则

- 每次导入章节后，在来源地图中更新该章节的 `status`。
- 按 `priority` 顺序处理章节：先 `high`，再 `medium`，最后 `low`。
- 标记为 `status: skipped` 的章节经过审查但未产生 wiki 相关内容。
- 标记为 `status: complete` 的章节已完全导入；其声明已在 wiki 中。
- `open_questions` 累积导入过程中无法回答的问题；它们不阻塞进度。
- 导入中断时，报告：下一个 `pending` 章节的 `id`、其 `page_range` 以及当前的 `coverage_status`，以便下一次会话可以恢复。

### 恢复中断的导入

恢复时，读取来源地图并找到第一个 `status: pending` 的章节。从该章节开始导入。不要重新导入已完成的章节。完成一个章节后，在继续之前将其 `status` 更新为 `complete`。

### 代码锚点模式

当来源是硬件手册且工作空间包含项目源代码时，
使用 `code-anchor` 工作流（见工作流章节）在 wiki 页面和源文件之间建立双向链接。
</source_map_protocol>
</large_file_protocol>

<workflows>

## init（初始化）
完整工作流见 `sub-skills/tasks/init.md`。

## capture（捕获）
完整工作流见 `sub-skills/tasks/capture.md`。

### 输出结构

```
raw/sources/<slug>.md         ← 捕获的源记录（URL内容 / 文本摘要）
raw/assets/<original-file>    ← 大文件附件（PDF/DOCX等）
```

## ingest（导入）
当用户希望将来源转化为 wiki 更新时使用。

完整工作流见 `sub-skills/tasks/ingest.md`。

### 输出结构

```
wiki/sources/<slug>.md         ← 源记录（每份源文档一个，保留页码锚点）
wiki/<type>/<name>.md         ← 知识页面（peripherals/concepts/entities 等）
index.md                       ← 入口页更新（如有必要）
log.md                         ← ingest 记录
```

## query（查询）
当用户询问关于 wiki 的问题时使用。支持意图路由（事实/关系/对比/因果/探索）、
渐进式多轮加载、声明交叉验证、编译报告感知、query→compile 反馈闭环、多轮追问。

完整工作流见 `sub-skills/tasks/query.md`。

### 输出结构

无文件写入。如用户同意保存，输出至：
```
wiki/analyses/<slug>.md     ← 保存的分析结果
wiki/comparisons/<slug>.md   ← 保存的对比结果
```
如有新矛盾反馈：
```
wiki/_compiled/report-YYYY-MM-DD.md  ← 追加 "## Query 发现" 区块
```

## research（自动研究）
当用户希望学习某个主题但没有现成资料时使用。自动多渠道搜索、
质量筛选、下载资源、构建 wiki 知识。支持中英文双语搜索。

完整工作流见 `sub-skills/tasks/research.md`。

### 输出结构

```
raw/sources/<slug>.research-plan.md    ← 研究策略
raw/sources/<slug>.candidates.md       ← 候选来源列表
raw/assets/<file>                       ← 自动下载的资源
wiki/<type>/<page>.md                  ← 生成的知识页面
wiki/analyses/<slug>-gaps.md           ← 知识缺口报告
wiki/analyses/<slug>-report.md         ← 最终研究报告
log.md                                  ← 操作日志
```

## sync（增量同步）
当来源文件更新后，检测 wiki 同步状态。定位受影响页面，标记过时声明。

完整工作流见 `sub-skills/tasks/sync.md`。

### 输出结构

```
<受影响页面>.md             ← frontmatter 更新 (status/needs_refresh)
raw/sources/<slug>.md       ← last_checked 更新
wiki/_compiled/report-*.md  ← 追加同步报告区块
log.md                       ← sync 记录
```

## review（审查）
当用户希望进行健康检查、维护或一致性审查时使用。

完整工作流见 `sub-skills/tasks/review.md`，含 9 项检查清单。

### 输出结构

无文件写入（仅报告）。如用户要求修复：
```
<修改的页面>                 ← frontmatter 补充 / 重复行删除 / 链接添加
log.md                       ← review 记录
```

## compile（编译）
当用户希望运行编译验证、检查 wiki 质量或生成编译报告时使用。

完整工作流见 `sub-skills/tasks/compile.md`，含三阶段编译检查。

### 输出结构

```
wiki/_compiled/report-YYYY-MM-DD.md  ← 编译报告（CRITICAL/WARN/INFO）
log.md                                ← compile 记录
```

## curate（整理）
当用户希望进行人工主导的重组或优化时使用。

完整工作流见 `sub-skills/tasks/curate.md`。

### 输出结构

```
<修改的页面>                ← 合并/拆分/重命名后的页面
index.md                    ← 链接更新（如有必要）
log.md                      ← curation 记录
```

## project-init（项目初始化）
当用户希望为现有项目构建 wiki 知识时使用。

完整工作流见 `sub-skills/tasks/project-init.md`。

project-init 完成后，说明具体的下一步步骤：
  1. 对 <manual-file> 执行 `map-document` → 创建 `raw/sources/<slug>.map.md`
  2. 对 <code-dir> 执行 `index-codebase` → 创建 `raw/sources/<slug>.codebase.md`
  3. 对来源地图中最高优先级的待处理章节执行 `ingest`

### 输出结构

```
<project-root>/
├── CLAUDE.md              ← 复制自 templates/vault-CLAUDE.md
├── index.md               ← 入口页（链接到 wiki/overview.md）
├── log.md                 ← 初始化记录
├── raw/
│   ├── sources/           ← （待建档时填充）
│   └── assets/            ← （附件/大文件）
└── wiki/
    ├── overview.md        ← 项目地图（模块、外设、关键文件）
    ├── sources/           ← 源记录（每份文档一个）
    ├── concepts/          ← 概念页
    ├── entities/          ← 实体页（模块、组件）
    ├── analyses/          ← 分析页
    └── comparisons/      ← 对比页
```

## code-anchor（代码锚点）
当用户指向一个源文件并希望了解 wiki 相关知识，
或指向一个 wiki 页面并希望了解哪些源代码使用了它时使用。

示例：
- "clock_config.c 文件配置了什么？哪个手册章节涉及它？"
- "我想把 PWM wiki 页面链接到实际使用它的代码"

完整工作流见 `sub-skills/tasks/code-anchor.md`。

核心原则：wiki 页面知道哪些代码使用了它，代码也知道哪个 wiki 页面解释了它。

### 输出结构

```
wiki/<type>/<name>.md        ← 添加了代码片段块和源码锚点
<source-file>.c/.h           ← 添加了 wiki 回指注释 /* → wiki/... */
log.md                        ← code-anchor 记录
```

## map-document（文档映射）
当用户提供大型文档（PDF、DOCX、PPTX）并希望在导入前创建可导航的结构地图时使用。

完整工作流见 `sub-skills/tools/map-document.md`。Claude Code 根据文档格式自行选择 Python 库，通过 `uv run --with <library>` 动态安装。

步骤：
1. 确认文件存在且为 `.pdf`、`.docx` 或 `.pptx` 格式。
2. 运行 `sub-skills/tools/map-document.md` 中的提取脚本。
3. 解析 JSON 输出。
4. 将来源地图写入 `raw/sources/<slug>.map.md`。
5. 记录操作到日志。

### 输出结构

```
raw/sources/<slug>.map.md    ← 大文件结构地图（章节/页码/优先级）
raw/.tmp/llm_wiki_map_doc.py  ← 临时脚本（会话内）
```

## index-codebase（代码库索引）
当用户提供源代码目录并希望建立符号索引时使用。

完整工作流见 `sub-skills/tools/index-codebase.md`。使用 tree-sitter 进行 AST 解析，Claude Code 根据源码语言选择对应的 tree-sitter 包。

步骤：
1. 确认目录存在。
2. 运行 tree-sitter 索引器并解析输出。
3. 将代码库地图写入 `raw/sources/<slug>.codebase.md`。
4. 记录操作到日志。

### 输出结构

```
raw/sources/<slug>.codebase.md  ← 代码符号地图（函数/结构体/枚举/宏）
raw/sources/<slug>.codebase.json ← 原始索引数据（会话内）
raw/.tmp/llm_wiki_index_code.py  ← 临时脚本（会话内，方案 B）
```

</workflows>

<process>
1. 判断请求是 init、capture、ingest、query、research、review、compile、curate、sync、graph、project-init、code-anchor、map-document、index-codebase 或 novelist 扩展工作流（style-analyze、style-profile、chapter-write、continuity-check、plot-track、character-manage、timeline-sync）。
2. 在操作文件前确认工作空间根目录。
3. 优先编辑现有页面而非创建重复页面。
4. 捕获后保持原始来源不可变。
5. 将用户修正视为页面刷新的高优先级信号。
6. 对于有意义的写入操作，始终报告触及路径。
7. 保存新的知识页面时，优先使用现有页面类型和路径，而非发明新结构。
8. 当用户提问时，先从维护的 wiki 回答，仅在需要时扩大到原始来源。
9. 当用户标记某个页面为错误或过时时，将其视为修正或整理工作流，而非重新导入。
10. 文风分析时，先检查 wiki 是否已有该小说/维度的分析。
11. 写作时，先读取 wiki 中的角色/时间线/情节状态再动笔；写完后更新 wiki。
12. 下载网文 TXT 前，必须让用户验证 URL。
</process>

<novelist_extension>

## 文风维度体系

文风研究使用八个可交叉引用的维度页（详见 `wiki/dimensions/`）：

| 维度 | wiki 页 | 研究内容 |
|------|---------|---------|
| 句法肌理 | `dimensions/syntax.md` | 句子长度、段落节奏、标点使用、断句习惯 |
| 词汇光谱 | `dimensions/vocab.md` | 白话-古风位置、成语密度、标志性词汇 |
| 叙事节奏 | `dimensions/pacing.md` | 高潮间距、过渡处理、章末钩子类型 |
| 氛围质地 | `dimensions/atmosphere.md` | 情绪基调、感官侧重、场景的情绪功能 |
| 场景生态 | `dimensions/scene-ecosystem.md` | 偏爱的场景类型、场景的叙事功能 |
| 套路指纹 | `dimensions/trope-fingerprint.md` | 爽点模式、金手指类型、冲突升级结构 |
| 对话纹理 | `dimensions/dialogue-texture.md` | 对话比例、功能、角色话术辨识度 |
| AI 负空间 | `dimensions/ai-negative-space.md` | AI 难以模仿的人类特征、反 AI 检测信号 |
| **世界观设计** | `dimensions/world-building.md` | **novelist 扩展**：规则体系完备性、创新评定、逻辑自洽 |
| **世界观测评** | `dimensions/world-consistency.md` | **novelist 扩展**：世界观矛盾检测、设定遵守度 |

每个维度页包含：维度定义、识别方法、变化光谱、代表作品链接、AI 常见模式。

### 世界观分析（novelist 扩展）

世界观是网文的核心竞争力之一。例如《神秘复苏》被认为"世界观超一流，人物塑造不入流"——《诡秘之主》的序列体系是其最大卖点。

世界观 wiki 化结构：
```
wiki/novels/<slug>/world-building/
├── _index.md              ← 世界观总览
├── power-system.md        ← 力量体系（序列/斗气/鬼的规则）
├── geography.md           ← 地理/势力分布
├── history.md             ← 世界历史/背景纪元
├── organizations.md       ← 组织/势力/教会
├── magic-rules.md         ← 魔法/超自然规则
└── consistency-check.md   ← 逻辑自洽验证结果
```

**世界观专用工作流**：
- `world-analyze`：分析小说世界观——提取规则体系、检测逻辑自洽性
- `world-consistency`：写作前检查——新章节是否违反已建立的世界规则

## 网文下载：经过实战验证的完整管线

novelist 不重新发明下载流程——下载网文 TXT 全文时，**严格遵循 llm-wiki 的 `research` 和 `capture` 工作流**。

### 实战验证的下载管线（2026-04-30 跑通）

以下流程经过斗破苍穹 + 诡秘之主两部小说的实际下载验证：

**阶段 A：域名获取**（→ llm-wiki `research` 阶段二）

```bash
agent-browser open "https://shadowlibraries.github.io/DirectDownloads/AnnasArchive/"
agent-browser wait --load networkidle
agent-browser get attr @e13 href   # Anna's Archive 主站
agent-browser get attr @e14 href   # Mirror 1
agent-browser get attr @e15 href   # Mirror 2
```

**阶段 B：搜索**（→ llm-wiki `research` 阶段二）

```bash
agent-browser open "https://annas-archive.gl"
agent-browser fill @e74 "<书名> <作者>"
agent-browser press Enter
agent-browser wait --load networkidle
agent-browser snapshot -i -d 3     # 查看结果，找 TXT 候选
agent-browser get attr @<书名ref> href  # 获取 MD5 路径
```

**阶段 C：用户验证 URL**（novelist 特有安全规则）

向用户展示 MD5 详情页 URL，等待确认。不自动下载。

**阶段 D：提取直链 + 下载**

⚠️ agent-browser 点击 slow_download 会触发 hCaptcha（无法自动化）。
**解决方案：用 opencli browser 控制真实 Chrome + 直链提取。**

```bash
# 1. 用 opencli browser 打开 MD5 详情页
opencli browser open "https://annas-archive.gl/md5/<md5>"

# 2. 用 eval 直接导航到 slow_download（绕过 DOM 索引不稳定问题）
opencli browser eval "window.location.href='/slow_download/<md5>/0/7'"

# 3. 提取 partner server 直链（无 hCaptcha，无 DDoS-Guard）
opencli browser eval "Array.from(document.querySelectorAll('span')).filter(s => s.textContent.startsWith('http')).map(s => s.textContent).join('\n')"

# 4. curl 下载直链（建议用短文件名那个 URL）
curl -L -o "raw/assets/<slug>.txt" "<直链URL>"
```

**为什么这个管线能跑通：**
- Anna's Archive 搜索/浏览无需验证，agent-browser 完全够用
- 下载触发 hCaptcha，但 slow_download 页面给的 partner server 直链（IP:PORT）无需任何验证
- opencli browser 用真实 Chrome（已登录状态），eval 导航不受 DOM 索引刷新影响
- curl 下载 partner server 直链速度快、无中间层

**阶段 E：捕获后处理**（→ llm-wiki `capture` 工作流）

1. 创建 `raw/sources/<slug>.md`（元数据、获取状态、MD5）
2. 对长篇（>100 万字）创建来源地图
3. 追加 `log.md` 捕获记录
4. 标记 `acquired: auto`，记录下载日期

**Anna's Archive 约束**（继承 llm-wiki research）：
- 域名频繁变动，绝不硬编码 URL
- 每次使用前从 shadowlibraries.github.io 获取最新域名
- 仅个人学习研究用途
- 下载后 `raw/assets/` 内容不可变（llm-wiki 核心规则）
- `annas-archive.li` 已被劫持，永远不要使用

**备选渠道**（Anna's Archive 不可用时）：
- WebSearch "`<小说名>` txt 下载" 搜索其他下载站
- 知轩藏书、Z-Library 等
- 所有备选渠道同样需要用户验证 URL

## llm-wiki 工作流在 novelist 中的映射

以下说明 llm-wiki 的每个基础工作流在 novelist 中如何使用：

| llm-wiki 工作流 | novelist 中的用法 | 说明 |
|----------------|-------------------|------|
| `init` | 初始化文风研究 wiki | 创建 writing-style 工作空间结构 |
| `project-init` | 为小说项目搭建创作 wiki | 创建角色/时间线/情节骨架 |
| `capture` | **保存下载的 TXT + 创建来源记录** | 核心下载后处理 |
| `ingest` | **文风分析——从 TXT 提取风格特征到 wiki** | 大文件增量导入协议 |
| `research` | **多渠道搜索 + Anna's Archive 下载** | 核心下载流程 |
| `query` | 查询文风问题 / 创作咨询 | 意图路由 + 渐进式加载 |
| `sync` | 检测 TXT 是否有新章节 | 增量同步 |
| `compile` | 文风维度覆盖检查 + 声明矛盾检测 | 三阶段编译验证 |
| `review` | 9 项健康检查 | 适用于文风 wiki 和创作 wiki |
| `curate` | 合并/重组分析页或创作页 | 人工主导 |
| `graph` | 文风维度关系可视化 | Louvain 社区检测 |
| `map-document` | TXT 结构提取（章节划分） | 大文件预处理 |
| `code-anchor` | **不使用**（novelist 不涉及代码） | — |
| `index-codebase` | **不使用**（novelist 不涉及代码） | — |

## novelist 扩展工作流

以下工作流是 novelist 在 llm-wiki 基础上新增的，基础工作流继承自 llm-wiki。

### style-analyze（文风分析）
当用户提供一部网文并希望分析其文风时使用。

**分析方法**：双层混合分析 —— 计算指标层（全量定量扫描）+ Wiki 编译层（llm-wiki ingest 管线）。
详见 `.planning/novelist-analysis-methodology.md`。

完整工作流见 `sub-skills/tasks/style-analyze.md`。

**五阶段管线**：
1. `style-metrics.py` 全量扫描 → 定量指纹 + 极端章定位 + 风格漂移检测
2. Source Map 创建 → 基于指标+标题的章节优先级地图
3. Wiki Ingest → 逐章编译角色/情节/场景 wiki（llm-wiki ingest 协议，可中断）
4. 维度分析 → 定量数据 + wiki 知识融合撰写
5. Compile → 叙事一致性验证 + 维度覆盖检查

输出结构：
```
wiki/novels/<slug>/
├── overview.md              ← 文风总览
├── source-map.md            ← 章节地图（优先级+状态追踪）
├── characters/              ← 角色档案（含风格标注）
├── plot-threads/            ← 情节线+伏笔
├── timeline/                ← 时间线
├── scenes/                  ← 场景分类目录
├── style-dimensions/        ← 八个维度分析（定量+定性融合）
│   ├── syntax.md
│   ├── vocab.md
│   ├── pacing.md
│   ├── atmosphere.md
│   ├── tropes.md
│   ├── dialogue.md
│   ├── scenes-analysis.md
│   └── ai-gaps.md
├── style-drift.md           ← 风格漂移分析
└── excerpts.md              ← 关键摘录（含章号锚点）
```

### style-profile（文风文件生成）
当用户希望从 wiki 分析编译出可使用的文风文件时使用。

完整工作流见 `sub-skills/tasks/style-profile.md`。

输出结构：
```
profiles/<style-name>.yml     ← 文风抽象化文件（给写作 agent 使用）
profiles/使用说明.md           ← 使用指南
```

### chapter-write（章节写作）
当用户希望基于 wiki 记忆写新章节时使用。

流程：写作前 → 读取 wiki 记忆（角色状态/当前时间线/未回收伏笔/上一章摘要/目标文风）
→ 写作 → 写作后更新 wiki（新章节摘要/角色状态变更/时间线新事件/伏笔更新）

完整工作流见 `sub-skills/tasks/chapter-write.md`。

### continuity-check（连续性检查）
当用户希望检查跨章节一致性时使用。扫描角色信息、时间线、设定、情节线四个维度的矛盾。

完整工作流见 `sub-skills/tasks/continuity-check.md`。

### plot-track（情节追踪）
当用户需要管理伏笔和情节线时使用。支持伏笔增删、回收标记、未回收伏笔列表。

完整工作流见 `sub-skills/tasks/plot-track.md`。

### character-manage（角色管理）
当用户需要创建或更新角色卡时使用。支持角色状态快照、关系追踪、成长弧线记录。

完整工作流见 `sub-skills/tasks/character-manage.md`。

### timeline-sync（时间线同步）
当写完新章节后需要更新时间线时使用。从新章提取时间事件，检测时间线冲突。

完整工作流见 `sub-skills/tasks/timeline-sync.md`。

## novelist 工作空间结构

novelist 的工作空间在 llm-wiki 标准结构基础上增加了文风研究和创作记忆专用目录：

```
<工作空间>/
├── CLAUDE.md                   ← 工作空间协议（llm-wiki 通用）
├── raw/
│   ├── sources/<slug>.md       ← 小说来源记录
│   └── assets/<slug>.txt       ← 下载的全文 TXT（不可变）
├── wiki/
│   ├── dimensions/             ← 文风维度定义（可交叉引用）
│   ├── novels/<slug>/          ← 已分析小说的完整文风档案
│   ├── novels/<当前作品>/       ← 正在写的小说的"记忆"
│   │   ├── characters/         ←   角色卡（状态/关系/成长）
│   │   ├── timeline/           ←   时间线
│   │   ├── plot-threads/       ←   伏笔与情节线
│   │   └── chapters/           ←   每章摘要
│   ├── authors/<author>/       ← 作者级文风指纹
│   ├── comparisons/            ← 跨作品对比分析
│   └── ai-traits/              ← AI 文风特征库
├── profiles/                   ← 产出的文风抽象化文件（给 agent 使用）
└── templates/                  ← 分析模板
```

## novelist 特有全局规则

以下规则在 llm-wiki 全局规则基础上增加：

- 写入 wiki 的每条文风声明必须包含文本摘录作为证据。
  格式：`→ [摘录: 第X章, 第Y段]`。任何声明都不能没有可追溯的文本来源。
- 文风维度页通过 `[[wiki链接]]` 与各小说分析页交叉引用——维度可以找到代表作品，作品可以找到维度表现。
- 章节写作 session 开始前，必须先读取 wiki 中的角色/时间线/情节状态。
- 章节写作 session 结束后，必须更新 wiki 中的章节摘要/角色状态/时间线/情节线。
- 网文 TXT 下载前，由用户验证 URL。下载后保持 raw/ 不可变。
- 如果文风在连载中有漂移，记录漂移轨迹而非强行统一——文风演变本身是有价值的信息。

</novelist_extension>
