---
name: fmt-tech-spec-writer
description: Create or update Jira-linked technical design documents for FarMart ticket workspaces. Use when the user needs an HLD, LLD, implementation plan, phased rollout, technical approach, architecture decision, or updates caused by delayed discoveries or stakeholder feedback.
metadata:
  short-description: Write HLD, LLD, and implementation plans
---

# Tech Spec Writer

Create cohesive technical design documentation for a Jira ticket.

Canonical outputs:

```text
docs/tickets/<JIRA-KEY>-<short-kebab-slug>/hld.md
docs/tickets/<JIRA-KEY>-<short-kebab-slug>/lld.md
docs/tickets/<JIRA-KEY>-<short-kebab-slug>/implementation-plan.md
```

## Required Reference Files

Before writing or updating docs, read the relevant reference files from this skill:

1. [`references/planning-process.md`](references/planning-process.md) — interactive research, discovery, option alignment, outline approval, and implementation-plan quality rules.
2. [`references/hld.md`](references/hld.md) — HLD scope, template, and review checklist.
3. [`references/lld.md`](references/lld.md) — LLD scope, template, and review checklist.
4. [`references/implementation-plan.md`](references/implementation-plan.md) — phased implementation-plan template and success criteria rules.
5. [`references/change-management.md`](references/change-management.md) — canonical-doc update model, `change-log.md`, `decisions/`, and `updates/`.

If the task is only about one doc type, read `planning-process.md`, `change-management.md`, and that doc-specific reference.

## What I Do

I turn PRDs, Jira requirements, research, codebase context, and stakeholder feedback into three connected engineering documents:

1. **`hld.md`** — High-level design: system context, components, flows, integrations, data movement, non-functional constraints, risks, and alternatives.
2. **`lld.md`** — Low-level design: detailed design contracts, data model changes, API/event contracts, state transitions, validation/error behavior, security, observability, and compatibility constraints.
3. **`implementation-plan.md`** — Phased execution plan: implementation sequence, affected repos/files, validation steps, rollout, rollback, and ownership.

## Document Boundaries

- HLD answers: **what architecture are we choosing and why?**
- LLD answers: **how does the chosen design behave at contract/data/module level?**
- Implementation plan answers: **how will engineering implement, verify, roll out, and roll back the approved design?**

Keep HLD and LLD free from file-by-file implementation details. Put tactical execution details in `implementation-plan.md`.

## When to Use

Use this skill when the user asks to:

- write or update an HLD
- write or update an LLD
- create a technical specification for a Jira ticket
- turn a PRD into engineering design documents
- create a phased implementation plan
- document architecture decisions and tradeoffs
- update technical docs after feedback, late discoveries, or scope changes

## Required Ticket Workspace

Every Jira-linked HLD, LLD, and implementation plan must belong to a Jira ticket workspace:

```text
docs/tickets/<JIRA-KEY>-<short-kebab-slug>/
```

If the request does not include a Jira key, ask whether to create exploratory technical notes under `docs/thoughts/{name}/plans/` or wait for a Jira key. Resolve `name` from `docs/.env`.

If `docs/tickets/README.md` exists, follow its workspace convention for Jira-linked docs. If `docs/thoughts/README.md` exists, follow it for exploratory unticketed docs.

## Docs Repo Workflow Awareness

When writing or updating HLDs, LLDs, or implementation plans in the FarMart docs repo:

1. Read `docs/readme.md`, `docs/tickets/README.md`, `docs/thoughts/README.md`, and `docs/contributors.md` before creating or updating docs repo documents.
2. Resolve contributor identity from `docs/.env`, not from the active git branch:
   ```bash
   cd docs
   test -f .env || cp .env.example .env
   grep '^name=' .env
   ```
   Use `name=firstname.lastname` as the personal exploratory workspace directory and use `full_name` or `docs/contributors.md` for display names.
3. Use the shared ticket branch as the live collaboration branch:
   ```text
   docs/<JIRA-KEY>-<short-kebab-slug>
   ```
4. For Jira-linked work, before reading or editing the ticket workspace, pull latest from the ticket branch:
   ```bash
   git fetch origin
   git checkout docs/<JIRA-KEY>-<short-kebab-slug>
   git pull --rebase origin docs/<JIRA-KEY>-<short-kebab-slug>
   ```
5. If the ticket branch does not exist, ask whether to create it from latest `main`.
6. Work directly on the ticket branch for normal design-doc edits so other contributors can see changes before merge to `main`.
7. Use a personal branch only for risky, large, or experimental rewrites.
8. Do not commit or push unless the user explicitly asks or confirms. If not committing, report the exact commit/push commands needed by the docs workflow.

## Planning Process Requirements

Follow the interactive process in [`references/planning-process.md`](references/planning-process.md):

- Read all provided context files fully before spawning research.
- Research actual code patterns and current state before proposing design.
- Verify stakeholder corrections against docs/code when possible.
- Present understanding and focused questions before writing.
- Present design options for non-trivial choices.
- Present the doc/phase outline before detailed writing for large changes.
- Do not finalize an implementation plan with unresolved open questions.

## Inputs to Read First

Before drafting or updating, read relevant ticket workspace files that exist:

1. `README.md` — ticket hub, status, contributors, links, open questions
2. `prd.md` — product requirements and acceptance criteria
3. existing `hld.md`, `lld.md`, and `implementation-plan.md`
4. `test-plan.md` — QA coverage and execution risks
5. `research/` — supporting codebase or domain research
6. `decisions/` — ADR-style product/technical decisions
7. `updates/` — change notes from stakeholders or delayed discoveries
8. `change-log.md` — canonical chronological record of doc/design changes

Also read any explicitly provided Jira text, Slack decisions, PR comments, screenshots, designs, API contracts, logs, or code references.

## Change Maintenance Model

Use [`references/change-management.md`](references/change-management.md).

Summary:

- Update canonical docs in place.
- Do not create competing files like `hld-v2.md`, `final-lld.md`, or `updated-plan.md`.
- Update `change-log.md` for meaningful changes.
- Add `decisions/` records for architecture/product/contract changes.
- Add `updates/` notes for stakeholder feedback, implementation discoveries, PR feedback, or QA feedback.
- Propagate impacts across PRD, HLD, LLD, implementation plan, and test plan.

## Output Rules

For a full technical spec request, create or update all three:

```text
hld.md
lld.md
implementation-plan.md
```

For a targeted request, update only the requested doc plus any downstream docs that must change. Always call out downstream impact.

## Final Response Expectations

When reporting back:

- List which docs were created or updated: `hld.md`, `lld.md`, `implementation-plan.md`, `change-log.md`, decisions, updates.
- Summarize major design changes and why they changed.
- Mention downstream docs needing updates, especially PRD or test plan.
- List unresolved open questions.
- List commands/checks run, if any.
- If not committed/pushed, provide the exact git commands the docs workflow expects.

---

**Version**: 3.0.0
**Last Updated**: 2026-05-09
**Maintainer**: FarMart Engineering
