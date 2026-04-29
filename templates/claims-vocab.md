---
title: Claims 谓词词汇表模板
type: reference
created: 2026-04-29
---

# Claims 谓词词汇表

注意：每个项目的词汇表**不同**。不要直接使用此文件——compile 会自动生成项目专属词汇表。

## 使用方式

### 自动生成（推荐）

```bash
uv run python sub-skills/tools/parse-claims.py wiki/ --gen-vocab wiki/_compiled/vocab.txt
```

此命令扫描所有 wiki 页面，提取已使用的谓词，生成项目专属词汇表。

### 词汇表检查

```bash
uv run python sub-skills/tools/parse-claims.py wiki/ --vocab wiki/_compiled/vocab.txt
```

检查是否有页面使用了词汇表中未注册的谓词。compile 阶段二自动执行此检查。

### 添加新谓词

当需要表达词汇表无法覆盖的声明时：
1. 在页面 claims 中使用新谓词
2. 重新运行 `--gen-vocab` 更新词汇表
3. compile 报告会提示"词汇表已更新"（INFO）

### 词汇表格式

每行一个谓词名，`#` 后为自动生成的注释：

```
channel  # 4 uses
clock_source  # 3 uses
...
```

词汇表存放在 `wiki/_compiled/vocab.txt`（项目内路径，不推送到 skill 仓库）。
