# Phase 1: Local Runtime & Vault Bootstrap - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a local CLI runtime that can initialize an Obsidian-compatible vault with the required LLM Wiki structure (folders, schema files, index, log, overview) and make it runnable locally without any hosted backend.

**Requirements covered:**
- FND-01: Initialize vault with required structure
- FND-02: Run locally without hosted backend
- FND-03: Inspect generated artifacts as normal markdown files

**Success criteria:**
1. User can run `init` against empty/partial vault and get required folders, schema files, index, log, overview in predictable locations
2. User can run llm-wiki locally without any hosted backend or cloud service
3. User can inspect generated wiki artifacts as normal markdown and understand human-facing vs sidecar runtime state
4. Re-running `init` repairs missing required files instead of creating duplicate scaffolding

</domain>

<decisions>
## Implementation Decisions

### CLI Command Structure
- **D-01:** Multi-command entrypoint (`llm-wiki init`, `llm-wiki ingest`, `llm-wiki query`, `llm-wiki lint`)
- **D-02:** Each command suggests next logical step after completion (guided workflow similar to GSD auto-advance)
  - After `init` → suggest `ingest <url>` to add first source
  - After `ingest` → suggest `query` to explore wiki or `lint` to check issues
  - Creates guided workflow, reduces adoption friction

### Sidecar State Design
- **D-03:** `.llm-wiki/` sidecar directory completely separated from vault
- **D-04:** Sidecar contains:
  - `state.db` (SQLite + FTS5) — Persistent machine state: crawl history, URL metadata, page fingerprints, link graph
  - `cache/` — Temporary crawl buffer, raw HTML cache, intermediate transformation results (can be periodically cleaned)
  - `manifests/` — Per-crawl manifest files: crawl parameters, timestamps, target page list (for debugging and re-runs)

### Init Implementation Approach
- **D-05:** Copy template files from `templates/` directory to vault
- **D-06:** Idempotent behavior: only create missing files, do not overwrite existing files (preserve user modifications)
- Required files: `CLAUDE.md`, `index.md`, `log.md`, `wiki/overview.md`
- Required directories: `raw/sources/`, `raw/assets/`, `wiki/entities/`, `wiki/concepts/`, `wiki/sources/`, `wiki/comparisons/`, `wiki/analyses/`

### Human/Machine Distinction
- **D-07:** Directory structure self-explanatory:
  - `wiki/` = Human-readable wiki pages (entities, concepts, sources, analyses)
  - `raw/` = Immutable raw sources (captured content)
  - `.llm-wiki/` = Machine state (SQLite database, cache, manifests)
- Users understand different zones by browsing directory organization, no extra documentation or metadata needed

### Claude's Discretion
Areas where Claude has flexibility:
- CLI output format (silent, verbose, progress bar) — choose based on user preference patterns
- Error handling strategy (fail fast vs retry vs prompt) — choose based on phase constraints
- Environment validation depth (Node.js version check, Obsidian installation check) — validate essentials only to keep setup lightweight

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project vision, constraints, key decisions, evolution rules
- `.planning/REQUIREMENTS.md` — v1 requirements with traceability to phases
- `.planning/ROADMAP.md` §Phase 1 — Phase goal, success criteria, requirements mapping
- `.planning/config.json` — Project-level workflow configuration

### Technical Stack Recommendations
- `CLAUDE.md` §Recommended Stack — Node.js 24 LTS, TypeScript 6.0.x, Commander 14.0.x, SQLite + better-sqlite3 12.9.0, unified/remark for markdown AST
- `CLAUDE.md` §Prescriptive Architecture Choice — Vault = normal Markdown, sidecar state in `.llm-wiki/`, CLI commands via Commander

### Existing Templates and Examples
- `templates/vault-CLAUDE.md` — Schema documentation for vault initialization
- `templates/index.md` — Template for index page
- `templates/log.md` — Template for activity log (if exists, check before use)
- `templates/page-template.md` — Template for individual wiki pages
- `examples/starter-vault/CLAUDE.md` — Example vault CLAUDE.md structure
- `examples/starter-vault/index.md` — Example index structure
- `SKILL.md` — Existing skill spec defining workflows (init, clip, ingest, query, lint, browse) — provides conceptual model but needs runtime implementation

### Constraints and Anti-Patterns
- `CLAUDE.md` §What Not to Use — Avoid `node:sqlite` (stability concerns), embeddings/vector search in v1, regex-only rewriting
- `CLAUDE.md` §Constraints — Must work within Claude Code + Obsidian vault, setup must stay lightweight for friend trials, repository starting point is skill/templates only

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Templates directory (`templates/`)** — Contains vault-CLAUDE.md, index.md, log.md, page-template.md — can be copied directly to vault during init
- **Example vault (`examples/starter-vault/`)** — Demonstrates expected final structure after init — serves as validation reference
- **Skill spec (`SKILL.md`)** — Defines workflow logic (init, ingest, query, lint) — provides conceptual model but needs runtime implementation

### Established Patterns
- **Schema structure** — Vaults expect: CLAUDE.md (schema doc), index.md (page catalog), log.md (activity log), wiki/overview.md (wiki overview)
- **Directory organization** — Three-zone pattern: wiki/ (human pages), raw/ (immutable sources), .llm-wiki/ (machine state)
- **Idempotent requirement** — Init must repair missing files without creating duplicates (Phase 1 success criterion #4)

### Integration Points
- **CLI entrypoint** — New runtime connects to Commander CLI structure (CLAUDE.md recommended)
- **Obsidian vault** — Runtime initializes vault that user can browse in Obsidian
- **Sidecar state** — `.llm-wiki/` directory must be created alongside vault structure
- **Template copy flow** — Runtime reads templates/ and writes to target vault path

### Creative Constraints
- **No existing runtime code** — Phase 1 builds from scratch, only templates and examples exist
- **CLAUDE.md recommendations** — Must follow Node.js + TypeScript + SQLite stack
- **Friend-friendly adoption** — Setup must stay lightweight (zero or low friction)
- **Local-first** — No hosted backend or cloud service required

</code_context>

<specifics>
## Specific Ideas

User explicitly requested:
- **Guided workflow** — Similar to GSD "next" functionality, each command suggests next logical step after completion
- **Chinese language** — Discussion conducted in Chinese, user prefers Chinese explanations (but technical terms, code, file paths stay in English)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope (local runtime and vault bootstrap).

</deferred>

---

*Phase: 01-local-runtime-vault-bootstrap*
*Context gathered: 2026-04-21*