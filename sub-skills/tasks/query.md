---
name: query
description: Answer a question from the maintained wiki, declare sources, offer to save results.
---

## query

Use when the user asks a question about the wiki.

### Steps

1. Read `index.md`.
2. Search for relevant wiki pages.
3. Read the best matching pages first.
4. Return to raw sources only when the wiki is missing evidence or needs verification.
5. Answer with references to wiki page paths.
6. If the answer seems worth keeping, offer to save it as:
   - `wiki/analyses/<slug>.md`
   - `wiki/comparisons/<slug>.md`
7. If the answer reveals outdated or incorrect wiki content, offer to refresh the affected pages.

### 输出结构

无文件写入。如用户同意保存，输出至：
```
wiki/analyses/<slug>.md     ← 保存的分析结果
wiki/comparisons/<slug>.md   ← 保存的对比结果
```