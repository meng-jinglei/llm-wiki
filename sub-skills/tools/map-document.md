---
name: map-document
description: Extract outline/structure from a large document (PDF/DOCX/PPTX) and create a source map.
argument-hint: "<file_path>"
allowed-tools: [Bash, Read, Write]
---

## map-document

Extract the outline or heading structure from a PDF, DOCX, or PPTX file,
then create a source map at `raw/sources/<slug>.map.md`.

### Tool Assumptions

| Tool | Required | Install |
|------|----------|---------|
| `uv` | Yes | `curl -LsSf https://astral.sh/uv/install.sh \| sh` (Git Bash / Linux / macOS) |
| `pdfplumber` | Via --with | `uv run --with pdfplumber` |
| `PyPDF2` | Via --with | `uv run --with PyPDF2` |
| `python-docx` | Via --with | `uv run --with python-docx` |
| `python-pptx` | Via --with | `uv run --with python-pptx` |

**Windows (Git Bash/MSYS) notes:**
- Use `raw/.tmp/` for all temporary files (script files, intermediate data) — never rely on `/tmp/`
- Always pass file paths as command-line arguments, not via stdin/heredoc — avoids quoting issues with spaces and unicode characters

### When to use

- User provides a large document and wants to see its structure before ingesting
- User says "map this PDF" or "index this document"
- `capture` detected a large `.pdf`/`.docx`/`.pptx` file and suggested mapping

### Steps

1. Confirm the file exists and is a supported type: `.pdf`, `.docx`, `.pptx`.
2. Derive the slug from the filename (kebab-case).
3. **Write the Python script to a temp file first** (avoids heredoc quoting issues with spaces and unicode):

```
Use Write tool to create `raw/.tmp/llm_wiki_map_doc.py` with the script below.
The project must have a `raw/` directory already (created by `init` or `capture`).
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

4. **Run the script with uv, passing the file path as an argument**:
```bash
uv run --with PyPDF2 --with pdfplumber --with python-docx --with python-pptx python raw/.tmp/llm_wiki_map_doc.py "<filepath>"
```

5. Parse the JSON output. If extraction failed, report the error and stop.
6. Generate the source map file at `raw/sources/<slug>.map.md`. Use this template:

```
---
title: "<filename without extension, title-cased>"
type: source_map
source_type: "<pdf | docx | pptx>"
file_path: "<absolute path>"
structure_mode: <explicit_toc | inferred_structure>
structure_basis: "<bookmarks | headings | slide titles>"
confidence: <high | medium | low>
coverage_status: mapped
<page_count: N  (if pdf/pptx)>
---

# <title>

## Overview
Brief description of this document (infer from filename and first few headings).

## Section Map
- <Heading 1> — p.XX (or slide XX)
  - <Heading 2> — p.XX

## High-Value Ranges
Note which sections are most likely to contain wiki-relevant content
(e.g. reference sections, API tables, configuration chapters).

## Extraction Caveats
Note any limitations: inferred headings (not from TOC), missing pages,
scan artifacts, etc.

## How to Use This Map
Run `ingest --target "<section>"` to extract a specific section into the wiki.
Run `ingest` without `--target` to start from the highest-priority section.
```

7. Save the map file.
8. Append a log entry to `log.md`:
   `## [YYYY-MM-DD] map-document | <filename> — structure mapped (N sections, N pages)`

9. **After reporting the map file path, state the next action:**
   - Read the source map and identify the highest-priority pending section
   - "Suggested next: run `ingest` on section `<id>` (chapter X, priority:high)"

### Output

Report these paths:
- Created: `raw/sources/<slug>.map.md`
- Temp script: `raw/.tmp/llm_wiki_map_doc.py` (session-scoped)
