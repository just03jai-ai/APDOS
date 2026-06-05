# Implementation plan guide

`implementation-plan.md` is the phased engineering execution plan. It explains how to implement and verify the approved PRD/HLD/LLD.

Unlike `hld.md` and `lld.md`, this document may contain specific implementation tasks and likely file/module areas.

## Output path

```text
docs/tickets/<JIRA-KEY>-<slug>/implementation-plan.md
```

## Scope

Include:

- implementation principles
- dependencies and prerequisites
- phases and sequencing
- affected repositories and likely files/modules
- implementation tasks
- automated verification
- manual verification
- rollout plan
- rollback plan
- ownership
- pause points for human confirmation

Do not include unresolved design questions in a final/approved implementation plan. If questions remain, keep status as `draft` and mark blockers clearly.

## Template

```markdown
---
date: [ISO datetime with timezone]
created_at: YYYY-MM-DD::HH-MM
created_by: [Author]
updated_at: YYYY-MM-DD::HH-MM
updated_by: [Author]
ticket: [JIRA-KEY]
status: draft
priority: [high/medium/low]
estimated_effort: [story points or time estimate]
source_prd: docs/tickets/[JIRA-KEY]-[slug]/prd.md
source_hld: docs/tickets/[JIRA-KEY]-[slug]/hld.md
source_lld: docs/tickets/[JIRA-KEY]-[slug]/lld.md
sources:
  - repository: docs
    branch: [Branch]
    commit: [Commit]
    remote: [Remote]
tags:
  - implementation-plan
---

# [JIRA-KEY]: [Feature name] implementation plan

## Overview

[What will be implemented and how this plan is organized.]

## Current state analysis

[Current implementation facts with file:line references.]

## Desired end state

[What is true after implementation completes and how to verify it.]

## What we're not doing

- [Out of scope]

## Implementation principles

- [Principle]

## Dependencies and prerequisites

- [Dependency]

## Phase 1: [Name]

### Objective

[What this phase accomplishes.]

### Scope

[What is included/excluded in this phase.]

### Likely files or modules

| Repo | Area/file | Expected change |
| ---- | --------- | --------------- |
| TBD | TBD | TBD |

### Tasks

- [ ] [Task]

### Automated verification

- [ ] [Command/check]

### Manual verification

- [ ] [Human verification]

### Rollback notes

[How to safely undo or disable this phase.]

### Pause point

Pause after automated verification passes and get human confirmation before moving to the next phase.

## Phase 2: [Name]

[Repeat phase structure.]

## Rollout plan

[Environment sequence, feature flags, release candidate flow.]

## Rollback plan

[Rollback procedure and ownership.]

## Validation strategy

### Automated verification

### Manual verification

## Ownership

| Area | Owner | Notes |
| ---- | ----- | ----- |
| TBD | TBD | TBD |

## References

- PRD: [prd.md](./prd.md)
- HLD: [hld.md](./hld.md)
- LLD: [lld.md](./lld.md)
```

## Phase writing rules

- Keep phases incremental and independently verifiable.
- Put risky migrations or contract changes early enough to validate safely.
- Include rollback notes for every phase.
- Include automated and manual verification separately.
- Add a pause point after phases that require human/QA validation.

## Common phase patterns

### Database changes

1. Schema/migration design
2. Backward-compatible model updates
3. Read path support
4. Write path support
5. Backfill/migration
6. Cleanup after verification

### New backend feature

1. Data model/contracts
2. Service and DAL logic
3. API/job/queue entrypoints
4. Observability and guardrails
5. Tests and rollout

### New frontend feature

1. Route/state/data contract alignment
2. Reusable UI components
3. Feature integration
4. Empty/error/loading states
5. Responsive/manual QA pass

### Refactor

1. Document current behavior
2. Add safety tests or smoke checks
3. Introduce new path behind compatibility layer
4. Move consumers incrementally
5. Remove old path after verification

## Review checklist

- [ ] Does every phase have clear output?
- [ ] Are automated and manual checks separated?
- [ ] Is rollout clear?
- [ ] Is rollback possible or explicitly constrained?
- [ ] Are owners/dependencies clear?
- [ ] Are all design decisions resolved or marked as blockers?
- [ ] Are HLD/LLD references aligned with the plan?
