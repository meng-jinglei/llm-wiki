---
title: Claims 代码块格式规范
type: spec
created: 2026-04-29
updated: 2026-04-29
---

# Claims 代码块格式规范

声明格式从列表升级为结构化 claims 代码块，支持机械解析和 Datalog 推理。

## 为什么改

旧格式（列表）：
```markdown
- 时钟源: PCLKB → [来源: R7F0C014_manual, p.134]
- 分频比: 1/256 (默认) → [来源: R7F0C014_manual, p.512]
```

问题：编译器无法可靠解析声明结构——主题和值混在自然语言中，
来源锚点可能出现在任意位置。

新格式（claims 代码块）：
```markdown
## 关键声明

```claims
clock_source(periph: WDT, source: PCLKB) %% → [来源: R7F0C014_manual, p.134]
divider(periph: WDT, value: 256, default: true) %% → [来源: R7F0C014_manual, p.512]
```
```

优势：
- 每条声明是结构化的谓词表达式，可直接解析为 SPO 三元组
- `%%` 明确分隔声明本体和来源锚点，解析器不会混淆
- 兼容旧格式（compile 阶段二同时支持两种格式）
- 可选 `derived:` 行定义推导规则

## 格式定义

### 事实声明

```
<predicate>(<key>: <value>, <key>: <value>, ...) %% → [来源: <path>, <locator>]
```

| 部分 | 说明 | 示例 |
|------|------|------|
| predicate | 谓词名，描述声明类型 | `clock_source`, `divider`, `register_width` |
| key: value | 命名参数，至少包含一个主体标识 | `periph: WDT`, `source: PCLKB` |
| %% | 分隔符，声明本体在此结束 | — |
| → [来源: ...] | 来源锚点（与旧格式相同） | `→ [来源: manual, p.134]` |

### 推导规则（可选）

```
derived: <conclusion> :- <premise1>, <premise2>, ...
```

| 部分 | 说明 | 示例 |
|------|------|------|
| derived: | 标记为推导声明（非直接提取） | — |
| conclusion | 推导结论 | `clock_dependent(A, B)` |
| :- | Datalog 风格蕴含符号 | — |
| premises | 前提条件列表，逗号分隔 | `clock_source(A, C), clock_source(B, C), A != B` |

### 注释

以 `#` 开头的行是注释，解析器忽略。

### 完整示例

```markdown
## 关键声明

```claims
# === WDT 外设时钟 ===
clock_source(periph: WDT, source: PCLKB) %% → [来源: R7F0C014_manual, p.134]
divider(periph: WDT, value: 256, default: true) %% → [来源: R7F0C014_manual, p.512]
register_width(periph: WDT, bits: 16) %% → [来源: R7F0C014_manual, p.135]

# === Timer 外设时钟 ===
clock_source(periph: Timer, source: PCLKB) %% → [来源: R7F0C014_manual, p.245]

# === 推导规则 ===
derived: clock_dependent(A, B) :- clock_source(A, C), clock_source(B, C), A != B
```
```

## 解析为三元组

解析器将每条事实声明转换为 SPO 三元组：

| 声明 | 主语 (S) | 谓语 (P) | 宾语 (O) | 来源 |
|------|---------|---------|---------|------|
| `clock_source(periph: WDT, source: PCLKB)` | WDT 外设 | 时钟源 | PCLKB | p.134 |
| `divider(periph: WDT, value: 256)` | WDT 外设 | 分频比 | 256 | p.512 |

## 兼容策略

compile 阶段二同时支持新旧格式：
1. 优先解析 `claims` 代码块
2. 如果无 claims 代码块，回退到解析旧列表格式（`- <声明>: <值> → [来源: ...]`）
3. 旧格式解析为 `claim(subject: <声明>, value: <值>)` 三元组
4. 无任何声明格式时 → INFO：无关键声明区块（与旧行为相同）
