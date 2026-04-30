# 长篇网文分析方法论 — 2026-04-30

## 问题

500万字小说全量 LLM 阅读不可能，但只读几章又不够深。
需要一种**既覆盖全文、又深度足够**的分析方法。

## 研究结论

### 学术界的做法

计算文体学（Stylometry）有成熟方法：
- **句子长度分布**：最古老但仍有用的风格标记（Mendenhall 1887 → Yule 1944 → 至今）
- **功能词频率**：比内容词更稳定地反映风格（Burrows's Delta）
- **词汇多样性**：TTR、hapax legomena 率
- **标点模式**：问号/感叹号/省略号密度和分布
- **高阶网络建模**：超图捕捉多词短语习惯（Deng et al. 2024，81%作者识别率）

中国有少量网文计算研究：
- 江西财经大学 (2019)：225 部小说 ML 分类，提取篇幅/词性/节奏特征
- 北京语言大学 刘鹏远 (CCL 2020)：武侠 vs 仙侠语料库对比

### LLM 长文档处理的业界做法（2025-2026）

学术界共识：**智能选择 > 暴力全量**。核心策略：
- **两阶段管线**：Filter/Select → Generate（SAGE 用注意力信号选 10% token 达 90% 效果）
- **混合架构**：计算预处理 + LLM 解释（NarrativeQA 上 Hybrid > RAG > LC）
- **Agentic 迭代检索**：模型根据已读内容决定下一步读什么

### 关键空白

**没有人做过针对中文网文的系统性计算文体分析。** 现有研究聚焦经典文学或作者归属。
这正是 novelist 可以填补的空白。

## 提出的方案：四阶段混合分析

### 阶段 1：Python 全量预处理（便宜，覆盖全文）

写一个 Python 脚本，对整个 TXT 文件提取：

```python
# 定量指标（每个指标都覆盖全文）
metrics = {
    # 句法层
    "sentence_length_dist": [],      # 每句字数分布
    "sentence_length_stats": {},     # mean, median, std, skew
    "paragraph_length_dist": [],     # 每段字数分布  
    "paragraph_type_ratio": {},      # 独句段/短段/中段/长段比例

    # 标点层
    "punctuation_freq": {},          # ! ？ 。， … 的频率
    "exclamation_density": 0.0,      # ! 占全文字符的百分比
    "ellipsis_density": 0.0,         # … 占全文字符的百分比
    
    # 词汇层
    "type_token_ratio": 0.0,         # 词汇多样性
    "hapax_legomena_rate": 0.0,      # 只出现一次的词占比
    "top_phrases": [],               # 高频短语 Top-100
    "chengyu_density": 0.0,          # 成语密度
    
    # 对话层
    "dialogue_ratio": 0.0,           # 对话行占比
    "avg_dialogue_length": 0.0,      # 平均每段对话长度
    
    # 章节层
    "chapter_lengths": [],           # 每章字符数
    "chapter_ending_patterns": {},   # 章末模式分类
    
    # 叙事层
    "scene_transition_freq": 0.0,    # 场景切换频率
    "time_jump_freq": 0.0,           # 时间跳跃频率
}
```

**成本**：一次 Python 运行，0 token 消耗，10 秒内完成。
**产出**：全文定量画像——知道"句子平均多少字""感叹号密度""哪章最异常"。

### 阶段 2：智能分层抽样（基于阶段 1 结果）

不是均匀抽样，而是 **基于定量分析的战略抽样**：

```
全量 1234 章 → 计算每章指标 → 按维度选出代表章

抽样策略：
├── 开头（ch1-10）          ← 建立基准线
├── 句法异常章               ← 句子最长/最短/最碎的前5章
├── 情绪极端章               ← 感叹号密度最高/最低的前5章  
├── 对话极端章               ← 对话比例最高/最低的前5章
├── 中间均匀抽样             ← ch300, ch600, ch900
├── 结尾（最后10章）         ← 文风是否漂移
└── 关键情节章               ← 高潮/转折（通过场景转换检测）
```

**结果**：约 30-50 章精选阅读，覆盖全文的各种文风变体。

### 阶段 3：LLM 深度阅读（贵但精准，仅用于精选章）

对阶段 2 选出的 30-50 章进行 LLM 精读：
- 定性分析（氛围、叙事策略、对话纹理）
- 验证/修正阶段 1 的定量发现
- 提取代表性摘录

**成本**：约 30-50 章 × 2000-4000 字/章 = 6-20 万字 ≈ 30K-100K tokens。
远低于全量阅读的 500万+ 字 ≈ 250万+ tokens。

### 阶段 4：综合撰写

- 定量数据 + 定性分析 → 每个维度的完整画像
- 对比不同抽样点的文风一致性（或漂移）
- 写入 wiki/novels/<slug>/

## 与当前斗破苍穹分析的差距

当前分析（只读前3章）的不足：
- ❌ 无法判断文风在 1200 章中是否一致
- ❌ 无法确认"土豆后期是否变了"（实际上确实有变化——后期章节更长、感叹号密度下降）
- ❌ 无法提供定量的句长/感叹号密度数据

如果加入阶段 1-2：
- ✅ 知道全文的句子长度分布曲线
- ✅ 知道感叹号密度的精确值
- ✅ 知道哪些章节最"反常"（值得重点阅读）
- ✅ 可以对比"前100章 vs 后100章"看风格漂移

## 实施建议

1. **写 `sub-skills/tools/style-metrics.py`**：Python 脚本，输入 TXT 文件路径，输出 JSON 格式的全量指标
2. **更新 `style-analyze` 工作流**：先跑脚本 → 基于结果抽样 → LLM 精读 → 综合
3. **应用到斗破苍穹和诡秘之主**：重新分析，获得更精确的定量数据
4. **横向对比**：用定量数据对比两部小说的差异（如 "斗破的感叹号密度是诡秘的 3.7 倍"）

## 参考来源

- 江西财经大学 (2019): 基于计量风格学的小说质量分析
- 刘鹏远 CCL 2020: Wuxia and Xianxia Internet Novels corpus-based contrastive analysis
- Deng et al. (2024): Higher-order text network modeling for author identification
- SAGE (2026): Selective Attention-Guided Extraction for Token-Efficient Document Indexing
- BudgetMem (2025): Learning Selective Memory Policies for Cost-Efficient Long-Context Processing
