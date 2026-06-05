# HLD guide

`hld.md` is the high-level design. It explains what architecture we are choosing and why.

## Output path

```text
docs/tickets/<JIRA-KEY>-<slug>/hld.md
```

## Scope

Include:

- problem and design goals
- non-goals
- current state summary
- proposed architecture
- system context
- component responsibilities
- key flows and data movement
- integrations and dependencies
- non-functional requirements
- security and compliance considerations
- observability approach
- alternatives considered
- risks and mitigations
- assumptions and open questions

Do not include:

- file-by-file implementation details
- exact function names unless part of an external/public contract
- detailed code snippets
- step-by-step implementation phases
- tactical refactor steps

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
source_prd: docs/tickets/[JIRA-KEY]-[slug]/prd.md
tags:
  - hld
  - technical-design
---

# [JIRA-KEY]: [Feature name] HLD

## Overview

[Short summary of the technical direction and why it exists.]

## Goals

- [Goal]

## Non-goals

- [Explicit out-of-scope item]

## Current state

[What exists today. Include file:line references where claims depend on code.]

## Proposed design

[High-level architecture and major design choices.]

## System context

[Systems/users/services involved and how they relate.]

## Component responsibilities

| Component | Responsibility | Notes |
| --------- | -------------- | ----- |
| TBD | TBD | TBD |

## Key flows

### Flow 1: [Name]

1. [Step]
2. [Step]

## Data movement

[Describe what data moves between systems, not detailed schema implementation.]

## Integrations and dependencies

- [External/internal dependency]

## Non-functional requirements

### Performance

### Reliability

### Scalability

### Security

### Observability

## Security and compliance

[Auth, permissions, PII, auditability, compliance constraints.]

## Observability

[Logs, metrics, traces, dashboards, alerts at design level.]

## Alternatives considered

| Option | Pros | Cons | Decision |
| ------ | ---- | ---- | -------- |
| TBD | TBD | TBD | TBD |

## Risks and mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| TBD | TBD | TBD |

## Assumptions and open questions

- [Assumption/question]

## References

- PRD: [prd.md](./prd.md)
- Research: [research/...](./research/)
```

## Review checklist

- [ ] Does the HLD explain why this architecture is chosen?
- [ ] Are alternatives and tradeoffs documented?
- [ ] Are non-goals explicit?
- [ ] Are current-state claims backed by references?
- [ ] Are major flows understandable without code?
- [ ] Are risks and mitigations practical?
- [ ] Is HLD free from file-by-file implementation details?
