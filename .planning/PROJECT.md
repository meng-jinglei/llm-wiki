# llm-wiki

## What This Is

llm-wiki is evolving from a Claude Code skill spec into a practical personal knowledge workflow that gets closer to Karpathy's LLM Wiki pattern. It should help a single user ingest new sources into an Obsidian-backed wiki as persistent, interlinked knowledge, while remaining easy enough for friends to try with low setup friction.

## Core Value

A new source should reliably produce meaningful incremental updates across the wiki instead of becoming a one-off summary.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Single-source ingest consistently updates multiple durable wiki surfaces, not just a source summary.
- [ ] The wiki structure and workflow make accumulated knowledge easier to maintain over time.
- [ ] The system remains approachable enough that another Claude Code user can try it without heavy setup.

### Out of Scope

- Full hosted multi-user product — the near-term goal is a strong local workflow, not a shared SaaS.
- Enterprise-scale ingestion pipeline — the current goal is personal-first compounding knowledge, not large-org data infrastructure.

## Context

The current repository contains a publishable Claude Code skill, templates, and example vault files. It demonstrates the LLM Wiki pattern, but it does not yet deliver the stronger behavior described in Karpathy's article: persistent accumulation, disciplined incremental maintenance, and a wiki that becomes more useful as more sources and questions pass through it.

The first real user is the project owner, but the output should also be simple enough that friends can try the skill. That creates a tension between stronger capabilities and low setup friction. The current priority is to improve ingest quality first: when a new source arrives, the system should reliably update source, entity, concept, overview, index, and log surfaces where appropriate.

The desired v1 win condition is stable incremental behavior. Repeated ingests of related material should feel like the wiki is being maintained and extended, not regenerated from scratch each time.

## Constraints

- **Runtime**: Must work well within Claude Code and an Obsidian-style local vault — this is the current operating model.
- **Adoption**: Setup should stay lightweight enough for friends to try — zero- or low-friction onboarding matters.
- **Repository starting point**: Current repo is mostly skill/schema/templates, not a full implementation — the roadmap must account for building missing runtime support.
- **Priority**: Ingest quality comes before broader optimizations like advanced search or enterprise workflows — because the first must-win is stable multi-page incremental ingest.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Optimize for a stronger local workflow before a larger product surface | The first user is the project owner, and the repository already starts as a local Claude Code skill | — Pending |
| Prioritize durable multi-page ingest as the first must-win | This is the clearest gap between the current repo and the target LLM Wiki experience | — Pending |
| Keep trialability for friends as a design constraint | Better capabilities should not make the system too hard to adopt | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-21 after initialization*
