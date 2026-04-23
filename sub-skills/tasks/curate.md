---
name: curate
description: Human-led restructuring — merge, split, rename, reorganize wiki pages.
---

## curate

Use when the user wants human-led restructuring or refinement.

Examples:
- merge duplicate pages
- split overly large pages
- rename pages
- reorganize topic structure
- rewrite a summary or overview page
- refresh a page that the user says is wrong or outdated

### Steps

1. Read the target pages and nearby context.
2. Explain the proposed structural change if it is non-trivial.
3. Apply the smallest coherent set of edits.
4. Update `index.md` and links if needed.
5. Append a curation or correction entry to `log.md`.
6. Report all touched paths.

### 输出结构

```
<修改的页面>                ← 合并/拆分/重命名后的页面
index.md                    ← 链接更新（如有必要）
log.md                      ← curation 记录
```