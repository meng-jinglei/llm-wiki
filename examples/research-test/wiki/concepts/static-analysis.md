---
title: 静态程序分析
type: concept
sources:
  - raw/sources/spa-moller.md
  - raw/sources/wikipedia-static-analysis.md
  - raw/sources/nju-software-analysis.md
created: 2026-04-29
updated: 2026-04-29
status: stable
---

# 静态程序分析

在不执行程序的情况下分析计算机程序的方法。与动态分析相对——后者在运行时分析程序行为。

## 核心思想

对所有可能的程序输入/路径进行**近似**分析。由于停机问题和 Rice 定理，
精确分析一般不可判定，因此所有静态分析必须在精度和效率之间取舍。

```
具体执行（不可计算） → 抽象解释（可计算近似）
```

## 主要技术

### 数据流分析
基于控制流图 (CFG) 的格论迭代计算。设置数据流方程，迭代求解不动点。
→ [来源: raw/sources/wikipedia-static-analysis.md]

### 抽象解释
统一的理论框架。通过 Galois 连接将具体语义映射到可计算的抽象语义。
所有数据流分析都可视为抽象解释的特例。
→ [来源: raw/sources/wikipedia-static-analysis.md]

### 符号执行
用符号值替代具体输入，推导程序路径上的符号表达式。
用于测试用例生成和错误检测。

### 模型检测
将程序抽象为有限状态模型，自动验证时序逻辑属性。

## 关键概念关系

```
抽象解释（理论框架）
  ├── 数据流分析（格 + 不动点迭代）
  │     ├── 前向分析：可达定义、常量传播
  │     └── 后向分析：活跃变量
  ├── 过程间分析（调用图 + 上下文敏感）
  ├── 指针分析（Andersen / Steensgaard）
  └── IFDS/IDE 框架（过程间有限分布集）
```

## 学习路径

| 阶段 | 内容 | 推荐资源 |
|------|------|---------|
| 入门 | 程序表示 (AST/CFG/SSA) | Møller 第1-2章 |
| 基础 | 格与不动点 | Møller 第4章 |
| 核心 | 数据流分析 | Møller 第5章、南大课程第3-5讲 |
| 进阶 | 抽象解释 | Møller 第10章 |
| 高级 | 过程间分析、指针分析 | 南大课程第6-8讲 |

→ [来源: raw/sources/spa-moller.md] → [来源: raw/sources/nju-software-analysis.md]
