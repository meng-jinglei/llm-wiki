---
title: 静态程序分析入门 — 候选来源
type: candidate_list
research_topic: 静态程序分析入门
created: 2026-04-29
updated: 2026-04-29
status: screening
---

## 候选来源

### high 优先级

| # | 类型 | 标题 | 作者/来源 | URL | 评估 |
|---|------|------|----------|-----|------|
| 1 | 教科书 | Static Program Analysis (免费 PDF) | Anders Møller & Michael I. Schwartzbach (2018) | https://cs.au.dk/~amoeller/spa/ | 现代入门经典，南京大学等课程指定教材。免费！ |
| 2 | 教科书 | Principles of Program Analysis | Nielson, Nielson & Hankin (1999/2005) | Springer | 经典权威参考，覆盖四大方法。arXiv 搜索一致推荐。 |
| 3 | Wikipedia | Static Program Analysis | Wikipedia | https://en.wikipedia.org/wiki/Static_program_analysis | 概念入口，定义+技术分类+工具列表 |
| 4 | Wikipedia | Data-flow analysis | Wikipedia | https://en.wikipedia.org/wiki/Data-flow_analysis | 核心子概念 |
| 5 | Wikipedia | Abstract interpretation | Wikipedia | https://en.wikipedia.org/wiki/Abstract_interpretation | 理论基础 |

### high 优先级（中文补充）

| # | 类型 | 标题 | 作者/来源 | URL | 评估 |
|---|------|------|----------|-----|------|
| 6 | 课程 | 南京大学《软件分析》(16讲) | 李樾, 谭添 (NJU) | http://tai-e.pascal-lab.net/lectures.html | 国内最著名静态分析课程，B站有视频，配套 Tai-e 实验平台 |
| 7 | GitBook | 静态程序分析入门教程 | RangerNJU (开源笔记) | https://ranger-nju.gitbook.io/static-program-analysis-book/ | 基于南大课程的听课笔记，免费开源 |
| 8 | 教材 | 《程序分析原理》(中文版) | Nielson, Nielson, Hankin | https://book.douban.com/subject/35970106/ | 经典教材的中文译本 |

### medium 优先级

| # | 类型 | 标题 | 作者/来源 | URL | 评估 |
|---|------|------|----------|-----|------|
| 6 | 课程 | Static Program Analysis (16讲) | 南京大学 / Tai-e | http://tai-e.pascal-lab.net/en/lectures.html | 理论+实践，含作业 |
| 7 | 论文 | Unveiling the Power of IR for Static Analysis: A Survey | Zhang et al. (2024) | https://arxiv.org/abs/2405.12841 | IR 视角的综述，面向学习者 |
| 8 | 课程 | Designing Code Analyses for Large-Scale Software Systems | Paderborn University (2025/26) | https://www.hni.uni-paderborn.de/sse/lehre/deca1 | 工业级分析 |

### low 优先级（备选）

| # | 类型 | 标题 | 来源 | 评估 |
|---|------|------|------|------|
| 9 | 论文 | Implementing Static Analysis Using LLVM and CodeChecker | Horváth et al. (2024) | 实践教程，过于具体 |
| 10 | 课程 | Selected Methods for Program Analysis | CTU Prague (2025/26) | 覆盖全面但范围较广 |

## 搜索记录

- WebSearch "static program analysis tutorial beginners guide" → 发现 #6, #8
- WebSearch "Wikipedia static analysis dataflow abstract interpretation" → 发现 #3, #4, #5
- WebSearch "arxiv survey static analysis" → 发现 #2 (经典教材), #7 (综述)
- Anna's Archive (agent-browser, annas-archive.gl) → 确认 #2 有 3 个版本
  - 版本 1: Nielson, Nielson, Hankin, Springer-Verlag, 1st ed. 1999, Berlin, 2005
  - 版本 2: Nielson, Nielson, Hankin, Springer Berlin, 1st ed., corr. 2nd print, 2005
  - 版本 3: Nielson, Nielson, Hankin, Springer Berlin Heidelberg, 2005
  - 总计 61 个相关结果（47 本非小说类书籍，37 个 PDF 格式）
  - 域名来源：shadowlibraries.github.io（官方静态页面）
  - ⚠️ annas-archive.li 已被劫持，不使用

## 测试发现

1. **WebFetch 受限**：Wikipedia 和 arXiv 的 WebFetch 均被拒绝（网络策略），WebSearch 作为替代足够
2. **Anna's Archive 域名动态**：必须从 shadowlibraries.github.io 获取最新域名，不能硬编码
3. **agent-browser 可靠性**：对需要交互式搜索的站点（如 AA），agent-browser 是唯一可用方案

## 下一步

- Anna's Archive 搜索 #1 和 #2 的电子版
- 用户确认候选列表后进入 capture 阶段
