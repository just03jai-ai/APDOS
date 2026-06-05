---
name: fmt-prd-writer
description: Generate senior-PM-grade Product Requirements Documents with discovery, user flows, edge cases, acceptance criteria, technical context, and measurable success criteria. Use when creating PRDs, documenting features, writing product specifications, turning rough requirements into build-ready product docs, or improving an existing PRD.
---

# PRD Writer

Create PRDs that are specific enough for engineering and product review. Operate like a senior product manager: clarify before drafting, make decisions explicit, expose unknowns, and close flow gaps.

## Quick Start

Minimal:
```text
Create a PRD for user authentication.
```

Configured:
```text
Create a PRD for payment integration:
- Template: 'Engineering PRD Template'
- Codebase: ~/repos/payment-service
- Documentation: Search for 'Payment Standards' and 'Checkout HLD'
- Save to: ~/repos/payment-service/docs/prds/
```

See [EXAMPLES.md](EXAMPLES.md) for more patterns and [REFERENCE.md](REFERENCE.md) for configuration details.

## Senior PM Operating Rules

1. **Run a discovery grill first**: Before drafting, use the `/grill-me` skill to ask focused questions one at a time until the main product decisions are clear. If `/grill-me` is unavailable, suggest installing it with `npx skills add https://github.com/mattpocock/skills --skill grill-me`; if it still is not available, run the equivalent questioning flow directly in `fmt-prd-writer`. Skip the grill only when the user explicitly says `Disable grill-me strictly`.
2. **Decide, do not decorate**: Every PRD section should make a decision, define a constraint, or identify a known open question.
3. **Verify the full flow**: Cover entry points, happy path, alternate paths, empty states, errors, permissions, notifications, data changes, audit/logging needs, rollback/recovery, and ownership handoffs.
4. **Separate product from implementation**: Specify what and why. Include technical context only where it constrains requirements or clarifies feasibility.
5. **Create the PRD only**: Do not create tickets, tasks, implementation plans, migrations, or code unless the user explicitly asks.

## Workflow

### 1. Parse Configuration

Check the request for:
- `Disable grill-me strictly`
- `Template: 'Name'`
- `Codebase: path/or/url`
- `Documentation: Search for 'Name'`
- `Database knowledge: url/or/path`
- `Save to: path/`
- `Filename: name.md`
- `Skip codebase analysis`
- `Skip documentation search`
- `Use flexible format`
- `Add section: 'Name'`
- `Add sections: 'Name' and 'Other name'`

Defaults:
- Discovery grill: enabled; use `/grill-me` before drafting unless the user explicitly says `Disable grill-me strictly`
- Discovery grill fallback 1: if `/grill-me` is unavailable, suggest installing it with `npx skills add https://github.com/mattpocock/skills --skill grill-me`
- Discovery grill fallback 2: if `/grill-me` remains unavailable, ask the same style of focused one-at-a-time discovery questions directly in `fmt-prd-writer`
- Template: exact Outline document named `PRD Template`
- Template mode: strict
- Save: Jira ticket workspace in the docs repo: `docs/tickets/<JIRA-KEY>-<slug>/prd.md`
- Documentation: search Outline directly unless skipped
- Codebase: analyze only if a codebase is mentioned or the feature clearly depends on existing behavior
- Database knowledge: fetch FarMart database knowledge only for FarMart, backend, API, reporting, analytics, migration, data-modeling, or explicitly database-related PRDs

### Jira Ticket Workspace Requirement

For FarMart PRDs, every PRD must be related to a Jira ticket.

1. Parse the Jira key from the request, such as `ENG-1234`, `FMOS-9803`, or another uppercase project key followed by a number.
2. If no Jira key is present, ask whether to create an exploratory PRD draft under `docs/thoughts/{name}/prd/` or wait for a Jira key. Resolve `name` from `docs/.env`.
3. Save the canonical Jira-linked PRD at:
   ```text
   docs/tickets/<JIRA-KEY>-<short-kebab-slug>/prd.md
   ```
4. Create the ticket workspace if needed, including `README.md`, `research/`, `decisions/`, `updates/`, `assets/`, and `change-log.md`.
5. If `docs/tickets/README.md` exists, follow its workspace convention.
6. If updating an existing PRD, update `prd.md` in place, update `change-log.md`, and add a concise update note under `updates/` for meaningful scope or decision changes.
7. Do not create new Jira-linked PRDs under personal folders like `docs/thoughts/{person}/prd/`.
8. Exploratory PRDs without a Jira ticket may live under `docs/thoughts/{name}/prd/YYYY-MM-DD-topic.md`; mark them with `status: exploratory` and `ticket: TBD`. Resolve `name` from `docs/.env`.
9. If an exploratory PRD later gets a Jira ticket, promote it into `docs/tickets/<JIRA-KEY>-<slug>/prd.md` and make the ticket workspace the source of truth.
10. If PRD changes affect technical design or QA coverage, call out that `hld.md`, `lld.md`, `implementation-plan.md`, and/or `test-plan.md` need updates.

### Docs Repo Workflow Awareness

