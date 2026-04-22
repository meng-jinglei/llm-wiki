# llm-wiki

[English](README.md) · [简体中文](README.zh-CN.md)

一个用于在本地 Markdown 工作区中运行 **skill-first 知识沉淀工作流** 的 Claude Code skill。

`llm-wiki` 不把每次提问都当作一次新的临时检索，而是帮助 Claude 持续维护一个可积累的 Markdown wiki：

- 原始来源保持可追溯
- wiki 页面优先被更新，而不是不断重建
- 有价值的回答可以回写到工作区
- 人类始终保留纠错、刷新和重组 wiki 的权利

## 这个仓库是什么

这个仓库是一个 **skill 协议仓库**，不是独立的 runtime 应用。

它包含：

- `SKILL.md` — 可发布的 Claude Code skill 文件
- `docs/` — filesystem-first 工作流说明、可选的 Obsidian 集成说明与使用示例
- `templates/` — 初始化工作区时使用的协议文件与页面模板
- `examples/` — 一个 starter workspace 示例，用来展示目标结构

## 核心模型

`llm-wiki` 依赖三层结构：

1. **Raw layer** — `raw/` 下的来源与附件
2. **Wiki layer** — `wiki/` 下的维护型知识页
3. **Schema layer** — `CLAUDE.md` 与 skill 本身定义的规则

目标是让 wiki 成为一个会持续复利的知识中间层，而不是一次性摘要的堆积。

## 主工作流

v1 对外暴露以下主要动作：

- `init` — 初始化或修复工作区结构与核心协议文件
- `capture` — 将 URL、文件或粘贴文本保存到 raw layer
- `ingest` — 将一个 source 沉淀为 wiki 更新
- `query` — 优先从 wiki 回答，并在需要时回写有价值结果
- `review` — 检查矛盾、漂移、过时信息和缺失链接
- `curate` — 在人工主导下执行合并、拆分、重命名和结构整理

## 工作流原则

- `raw/` 在 capture 后保持不可变
- 优先更新已有页面，而不是制造近重复页
- 优先从 wiki 回答，而不是总回原始来源
- 冲突应显式暴露，而不是被静默抹平
- 人类纠错是一级能力，不是例外情况
- 重要动作都应在 `log.md` 中留下记录
- `index.md` 只做轻入口，不做无限膨胀的大总表

## 安装

将 skill 复制到你的 Claude Code skills 目录：

```bash
mkdir -p ~/.claude/skills/llm-wiki
cp SKILL.md ~/.claude/skills/llm-wiki/SKILL.md
```

或者直接把这个仓库 clone 到你的 skills 目录：

```bash
git clone https://github.com/meng-jinglei/llm-wiki.git ~/.claude/skills/llm-wiki
```

## Filesystem-first 工作方式

这个 skill 默认直接工作在普通本地 Markdown 工作区上。

- 优先使用直接文件系统读写，保证稳定性
- 在 workspace root 下维护 llm-wiki 约定的目录结构
- 报告重要文件操作时使用 workspace-relative path
- Obsidian 是可选增强，不是前提依赖

## 可选的 Obsidian 集成

如果你本来就在使用 Obsidian，它可以作为同一工作区的一个方便界面，用于浏览、搜索和导航。

- Obsidian CLI 是可选增强，不是强依赖
- 当 CLI 不可用时，回退到文件搜索
- 只有在用户明确要求时，才执行 GUI 打开动作

详细说明见 [docs/obsidian-setup.md](docs/obsidian-setup.md)，使用示例见 [docs/usage-examples.md](docs/usage-examples.md)。

## 仓库结构

```text
llm-wiki/
├── SKILL.md
├── README.md
├── README.zh-CN.md
├── docs/
│   └── obsidian-setup.md
├── templates/
│   ├── index.md
│   ├── log.md
│   ├── page-template.md
│   └── vault-CLAUDE.md
└── examples/
    └── starter-vault/
        ├── CLAUDE.md
        ├── index.md
        ├── log.md
        └── wiki/
            └── overview.md
```

## templates 和 examples 的区别

- `templates/` 包含初始化时使用的可复用协议文件与页面模板
- `examples/` 包含一个供人阅读和参考的 starter workspace 示例

## 依赖要求

- Claude Code
- 一个本地 Markdown 工作区

## License

MIT
