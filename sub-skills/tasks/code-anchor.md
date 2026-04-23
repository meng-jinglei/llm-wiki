---
name: code-anchor
description: Bidirectional binding between source code files and wiki knowledge pages.
---

## code-anchor

Use when the user points to a source file and wants wiki knowledge about it,
or when the user points to a wiki page and wants to know which source code uses it.

Examples:
- "What does the clock_config.c file configure? What manual section covers it?"
- "I want to link the PWM wiki page to the actual code that uses it"

This workflow binds source code and wiki knowledge bidirectionally.

### Steps

1. Read the target source file or wiki page.
2. Identify the key symbols, registers, peripherals, or concepts it references.
3. For each identified element:
   a. Find or create the corresponding `wiki/peripherals/<name>.md` or `wiki/concepts/<name>.md`.
   b. Add a code snippet block with file path and line reference.
   c. Add a manual anchor: `→ [Source: RA4M2_manual.pdf, p.512]`.
   d. Add a back-reference: in the source file, append a comment line pointing to the wiki page.
4. Update `wiki/overview.md` if the project map needs refreshing.
5. Log the anchor operation to `log.md`.

Key principle: the wiki page knows which code uses it, and the code knows which wiki page explains it.

### 输出结构

```
wiki/<type>/<name>.md        ← 添加了代码片段块和源码锚点
<source-file>.c/.h           ← 添加了 wiki 回指注释 /* → wiki/... */
log.md                        ← code-anchor 记录
```