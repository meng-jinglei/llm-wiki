---
name: code-anchor
description: 在源代码文件和 wiki 知识页面之间建立双向绑定
---

## code-anchor（代码锚点）

当用户指向一个源文件并希望了解 wiki 相关知识，
或指向一个 wiki 页面并希望了解哪些源代码使用了它时使用。

示例：
- "clock_config.c 文件配置了什么？哪个手册章节涉及它？"
- "我想把 PWM wiki 页面链接到实际使用它的代码"

此工作流将源代码和 wiki 知识双向绑定。

### 步骤

1. 读取目标源文件或 wiki 页面。
2. 识别其引用的关键符号、寄存器、外设或概念。
3. 对每个识别出的元素：
   a. 查找或创建对应的 `wiki/peripherals/<name>.md` 或 `wiki/concepts/<name>.md`。
   b. 添加带文件路径和行号引用的代码片段块。
   c. 添加手册锚点：`→ [来源: RA4M2_manual.pdf, 第512页]`。
   d. 添加反向引用：在源文件中追加指向 wiki 页面的注释行。
4. 如果项目地图需要刷新，更新 `wiki/overview.md`。
5. 将锚点操作记录到 `log.md`。

核心原则：wiki 页面知道哪些代码使用了它，代码也知道哪个 wiki 页面解释了它。

### 输出结构

```
wiki/<type>/<name>.md        ← 添加了代码片段块和源码锚点
<source-file>.c/.h           ← 添加了 wiki 回指注释 /* → wiki/... */
log.md                        ← code-anchor 记录
```
