# Requirements: llm-wiki

**Defined:** 2026-04-21
**Core Value:** A new source should reliably produce meaningful incremental updates across the wiki instead of becoming a one-off summary.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FND-01**: User can initialize an Obsidian-compatible vault with the required LLM Wiki structure and schema files.
- [ ] **FND-02**: User can run the system locally without any hosted backend or cloud service.
- [ ] **FND-03**: User can inspect all generated wiki artifacts as normal markdown files inside the vault.

### Source Capture

- [ ] **SRC-01**: User can ingest a URL, local file, or pasted text as a source.
- [ ] **SRC-02**: User can keep the raw captured source immutable after ingest.
- [ ] **SRC-03**: User can see stable source identity metadata for each ingested source.
- [ ] **SRC-04**: User can re-run ingest on the same unchanged source without creating a duplicate raw source record.

### Incremental Ingest

- [ ] **ING-01**: User can ingest one source and have the system create or update a source summary page plus multiple related wiki pages in one run.
- [ ] **ING-02**: User can re-ingest the same source and have the system update the same target pages instead of creating near-duplicate pages.
- [ ] **ING-03**: User can see which pages were created or updated by an ingest run.
- [ ] **ING-04**: User can recover from an interrupted ingest run without corrupting previously maintained wiki pages.
- [ ] **ING-05**: User can preserve non-owned page sections when the system updates an existing wiki page.

### Page Identity and Traceability

- [ ] **PAGE-01**: User can rely on canonical page identity rules so the same concept or entity resolves to the same wiki page across ingests.
- [ ] **PAGE-02**: User can see which sources contributed to each maintained wiki page.
- [ ] **PAGE-03**: User can navigate from a source page to the concept and entity pages that ingest changed.
- [ ] **PAGE-04**: User can inspect when a maintained page was last updated and reviewed.

### Query

- [ ] **QRY-01**: User can ask a question and receive an answer synthesized from maintained wiki pages first.
- [ ] **QRY-02**: User can see citations to the relevant wiki page paths in each answer.
- [ ] **QRY-03**: User can save a valuable answer back into the wiki as a durable analysis or comparison page.

### Maintenance

- [ ] **MNT-01**: User can run lint and detect broken links, orphan pages, and pages missing required metadata.
- [ ] **MNT-02**: User can detect likely duplicate pages that should be merged or aliased.
- [ ] **MNT-03**: User can detect stale pages whose synthesis has not been reviewed against newer source updates.
- [ ] **MNT-04**: User can see unresolved conflict or review flags instead of having contradictory updates silently merged away.

### Trust and Usability

- [ ] **TRST-01**: User can inspect an activity log that records each ingest, query save, and maintenance pass.
- [ ] **TRST-02**: User can inspect an index that stays in sync with the actual wiki pages.
- [ ] **TRST-03**: User can run a doctor-style setup check that verifies the local environment and vault structure are usable.
- [ ] **TRST-04**: User can get meaningful value from the default setup without installing advanced retrieval or plugin infrastructure.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Search and Scale

- **SRCH-01**: User can search a large wiki with stronger ranking than index-first plus filesystem search alone.
- **SRCH-02**: User can use optional semantic retrieval without making it mandatory for setup.

### Richer Knowledge Maintenance

- **KNOW-01**: User can manage aliases and canonical merges through a richer review workflow.
- **KNOW-02**: User can track claim-level citations instead of only page-level source provenance.
- **KNOW-03**: User can ingest multiple related sources into a coordinated synthesis workflow.

### Richer Source Types

- **RICH-01**: User can ingest image-heavy, PDF-heavy, or other non-text sources with explicit coverage reporting.
- **RICH-02**: User can incorporate asset review into wiki synthesis when a source depends on visual evidence.

### Collaboration

- **COLL-01**: Multiple users can collaborate on one wiki without ambiguous machine-vs-human ownership.
- **COLL-02**: Team workflows can review and approve maintenance changes before they land.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hosted SaaS or remote service | The current goal is a strong local-first workflow, not a cloud product |
| Mandatory embeddings or vector database | v1 must first prove stable ingest and maintenance without extra setup burden |
| Obsidian plugin-first implementation | Packaging and plugin UX are secondary to making ingest semantics trustworthy |
| Autonomous always-on background agent | Explicit, inspectable commands are safer for early trust and debugging |
| Enterprise-scale ingestion pipeline | This project is currently optimized for personal use and lightweight friend trials |
| Full contradiction auto-resolution | v1 should surface conflict and review flags before attempting aggressive semantic reconciliation |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Pending |
| FND-02 | Phase 1 | Pending |
| FND-03 | Phase 1 | Pending |
| SRC-01 | Phase 2 | Pending |
| SRC-02 | Phase 2 | Pending |
| SRC-03 | Phase 2 | Pending |
| SRC-04 | Phase 2 | Pending |
| ING-01 | Phase 2 | Pending |
| ING-03 | Phase 2 | Pending |
| TRST-02 | Phase 2 | Pending |
| ING-02 | Phase 3 | Pending |
| ING-04 | Phase 3 | Pending |
| ING-05 | Phase 3 | Pending |
| PAGE-01 | Phase 3 | Pending |
| PAGE-02 | Phase 3 | Pending |
| PAGE-03 | Phase 3 | Pending |
| PAGE-04 | Phase 3 | Pending |
| MNT-04 | Phase 3 | Pending |
| QRY-01 | Phase 4 | Pending |
| QRY-02 | Phase 4 | Pending |
| QRY-03 | Phase 4 | Pending |
| MNT-01 | Phase 5 | Pending |
| MNT-02 | Phase 5 | Pending |
| MNT-03 | Phase 5 | Pending |
| TRST-01 | Phase 5 | Pending |
| TRST-03 | Phase 5 | Pending |
| TRST-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-21*
*Last updated: 2026-04-21 after roadmap creation*
