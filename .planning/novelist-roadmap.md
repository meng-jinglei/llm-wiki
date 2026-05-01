# llm-wiki-novelist — 开发路线图

## 项目愿景

构建 llm-wiki 的特化分支，让 AI agent 能够独立或半独立地完成 100 万字以上网文连载——文风一致、情节连贯、角色发展有弧线。

## 当前状态：Phase 1 实战中

方法论已建立，斗破苍穹 wiki 化完成，诡秘之主实战暴露方法论执行缺陷（跳过 wiki ingest）。
修正已落地——style-analyze 和 style-profile 工作流文件已创建，wiki 化改为硬前置条件。

---

## Phase 1: 文风维度建立 + 首批分析（进行中）

### 2026-04-30 更新

- **方法论修正**：诡秘之主实战验证了"跳过 wiki = profile 无价值"。style-analyze 和 style-profile 工作流文件已创建，wiki 化改为硬前置条件。
- **新发现**：在追求风格模仿之前，需要先解决"AI 不会当网文作者"这个更基础的问题（→ Phase 1.5）。

### 目标
建立 wiki 兼容的文风维度体系，完成首批 2-3 部代表作品的深度文风分析。

### 任务
- [x] writing-style wiki 初始化
- [x] 架构设计文档
- [x] 研究笔记 + 候选作品矩阵
- [x] 下载管线验证（斗破苍穹 + 诡秘之主）
- [ ] 八个文风维度 wiki 页定义
- [ ] `wiki/overview.md` 研究总览
- [x] 筛选首批 2-3 部作品（斗破苍穹 / 诡秘之主）
- [x] 斗破苍穹：下载✅ + 全量扫描✅ + source map✅ + wiki ingest✅（ch1-7）
- [ ] 诡秘之主：下载✅ + 全量扫描✅ + source map✅ + wiki ingest（需补）
- [ ] 分析模板 `templates/novel-analysis.md`
- [ ] AI 文风特征初探（wiki/ai-traits/）
- [ ] 第一批 compile 验证（维度覆盖检查）
- [x] 方法论修正：wiki 化强制化（style-analyze + style-profile 工作流文件创建）

### 交付物
```
wiki/dimensions/*.md       ← 8 个维度页（可交叉引用）
wiki/novels/<slug>/*.md    ← 2-3 部小说文风分析
wiki/overview.md           ← 研究总览
wiki/ai-traits/*.md        ← AI 文风特征初探
profiles/<novel>.yml       ← 首批文风抽象化文件（初版）
```

---

## Phase 1.5: 网文作者基础能力研究

### 目标
在追求特定风格模仿之前，先让 AI 学会当一个"正常的网文作者"——掌握注水手法、章节经济学、微快感曲线、作者-读者关系模型等网文写作的共性技能。

### 背景
诡秘之主风格写作实战暴露了比"风格模仿不到位"更基础的问题：AI 根本不懂网文作者的职业本能。网文的商业本质决定了"注水"不是 bug 而是 feature——成功的注水让读者欲罢不能，失败的注水让读者味同嚼蜡。在风格之前，需要先建立网文写作的基础能力层。

### 核心研究问题
- AI 扮演及格网文作者需要哪些约束？（不只是文风，还有职业本能）
- 注水手法如何分类和编码？（描写注水 vs 剧情注水 vs 对话注水）
- 章节经济学：微快感曲线的分布规律是什么？章末钩子有哪些类型和适用场景？
- 作者-读者关系模型：网文作者如何预判和操控读者期待？

### 案例研究
| 案例 | 作者 | 注水类型 | 研究价值 |
|------|------|---------|---------|
| 《天启预报》 | 风月 | 描写注水 | 前半段（~300万字）注水教科书级别——美文描写、铺垫艺术 |
| 斗破苍穹 | 天蚕土豆 | 剧情注水 | 拿宝物→打怪→升级 循环中的微快感设计 |

### 任务
- [ ] 下载《天启预报》TXT
- [ ] 完整 wiki 化（遵循修正后的五阶段管线，不跳步）
- [ ] 斗破苍穹 wiki 补充（之前已有定量扫描 + 部分 ingest）
- [ ] 从两部作品的 wiki 中提取"网文共性"而非"作者个性"
- [ ] 研究现有 AI 网文方案（web search + 知乎 + 小红书）
- [ ] 设计网文基础能力约束集

### 交付物
```
wiki/craft/                  ← 网文技法知识库（独立于单一作者文风）
├── padding-techniques.md   ←   注水手法分类与编码
├── chapter-economics.md    ←   章节经济学（钩子/微快感/信息释放）
├── reader-psychology.md    ←   作者-读者关系模型
└── author-instincts.md     ←   网文作者的职业本能

profiles/novelist-base.yml  ←   网文作者基础能力约束集（给写作 agent 使用）
```

