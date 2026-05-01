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

## 核心模型

```
raw/  ──→ wiki/  ──→ profiles/
源码      中间表示    派生产物
（不可变）  （持久化）   （从 wiki 编译）
```

| 层 | 目录 | 角色 | 维护者 |
|---|------|------|--------|
| 原始来源 | `raw/` | 不可变的真相来源 | 人类（LLM 只读） |
| Wiki | `wiki/` | 编译后的知识页面 | LLM 主要维护 |
| Profiles | `profiles/` | 文风抽象化文件（给 agent 使用） | 从 wiki 编译生成 |

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

### 必需依赖

| 工具 | 用途 | 安装 |
|------|------|------|
| `uv` | Python 依赖隔离与动态库安装 | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

项目自带工具脚本（`sub-skills/tools/*.py`）使用 Python 标准库，无额外依赖，
通过 `uv run python sub-skills/tools/<script>.py` 运行。

## 使用方式

直接告诉我要做什么：

| 用户意图示例 | 执行的工作流 | 定义文件 |
|-------------|-------------|---------|
| "初始化这个项目的wiki" | `init` | `sub-skills/tasks/init.md` |
| "把这个PDF建档" | `capture` | `sub-skills/tasks/capture.md` |
| "建档第5章" | `ingest` | `sub-skills/tasks/ingest.md` |
| "wiki里怎么说的" | `query` | `sub-skills/tasks/query.md` |
| "帮我研究一个主题" | `research` | `sub-skills/tasks/research.md` |
| "来源更新了" | `sync` | `sub-skills/tasks/sync.md` |
| "检查wiki一致性" | `review` | `sub-skills/tasks/review.md` |
| "编译验证" | `compile` | `sub-skills/tasks/compile.md` |
| "合并这两个页面" | `curate` | `sub-skills/tasks/curate.md` |
| "画出手册结构" | `map-document` | `sub-skills/tools/map-document.md` |
| "索引这个代码目录" | `index-codebase` | `sub-skills/tools/index-codebase.md` |
| "绑定代码和手册" | `code-anchor` | `sub-skills/tasks/code-anchor.md` |
| **"分析斗破苍穹的文风"** | `style-analyze` | `sub-skills/tasks/style-analyze.md` |
| **"生成文风文件"** | `style-profile` | `sub-skills/tasks/style-profile.md` |
| **"写下一章"** | `chapter-write` | `sub-skills/tasks/chapter-write.md` |
| **"检查连续性"** | `continuity-check` | `sub-skills/tasks/continuity-check.md` |
| **"还有哪些伏笔没回收"** | `plot-track` | `sub-skills/tasks/plot-track.md` |
| **"更新角色卡"** | `character-manage` | `sub-skills/tasks/character-manage.md` |
| **"更新时间线"** | `timeline-sync` | `sub-skills/tasks/timeline-sync.md` |

歧义请求默认选择最窄的匹配工作流。

## 子技能结构

```
sub-skills/
├── tasks/          # 工作流定义
│   ├── init.md, project-init.md
│   ├── capture.md, ingest.md, query.md
│   ├── research.md, sync.md
│   ├── compile.md, review.md, curate.md
│   ├── graph.md, code-anchor.md
│   ├── style-analyze.md          # novelist: 五阶段文风分析管线
│   ├── style-profile.md          # novelist: 文风文件生成
│   ├── chapter-write.md          # novelist: 章节写作
│   ├── continuity-check.md       # novelist: 连续性检查
│   ├── plot-track.md             # novelist: 情节追踪
│   ├── character-manage.md       # novelist: 角色管理
│   └── timeline-sync.md          # novelist: 时间线同步
├── tools/          # 工具与脚本
│   ├── map-document.md, index-codebase.md
│   ├── parse-claims.py, build-graph.py, run-datalog.py
│   └── style-metrics.md          # novelist: 定量指标扫描工具
├── protocols/      # 共享协议
│   ├── large-file-protocol.md    # 大文件处理 + 来源地图 + 增量导入
│   └── download-pipeline.md      # 网文下载 9 步管线
└── runtime/        # 运行时抽象（预留）
```

## 全局规则

- 捕获后保持 `raw/` 不可变。
- 优先更新现有页面，而非创建近似重复。
- 回答问题时先查阅 wiki。
- 显式呈现矛盾和不确定性，而非默默抹平。
- 将人类修正视为一等操作。
- 对于有意义的捕获、导入、保存、审查、整理和修正操作，更新 `log.md`。
  对于长时间运行或多会话任务，在日志条目末尾包含 `task_status` 块：
  ```markdown
  ## [2026-04-23] ingest | R7F0C014 ch12 WDT
  - Created wiki/sources/r7f0c014-manual-ch12-wdt.md
  - **task_status: s12 (complete) → next: s14 (pending) | coverage: partial**
  ```
