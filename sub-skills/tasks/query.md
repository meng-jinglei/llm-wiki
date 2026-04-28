---
name: query
description: 从维护的 wiki 回答问题，声明来源，提供保存结果选项
---

## query（查询）

当用户询问关于 wiki 的问题时使用。

### 步骤

1. 读取 `index.md`。
2. 搜索相关的 wiki 页面。
3. 首先阅读最佳匹配的页面。
4. 仅当 wiki 缺少证据或需要验证时，才回溯到原始来源。
5. 引用 wiki 页面路径来回答。
6. 如果答案值得保存，提供保存为以下选项：
   - `wiki/analyses/<slug>.md`
   - `wiki/comparisons/<slug>.md`
7. 如果答案揭示了过时或不正确的 wiki 内容，提供刷新受影响页面的选项。

### 输出结构

无文件写入。如用户同意保存，输出至：
```
wiki/analyses/<slug>.md     ← 保存的分析结果
wiki/comparisons/<slug>.md   ← 保存的对比结果
```
