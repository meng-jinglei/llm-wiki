# llm-wiki

在本地 Markdown 工作空间中运行**技能优先的知识工作流**。

不把每次提问当作从零检索，而是让 Claude 持续维护一个可积累的 wiki：原始来源可追溯，wiki 页面不断被更新和复用，有价值的回答可以写回工作区。

**核心思想：知识编译 > 知识检索。** 传统 RAG 相当于解释器——每次查询重新从原始文档发现知识。llm-wiki 相当于编译器——来源一次摄入为结构化 wiki，后续查询基于编译产物，不重复推导。

## 项目结构

```
llm-wiki/
├── SKILL.md                  # 技能定义（产品本身）
├── ARCHITECTURE.md           # 设计原理
├── ROADMAP.md                # 发展方向与版本规划
├── CHANGELOG.md              # 版本记录
├── CONTRIBUTING.md           # 贡献指南
├── sub-skills/
│   ├── tasks/                # 核心工作流（13 个）
│   │   ├── init.md           #   初始化空工作空间
│   │   ├── project-init.md   #   为现有项目搭建 wiki 骨架
│   │   ├── capture.md        #   捕获 URL/文件/文本到 raw 层
│   │   ├── ingest.md         #   将来源导入 wiki
│   │   ├── query.md          #   意图路由 + 渐进式加载 + 交叉验证
│   │   ├── research.md       #   自动多渠道搜索 + 质量筛选 + 下载
│   │   ├── sync.md           #   增量同步 + 声明 diff + 过时标记
│   │   ├── compile.md        #   三阶段编译验证
│   │   ├── review.md         #   9 项健康检查
│   │   ├── curate.md         #   人工主导的重组优化
│   │   ├── code-anchor.md    #   源码与 wiki 双向绑定
│   │   └── graph.md          #   知识图谱构建 + 社区检测
│   └── tools/                # 外部工具与脚本
│       ├── map-document.md   #   PDF/DOCX/PPTX 大纲提取
│       ├── index-codebase.md #   C/C++ AST 符号索引
│       ├── parse-claims.py   #   声明解析 + 矛盾检测 + diff
│       ├── build-graph.py    #   知识图谱构建 + Louvain 社区检测
│       └── run-datalog.py    #   Datalog 演绎推理引擎
├── templates/                # 工作空间初始化模板
│   ├── vault-CLAUDE.md       #   项目级 CLAUDE.md 模板
│   ├── page-template.md      #   wiki 页面模板（含 claims 代码块）
│   ├── claims-format-spec.md #   claims 结构化格式规范
│   ├── claims-vocab.md       #   词汇表（谓词+实体名双重约束）
│   └── ...
└── examples/                 # 示例工作区
```

## 安装

```bash
mkdir -p ~/.claude/skills/llm-wiki
git clone https://github.com/meng-jinglei/llm-wiki.git ~/.claude/skills/llm-wiki
```

## 使用方式

在 Claude Code 中直接用自然语言描述意图，技能自动匹配对应工作流：

| 你说 | Claude 做 | 工作流 |
|------|----------|--------|
| "初始化这个项目的 wiki" | 扫描项目，搭建 raw/wiki 骨架 | `project-init` |
| "把这份手册建档" | 保存到 raw 层，记录元数据 | `capture` |
| "把这份文档消化进 wiki" | 提取知识，更新 wiki 页面 | `ingest` |
| "wiki 里怎么说的？" | 意图路由、渐进式加载、声明交叉验证 | `query` |
| "帮我研究一个主题" | 自动搜索、质量筛选、下载、导入 | `research` |
| "来源更新了，检查同步状态" | 增量同步、受影响页面定位、过时标记 | `sync` |
| "检查 wiki 一致性" | 9 项健康检查，CRITICAL/WARN/INFO | `review` |
| "编译验证" | 三阶段编译检查 — 来源覆盖、声明完整性、矛盾检测 | `compile` |
| "合并这两个页面" | 重组结构，保留关联 | `curate` |
| "帮我绑定代码和手册" | 源码与 wiki 双向绑定 | `code-anchor` |
| "画出手册结构" | 提取 PDF/DOCX/PPTX 大纲 | `map-document` |
| "索引这个代码目录" | 生成 C/C++ 符号地图 | `index-codebase` |
| "分析 wiki 的知识图谱" | 图构建 + 社区检测 + 洞察报告 | `graph` |

歧义请求默认选择最窄的匹配工作流。

## 核心原则

- **三层架构：** `raw/`（不可变来源）→ `wiki/`（编译后知识）→ 编译报告（只读诊断）
- **来源不可变：** `raw/` 在捕获后不可修改，所有知识有可追溯的来源锚点
- **声明层约定：** wiki 页面可包含 `## 关键声明` 区块或 ` ```claims` 代码块，用结构化格式表达原子化事实，每条声明以 `→ [来源: ...]` 结尾
- **编译验证：** 三阶段检查 — 来源覆盖进度、声明完整性（claims 解析器机械验证）、矛盾检测（按谓词+主体分组）
- **知识图谱：** 4 信号关系模型（wikilink/来源重叠/声明关联/类型亲和）+ Louvain 社区检测
- **Datalog 推理：** derived 规则执行 + 变量绑定冲突检测 + 推导链追溯
- **优先更新已有页面**，不造近似重复页
- **矛盾必须显式暴露**，不静默抹平
- **人类纠错是一等工作流**

## 依赖

| 工具 | 用途 | 安装 |
|------|------|------|
| Claude Code | 运行环境 | — |
| `uv` | Python 依赖隔离 | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| `tree-sitter-languages` | C/C++ AST 解析（index-codebase） | `uv run --with tree-sitter-languages` |
| `pdfplumber` | PDF 结构提取（map-document） | `uv run --with pdfplumber` |
| `PyPDF2` | PDF 解析备用 | `uv run --with PyPDF2` |
| `python-docx` | DOCX 解析（map-document） | `uv run --with python-docx` |
| `python-pptx` | PPTX 解析（map-document） | `uv run --with python-pptx` |

`parse-claims.py`、`build-graph.py`、`run-datalog.py` 使用 Python 标准库，无额外依赖。

## Obsidian 集成（可选）

Obsidian 是可选的浏览和导航层，不是先决条件。

用 Obsidian 打开 wiki 工作目录作为 vault 即可获得图形化的反向链接、图谱导航和搜索界面。推荐设置：`Settings → Files & Links → Attachment folder path` 设为 `raw/assets`。

## License

MIT
