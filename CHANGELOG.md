# Changelog

## [2.0-novelist] — Unreleased (llm-wiki-novelist 分支)

### Changed (2026-05-01)
- **项目结构重组（参照 AutoPku 三层分离式架构）**
  - SKILL.md 精简：913 → 256 行，提取协议到 `sub-skills/protocols/`
  - 新建 `sub-skills/protocols/large-file-protocol.md` — 大文件处理 + 来源地图 + 增量导入
  - 新建 `sub-skills/protocols/download-pipeline.md` — 网文下载 9 步管线
  - ROADMAP.md 更新为 novelist 版
  - CLAUDE.md 新增会话恢复协议（结构化恢复流程）
  - .gitignore 新增 `__pycache__/`、`raw/.tmp/`、`tmp/`
  - 清理：5 个废弃 worktrees、`__pycache__/`、`--output` 文件、`tmp/` 目录统一到 `raw/.tmp/`

### Added
- **novelist 分支创建** — 从 main 分出的网文写作特化分支
- **SKILL.md novelist 版** — 基于 llm-wiki，扩展文风研究 + 长篇创作工作流
- **八个文风维度定义** — 句法肌理、词汇光谱、叙事节奏、氛围质地、场景生态、套路指纹、对话纹理、AI 负空间
- **候选网文矩阵** — 14 部候选作品（起点 + SF），含代表性评分和 Phase 1 推荐
- **novelist 扩展工作流**：style-analyze、style-profile、chapter-write、continuity-check、plot-track、character-manage、timeline-sync
- **开发规划文档** — 架构设计、路线图、研究笔记、候选矩阵
- **writing-style wiki 工作空间** — 文风研究专用 llm-wiki vault
- **实战验证的下载管线** — Anna's Archive 搜索 → opencli browser 提取直链 → curl 下载（已验证两部小说）
- **style-analyze.md 工作流文件** — 五阶段文风分析管线，阶段间硬性门控，wiki ingest 不可跳过
- **style-profile.md 工作流文件** — 文风文件编译工作流，硬前置条件检查（wiki 不完整则拒绝生成）

### Changed
- `.planning/` 从 .gitignore 移除（novelist 分支中追踪开发规划）
- README 新增分支说明
- CLAUDE.md 新增临时文件管理规则、opencli 下载方案
- SKILL.md 网文下载章节更新为实战验证的完整管线
- **方法论强制化** — wiki 化改为 profile 生成硬前置条件。诡秘之主实战验证了"跳过 wiki = profile 无价值"
- **ROADMAP 新增 Phase 1.5** — 网文作者基础能力研究（注水手法、章节经济学、微快感曲线）
- **方法论文档新增"为什么 Wiki Ingest 不可跳过"** — 用诡秘之主作为反面案例

### Captured
- `raw/assets/斗破苍穹.txt` (11MB, 532万字) — Anna's Archive / DuXiu
- `raw/assets/诡秘之主.txt` (9MB, 446万字) — Anna's Archive / DuXiu

## [Unreleased] (main 分支)

## [1.3] — 2026-04-29

### Added
- **research 工作流** — 自动研究：多渠道搜索、中英文双语、质量筛选、agent-browser 自动下载、缺口检测与迭代
  - Anna's Archive 集成：动态域名查找（shadowlibraries.github.io）+ agent-browser 搜索与下载
  - 安全下载渠道：arXiv、作者主页、GitHub Releases、机构仓库
- **query 强化（Phase 3 完成）**：
  - 意图路由：自动判断事实/关系/对比/因果/探索五类意图
  - 渐进式加载：R1(index)→R2(frontmatter)→R3(声明)→R4(全文)，上下文预算控制
  - query→compile 反馈闭环：新发现矛盾自动写回编译报告
  - 声明质量感知：区分 derived/direct、auto_screened/human_curated
- **nashsu/llm_wiki wiki 化分析**：对 nashsu 项目完成 project-init + capture + ingest，产出 8 个 wiki 页面 + 对比分析

### Changed
- **ROADMAP Phase 3 标记为完成** — query 从"搜索"进化为"推理"
- **思考语言** — CLAUDE.md 声明 thinking 阶段使用中文
- **中英文双语搜索强制** — research 工作流要求每个主题用中英文各搜一次
- **query 输出更新** — 新增写回 compile 报告的路径

## [1.1] — 2026-04-27

### Changed
- **全中文化** — SKILL.md 和 sub-skills/ 下 10 个文件全部翻译为中文
- **语言声明** — CLAUDE.md 首行声明"语言：中文"
- **项目结构优化** — 参考薄应用层原则重组根目录：
  - 新增 `ARCHITECTURE.md`（设计原理）
  - 新增 `CONTRIBUTING.md`（贡献指南）
  - 新增 `LICENSE`（MIT）
  - 精简 `CLAUDE.md` 至 ~30 行
  - 移除 `docs/`（内容合并入 README）
  - 移除 `.planning/`（归入 .gitignore）
- **ROADMAP 更新** — Phase 2 聚焦知识编译管线（compile 工作流 + 关键声明约定）

## [1.0] — 2026-04-23

### Added
- **意图路由表** — 自然语言用户意图在工作流表格中映射到工作流名称
- **配置章节** — Claude Code 权限设置、本地配置覆盖、依赖表、Windows 注意事项
- **安全规则** — 五条规则：raw 不可变、不静默丢失信息、不无确认删除、不暴露敏感内容、人类修正优先
- **输出结构** — 每个工作流记录其输出文件树
- **Sub-skills 索引** — `sub-skills/` 包含 `tasks/`（8 个工作流任务文件）、`tools/`（map-document、index-codebase）、`runtime/`（保留）

### Changed
- **SKILL.md 瘦身** — 工作流正文移至 `sub-skills/tasks/*.md`，SKILL.md 仅作索引和路由
- **目录结构** — `sub-skills/` 替代扁平 `subskills/`

### Fixed
- **Windows Edit 工具** — 记录非 ASCII old_string 导致 Edit 静默失败的处理方法

## [0.1.0] — 2026-04-22

### Added
- 初始技能发布：`init`、`capture`、`ingest`、`query`、`review`、`curate`、`project-init`、`code-anchor`
- 大文件协议及来源地图支持（`explicit_toc`、`inferred_structure`、`coarse_map`）
- `map-document` 和 `index-codebase` 工具工作流
- 模板、示例 vault、项目协议文件
