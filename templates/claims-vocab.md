---
title: Claims 谓词词汇表
type: reference
created: 2026-04-29
---

# Claims 谓词词汇表

定义 llm-wiki 中推荐使用的谓词及其参数模式。compile 阶段可检查页面是否使用了未注册的谓词。

## 外设类（peripherals）

```claims
# 时钟
clock_source(periph:, source:)       %% 外设的时钟源
clock_freq(periph:, hz:)             %% 外设运行的时钟频率
clock_divider(periph:, ratio:)       %% 时钟分频比

# 寄存器
register(periph:, name:, addr:, function:)        %% 寄存器基本信息
register_bit(reg:, value:, meaning:)               %% 寄存器位配置
register_field(periph:, name:, bits:, function:)   %% 寄存器字段

# 计数器/定时器
counter_bits(periph:, bits:)          %% 计数器位宽
overflow_time(periph:, setting:, ms:) %% 溢出时间配置
channel(periph:, ch:, function:)      %% 通道分配

# PWM
pwm_freq(periph:, hz:)                %% PWM 频率
pwm_duty(periph:, percent:)           %% PWM 占空比

# 选项字节
option_byte(periph:, addr:, field:, bit:, desc:)  %% 选项字节配置
```

## 项目类（project-level）

```claims
uses_external_wdt(project:, chip:)     %% 使用外部WDT芯片
wdt_feed_interval(project:, max_ms:)   %% 喂狗间隔
```

## 系统时钟类（clock-system）

```claims
oscillator(name:, type:, hz:)           %% 振荡器定义
clock_freq(source:, hz:)                %% 时钟源频率
supplies_clock_to(source:, consumer:)   %% 时钟供应关系
```

## 参数命名约定

| 参数 | 含义 | 示例 |
|------|------|------|
| `periph:` | 外设名称 | `WDT`, `TAU0`, `CGC` |
| `source:` | 时钟/信号来源 | `fIH`, `f_IL`, `PCLKB` |
| `hz:` | 频率（Hz） | `16000000` |
| `ms:` | 时间（毫秒） | `3.71` |
| `addr:` | 十六进制地址 | `0xFFFAB` |
| `name:` | 名称 | `WDTE` |
| `bits:` | 位宽/位范围 | `17`, `"2:0"` |
| `reg:` | 寄存器名 | `CMC` |
| `ch:` | 通道号 | `0`, `1`, `2` |

## 推导规则命名约定

```claims
derived: <小写谓词>(<大写变量>, ...) :- <前提1>, <前提2>, ...条件
```

变量名大写字母开头，常量小写。示例：
```claims
derived: clock_dependent(A, B) :- clock_source(periph: A, source: C), clock_source(periph: B, source: C), A != B
```

## 添加新谓词

当现有词汇表不足以表达声明时：
1. 在页面 claims 中使用新谓词
2. compile 报告会提示"未注册谓词"（INFO）
3. 如果新谓词被多页面使用，添加到本词汇表
