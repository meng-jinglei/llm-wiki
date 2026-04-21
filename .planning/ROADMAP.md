# Roadmap: llm-wiki

## Overview

llm-wiki currently starts from a Claude Code skill, templates, and example vault files rather than a working runtime. This roadmap turns that starting point into a local-first CLI sidecar that can initialize a vault, capture one source, perform stable multi-page incremental ingest, answer from maintained wiki pages, and keep the wiki healthy enough for daily owner use plus low-friction friend trials. The build order follows the v1 must-win: reliable single-source multi-page incremental ingest before broader retrieval or product polish.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Local Runtime & Vault Bootstrap** - Build the missing local runtime and idempotent vault initialization path.
- [ ] **Phase 2: Source Capture & Transactional Ingest** - Capture one source immutably and turn one ingest run into visible multi-page wiki updates.
- [ ] **Phase 3: Canonical Incremental Maintenance** - Make re-ingest update the same pages safely with provenance, preservation rules, and conflict handling.
- [ ] **Phase 4: Wiki-First Query & Durable Analysis** - Answer from maintained wiki pages and save useful answers back into the vault.
- [ ] **Phase 5: Maintenance Health & Friend-Friendly Adoption** - Add lint, doctor, and default-path usability so the workflow stays trustworthy and easy to try.

## Phase Details

### Phase 1: Local Runtime & Vault Bootstrap
**Goal**: Users can initialize and run a local llm-wiki runtime against an Obsidian-compatible vault.
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03
**Success Criteria** (what must be TRUE):
  1. User can run an init flow against an empty or partial vault and end up with the required folders, schema files, index, log, and overview in predictable locations.
  2. User can run llm-wiki locally without any hosted backend or cloud service.
  3. User can inspect generated wiki artifacts as normal markdown files in the vault and understand which files are human-facing versus sidecar runtime state.
  4. Re-running initialization repairs missing required files instead of creating duplicate scaffolding.
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Canonicalize bootstrap templates and create the Node/TypeScript/Vitest init test baseline.
- [x] 01-02-PLAN.md — Implement the deterministic local init pipeline, sidecar bootstrap, and Commander CLI wiring.

### Phase 2: Source Capture & Transactional Ingest
**Goal**: Users can ingest one source and see a trustworthy first round of multi-page wiki updates.
**Depends on**: Phase 1
**Requirements**: SRC-01, SRC-02, SRC-03, SRC-04, ING-01, ING-03, TRST-02
**Success Criteria** (what must be TRUE):
  1. User can ingest a URL, local file, or pasted text and get one immutable raw capture with stable source identity metadata.
  2. One ingest run creates or updates a source summary plus multiple related wiki pages, not just a source note.
  3. Re-running ingest on the same unchanged source does not create a duplicate raw source record.
  4. User can inspect exactly which wiki paths were created or updated by the ingest run.
  5. `index.md` stays synchronized with the actual maintained wiki pages touched by ingest.
**Plans**: TBD

### Phase 3: Canonical Incremental Maintenance
**Goal**: Users can trust repeated ingest to maintain the same wiki pages instead of regenerating or fragmenting them.
**Depends on**: Phase 2
**Requirements**: ING-02, ING-04, ING-05, PAGE-01, PAGE-02, PAGE-03, PAGE-04, MNT-04
**Success Criteria** (what must be TRUE):
  1. Re-ingesting the same source updates the same canonical wiki targets instead of spawning near-duplicate pages.
  2. Existing maintained pages keep non-owned or protected sections intact while machine-managed sections refresh.
  3. Each maintained page shows contributing sources plus last-updated and last-reviewed metadata, and each source page links to the concept and entity pages it changed.
  4. If ingest is interrupted, the user can retry without corrupting previously maintained pages and can see any unfinished or conflicted work called out explicitly.
  5. Contradictory or unresolved updates surface as review or conflict flags instead of being silently merged away.
**Plans**: TBD

### Phase 4: Wiki-First Query & Durable Analysis
**Goal**: Users can ask the maintained wiki questions and promote valuable answers back into durable knowledge pages.
**Depends on**: Phase 3
**Requirements**: QRY-01, QRY-02, QRY-03
**Success Criteria** (what must be TRUE):
  1. User can ask a question and receive an answer synthesized from maintained wiki pages before raw-source fallback is used.
  2. Each answer cites the relevant wiki page paths so the user can inspect the maintained evidence directly.
  3. User can save a valuable answer as a durable analysis or comparison page inside the wiki.
**Plans**: TBD

### Phase 5: Maintenance Health & Friend-Friendly Adoption
**Goal**: Users can keep the wiki healthy and get value from the default local workflow without extra infrastructure.
**Depends on**: Phase 4
**Requirements**: MNT-01, MNT-02, MNT-03, TRST-01, TRST-03, TRST-04
**Success Criteria** (what must be TRUE):
  1. User can run a doctor command and get an actionable verdict on local environment and vault structure readiness.
  2. User can run lint and receive actionable findings for broken links, orphan pages, missing metadata, likely duplicate pages, and stale pages needing review.
  3. User can inspect one activity log that records ingest runs, saved analyses, and maintenance passes in chronological order.
  4. User can get useful end-to-end value from the default local setup without installing advanced retrieval or plugin infrastructure.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local Runtime & Vault Bootstrap | 0/2 | Planned | - |
| 2. Source Capture & Transactional Ingest | 0/TBD | Not started | - |
| 3. Canonical Incremental Maintenance | 0/TBD | Not started | - |
| 4. Wiki-First Query & Durable Analysis | 0/TBD | Not started | - |
| 5. Maintenance Health & Friend-Friendly Adoption | 0/TBD | Not started | - |
