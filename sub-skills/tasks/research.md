---
name: research
description: 自动化研究——从零开始搜集资料、筛选、捕获并构建 wiki 知识
---

## research（自动研究）

当用户希望学习某个主题但没有现成资料时使用。系统自动搜索、筛选、捕获来源，逐篇导入 wiki。

示例：
- "帮我研究一下 RISC-V 向量扩展"
- "我想系统学习编译原理，帮我收集资料建 wiki"
- "研究 Transformer 架构的最新进展"

### 前置条件

- 工作空间已初始化（`project-init` 或 `init` 已完成）
- 如有 Tavily API key，搜索质量更高（可选）

### 阶段一：制定研究策略

1. 与用户确认研究范围：
   - 主题边界（包含什么、不包含什么）
   - 深度偏好（入门概览 vs 深度技术）
   - 来源偏好（学术论文 vs 博客 vs 教科书 vs 综合）
   - 时间范围（经典材料 vs 最新进展）
2. 将策略写入 `raw/sources/<slug>.research-plan.md`，包含：
   - 研究主题和范围
   - 搜索关键词列表（中英文各一组，缺一不可）
   - 目标来源类型及优先级
   - 预期 wiki 结构（概念页、实体页等）

### 阶段二：多渠道搜索

**强制要求：中英文双语搜索。** 每个搜索主题必须分别用中文和英文关键词搜索，
确保资料来源的语言多样性。仅搜索英文会导致视野偏斜——中文技术社区
（知乎、CSDN、中文教科书、中国大学课程）同样有大量高质量资料。

按策略并行搜索多个渠道：

| 渠道 | 工具/方法 | 适用场景 | 语言 |
|------|----------|---------|------|
| **网页搜索** | WebSearch 工具 | 通用搜索，发现文章/博客/文档 | 中+英各搜一次 |
| **学术论文** | arXiv API / Semantic Scholar | 学术研究 | 英文为主 |
| **中文论文** | CNKI / 万方 (如有访问) | 中文学术 | 中文 |
| **Wikipedia** | WebFetch EN + ZH 版本 | 概念入门 | 中+英 |
| **书籍/教材** | agent-browser 访问 Anna's Archive | 深度学习 | 中+英书名各搜一次 |
| **GitHub** | `gh search repos` / `gh search code` | 技术实现 | 英文为主 |
| **技术文档** | WebFetch 项目官网 | API/框架文档 | 视项目而定 |
| **中文社区** | WebSearch site:zhihu.com / site:csdn.net | 实践教程 | 中文 |

**双语搜索规则**：
- 阶段一的研究计划中，搜索关键词列表必须包含中英文两组
- 每个渠道搜索时，先用英文关键词，再用中文关键词
- 中文资料可来自：知乎、CSDN、豆瓣、中国大学课程网站、中文教材出版社
- Anna's Archive 搜索中文书名时使用中文字符（如"程序分析原理"）

**⚠️ Anna's Archive 域名警告**：
- `annas-archive.li` 已被劫持为内容农场，**永远不要使用**
- Anna's Archive 域名随着法律打击频繁变动，**绝不硬编码 URL**
- 每次使用前必须从官方页面获取当前可用域名

**Anna's Archive 搜索流程（每次执行前必读）**：

1. **获取最新域名**（每次 research 第一步）：
   ```bash
   agent-browser open "https://shadowlibraries.github.io/DirectDownloads/AnnasArchive/"
   agent-browser wait --load networkidle
   agent-browser snapshot
   ```
   从页面 "Links:" 区块提取当前官方域名（格式：`Anna's Archive` + `Mirror 1` + `Mirror 2`）。

   **当前已知可用域名（2026-04-29 验证）**：
   - `annas-archive.gl`（主站）
   - `annas-archive.pk`（镜像 1）
   - `annas-archive.gd`（镜像 2）

2. **搜索**：
   ```bash
   agent-browser open "https://annas-archive.gl"    # 使用步骤1获取的域名
   agent-browser wait --load networkidle
   agent-browser snapshot -i                          # 找到搜索框 ref
   agent-browser fill <搜索框ref> "<搜索关键词>"
   agent-browser press Enter
   agent-browser wait --load networkidle
   agent-browser snapshot -i                          # 查看结果
   ```

3. **提取元数据或下载**：
   - 搜索结果中包含书名、作者、出版社、年份、格式（pdf/epub）、来源库（Z-Library/Libgen 等）
   - 用 `agent-browser snapshot` 全量提取可见元数据
   - 对确认要下载的来源，`agent-browser click` 进入详情页，再 `agent-browser download` 下载
   - 下载约束见阶段四（仅官方域名、仅个人学习用途）

4. **记录候选来源**：将元数据写入 `raw/sources/<slug>.candidates.md`

**备选方案**：如果 agent-browser 不可用或所有 Anna's Archive 域名均不可达，
用 WebSearch 搜索 "title author PDF" 查找替代下载源（如作者主页、arXiv、机构仓库）。

**搜索输出**：`raw/sources/<slug>.candidates.md`，包含每条来源的：
- 标题、作者、URL
- 来源类型（论文/书籍/文章/文档）
- 初步质量评估（LLM 判断相关性 + 时效性）
- 优先级（high/medium/low）

### 阶段三：质量筛选

1. LLM 对每条候选来源评估：
   - **相关性**：与用户研究主题的匹配度
   - **权威性**：作者/机构声誉、引用量（如可获取）
   - **时效性**：发布时间，是否可能过时
   - **覆盖度**：是否填补了已有候选来源未覆盖的子主题
