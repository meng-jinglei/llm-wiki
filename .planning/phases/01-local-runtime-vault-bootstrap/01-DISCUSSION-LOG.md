# Phase 1: Local Runtime & Vault Bootstrap - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 01-local-runtime-vault-bootstrap
**Areas discussed:** CLI command structure, Sidecar state design, Init implementation approach, Human/machine distinction
**Language:** Chinese (user requested 中文讨论)

---

## CLI Command Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-command structure | Separate entrypoints for each workflow: `llm-wiki init`, `llm-wiki ingest`, `llm-wiki query`, `llm-wiki lint`. Clear workflow boundaries, matches Commander patterns. CLAUDE.md recommended. | ✓ |
| Single-command entrypoint | Single entry with parameters or interactive menu. Simpler early prototype but becomes unwieldy as features grow. | |
| CLI + Plugin combo | CLI sidecar + optional Obsidian plugin as friendly UI. CLI is primary runtime, plugin is future polish. CLAUDE.md explicitly prioritizes CLI over plugin. | |

**User's choice:** Multi-command structure + GSD "next" functionality
**Notes:** User wants guided workflow where each command suggests next logical step (like GSD auto-advance chains). After `init` → suggest `ingest`, after `ingest` → suggest `query` or `lint`. Reduces adoption friction.

---

## Sidecar State Location

| Option | Description | Selected |
|--------|-------------|----------|
| `.llm-wiki/` sidecar directory | Machine state fully separated, vault stays pure Markdown. SQLite persists crawl history, URL metadata, page fingerprints, link graph. CLAUDE.md recommended. | ✓ |
| Embedded in vault root | State files directly in vault root. Simpler but pollutes human-readable wiki structure. Not recommended for long-term maintenance. | |
| Global shared state | State files in system-level location (e.g., ~/.llm-wiki/), multiple vaults share one database. Good for multi-vault workflows but adds complexity. | |

**User's choice:** `.llm-wiki/` sidecar directory
**Notes:** Confirmed CLAUDE.md recommendation.

---

## Sidecar Contents

| Option | Description | Selected |
|--------|-------------|----------|
| state.db (SQLite) | Persistent machine state: crawl history, URL metadata, page fingerprints, link graph. CLAUDE.md recommends SQLite + better-sqlite3 + FTS5. | ✓ |
| cache/ directory | Temporary crawl buffer, raw HTML cache, intermediate transformation results. Can be periodically cleaned without affecting long-term state. | ✓ |
| manifests/ directory | Per-crawl manifest files with crawl parameters, timestamps, target page list. Useful for debugging and re-running. | ✓ |
| Only state.db, no other directories | All machine state in single SQLite file. Simpler structure, easier backup/migration, but weaker debugging. | |

**User's initial selection:** All options including contradictory "Only state.db"
**Clarification requested:** User chose "Complete sidecar" structure (state.db + cache/ + manifests/)

**User's choice:** Complete sidecar structure
**Notes:** Full structure provides debugging capabilities and re-run flexibility. Confirmed after clarifying contradiction.

---

## Init Implementation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Copy template files | Directly copy files from `templates/` directory to vault. Fast and readable templates. Idempotent: only copy missing files, preserve existing user modifications. | ✓ |
| Dynamic content generation | Runtime generates file content. More flexible but slower init. Idempotent: only generate missing files. Suitable when templates need vault-specific config. | |
| Full validation + repair | Every run validates all required files against content rules, repairs corrupted or malformed files (overwrites user modifications). Strict schema maintenance but may lose user customizations. | |

**User's choice:** Copy template files
**Notes:** Confirmed recommendation.

---

## Idempotent Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Create missing files only | Only copy/create missing files, existing files not overwritten (preserve user modifications). Validate required file list, create if absent. Safe and respects user customizations. | ✓ |
| Full validation + repair | Every run validates all required files against template spec, corrupted or malformed files repaired (overwrites user modifications). Strict schema maintenance but may lose user content. | |

**User's choice:** Create missing files only
**Notes:** Confirmed recommendation. Preserves user modifications, safe idempotent behavior.

---

## Human/Machine Distinction

| Option | Description | Selected |
|--------|-------------|----------|
| vault-CLAUDE.md documentation | Explain human-readable wiki pages vs machine state in vault-CLAUDE.md. User sees clear explanation when opening vault. | |
| Directory structure self-explanatory | File names and directory organization inherently show purpose: wiki/ = human pages, raw/ = immutable sources, .llm-wiki/ = machine state. Users understand by browsing directory layout. | ✓ |
| Page-level annotations | Each generated wiki page has frontmatter or comments explaining its nature (e.g., "machine-maintained", "human-editable section"). More granular distinction. | |
| doctor command output | Running doctor outputs full vault structure diagnostics including which are required files, optional files, machine state. Users consult doctor for complete explanation. | |

**User's choice:** Directory structure self-explanatory
**Notes:** Clean and intuitive approach. No extra documentation or metadata needed.

---

## Claude's Discretion

Areas where user deferred to Claude:
- CLI output format (silent, verbose, progress bar)
- Error handling strategy (fail fast, retry, prompt)
- Environment validation depth (Node.js version check, Obsidian installation check)

Claude should choose based on:
- User preference patterns (Chinese language preference suggests verbose Chinese explanations)
- Phase constraints (friend-friendly adoption → validate essentials only)
- CLAUDE.md recommendations (local-first, zero/low friction setup)

---

## Deferred Ideas

None — discussion stayed within Phase 1 scope.

---

*Discussion log generated: 2026-04-21*