When writing or updating PRDs in the FarMart docs repo:

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
4. Before reading or editing the ticket workspace, pull latest from the ticket branch:
   ```bash
   git fetch origin
   git checkout docs/<JIRA-KEY>-<short-kebab-slug>
   git pull --rebase origin docs/<JIRA-KEY>-<short-kebab-slug>
   ```
5. If the ticket branch does not exist, ask whether to create it from latest `main`.
6. Work directly on the ticket branch for normal PRD edits so other contributors can see changes before merge to `main`.
7. Use a personal branch only for risky, large, or experimental rewrites.
8. After making meaningful PRD changes, update `change-log.md`; add `updates/` or `decisions/` notes when relevant.
9. Do not create competing files like `prd-v2.md` or `final-prd.md`; update canonical `prd.md` in place.
10. Do not commit or push unless the user explicitly asks or confirms. If not committing, report the exact commit/push commands needed by the docs workflow.

### 2. Run Discovery Grill

Unless the user explicitly says `Disable grill-me strictly`, use the `/grill-me` skill before drafting.

Behavior:
1. Ask one question at a time and include a recommended answer, following `/grill-me`.
2. Use the grill to resolve the highest-risk product decisions first: target user, problem severity, success metric, scope boundaries, key flows, permissions, rollout constraints, and known edge cases.
3. If a question can be answered from codebase or documentation context, resolve it from those sources instead of asking the user.
4. Stop once the PRD can be drafted with a defensible set of decisions and only real residual unknowns remain.
5. If the user asked for a quick draft, keep the grill short and resolve only the most important blockers before drafting; mark the rest as `TBD`.
6. If `/grill-me` is unavailable, first suggest installing it with `npx skills add https://github.com/mattpocock/skills --skill grill-me` so the stronger shared discovery workflow can be used.
7. If `/grill-me` still is not available, do not stop. Run the same questioning layer directly inside `fmt-prd-writer`: ask one question at a time, include a recommended answer, prefer resolving questions from codebase/docs when possible, and stop when the remaining unknowns are real residuals.
8. If the user says `Disable grill-me strictly`, do not run `/grill-me`; ask only the minimum direct clarifications needed to avoid writing something misleading.

### 3. Gather Context

Use the highest-signal sources first:
1. User-provided requirements and constraints
2. Exact template from Outline
3. Explicitly referenced documents
4. Similar PRDs, HLDs, LLDs, architecture docs, and domain standards
5. Codebase analysis when relevant
6. Database knowledge when relevant

For Outline, use `outline_search_documents` directly. Do not route Outline search through another agent. Search for the feature name plus `PRD`, `HLD`, `LLD`, domain terms, and any documents the user names.

For codebases:
- Git URL: clone or inspect the repo if allowed
- Local path: inspect that path
- Codebase name: search common locations such as `/Users/*/`, `~/projects/`, `~/code/`, and `~/Documents/Projects/`
- If the repo cannot be found, ask for the path or URL

### 4. Resolve Template Rules

Template precedence:
1. If a specific `Template:` is provided, fetch that exact template.
2. Otherwise fetch the exact Outline document named `PRD Template`.
3. In strict mode, do not add, remove, rename, or reorder template sections.
4. `Add section:` or `Add sections:` is allowed only when the user explicitly requests it.
5. `Use flexible format` allows structure changes, but still preserve required product fundamentals: problem, users, goals, non-goals, user flows, requirements, acceptance criteria, metrics, risks, and open questions.
6. If the template cannot be fetched, stop and ask whether to retry, use a local/template excerpt, or switch to flexible format.

### 5. Draft The PRD

Write in Markdown suitable for Outline.

Quality requirements:
- Use sentence case for headings except the document title.
- Do not use horizontal rules, disclaimers, conclusions, or footers.
- Keep user stories and acceptance criteria testable.
- Prefer measurable thresholds over adjectives like fast, easy, intuitive, robust, or scalable.
- Mark unknown constraints as `TBD`.
- Include non-goals and out-of-scope items.
- Cover authentication/authorization whenever identity, roles, money, private data, or operational actions are involved.
- Cover error states, empty states, retry/recovery behavior, edge cases, and audit/observability needs where relevant.
- Ensure the user stories section remains the last section when the selected template expects it.

### 6. Senior PM Review Pass

Before saving, run this checklist:
- [ ] The problem statement explains why this matters now.
- [ ] Target users and permissions are explicit.
- [ ] The main user flow has no missing transition, dead end, or unclear owner.
- [ ] Alternate paths, edge cases, empty states, and failure states are covered.
- [ ] Acceptance criteria are observable and testable.
- [ ] Success metrics are measurable and tied to the problem.
- [ ] Non-goals prevent scope creep.
- [ ] Technical context is accurate and does not over-prescribe implementation.
- [ ] Open questions are limited to real unknowns that cannot be resolved from available context.

### 7. Save Document

Create the save directory if needed, save the PRD to the configured location, and report the file path. For Jira-linked FarMart docs repo work, use `docs/tickets/<JIRA-KEY>-<slug>/prd.md`. For explicitly exploratory unticketed work, use `docs/thoughts/{name}/prd/YYYY-MM-DD-topic.md` where `name` comes from `docs/.env`, and mark it as non-canonical.
