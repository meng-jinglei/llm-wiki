---
title: 静态程序分析 — Wikipedia 概念框架
type: source
source_type: encyclopedia
url: https://en.wikipedia.org/wiki/Static_program_analysis
language: en (中文版存在)
captured: 2026-04-29
quality: high
screened: confirmed
---

# 静态程序分析概念框架 (via Wikipedia)

通过 WebSearch 获取的 Wikipedia 内容摘要。

## 核心定义

静态程序分析是在不执行程序的情况下分析计算机程序的方法，与运行动态分析相对。

## 技术分类

| 技术 | 说明 |
|------|------|
| **抽象解释** | 建模每条语句对抽象机器状态的影响，可靠但过度近似 |
| **数据流分析** | 基于格的迭代不动点计算，收集可能值集合信息 |
| **Hoare 逻辑** | 程序正确性推理的逻辑规则系统 |
| **模型检测** | 适用于有限状态系统的自动化验证 |
| **符号执行** | 推导表示代码点变量值的数学表达式 |

## 形式化基础

- 一般不可判定（归约为停机问题 / Rice 定理）
- 所有分析必须近似
- 抽象解释提供可靠性框架

## 关系链

```
静态程序分析 (Umbrella)
  ├── 数据流分析 (具体技术)
  │     └── 基于 CFG + 格 + 不动点迭代
  ├── 抽象解释 (理论框架)
  │     └── 具体语义 → 抽象语义 (Galois 连接)
  ├── 符号执行
  └── 模型检测
```

→ [来源: Wikipedia "Static program analysis" (via WebSearch, 2026-04-29)]
→ [来源: Wikipedia "Data-flow analysis"]
→ [来源: Wikipedia "Abstract interpretation"]
