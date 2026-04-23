# Changelog

All notable changes to `llm-wiki` are documented here.

## [Unreleased]

### Added
- **Intent routing table** — Natural language user intent mapped to workflow names at top of SKILL.md (e.g. "帮我建wiki结构" → `project-init`)
- **Configuration section** — Claude Code permission settings, local config override, dependency table, Windows notes
- **Safety rules** — Five rules: raw immutability, no silent info loss, no deletion without confirmation, no sensitive content exposure, human correction priority
- **Output structure** — Every workflow documents its output file tree
- **Sub-skills index** — `sub-skills/` directory with `tasks/` (8 workflow task files), `tools/` (map-document, index-codebase), `runtime/` (reserved)

### Changed
- **SKILL.md slim-down** — Workflow body text moved to `sub-skills/tasks/*.md`. SKILL.md now serves as index + routing only (~493 lines, down from ~645)
- **Directory structure** — `sub-skills/` replaces flat `subskills/` with three-layer `tasks/tools/runtime` layout
- **index-codebase Option B** — Now uses `tree-sitter-languages` (bundled, no compilation). `tree-sitter + tree-sitter-c` deprecated.
- **map-document duplicates detection** — Added duplicate section ID detection to the Python script

### Fixed
- **Windows Edit tool** — Workaround documented for non-ASCII old_string failures in Edit tool (use `uv run python` instead)

## [0.1.0] — 2026-04-22

### Added
- Initial skill release with `init`, `capture`, `ingest`, `query`, `review`, `curate`, `project-init`, `code-anchor` workflows
- Large-file protocol with source map support (`explicit_toc`, `inferred_structure`, `coarse_map`)
- `map-document` and `index-codebase` tool workflows
- Templates: `vault-CLAUDE.md`, `page-template.md`, `index.md`, `log.md`
- Examples: `starter-vault/` demonstrating target workspace structure
- `docs/usage-examples.md` with workflow prompt patterns
- `docs/obsidian-setup.md` for optional Obsidian integration
- Project protocol files: `CLAUDE.md`, `README.md`, `README.zh-CN.md`
