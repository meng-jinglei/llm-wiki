---
name: download-pipeline
description: 网文下载管线——Anna's Archive → 直链提取 → curl 下载 → EPUB 转换
---

## 网文下载：经过实战验证的完整管线

novelist 不重新发明下载流程——下载网文全文时，走以下已验证的管线。

**已验证案例**：斗破苍穹 / 诡秘之主 / 天启预报（含 EPUB→TXT 转换）

### 必需依赖

| 工具 | 用途 |
|------|------|
| `agent-browser` | Anna's Archive 搜索与浏览 |
| `opencli browser` | 真实 Chrome，绕过 hCaptcha 提取直链 |
| `curl` | 下载直链文件 |
| `uv` + `ebooklib` + `beautifulsoup4` | EPUB→TXT 转换 |

---

### 步骤 1: 获取 Anna's Archive 最新域名

域名频繁变动，每次下载前从 shadowlibraries.github.io 获取：

```bash
agent-browser open "https://shadowlibraries.github.io/DirectDownloads/AnnasArchive/"
agent-browser wait --load networkidle
agent-browser snapshot -i
# → 从 "Links:" 区块提取域名 ref（通常是 @e13/@e14/@e15）
agent-browser get attr @e13 href   # Anna's Archive 主站
agent-browser get attr @e14 href   # Mirror 1
agent-browser get attr @e15 href   # Mirror 2
```

**注意**：`annas-archive.li` 已被劫持为内容农场，永远不要使用。

---

### 步骤 2: 搜索小说

```bash
agent-browser open "<主站URL>/search?q=<书名+作者>"
agent-browser wait --load networkidle
agent-browser snapshot -i -d 4
# → 在结果中找到目标小说，记下书名链接的 ref
```

中文搜索建议同时搜"书名"和"书名+作者"两个版本。

---

### 步骤 3: 进入详情页，查看文件信息

```bash
agent-browser click @<书名ref>
agent-browser wait --load networkidle
agent-browser snapshot -i -d 3
# → 确认文件格式（epub/txt/mobi）、章节数、语言
```

Anna's Archive 上中文网文常见格式为 EPUB（TXT 较少）。如果只有 EPUB，步骤 7 需要额外转换。

---

### 步骤 4: 获取 MD5

在详情页的 "Technical details" 标签中：

```bash
agent-browser click @<technical_details_ref>
agent-browser wait --load networkidle
agent-browser snapshot -i
# → 记录 MD5 hash
```

也可以通过 URL 路径提取 MD5：详情页 URL 格式为 `/md5/<md5>`。

---

### 步骤 5: 用户验证（必须执行）

向用户展示：
- MD5 详情页 URL（如 `https://annas-archive.gl/md5/<md5>`）
- 文件名、格式、章节数
- 文件来源（Libgen / Z-Library / 民间自制 等）

**等待用户确认后才下载。不自动下载。**

---

### 步骤 6: 用 opencli browser 提取直链

agent-browser 点击 download 会触发 hCaptcha。用 opencli browser 替代：

```bash
# 6a. 用 opencli browser 打开 MD5 详情页（真实 Chrome，已登录状态）
opencli browser open "https://annas-archive.gl/md5/<md5>"

# 6b. 用 eval 导航到 slow_download（绕过 DOM 索引不稳定）
opencli browser eval "window.location.href='/slow_download/<md5>/0/7'"

# 6c. 提取 partner server 直链
opencli browser eval "Array.from(document.querySelectorAll('span')).filter(s => s.textContent.startsWith('http')).map(s => s.textContent).join('\n')"
# → 输出两行 URL：长文件名 + 短文件名（推荐用短文件名的）
```

**为什么用 opencli browser**：
- Anna's Archive 搜索/浏览无需验证 → agent-browser 够用
- 下载按钮触发 hCaptcha → 无法自动化
- slow_download 页面给的 partner server 直链（`http://IP:PORT/...`）无需验证
- opencli browser 用真实 Chrome，`eval` 导航不受 DOM 刷新影响

---

### 步骤 7: curl 下载

```bash
curl -L -o "raw/assets/<slug>.<ext>" "<短文件名直链>"
```

直链格式：`http://<IP>:<PORT>/d3/.../<filename>`，curl 直接下载，速度快、无中间层。

---

### 步骤 8: EPUB→TXT 转换（如需要）

如果步骤 3 确认文件是 EPUB 格式，用 Python 转换：

```bash
uv run --with ebooklib --with beautifulsoup4 python -c "
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import re

book = epub.read_epub('raw/assets/<slug>.epub')
chapters = []
for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
    soup = BeautifulSoup(item.get_content(), 'html.parser')
    text = soup.get_text()
    text = re.sub(r'\n\s*\n', '\n\n', text).strip()
    if len(text) > 100:
        chapters.append(text)

with open('raw/assets/<slug>.txt', 'w', encoding='utf-8') as f:
    f.write('\n\n'.join(chapters))
"
```

依赖：`ebooklib` + `beautifulsoup4`（通过 `uv run --with` 自动安装）。

---

### 步骤 9: 捕获后处理

1. 创建 `raw/sources/<slug>.md`（元数据、MD5、获取状态）
2. 对长篇（>100 万字）后续创建来源地图（style-analyze 阶段 2）
3. 追加 `log.md` 捕获记录

---

### 备选渠道

Anna's Archive 全部不可用时：
- WebSearch "`<小说名>` txt 下载" 搜索其他下载站
- 知轩藏书、Z-Library、豆瓣分享的网盘链接
- 所有备选渠道同样需要步骤 5（用户验证 URL）
