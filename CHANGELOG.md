# Changelog

## [Unreleased]

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
