# llm-wiki

一个 Claude Code skill，用于在你的 Obsidian vault 中构建和维护 LLM 驱动的 wiki。

它遵循 LLM Wiki 模式：原始资料保持不可变，LLM 负责维护结构化 wiki 页面，并且回答结果也可以回写到 vault 中，让知识随着使用不断积累。

## 这个仓库包含什么

- `SKILL.md` — 可发布的 Claude Code skill 文件
- `docs/` — 面向用户的配置与使用文档
- `templates/` — skill 初始化 vault wiki 时可使用的模板文件
- `examples/` — 一个 starter vault 示例，用来展示目标输出结构

## 安装

将 skill 复制到你的 Claude Code skills 目录：

```bash
cp SKILL.md ~/.claude/skills/llm-wiki/SKILL.md
```

或者直接把这个仓库 clone 到你的 skills 目录：

```bash
git clone https://github.com/meng-jinglei/llm-wiki.git ~/.claude/skills/llm-wiki
```

## 这个 skill 可以做什么

这个 skill 支持以下工作流：

- `init` — 在 Obsidian vault 中初始化 wiki 结构
- `clip` — 将网页内容抓取到 `raw/sources/`
- `ingest` — 把来源资料转化为结构化 wiki 页面
- `query` — 基于已经积累的 wiki 内容回答问题
- `lint` — 检查 wiki 中的矛盾、过时信息和维护问题
- `browse` — 在 Obsidian 中打开目标页面

## Obsidian 集成

这个 skill 设计为在 Obsidian vault 中工作。

- 优先使用直接文件系统读写，以保证稳定性
- 当 Obsidian CLI 可用时，优先使用 `obsidian search`
- 当 CLI 不可用时，回退到文件搜索
- 只有在用户明确要求时，才执行 GUI 打开动作

详细配置说明见 [docs/obsidian-setup.md](docs/obsidian-setup.md)。

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

- `templates/` 包含 skill 初始化时可复用的模板输入
- `examples/` 包含一个供人阅读和参考的示例结果

## 依赖要求

- Claude Code
- Obsidian
- 一个 Obsidian vault

## License

MIT