- 保持 `index.md` 为轻量级入口点，而非巨型详尽注册表。
- 默认选择满足工作流的最小连贯变更集。
- 如果工作流写入文件，始终报告按创建、更新或未变化分组的触及路径。
- 如果查询结果值得保存，在保存回工作空间之前先询问。
- **临时文件必须写入 `raw/.tmp/`**，禁止写入系统临时目录。
- 写入 wiki 的每条事实声明都必须包含来源锚点。
  格式：`→ [来源: raw/sources/filename.md]` 或 `→ [来源: filename.md:第XX页]`。

## 安全规则

- **不修改 raw 层** — capture 后 raw/ 内容不可更改
- **不静默丢弃信息** — 矛盾和不一致必须显式 surface
- **不经用户确认不删除** — curate/review 发现孤儿页面必须先报告再处理
- **不暴露敏感内容** — source anchor 中不包含内网路径、密钥或凭证
- **人类修正优先** — 用户说"这个页面错了"等同于最高优先级信号

## 大文件处理

详见 `sub-skills/protocols/large-file-protocol.md`。核心要点：
- 先创建来源地图，再按章节增量导入
- 按 priority 顺序处理：high → medium → low
- 中断恢复：读取 source-map，找第一个 `status: pending` 的章节

## 网文下载管线

详见 `sub-skills/protocols/download-pipeline.md`。核心要点：
- Anna's Archive → opencli browser 提取直链 → curl 下载
- EPUB 自动转 TXT
- **下载前必须用户验证 URL**

---

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
| 世界观设计 | `dimensions/world-building.md` | 规则体系完备性、创新评定、逻辑自洽 |
| 世界观测评 | `dimensions/world-consistency.md` | 世界观矛盾检测、设定遵守度 |

## style-analyze（文风分析）

五阶段管线，**不可跳过**。完整工作流见 `sub-skills/tasks/style-analyze.md`。

```
阶段 1: 全量计算扫描 → 定量指纹 JSON
阶段 2: Source Map 创建 → 章节优先级地图
阶段 3: Wiki Ingest（不可跳过） → 逐章编译角色/情节/场景 wiki
阶段 4: 维度分析 → 8 个维度页
阶段 5: Compile → 叙事一致性验证
```

核心约束：阶段 3（Wiki Ingest）是认知基础。跳过 wiki = profile 成为无源之水。

## style-profile（文风文件生成）

从完整 wiki 编译 profiles/*.yml。完整工作流见 `sub-skills/tasks/style-profile.md`。

硬前置条件：wiki 不完整则拒绝生成。必须通过 7 项门控检查。

## novelist 特有全局规则

- 写入 wiki 的每条文风声明必须包含文本摘录作为证据。
  格式：`→ [摘录: 第X章, 第Y段]`
- 文风维度页通过 `[[wiki链接]]` 与各小说分析页交叉引用
- 章节写作 session 开始前，必须先读取 wiki 中的角色/时间线/情节状态
- 章节写作 session 结束后，必须更新 wiki
- 网文 TXT 下载前，由用户验证 URL
- 如果文风在连载中有漂移，记录漂移轨迹而非强行统一

## novelist 工作空间结构

```
<工作空间>/
├── CLAUDE.md                   ← 工作空间协议
├── raw/
│   ├── sources/<slug>.md       ← 小说来源记录
│   └── assets/<slug>.txt       ← 下载的全文 TXT（不可变）
├── wiki/
│   ├── dimensions/             ← 文风维度定义（可交叉引用）
│   ├── novels/<slug>/          ← 已分析小说的完整文风档案
│   ├── novels/<当前作品>/       ← 正在写的小说的"记忆"
│   ├── authors/<author>/       ← 作者级文风指纹
│   ├── comparisons/            ← 跨作品对比分析
│   └── ai-traits/              ← AI 文风特征库
├── profiles/                   ← 产出的文风抽象化文件（给 agent 使用）
└── templates/                  ← 分析模板
```

</novelist_extension>

<process>
1. 判断请求是基础工作流（init/capture/ingest/query/research/review/compile/curate/sync/graph/project-init/code-anchor/map-document/index-codebase）或 novelist 扩展工作流（style-analyze/style-profile/chapter-write/continuity-check/plot-track/character-manage/timeline-sync）。
2. 在操作文件前确认工作空间根目录。
3. 优先编辑现有页面而非创建重复页面。
4. 捕获后保持原始来源不可变。
5. 将用户修正视为页面刷新的高优先级信号。
6. 对于有意义的写入操作，始终报告触及路径。
7. 当用户提问时，先从维护的 wiki 回答，仅在需要时扩大到原始来源。
8. 文风分析时，先检查 wiki 是否已有该小说/维度的分析。
9. 写作时，先读取 wiki 中的角色/时间线/情节状态再动笔；写完后更新 wiki。
10. 下载网文 TXT 前，必须让用户验证 URL。
</process>
