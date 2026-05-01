---
title: 静态程序分析入门 — 研究计划
type: research_plan
topic: 静态程序分析入门
scope: 广度优先入门概览
created: 2026-04-29
status: active
---

## 研究范围

- **包含**：静态分析基本概念（数据流分析、抽象解释、符号执行）、经典算法、代表性工具、与动态分析/形式验证的区别
- **不包含**：具体编译器实现细节、LLVM pass 编写教程、硬件验证
- **深度**：入门概览——建立领域认知地图，不求深入某一子领域
- **来源偏好**：Wikipedia > 知名教程 > 经典教材章节 > 学术综述 > 技术博客
- **时间范围**：经典材料为主，辅以近年综述

## 搜索策略

| 渠道 | 关键词 | 预期产出 |
|------|--------|---------|
| Wikipedia | "Static program analysis" | 概念入门页 |
| arXiv | "static analysis survey" | 综述论文 |
| Anna's Archive | "Principles of Program Analysis" | 经典教材 |
| 网页搜索 | "static analysis tutorial beginners" | 知名教程 |
| GitHub | 不适用 | 跳过 |

## 预期 Wiki 结构

```
wiki/
├── concepts/
│   ├── static-analysis.md          ← 主概念页
│   ├── dataflow-analysis.md        ← 数据流分析
│   ├── abstract-interpretation.md  ← 抽象解释
│   └── symbolic-execution.md       ← 符号执行
├── entities/
│   ├── tools-overview.md           ← 代表性工具
│   └── classics-papers.md          ← 经典论文清单
└── comparisons/
    └── static-vs-dynamic.md        ← 静态 vs 动态分析
```

## 进度

- **task_status: phase_1_complete → next: phase_2_search (pending)**