2. 按优先级排序，默认纳入所有 `high` 候选
3. 向用户展示候选列表，**等待确认**（或设阈值自动通过）
4. 确认后的来源标记为 `screened`，进入捕获阶段

### 阶段四：捕获与自动获取

对每条已确认的来源，执行捕获 + 自动下载到 `raw/assets/`。

#### 4.1 安全渠道自动下载

以下渠道的 PDF/文件可直接通过 agent-browser 自动下载，零法律风险：

| 渠道 | 下载方式 | 示例 |
|------|---------|------|
| **arXiv** | `agent-browser open https://arxiv.org/pdf/<id>.pdf` → `download @e1 <path>` | 论文 PDF |
| **作者主页** | `agent-browser open <url>` → snapshot 找下载链接 → `download <ref> <path>` | 免费教材 |
| **GitHub Releases** | `agent-browser open <release-url>` → snapshot 找 asset → `download <ref> <path>` | 工具/代码 |
| **机构仓库** | 同上，找 PDF 链接 | 大学课件 |

```bash
# arXiv 下载示例
agent-browser open "https://arxiv.org/pdf/2405.12841.pdf"
agent-browser wait --load networkidle
agent-browser download @e1 "raw/assets/ir-static-analysis-survey.pdf"
```

```bash
# 作者主页下载示例 (Møller 教材)
agent-browser open "https://cs.au.dk/~amoeller/spa/spa.pdf"
agent-browser wait --load networkidle
agent-browser download @e1 "raw/assets/spa-moller.pdf"
```

#### 4.2 Anna's Archive 下载（需谨慎）

仅从官方域名（shadowlibraries.github.io 确认的）下载。流程：

```bash
# 步骤1: 从搜索结果进入详情页
agent-browser click @<书名ref>              # 点击搜索结果中的书名

# 步骤2: 在详情页找到下载按钮
agent-browser wait --load networkidle
agent-browser snapshot -i                    # 定位下载按钮 ref

# 步骤3: 下载
agent-browser download @<下载按钮ref> "raw/assets/<slug>.pdf"
agent-browser wait --load networkidle       # 等待下载完成
```

**Anna's Archive 下载约束**：
- 仅从 shadowlibraries.github.io 确认的官方域名下载
- 不下载受版权保护的商业软件或付费内容
- 下载仅用于个人学习和研究目的
- 如果下载需要登录/密钥，跳过并标记 `needs_manual_download`

#### 4.3 课程资源

课程资源不下载视频，仅获取：
- 课程大纲 / 讲义 PDF（如有直接下载链接）
- 开源笔记（GitHub/GitBook 链接记录）
- 其他资源记录 URL 到来源页面，标记 `access: online_only`

```bash
# GitBook/网页资源：截图保存大纲
agent-browser open "https://ranger-nju.gitbook.io/static-program-analysis-book/"
agent-browser wait --load networkidle
agent-browser snapshot > raw/sources/gitbook-nju-outline.md
```

#### 4.4 下载后处理

1. 下载完成后创建来源记录：`raw/sources/<slug>.md`（包含文件路径、元数据）
2. 对大型来源（书籍、长论文）创建来源地图
3. 标记获取状态：
   - `acquired: auto` — 自动下载成功
   - `acquired: manual_needed` — 需要人工获取（如付费内容、需登录）
   - `acquired: online_only` — 仅在线访问（如课程视频）
4. 将文件大小、格式、下载时间写入来源记录

#### 4.5 导入 wiki

1. 按优先级顺序执行 ingest（逐章或逐篇）
2. 遵循大文件增量导入协议
3. 每完成一个来源，更新研究计划中的进度
4. 每完成一篇 ingest，追加 `log.md`

### 阶段五：缺口检测与迭代

1. 导入完成后，LLM 审查 wiki 的知识覆盖：
   - 研究计划中的子主题是否都有对应页面？
   - 是否存在矛盾或不确定的声明？
   - 哪些子主题的页面标记了 `status: needs_review`？
2. 生成缺口报告：`wiki/analyses/<slug>-gaps.md`
3. 对于重大缺口，回到阶段二补充搜索
4. 迭代直到用户满意或研究计划中所有 `high` 优先级来源已导入

### 阶段六：生成研究报告

1. 撰写综合报告：`wiki/analyses/<slug>-report.md`
   - 研究主题概述
   - 已确认的结论（附来源锚点）
   - 存在争议或不确定的结论
   - 知识缺口和建议的下一步
   - 已纳入的来源清单
2. 更新 `index.md`，将报告作为入口点

### 中断恢复

如果研究跨多个会话：

1. 查看 `raw/sources/<slug>.research-plan.md` 了解进度
2. 查看 `raw/sources/<slug>.candidates.md` 了解剩余候选
3. 找到第一个 `status: pending` 的来源继续处理

### 输出结构

```
raw/sources/<slug>.research-plan.md    ← 研究策略
raw/sources/<slug>.candidates.md       ← 候选来源列表
raw/sources/<source-slug>.md           ← 各来源记录
wiki/<type>/<page>.md                  ← 生成的知识页面
wiki/analyses/<slug>-gaps.md           ← 知识缺口报告
wiki/analyses/<slug>-report.md         ← 最终研究报告
log.md                                  ← 研究操作日志
```

### 安全与责任边界

- **版权合规**：不通过自动化手段下载受版权保护的内容。Anna's Archive 等渠道仅用于搜索和元数据获取。
- **人工审核**：除非用户明确允许，否则纳入来源前须经人工确认。
- **质量标记**：自动纳入的来源默认标记 `quality: auto_screened`，与人工选择的 `quality: human_curated` 区分。
- **来源透明**：每条声明必须标注来源，包括搜索渠道和筛选依据。
