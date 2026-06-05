# LLD guide

`lld.md` is the low-level design. It explains how the chosen architecture behaves at module, API, data-contract, event, job, validation, permission, and error-handling levels.

## Output path

```text
docs/tickets/<JIRA-KEY>-<slug>/lld.md
```

## Scope

Include:

- detailed design scope
- API contracts
- event, queue, webhook, or job contracts
- data model and schema design
- validation rules
- error behavior
- state transitions
- permissions and authorization
- idempotency and concurrency
- backward compatibility and migrations
- observability and audit events
- performance considerations
- testability notes

Do not include:

- file-by-file implementation tasks
- detailed code snippets
- tactical refactor checklist
- phase sequencing

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
source_hld: docs/tickets/[JIRA-KEY]-[slug]/hld.md
tags:
  - lld
  - technical-design
---

# [JIRA-KEY]: [Feature name] LLD

## Overview

[Detailed behavior summary.]

## Design scope

### In scope

### Out of scope

## Detailed flows

### Flow 1: [Name]

1. [Step]
2. [Step]

## API contracts

### [METHOD] [path]

**Purpose:**

**Request:**

```json
{}
```

**Response:**

```json
{}
```

**Errors:**

| Status/code | Condition | Response behavior |
| ----------- | --------- | ----------------- |
| TBD | TBD | TBD |

## Event, queue, or job contracts

| Contract | Producer | Consumer | Payload | Retry/idempotency |
| -------- | -------- | -------- | ------- | ----------------- |
| TBD | TBD | TBD | TBD | TBD |

## Data model and schema design

[Describe entities, fields, indexes, relationships, and migration constraints at design level.]

## State transitions

```text
state_a -> state_b -> state_c
```

## Validation rules

| Field/action | Rule | Error behavior |
| ------------ | ---- | -------------- |
| TBD | TBD | TBD |

## Error handling

[Expected errors, fallback behavior, retries, user-facing messages, alerting behavior.]

## Permissions and authorization

| Actor/role | Allowed actions | Denied actions |
| ---------- | --------------- | -------------- |
| TBD | TBD | TBD |

## Idempotency and concurrency

[Duplicate request handling, retries, locks, race conditions, consistency guarantees.]

## Backward compatibility and migrations

[Compatibility constraints, rollout safety, old clients/data behavior.]

## Observability and audit events

| Signal | When emitted | Fields | Owner |
| ------ | ------------ | ------ | ----- |
| TBD | TBD | TBD | TBD |

## Performance considerations

[Expected scale, query behavior, caching, pagination, batch size, limits.]

## Testability notes

[What QA and automation need to verify.]

## Open questions

- [Question]

## References

- PRD: [prd.md](./prd.md)
- HLD: [hld.md](./hld.md)
```

## Review checklist

- [ ] Are contracts precise enough for implementation and QA?
- [ ] Are validation and error behaviors testable?
- [ ] Are permissions explicit?
- [ ] Are migration/backward-compatibility concerns covered?
- [ ] Are idempotency/concurrency risks addressed?
- [ ] Is observability designed, not bolted on later?
- [ ] Is LLD free from phased implementation tasks?
