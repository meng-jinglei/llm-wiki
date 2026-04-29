---
name: graph
description: 知识图谱分析——构建关系图、社区检测、图谱洞察、图增强查询
---

## graph（知识图谱）

当用户希望了解 wiki 的关系结构、发现知识聚类或图谱洞察时使用。

示例：
- "分析 wiki 的结构"
- "哪些页面是枢纽节点？"
- "wiki 中有哪些知识聚类？"
- "有没有孤立的知识页面？"

### 步骤

#### 1. 构建图谱

```bash
uv run --with networkx python sub-skills/tools/build-graph.py wiki/ --format json
```

读取 JSON 输出，理解图结构。

#### 2. 呈现图谱分析

按以下结构组织输出：

##### 统计概览

```
节点: 42 | 边: 87 | 密度: 0.05 | 连通分量: 3
```

##### 社区结构

列出检测到的知识聚类，按大小降序：

```
[社区 0] 大小=12 凝聚度=0.45 代表: concepts/clock.md
  - entities/wdt.md
  - entities/timer.md
  - concepts/clock.md
  ...

[社区 1] 大小=8 凝聚度=0.12 [SPARSE] 代表: concepts/uart.md
  ...
```

##### 图谱洞察

**桥接节点**（连接 3+ 社区的枢纽页面）：
- 这些是关键整合页面——更新时影响最大
- 建议优先确保这些页面的声明完整

**孤立页面**（度 ≤ 1）：
- 可能缺少交叉引用，或属于小众主题
- 建议检查是否有遗漏的 [[wikilinks]]

**稀疏社区**（凝聚度 < 0.15，≥ 3 页）：
- 知识领域内部交叉引用不足
- 建议补充页面间的 [[wikilinks]]

**意外连接**（跨社区 + 跨类型 + 弱关联）：
- 可能揭示非显而易见的关联
- 值得进一步探索的交叉领域

#### 3. 图增强查询（query 集成时使用）

当用户问题涉及关系查询（"X 依赖什么？"、"哪些外设共享时钟？"）：

1. 从查询主题找到对应节点
2. 做 2-hop 图遍历（直接邻居 + 邻居的邻居）
3. 将遍历到的相关页面纳入 query 的渐进式加载 R2

图遍历提供的关系脉络是纯文本搜索无法获取的。

#### 4. 图导出

```bash
uv run --with networkx python sub-skills/tools/build-graph.py wiki/ --output wiki/_compiled/graph.gexf
```

GEXF 格式可用 Gephi 等工具可视化（可选）。

### 社区检测说明

Louvain 算法基于图的链接拓扑自动发现知识聚类——独立于预定义的页面类型（entity/concept/source）。
这意味着同一个聚类可能包含不同类型的页面，反映的是实际的知识关联而非人为分类。

### 限制

- 图谱质量取决于 [[wikilinks]] 的密度——稀疏链接的 wiki 产出的图分析价值有限
- 社区检测是启发式算法，不同运行可能产生略微不同的分区
- 图分析不修改任何文件——仅报告

### 输出结构

```
wiki/_compiled/graph.gexf        ← 可选：GEXF 导出
log.md                            ← graph 操作记录
```
