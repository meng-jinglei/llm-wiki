---
name: init
description: 在工作空间缺失必需文件和目录时初始化 wiki 工作空间结构
---

## init（初始化）

当工作空间尚未具备所需的工作流文件和目录时使用。

### 步骤

1. 确定工作空间根目录。
2. 验证路径是适合 llm-wiki 结构的本地工作空间。
3. 创建缺失的以下路径：
   - `raw/sources/`
   - `raw/assets/`
   - `wiki/sources/`
   - `wiki/concepts/`
   - `wiki/entities/`
   - `wiki/analyses/`
   - `wiki/comparisons/`
4. 创建或修复：
   - `CLAUDE.md`
   - `index.md`
   - `log.md`
   - `wiki/overview.md`
5. 报告所有触及的路径。

### 输出结构

```
<workspace-root>/
├── CLAUDE.md
├── index.md
├── log.md
├── raw/
│   ├── sources/
│   └── assets/
└── wiki/
    ├── overview.md
    ├── sources/
    ├── concepts/
    ├── entities/
    ├── analyses/
    └── comparisons/
```
