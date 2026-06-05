---
name: fmt-test-plan-writer
description: Create or update Jira-linked manual QA test plans for FarMart ticket workspaces using a local 14-column test case table. Use when the user needs test scenarios, manual test cases, regression coverage, QA sign-off criteria, test data, environment notes, or edge-case coverage derived from a PRD, HLD, LLD, Jira ticket, or implementation scope.
metadata:
  short-description: Write manual QA test plans
---

# Test Plan Writer

Create manual-QA-ready test plans within the scope of a Jira ticket. Operate like a senior QA engineer: translate product requirements and technical scope into executable scenarios, precise test cases, realistic test data needs, environment coverage, regression checks, and sign-off criteria.

## When to Use

Use this skill when the user asks to:

- write a test plan for a Jira ticket
- create manual QA scenarios or test cases
- review PRD, HLD, LLD, and implementation-plan coverage from a QA perspective
- identify edge cases, negative cases, permissions cases, and regression risks
- prepare QA sign-off criteria before release
- convert acceptance criteria into test cases
- update an existing ticket's QA plan after PRD, HLD, LLD, implementation-plan, or scope changes

## Core Rule: Stay Within Ticket Scope

Every test plan must belong to a Jira ticket workspace:

```text
docs/tickets/<JIRA-KEY>-<short-kebab-slug>/test-plan.md
```

If the request does not include a Jira ticket key, ask whether to create exploratory QA notes under `docs/thoughts/{name}/plans/` or wait for a Jira key. Resolve `name` from `docs/.env`.

If `docs/tickets/README.md` exists, follow its workspace convention for Jira-linked test plans. If `docs/thoughts/README.md` exists, follow it for exploratory unticketed QA notes.

## Docs Repo Workflow Awareness

When writing or updating manual QA test plans in the FarMart docs repo:

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
6. Work directly on the ticket branch for normal test-plan edits so other contributors can see changes before merge to `main`.
7. Use a personal branch only for risky, large, or experimental rewrites.
8. After meaningful QA-plan changes, update `change-log.md`; add `updates/` notes for QA findings, execution feedback, or stakeholder changes, and `decisions/` records when test strategy or expected behavior changes.
9. Do not create competing files like `test-plan-v2.md` or `final-test-plan.md`; update canonical `test-plan.md` in place.
10. Exploratory QA notes without a Jira ticket may live under `docs/thoughts/{name}/plans/YYYY-MM-DD-qa-topic.md`; mark them with `status: exploratory` and `ticket: TBD`. Resolve `name` from `docs/.env`.
11. If exploratory QA notes later get a Jira ticket, promote the relevant content into `docs/tickets/<JIRA-KEY>-<slug>/test-plan.md`.
12. Do not commit or push unless the user explicitly asks or confirms. If not committing, report the exact commit/push commands needed by the docs workflow.

## Inputs to Read First

Before drafting, read the highest-signal documents that exist in the ticket workspace:

1. `README.md` — ticket summary, current status, contributors, open questions
2. `prd.md` — product requirements, flows, acceptance criteria, non-goals
3. `hld.md` — high-level design, system context, integrations, non-functional constraints
4. `lld.md` — detailed design contracts, API/event/job behavior, validation, permissions, errors
5. `implementation-plan.md` — implementation approach, phased rollout, affected files/systems
6. `change-log.md` — meaningful changes since initial drafts
7. `research/` — relevant research notes
8. `decisions/` — product/technical decisions
9. `updates/` — meaningful scope or requirement changes
10. [`assets/knowledge/dumps/`](assets/knowledge/dumps/) — optional historical QA references only when a subfolder clearly matches the current feature/domain; do **not** read every dump by default

Also read any user-provided Jira text, screenshots, API contracts, designs, or release notes. When consulting historical QA dumps, prefer summary files such as `index.csv`, `scenarios.csv`, or `rtm.csv` before detailed testcase exports.

Do not invent requirements. If a critical requirement is missing, mark it as `TBD` and add it to the test plan's open questions.

## Output Location

Create or update:

```text
docs/tickets/<JIRA-KEY>-<short-kebab-slug>/test-plan.md
```

For meaningful updates to an existing test plan, also add a short note under:

```text
docs/tickets/<JIRA-KEY>-<short-kebab-slug>/updates/YYYY-MM-DD-author-test-plan-update.md
```

## Test Plan Structure

Use this structure unless the user asks for a different format:

