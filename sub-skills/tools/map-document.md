---
name: map-document
description: 从大型文档（PDF/DOCX/PPTX）提取大纲/结构并创建来源地图
argument-hint: "<file_path>"
allowed-tools: [Bash, Read, Write]
---

## map-document（文档映射）

从 PDF、DOCX 或 PPTX 文件中提取大纲或标题结构，
然后在 `raw/sources/<slug>.map.md` 创建来源地图。

### 工具依赖

| 工具 | 必需 | 安装 |
|------|----------|---------|
| `uv` | 是 | `curl -LsSf https://astral.sh/uv/install.sh \| sh`（Git Bash / Linux / macOS） |
| `pdfplumber` | 通过 --with | `uv run --with pdfplumber` |
| `PyPDF2` | 通过 --with | `uv run --with PyPDF2` |
| `python-docx` | 通过 --with | `uv run --with python-docx` |
| `python-pptx` | 通过 --with | `uv run --with python-pptx` |

**Windows（Git Bash/MSYS）说明：**
- 所有临时文件（脚本文件、中间数据）使用 `raw/.tmp/` — 切勿依赖 `/tmp/`
- 始终将文件路径作为命令行参数传递，不通过 stdin/heredoc — 避免空格和 unicode 字符的引号问题

### 何时使用

- 用户提供大型文档并希望在导入前查看其结构
- 用户说"映射这个 PDF"或"索引这个文档"
- `capture` 检测到大型 `.pdf`/`.docx`/`.pptx` 文件并建议进行映射

### 步骤

1. 确认文件存在且为支持的格式：`.pdf`、`.docx`、`.pptx`。
2. 从文件名派生出 slug（kebab-case）。
3. **先将 Python 脚本写入临时文件**（避免 heredoc 引号问题导致的空格和 unicode 问题）：

```
使用 Write 工具将以下脚本创建为 `raw/.tmp/llm_wiki_map_doc.py`。
项目必须已有 `raw/` 目录（由 `init` 或 `capture` 创建）。
```

```python
import sys, json
from pathlib import Path

def extract_pdf_structure(filepath):
    from PyPDF2 import PdfReader
    reader = PdfReader(filepath)
    outline = reader.outline
    if outline:
        def parse_outline(items, level=0):
            result = []
            for item in items:
                if isinstance(item, list):
                    result.extend(parse_outline(item, level + 1))
                else:
                    try:
                        page = reader.get_destination_page_number(item) + 1
                    except Exception:
                        page = None
                    result.append({'title': item.title, 'page': page, 'level': level})
            return result
        return parse_outline(outline), 'explicit_toc', len(reader.pages)
    else:
        import pdfplumber
        with pdfplumber.open(filepath) as pdf:
            pages = len(pdf.pages)
            headings = []
            for i, page in enumerate(pdf.pages[:30]):
                text = page.extract_text() or ''
                lines = text.split('\n')
                for line in lines:
                    stripped = line.strip()
                    if stripped and len(stripped) > 10 and len(headings) < 200:
                        headings.append({'title': stripped[:120], 'page': i + 1, 'level': 1})
            return headings, 'inferred_structure', pages

def extract_docx_structure(filepath):
    from docx import Document
    doc = Document(filepath)
    structure = []
    for para in doc.paragraphs:
        if para.style and para.style.name.startswith('Heading') and para.text.strip():
            level_str = para.style.name
            level = int(level_str[-1]) if level_str[-1].isdigit() else 1
            structure.append({'title': para.text.strip(), 'level': level})
    return structure, 'explicit_toc', None

def extract_pptx_structure(filepath):
    from pptx import Presentation
    prs = Presentation(filepath)
    structure = []
    for i, slide in enumerate(prs.slides):
        title = slide.shapes.title.text.strip() if slide.shapes.title else ''
        if title:
            structure.append({'title': title[:120], 'slide': i + 1, 'level': 1})
        elif len(structure) < 500:
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    structure.append({'title': shape.text.strip()[:120], 'slide': i + 1, 'level': 1})
                    break
    return structure, 'explicit_toc', len(prs.slides)

filepath = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read().strip()
path = Path(filepath)
ext = path.suffix.lower()

if ext == '.pdf':
    structure, mode, pages = extract_pdf_structure(str(path))
    output = {'file': str(path), 'type': 'pdf', 'structure_mode': mode,
              'page_count': pages, 'outline': structure}
elif ext == '.docx':
    structure, mode, _ = extract_docx_structure(str(path))
    output = {'file': str(path), 'type': 'docx', 'structure_mode': mode, 'outline': structure}
elif ext == '.pptx':
    structure, mode, slides = extract_pptx_structure(str(path))
    output = {'file': str(path), 'type': 'pptx', 'structure_mode': mode,
              'slide_count': slides, 'outline': structure}
else:
    sys.stderr.write(f'Unsupported file type: {ext}\n')
    sys.exit(1)

# Duplicate section ID detection: flag entries where multiple outline items
# share the same title (case-insensitive), which would produce duplicate sXX IDs.
seen_titles = {}
dupes = []
for i, item in enumerate(output.get('outline', [])):
    key = item.get('title', '').strip().lower()
    if key in seen_titles:
        dupes.append({'index': i, 'title': item.get('title'), 'first_seen': seen_titles[key]})
    else:
        seen_titles[key] = i

if dupes:
    sys.stderr.write(f'WARNING: {len(dupes)} duplicate title(s) found in outline:\n')
    for d in dupes[:10]:
        sys.stderr.write(f'  [{d["index"]}] "{d["title"]}" — first seen at index {d["first_seen"]}\n')
    sys.stderr.write('  IDs will be disambiguated. Review the map file to confirm correctness.\n')
    # Annotate duplicate entries in output so the agent can handle them
    output['_duplicate_titles'] = dupes

# Output as JSON to stdout (pipe to jq or redirect as needed)
json.dump(output, sys.stdout, ensure_ascii=False)
```