---

## Phase 2: 规模分析 + 跨作品对比

### 目标
将分析的小说数量扩展到 8-10 部，建立跨作品对比体系，检测文风维度页的覆盖度。

### 任务
- [ ] 追加分析 5-7 部小说（覆盖不同风格维度）
- [ ] 建立 `wiki/comparisons/` 跨作品对比页
- [ ] 建立 `wiki/authors/` 作者级文风指纹
- [ ] compile 工作流：维度覆盖检查 + 矛盾检测
- [ ] 文风聚类初探（哪些小说在哪些维度上相似）
- [ ] SF 轻小说代表作品分析
- [ ] 古早经典 vs 新潮爆款 的代际文风差异分析

### 交付物
```
wiki/novels/*.md            ← 8-10 部小说分析
wiki/authors/*.md           ← 作者级指纹
wiki/comparisons/*.md       ← 跨作品对比
wiki/_compiled/report-*.md  ← 编译报告
```

---

## Phase 3: Profile 生成与验证

### 目标
从 wiki 编译产出可直接使用的文风文件，并通过写作实验验证。

### 任务
- [ ] 设计 profiles/ 格式（丰富但不模板化）
- [ ] 从 wiki 编译生成 profiles/*.yml
- [ ] 编写 profiles/使用说明.md
- [ ] 用 profile 指导 agent 写作片段
- [ ] 对比 agent 输出与原作 → 调整 profile
- [ ] 迭代直到风格逼真度达标
- [ ] "组合风格"实验：取 A 的句法 + B 的氛围 → 写作测试

### 交付物
```
profiles/<style-name>.yml   ← 经过验证的文风文件
profiles/使用说明.md         ← 给 agent 或用户的使用指南
wiki/analyses/profile-validation.md  ← 验证结果记录
```

---

## Phase 4: Novelist 技能定义

### 目标
在 llm-wiki 仓库创建 `llm-wiki-novelist` 分支，编写 SKILL.md + 写作专用子工作流。

### 任务
- [ ] 创建 `llm-wiki-novelist` git 分支
- [ ] 编写 SKILL.md（技能入口）
- [ ] 实现子工作流：
  - `sub-skills/tasks/style-analyze.md` — 文风分析
  - `sub-skills/tasks/style-profile.md` — 生成/应用文风文件
  - `sub-skills/tasks/chapter-write.md` — 章节写作
  - `sub-skills/tasks/continuity-check.md` — 连续性检查
  - `sub-skills/tasks/plot-track.md` — 情节追踪
  - `sub-skills/tasks/character-manage.md` — 角色管理
  - `sub-skills/tasks/timeline-sync.md` — 时间线同步
- [ ] 编写 novelist 专属工作空间模板
- [ ] 编写 ARCHITECTURE.md、CHANGELOG.md
- [ ] 在真实网文项目上实战测试

### 交付物
```
llm-wiki (分支 llm-wiki-novelist)
├── SKILL.md
├── ARCHITECTURE.md
├── CHANGELOG.md
├── sub-skills/tasks/
│   ├── style-analyze.md
│   ├── chapter-write.md
│   ├── continuity-check.md
│   ├── plot-track.md
│   ├── character-manage.md
│   └── timeline-sync.md
└── templates/
    └── novelist-vault-CLAUDE.md
```

---

## Phase 5: 长篇写作引擎

### 目标
实现 100 万+ 字网文连载的完整创作管线——wiki 记忆管理 + 文风一致性 + 半自动写作。

### 任务
- [ ] 跨 session 记忆管理优化（如何高效加载 wiki 上下文）
- [ ] 篇章级大纲自动生成
- [ ] 伏笔自动检测与提醒
- [ ] 角色 arc 自动追踪
- [ ] 风格漂移自动检测
- [ ] 多卷/多篇章管理
- [ ] 连载节奏分析（日更/周更对 wiki 管理的不同要求）
- [ ] 实战：从第 1 章写到第 100 章+

### 交付物
- 完整可用的 llm-wiki-novelist 技能
- 实战验证的长篇作品
- 使用文档与最佳实践

---

## 未来探索方向

- **多风格融合引擎**：从多个 profiles 中提取不同维度的特征，组合生成新风格
- **读者反馈闭环**：beta 读者反馈 → 自动定位问题章节 → 修正建议
- **网文市场分析**：基于文风维度的市场趋势分析
- **流派演化追踪**：追踪网文文风的历史演变