```markdown
---
date: [ISO datetime with timezone]
created_at: YYYY-MM-DD::HH-MM
created_by: [QA author name]
updated_at: YYYY-MM-DD::HH-MM
updated_by: [QA author name]
ticket: [JIRA-KEY]
status: draft
source_prd: docs/tickets/[JIRA-KEY]-[slug]/prd.md
source_hld: docs/tickets/[JIRA-KEY]-[slug]/hld.md
source_lld: docs/tickets/[JIRA-KEY]-[slug]/lld.md
source_implementation_plan: docs/tickets/[JIRA-KEY]-[slug]/implementation-plan.md
tags:
  - test-plan
  - manual-qa
---

# [JIRA-KEY]: [Feature name] test plan

## Overview

## Scope

### In scope

### Out of scope

## Source documents

## Assumptions and open questions

## Test environments

## Test data requirements

## User roles and permissions

## Test cases

[insert the canonical local 14-column markdown table — see format below]

## Regression coverage

## Edge and negative cases

## Cross-platform or compatibility coverage

## Release and rollback checks

## QA sign-off criteria

## Traceability matrix
```

## Local Test Case Table Format (required)

Before writing test cases, read [`references/test-case-sheet-format.md`](references/test-case-sheet-format.md).

### Rules

1. **All test cases** in `test-plan.md` must use the **14-column local markdown table** below — same headers, same order, every time.
2. **One row per test case.** Put the scenario name in **Test Scenario**; do not use a separate scenario-only section unless the user explicitly asks.
3. **Never leave a cell empty.** Use `N/A` when a field or whole column does not apply (see reference file).
4. **Plan-wide N/A:** If a column does not apply to the ticket at all (e.g. **Platform** for backend-only), set that column to `N/A` on **every row**, and note it above the table under `**Column applicability:**`.
5. Put preconditions, numbered steps, and test data inside **Test Case Description** (see reference file).
6. Test cases must be executable by manual QA without reading source code.
7. **Dropdown columns** must use only the allowed values in [`references/test-case-sheet-format.md`](references/test-case-sheet-format.md).
8. Keep the canonical test cases local to `test-plan.md`. Do **not** add external spreadsheet links, paste instructions, or CSV companion blocks unless the user explicitly asks for an additional local export artifact.

### Allowed dropdown values

| Column | Allowed values |
| ------ | -------------- |
| **Platform** | `FMT Pro`, `FarMartOS`, `FarMartApp`, `Saudabook App`, or plan-wide `N/A` |
| **Severity** | `S0`, `S1`, `S2` |
| **Test Type** | `Functionality`, `Flow`, `Design`, `Usability`, `Suggestions` (suggestions-only cases) |
| **Positive / Negative** | `Positive`, `Negative` |
| **Action Performed By** | `FC`, `RPM`, `SH`, `Logistics`, `KYC Analyst`, `MISS`, `VP`, `AP`, `HR`, `Warehouse_Manager` |
| **Status** | `Not Executed`, `In Progress`, `Pass`, `Fail`, `Blocked` |
| **Developer Assigned** | `Yatender`, or `N/A` (see reference if assignee not in sheet list) |

Do not use `P0`/`P1`/`P2` for Severity. Do not invent platform or role values outside this list unless this skill's local reference is updated first.

### Required table

```markdown
**Column applicability:** [List any plan-wide N/A columns, or "All columns applicable."]

| Test Case ID | Test Scenario | Platform | Module | Test Case Description | Severity | Test Type | Positive / Negative | Expected Result | Action Performed By | Status | Developer Assigned | Developer Test CheckList | Comments |
| ------------ | ------------- | -------- | ------ | --------------------- | -------- | --------- | ------------------- | --------------- | ------------------- | ------ | ------------------ | ------------------------ | -------- |
| TC-001 | [Scenario name] | [Platform or N/A] | [Module] | Preconditions: …<br>Steps: 1. … 2. …<br>Test data: … | S0 | Functionality | Positive | [Observable result] | FC | Not Executed | N/A | N/A | N/A |
```

### Local-first storage

The markdown table in `test-plan.md` is the **canonical** test case artifact.

If the user explicitly asks for an additional local export such as `.csv`, create it inside the ticket folder as a companion artifact and keep the markdown table canonical.

### Column quick reference