4. **使用 uv 运行脚本，将文件路径作为参数传递**：
```bash
uv run --with PyPDF2 --with pdfplumber --with python-docx --with python-pptx python raw/.tmp/llm_wiki_map_doc.py "<filepath>"
```

5. 解析 JSON 输出。如果提取失败，报告错误并停止。
6. 在 `raw/sources/<slug>.map.md` 生成来源地图文件。使用以下模板：

```
---
title: "<文件名（无扩展名，标题式大写）>"
type: source_map
source_type: "<pdf | docx | pptx>"
file_path: "<绝对路径>"
structure_mode: <explicit_toc | inferred_structure>
structure_basis: "<书签 | 标题 | 幻灯片标题>"
confidence: <high | medium | low>
coverage_status: mapped
<page_count: N（如为 pdf/pptx）>
---

# <标题>

## 概述
此文档的简要描述（从文件名和开头的几个标题推断）。

## 章节地图
- <标题1> — 第XX页（或 幻灯片XX）
  - <标题2> — 第XX页

## 高价值范围
注明哪些章节最可能包含 wiki 相关内容
（例如参考章节、API 表格、配置章节）。

## 提取注意事项
注明任何限制：推断的标题（非来自目录）、缺失页面、
扫描伪影等。

## 如何使用此地图
运行 `ingest --target "<章节>"` 将特定章节提取到 wiki。
运行 `ingest`（不带 `--target`）从最高优先级章节开始。
```

7. 保存地图文件。
8. 在 `log.md` 中追加日志条目：
   `## [YYYY-MM-DD] map-document | <文件名> — 结构已映射（N 个章节，N 页）`

9. **报告地图文件路径后，说明下一步操作：**
   - 读取来源地图并识别最高优先级的待处理章节
   - "建议下一步：对章节 `<id>`（第X章，优先级:high）执行 `ingest`"

### 输出

报告以下路径：
- 已创建：`raw/sources/<slug>.map.md`
- 临时脚本：`raw/.tmp/llm_wiki_map_doc.py`（会话范围）
