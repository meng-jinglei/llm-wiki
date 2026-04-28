# llm-wiki

一个在本地 Markdown 工作区运行的 **技能优先知识工作流**。

不把每次提问当作从零检索，而是让 Claude 持续维护一个可积累的 wiki：原始来源可追溯，wiki 页面不断被更新和复用，有价值的回答可以写回工作区。

**核心能力：** 知识编译 — 来源一次被摄入为结构化 wiki，后续查询基于编译产物而非原始文档检索。

## 项目结构

```
llm-wiki/
├── SKILL.md              # 技能定义（产品本身）
├── ARCHITECTURE.md        # 设计原理
├── ROADMAP.md             # 发展方向
├── CHANGELOG.md           # 版本记录
├── CONTRIBUTING.md        # 贡献指南
├── sub-skills/            # 模块化工作流
│   ├── tasks/             # 核心任务（init/capture/ingest/query/...)
│   └── tools/             # 外部工具集成（map-document/index-codebase）
├── templates/             # 工作空间初始化模板
└── examples/              # 示例工作区
```

## 安装

```bash
mkdir -p ~/.claude/skills/llm-wiki
git clone https://github.com/meng-jinglei/llm-wiki.git ~/.claude/skills/llm-wiki
```

## 使用方式

在 Claude Code 中直接告诉它要做什么：

| 你说 | Claude 做 |
|------|----------|
| `/llm-wiki 帮我对这个项目进行wiki化` | `project-init` — 扫描项目，搭建 raw/wiki 骨架 |
| `/llm-wiki 把这份手册建档` | `ingest` — 提取知识，更新 wiki 页面 |
| `/llm-wiki 问个问题` | `query` — 从 wiki 回答，声明来源 |
| `/llm-wiki 检查一下wiki一致性` | `review` — 9 项健康检查 |
| `/llm-wiki 编译验证` | `compile` — 三阶段编译检查（即将实现） |
| `/llm-wiki 帮我绑定代码和手册` | `code-anchor` — 双向绑定源码与 wiki |
| `/llm-wiki 画出手册结构` | `map-document` — 提取 PDF 大纲 |
| `/llm-wiki 索引这个代码目录` | `index-codebase` — 生成符号地图 |

## 核心原则

- `raw/` 在捕获后不可变 — 所有知识有可追溯的来源锚点
- 优先更新已有 wiki 页面，不造近似重复页
- 矛盾必须显式暴露，不静默抹平
- 人类纠错是一等工作流
- 每次摄入后建议运行编译验证

## 依赖

- Claude Code
- `uv`（`curl -LsSf https://astral.sh/uv/install.sh | sh`）
- `tree-sitter-languages`（通过 `uv run --with tree-sitter-languages` 自动安装）

## Obsidian 集成（可选）

Obsidian 是可选的浏览和导航层，不是先决条件。

用 Obsidian 打开 wiki 工作目录作为 vault 即可获得图形化的反向链接、图谱导航和搜索界面。可选启用 Obsidian CLI 增强搜索能力。

推荐设置：`Settings → Files & Links → Attachment folder path` 设为 `raw/assets`。

## License

MIT