| Column | Notes |
| ------ | ----- |
| Test Case ID | `TC-001`, `TC-002`, … — preserve on updates |
| Test Scenario | Flow / feature grouping for the row |
| Platform | Dropdown: `FMT Pro`, `FarMartOS`, `FarMartApp`, `Saudabook App`, or plan-wide `N/A` |
| Module | Screen, service, or API area |
| Test Case Description | Preconditions + steps + test data |
| Severity | Dropdown: `S0` / `S1` / `S2` |
| Test Type | Dropdown: `Functionality`, `Flow`, `Design`, `Usability`, `Suggestions` |
| Positive / Negative | Dropdown: `Positive` / `Negative` |
| Expected Result | Observable outcome |
| Action Performed By | Dropdown: `FC`, `RPM`, `SH`, … (see table above) |
| Status | Dropdown: `Not Executed` on create; `Pass` / `Fail` / `Blocked` / `In Progress` |
| Developer Assigned | Dropdown: `Yatender` or `N/A` |
| Developer Test CheckList | Checklist text or `N/A` |
| Comments | Notes or `N/A` |

## Coverage Checklist

Before finalizing, ensure the plan covers all relevant areas:

### Product flow coverage

- [ ] Main happy path
- [ ] Alternate paths
- [ ] Empty states
- [ ] Error states
- [ ] Retry/recovery behavior
- [ ] Validation messages
- [ ] Permissions and unauthorized access
- [ ] Notifications, emails, SMS, WhatsApp, push, or Slack alerts if relevant
- [ ] Audit/logging/analytics expectations if visible to QA or release validation

### Technical impact coverage

- [ ] Backend/API behavior
- [ ] Frontend/UI behavior
- [ ] Mobile or responsive behavior
- [ ] Data creation/update/deletion
- [ ] Background jobs, queues, or scheduled jobs
- [ ] Third-party integrations
- [ ] Feature flags or environment-specific behavior
- [ ] Migration or backward compatibility behavior

### QA execution coverage

- [ ] All test cases use the 14-column local markdown table
- [ ] No external spreadsheet link or spreadsheet-specific workflow is required
- [ ] Dropdown columns use only allowed local values (`S0`–`S2`, not `P0`–`P2`)
- [ ] No empty cells; plan-wide and row-level `N/A` used correctly
- [ ] Test data is realistic and explicitly listed (in **Test Case Description** or **Comments**)
- [ ] Required environments are listed: local/dev/stage/prod-smoke as applicable
- [ ] Required user roles/accounts are listed
- [ ] Regression areas are identified
- [ ] Release smoke checks are identified
- [ ] Rollback checks are identified when applicable
- [ ] Open questions are real unknowns, not missing analysis

## Prioritization

Use **Severity** dropdown values consistently:

- `S0`: Release-blocking core flow or severe data/security risk
- `S1`: Important supported flow or common edge case
- `S2`: Lower-risk edge case, cosmetic issue, or rare path

## Traceability Matrix

Map requirements to **Test Scenario** names and **Test Case ID** values:

```markdown
| Requirement / acceptance criteria | Test Scenario | Test Case ID | Status |
| --------------------------------- | ------------- | ------------ | ------ |
| User can submit order successfully | Order checkout – happy path | TC-001, TC-002 | covered |
```

If a requirement is not testable, call it out and suggest wording that would make it testable.

## Update Workflow

When updating an existing `test-plan.md`:

1. Read the current test plan fully.
2. Read updated `prd.md`, `hld.md`, `lld.md`, `implementation-plan.md`, `change-log.md`, and recent `updates/` notes.
3. Modify the canonical `test-plan.md` in place.
4. Update frontmatter `updated_at` and `updated_by`.
5. Add or update `last_updated_note` when the change is meaningful.
6. Add an update note in `updates/` for major changes in scope, test strategy, or release risk.
7. Preserve existing test case IDs where possible so QA execution history remains understandable.

## What Not to Do

- Do not create implementation code.
- Do not write automation scripts unless the user explicitly asks.
- Do not expand scope beyond the Jira ticket, PRD, or tech spec.
- Do not invent acceptance criteria or business rules.
- Do not mark a requirement as covered unless a scenario/test case verifies it.
- Do not create competing test plan files for the same ticket unless explicitly requested.
- Do not use the legacy 8-column test case table or leave local table cells empty.
- Do not omit plan-wide `N/A` when a column does not apply to the ticket.
- Do not add external spreadsheet links, paste instructions, or spreadsheet-only workflow steps by default.
- Do not create companion CSV or spreadsheet artifacts unless the user explicitly asks.
- Do not use values outside the local allowed lists (except `N/A` where allowed).

## Final Response Expectations

When reporting back to the user:

- Provide the path to `test-plan.md`.
- Summarize test case count and distinct **Test Scenario** count.
- List any plan-wide `N/A` columns.
- Highlight S0/S1 coverage.
- Confirm the local markdown table is the canonical artifact.
- List open questions or blocked test areas.
- Mention any source documents used.

---

**Version**: 1.2.0
**Last Updated**: 2026-05-27
**Maintainer**: FarMart Engineering
