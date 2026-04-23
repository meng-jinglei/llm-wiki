# llm-wiki

一个在本地 Markdown 工作区运行的 **skill-first 知识沉淀工作流**。

不把每次提问当作从零检索，而是让 Claude 持续维护一个可积累的 wiki：原始来源可追溯，wiki 页面不断被更新和复用，有价值的回答可以写回工作区。

## 使用方式

在 Claude Code 中直接告诉它要做什么：

| 你说 | Claude 做 |
|------|----------|
| `/llm-wiki 帮我对这个项目进行wiki化` | `project-init` — 扫描项目，搭建 raw/wiki 骨架 |
| `/llm-wiki 把这份手册建档` | `ingest` — 提取知识，更新 wiki 页面 |
| `/llm-wiki 问个问题` | `query` — 从 wiki 回答，声明来源 |
| `/llm-wiki 检查一下wiki一致性` | `review` — 9 项健康检查 |
| `/llm-wiki 帮我绑定代码和手册` | `code-anchor` — 双向绑定源码与 wiki |
| `/llm-wiki 画出手册结构` | `map-document` — 提取 PDF 大纲 |
| `/llm-wiki 索引这个代码目录` | `index-codebase` — 生成符号地图 |

## 安装

```bash
mkdir -p ~/.claude/skills/llm-wiki
git clone https://github.com/meng-jinglei/llm-wiki.git ~/.claude/skills/llm-wiki
```

## 核心原则

- `raw/` 在 capture 后不可变
- 优先更新已有 wiki 页面，不造近重复页
- 冲突必须显式暴露，不静默抹平
- 人类纠错是一级能力

## 仓库结构

```
llm-wiki/
├── SKILL.md              ← Skill 入口
├── CHANGELOG.md
├── README.md
├── docs/                 ← 使用示例
├── templates/            ← 初始化用的协议文件
├── examples/             ← 示例工作区
└── sub-skills/           ← 工作流正文
    ├── tasks/            ← 8 个工作流任务
    └── tools/            ← 工具脚本
```

## 依赖

- Claude Code
- `uv`（`curl -LsSf https://astral.sh/uv/install.sh | sh`）
- `tree-sitter-languages`（通过 `uv run --with tree-sitter-languages` 自动安装）

## License

MIT
