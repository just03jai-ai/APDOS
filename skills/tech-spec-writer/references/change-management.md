# Change management guide

Use this guide when late discoveries, stakeholder feedback, QA findings, or PR review comments change the docs after initial drafts.

## Canonical docs stay current

The current truth always lives in:

```text
prd.md
hld.md
lld.md
implementation-plan.md
test-plan.md
```

Do not create competing final files such as:

```text
prd-v2.md
hld-v2.md
final-lld.md
updated-plan.md
test-plan-final.md
```

Update canonical docs in place.

## Change history is captured separately

For meaningful changes:

1. Update the relevant canonical doc in place.
2. Add or update `change-log.md`.
3. Add a decision record under `decisions/` if the change affects architecture, product behavior, data model, security, compatibility, scope, rollout, or test strategy.
4. Add an update note under `updates/` for stakeholder feedback, meeting notes, PR review discoveries, implementation discoveries, or QA findings.
5. Update ticket workspace `README.md` status/open questions/contributors if needed.
6. Propagate downstream doc impacts.

## Change log format

```markdown
# Change log

| Date | Author | Source | Summary | Docs updated | Decision link |
| ---- | ------ | ------ | ------- | ------------ | ------------- |
| 2026-05-09 | Deepak Mishra | Stakeholder feedback / Jira / PR / QA | What changed and why | prd.md, hld.md, lld.md, implementation-plan.md, test-plan.md | decisions/2026-05-09-title.md |
```

## Impact propagation rules

- PRD changes may require HLD, LLD, implementation-plan, and test-plan updates.
- HLD changes usually require LLD and implementation-plan updates.
- LLD changes usually require implementation-plan and test-plan updates.
- Implementation discoveries may require HLD/LLD updates if they change the design, not just execution steps.
- QA findings may require PRD, LLD, or implementation-plan updates if expected behavior is unclear or incorrect.

## Decisions vs updates

Use `decisions/` when the note answers:

- What did we choose?
- Why did we choose it?
- What alternatives were considered?
- What are the consequences?

Use `updates/` when the note answers:

- What happened?
- Who gave feedback?
- What changed or needs attention?
- What context should future contributors know?

## Decision record template

```markdown
# [Decision title]

## Status

Proposed | Accepted | Superseded

## Context

## Decision

## Alternatives considered

## Consequences

## References
```

## Update note template

```markdown
# [Update title]

## Date

YYYY-MM-DD

## Source

Stakeholder / PR review / QA / implementation discovery / meeting

## Summary

## Impact

## Follow-up
```
