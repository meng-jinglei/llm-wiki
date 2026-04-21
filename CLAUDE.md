<!-- GSD:project-start source:PROJECT.md -->
## Project

**llm-wiki**

llm-wiki is evolving from a Claude Code skill spec into a practical personal knowledge workflow that gets closer to Karpathy's LLM Wiki pattern. It should help a single user ingest new sources into an Obsidian-backed wiki as persistent, interlinked knowledge, while remaining easy enough for friends to try with low setup friction.

**Core Value:** A new source should reliably produce meaningful incremental updates across the wiki instead of becoming a one-off summary.

### Constraints

- **Runtime**: Must work well within Claude Code and an Obsidian-style local vault — this is the current operating model.
- **Adoption**: Setup should stay lightweight enough for friends to try — zero- or low-friction onboarding matters.
- **Repository starting point**: Current repo is mostly skill/schema/templates, not a full implementation — the roadmap must account for building missing runtime support.
- **Priority**: Ingest quality comes before broader optimizations like advanced search or enterprise workflows — because the first must-win is stable multi-page incremental ingest.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Node.js | 24 LTS | Runtime | Best balance of stability, Windows support, and low setup friction for the owner plus friends. Fits filesystem-heavy local tooling and Obsidian-sidecar workflows well. | HIGH |
| TypeScript | 6.0.x | Implementation language | The runtime will juggle crawl manifests, page schemas, frontmatter, and update plans. TypeScript reduces silent shape drift in exactly the parts that will otherwise rot first. | HIGH |
| Commander | 14.0.x | CLI entrypoint | Use a boring CLI, not a framework-heavy app shell. `ingest`, `refresh`, `query`, `lint`, and `watch` map cleanly to Commander subcommands. | MEDIUM |
| tsx | 4.21.x | Local dev runner | Lowest-friction way to run TypeScript locally during early iteration. Good for owner-first development before packaging. | MEDIUM |
### Database
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| SQLite | 3.x with FTS5 enabled | Durable local state + full-text index | The wiki itself stays in Markdown, but incremental maintenance needs machine state: canonical URLs, fetch history, crawl checkpoints, page fingerprints, link graph, and searchable content. SQLite gives all of that in one portable file. FTS5 is the right default lexical index for local markdown/wiki search. | HIGH |
| better-sqlite3 | 12.9.0 | Node SQLite binding | Use this for v1 instead of `node:sqlite`. It is mature, fast, simple, synchronous in a good way for local CLI work, and officially recommends WAL mode. That makes it the boring choice for a reliability-first ingest pipeline. | HIGH |
### Infrastructure
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Obsidian vault filesystem | N/A | Human-facing source of truth | Keep user knowledge in normal Markdown files inside the vault. Obsidian remains the browser/editor; the runtime is a sidecar, not the primary UI. | HIGH |
| Sidecar state directory (`.llm-wiki/`) | N/A | Machine-facing durable state | Put `state.db`, crawl cache, and manifests here instead of polluting top-level wiki pages. This preserves Karpathy-style markdown ergonomics while giving the runtime enough memory to do true incremental maintenance. | HIGH |
| ripgrep (`rg`) | Current stable | Fast local content search | Do not depend on Obsidian CLI for core search. Obsidian CLI is optional in the current repo docs; `rg` is faster, scriptable, cross-platform, and easy to shell out to. Prefer system `rg`; bundle `@vscode/ripgrep` as fallback if you want near-zero setup friction. | HIGH |
### Supporting Libraries
| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| Crawlee | 3.16.0 | Durable multi-page crawl orchestration | Use for v1 ingest of documentation sites, article series, and single-source sites with many linked pages. Start with `HttpCrawler`/`CheerioCrawler`; only escalate to browser crawling for JS-heavy sites. | MEDIUM |
| `@mozilla/readability` | 0.6.0 | Article/main-content extraction | Use on fetched HTML after DOM parse when you want the main readable body, title, and metadata. Excellent default for articles and many docs pages. | HIGH |
| jsdom | 29.0.2 | DOM construction for Readability | Required by Readability in Node. Also useful for deterministic cleanup before HTML-to-Markdown conversion. | HIGH |
| turndown | 7.2.4 | HTML → Markdown conversion | Use after Readability or DOM cleanup. It accepts DOM nodes directly and gives predictable Markdown output with configurable fences/list markers. | HIGH |
| unified | 11.0.5 | Markdown AST pipeline | Use for real markdown transformations, not regex edits. This is the backbone for heading normalization, wikilink insertion, section replacement, and safe page rewriting. | HIGH |
| remark-parse | 11.0.0 | Markdown parsing | Parse existing wiki pages into ASTs before structural updates. | HIGH |
| remark-stringify | 11.0.0 | Markdown serialization | Write ASTs back out in a controlled format after edits. | HIGH |
| remark-frontmatter | 5.0.0 | Frontmatter support in AST pipeline | Use when pages need YAML frontmatter preserved during AST reads/writes. | HIGH |
| remark-gfm | 4.0.1 | GFM support | Keep tables, task lists, and other GitHub-flavored constructs round-trippable. | HIGH |
| gray-matter | 4.0.3 | Simple frontmatter I/O at boundaries | Use for quick metadata reads/writes on config or page boundaries. Keep AST work in `remark`; use `gray-matter` for boundary parsing, not whole-document mutation logic. | HIGH |
| github-slugger | 2.0.0 | Stable slug generation | Use for deterministic page names, heading anchors, and dedupe-safe source slugs that match GitHub-style markdown expectations. | HIGH |
| zod | 4.3.6 | Schema validation | Validate runtime config, ingest manifests, normalized source records, and page frontmatter. This should gate writes so broken crawls do not corrupt the wiki. | HIGH |
| chokidar | 5.0.0 | Lightweight watch mode | Use for `watch` mode that reindexes changed pages or refreshes search state. It explicitly handles atomic and chunked writes better than raw `fs.watch`. | HIGH |
| p-queue | 9.1.2 | Bounded concurrency | Use to control fetch concurrency, markdown update sequencing, and reindex work. Prevents self-inflicted crawl chaos. | MEDIUM |
| execa | 9.6.1 | Safe subprocess execution | Use for optional shell-outs to `rg`, `obsidian`, `git`, or packaging helpers without writing brittle `child_process` wrappers. | MEDIUM |
| `@vscode/ripgrep` | 1.17.1 | Bundled ripgrep fallback | Use only if you want the app to work even when the user has not installed `rg`. Good for friend-friendly setup. | MEDIUM |
| markdownlint + markdownlint-cli2 | 0.40.0 / 0.22.0 | Generated markdown validation | Run after writes or in `lint` mode to prevent gradual markdown drift. This is especially important once the runtime starts editing many pages automatically. | MEDIUM |
| Vitest | 4.1.4 | Test runner | Use for parser fixtures, crawl dedupe logic, link graph updates, and page rewrite tests. The stack is automation-heavy; tests buy reliability more than speed here. | MEDIUM |
## Prescriptive Architecture Choice
### What that means
- The vault remains normal Markdown under the user's control.
- The runtime keeps durable machine state in `vault/.llm-wiki/state.db` and `vault/.llm-wiki/cache/`.
- Core commands should look like this:
- Claude Code can still be a first-class authoring surface, but the runtime must no longer rely on Claude Code being the only thing that remembers prior ingest state.
### Why this is the right v1 shape
## How the Recommended Stack Fits the v1 Priority
### 1. Stable multi-page incremental ingest
### 2. Local-first markdown/wiki search
- **SQLite FTS5** for structured runtime search over indexed content, URL metadata, titles, headings, and source/page relationships.
- **ripgrep** for direct filesystem truth, debugging, and ad hoc power-user search.
### 3. Validation before writing
- **Zod** validates crawl records and normalized page models.
- **remark + gray-matter** validate that markdown/frontmatter remain parseable.
- **markdownlint-cli2** catches style drift and malformed generated markdown.
### 4. Lightweight automation
- optional watch mode
- reindex on file change
- ordered writes
- easy shell integration with `rg` and Obsidian
- minimal ops burden
## What Not to Use
### Avoid for v1
| Category | Do Not Use as Default | Why |
|----------|------------------------|-----|
| Database binding | `node:sqlite` | Promising, but Node's official docs still mark the module as **Stability 1.2 / release candidate** in current docs. For a boring v1, use `better-sqlite3` and revisit later. |
| Retrieval | Embeddings / vector search as core path | They add model, indexing, and ranking complexity before the wiki structure is stable. The main bottleneck today is durable maintenance, not semantic recall. |
| Vector extension | `sqlite-vec` in the default install | Its official README labels it pre-v1. Keep it as a future opt-in if semantic retrieval becomes necessary. |
| Crawl strategy | Playwright-first crawling | Too heavy for the stated v1 priority. Browser automation increases install friction and flakiness on friends' machines. Use HTTP/Cheerio first; escalate only when needed. |
| Source parser | Regex-only HTML or Markdown rewriting | This will absolutely create long-term corruption in a persistent wiki. Use DOM parsing and Markdown ASTs. |
| Search backend | Obsidian CLI as the only search backend | The current repo already treats Obsidian CLI as optional. Core runtime behavior must not depend on it being installed or enabled. |
| Packaging | Obsidian plugin first | It is the wrong first constraint. Nail ingest reliability first in a CLI sidecar. |
| All-in-one extractor | `@postlight/parser` as the default pipeline | It is convenient, but v1 needs an inspectable, composable pipeline. Prefer `Readability + jsdom + Turndown`; keep Postlight as an optional fallback, not the primary path. |
| Search library | MiniSearch / FlexSearch as primary index | Good libraries, but they do not solve durable crawl state, refresh history, or relational joins. Once SQLite exists, FTS5 is the simpler center of gravity. |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Runtime DB | SQLite + `better-sqlite3` | `node:sqlite` | Built-in is attractive, but current official docs still position it as release-candidate territory. |
| Crawl orchestration | Crawlee HTTP/Cheerio-first | Hand-rolled fetch queue | Reinventing retries, dedupe, queue persistence, and traversal rules is wasted effort. |
| Main-content extraction | Readability + jsdom + Turndown | `@postlight/parser` | Less composable and harder to debug when extraction needs site-specific fixes. |
| Markdown mutation | `unified` + `remark-*` | String replacement / regex edits | Unsafe for persistent wiki maintenance. |
| Search | SQLite FTS5 + ripgrep | MiniSearch / FlexSearch | In-memory search is fine for toy note search, not for durable ingest state and refresh-aware indexing. |
| Automation | chokidar + CLI watch mode | Long-running local service | Too much operational surface for the current stage. |
| UX shell | CLI sidecar | Obsidian plugin | CLI is easier to ship, debug, and adapt while the data model is still settling. |
## Installation
# Core runtime
# Dev dependencies
## Recommended Project Layout
## Confidence Summary
| Area | Confidence | Notes |
|------|------------|-------|
| Runtime choice (Node + TS CLI) | HIGH | Mature, low-friction, aligned with current repo and local-first usage. |
| Database/search choice (SQLite FTS5 + `better-sqlite3`) | HIGH | Strong official support for SQLite/FTS5; package is mature and widely used. |
| Capture/parsing choice (Crawlee + Readability + Turndown) | MEDIUM-HIGH | Well-supported components; exact site coverage varies, so expect some fallback logic. |
| Markdown mutation choice (`unified`/`remark`) | HIGH | AST-based mutation is the right long-term approach for persistent markdown systems. |
| Validation/automation choice (Zod + chokidar + markdownlint) | HIGH | Straightforward, proven local-tooling stack. |
| Avoiding embeddings/vector search in v1 | MEDIUM-HIGH | Strong architectural fit for the stated priority; revisit only after ingest quality is stable. |
## Sources
### High confidence
- Node.js SQLite docs: https://nodejs.org/api/sqlite.html
- Node.js release information: https://nodejs.org/en/about/previous-releases
- SQLite FTS5 docs: https://sqlite.org/fts5.html
- Crawlee docs: https://crawlee.dev/js/docs/quick-start
- Crawlee README: https://github.com/apify/crawlee
- Readability README: https://github.com/mozilla/readability
- Turndown README: https://github.com/mixmark-io/turndown
- unified docs: https://unifiedjs.com
- remark monorepo/docs: https://remark.js.org
- remark-frontmatter README: https://github.com/remarkjs/remark-frontmatter
- remark-gfm README: https://github.com/remarkjs/remark-gfm
- gray-matter README: https://github.com/jonschlinkert/gray-matter
- github-slugger README: https://github.com/Flet/github-slugger
- chokidar README: https://github.com/paulmillr/chokidar
- ripgrep README: https://github.com/BurntSushi/ripgrep
### Medium confidence
- better-sqlite3 package metadata/README: https://github.com/WiseLibs/better-sqlite3
- Zod docs: https://zod.dev
- p-queue README: https://github.com/sindresorhus/p-queue
- execa README: https://github.com/sindresorhus/execa
- markdownlint: https://github.com/DavidAnson/markdownlint
- markdownlint-cli2: https://github.com/DavidAnson/markdownlint-cli2
- `@vscode/ripgrep`: https://github.com/microsoft/vscode-ripgrep
- `sqlite-vec` README: https://github.com/asg017/sqlite-vec
- MiniSearch: https://github.com/lucaong/minisearch
- FlexSearch: https://github.com/nextapps-de/flexsearch
- Postlight Parser: https://github.com/postlight/parser
### Context sources from this repository
- `SKILL.md`
- `README.md`
- `docs/obsidian-setup.md`
- `templates/vault-CLAUDE.md`
- `templates/page-template.md`
- `examples/starter-vault/CLAUDE.md`
- Karpathy LLM Wiki gist: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
