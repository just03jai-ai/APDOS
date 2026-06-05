# Configuration Reference

Detailed configuration and quality rules for `fmt-prd-writer`.

## Configuration Options

### 1. Discovery grill

Controls whether `fmt-prd-writer` runs a pre-draft `/grill-me` pass.

**Default**: enabled

**Syntax**:
```text
Disable grill-me strictly
```

**Behavior**:
1. By default, use `/grill-me` before drafting to surface hidden assumptions, decision gaps, and edge cases.
2. Ask one question at a time and provide a recommended answer, matching `/grill-me`.
3. If a question can be resolved by codebase or document analysis, resolve it there instead of asking the user.
4. If `/grill-me` is unavailable, first suggest installing it with `npx skills add https://github.com/mattpocock/skills --skill grill-me`.
5. If `/grill-me` remains unavailable, run the same one-at-a-time discovery interview directly inside `fmt-prd-writer` instead of stopping.
6. For quick drafts, keep the grill short and resolve only the highest-risk blockers before drafting.
7. `Disable grill-me strictly` is an explicit opt-out. When present, do not run `/grill-me`; ask only direct blocker clarifications needed to avoid misleading requirements.

### 2. Template source

Controls the PRD structure.

**Default**: exact Outline document named `PRD Template`

**Syntax**:
```text
Template: 'Engineering PRD Template'
Template: 'Minimal PRD Template'
Use flexible format
Add section: 'Security considerations'
Add sections: 'Security considerations' and 'Rollout plan'
```

**Precedence**:
1. `Template:` chooses the exact Outline template to fetch.
2. Without `Template:`, fetch `PRD Template`.
3. Strict mode is the default. Do not add, remove, rename, or reorder sections.
4. `Add section:` or `Add sections:` permits only the named section additions.
5. `Use flexible format` allows structure changes but must still include core PRD fundamentals.
6. If the requested template is unavailable, ask whether to retry, use a provided template excerpt, or switch to flexible format.

### 3. Save location

Determines where the PRD file is saved.

**Default**: `~/Documents/Projects/draft-prds/`

**Syntax**:
```text
Save to: ~/my-prds/
Save to: /absolute/path/to/docs/
Save to: ./docs/prds/
Filename: checkout-recovery-prd.md
```

Create the directory if needed. Ask for clarification if the location is ambiguous or unwritable.

### 4. Codebase analysis

Use codebase analysis when the PRD depends on existing product behavior, APIs, UI flows, data models, permissions, or integrations.

**Syntax**:
```text
Codebase: ~/repos/my-app
Codebase: /absolute/path/to/code
Codebase: https://github.com/org/repo
Skip codebase analysis
```

**Behavior**:
- Git URLs: clone or inspect the repository if allowed.
- Local paths: inspect directly.
- Codebase names: search `/Users/*/`, `~/projects/`, `~/code/`, and `~/Documents/Projects/`.
- If not found, ask for the path or URL.

Use available codebase-analysis agents/tools for implementation details, relevant files, and existing patterns. Do not invent implementation constraints.

### 5. Documentation search

Search existing docs for consistency and context.

**Default**: use `outline_search_documents` directly unless skipped.

**Syntax**:
```text
Documentation: Search for 'API Architecture'
Documentation: Search for 'Auth Guide' and 'Security Standards'
Skip documentation search
```

Search terms should include the feature name, domain terms, `PRD`, `HLD`, `LLD`, and documents explicitly named by the user.

### 6. Database knowledge

Use database knowledge only when it is relevant.

**Default**: fetch FarMart database knowledge for FarMart, backend, API, reporting, analytics, migration, data-modeling, or explicitly database-related PRDs.

**Syntax**:
```text
Database knowledge: https://farmart.getoutline.com/doc/os-database-knowledge-41z12bCjRa
Database knowledge: ~/path/to/custom-db-doc.md
Skip database knowledge
```

Do not inject FarMart schema into unrelated, non-FarMart, greenfield, frontend-only, or generic product PRDs unless the user asks for it.

Use database knowledge to:
- Identify existing tables, relationships, ownership, and constraints
- Avoid duplicate entities and inconsistent naming
- Describe required data changes accurately
- Flag migration, audit, privacy, and reporting implications

### 7. Output format

The supported output is Markdown suitable for Outline and version control.

If the user asks for another format, save Markdown first and explain that export requires a separate tool or follow-up workflow.

## Core PRD Fundamentals

Even in flexible format, include:
- Problem statement and why now
- Target users/personas
- Goals and non-goals
- Main flow and alternate flows
- Functional requirements
- User stories and acceptance criteria
- Permissions, privacy, and compliance needs where relevant
- Success metrics
- Risks, dependencies, and open questions

## Senior PM Quality Bar

### Discovery

By default, start with a `/grill-me` pass unless the user explicitly says `Disable grill-me strictly`. If `/grill-me` is unavailable, suggest installing it first with `npx skills add https://github.com/mattpocock/skills --skill grill-me`, then fall back to the same discovery interview directly in `fmt-prd-writer`.

Use the discovery phase to resolve:
- Primary user and buyer/stakeholder
- Problem severity and evidence
- Business goal and success metric
- Platforms/modules affected
- Scope boundaries and non-goals
- Launch constraints, timelines, or dependencies
- Required template and save location
- Important edge cases, failure modes, and policy constraints

If the user wants a quick draft, ask only the most important blocker questions unless `Disable grill-me strictly` is present, then proceed with `TBD` markers and list open questions.

### Flow integrity

For every important user journey, check:
- Entry point
- Eligibility and permission checks
- Happy path
- Alternate path
- Empty state
- Error state
- Retry/recovery path
- Cancellation or rollback
- Notifications or confirmations
- Data/audit/logging changes
- Owner of handoff to another module/team

### Edge cases

Consider these categories before finalizing:
- First-time user, returning user, restricted user, admin/operator
- Missing, stale, duplicated, invalid, or conflicting data
- Network/API timeout or partial failure
- Concurrent edits or race conditions
- Permission changes mid-flow
- Idempotency for payments, orders, status changes, or external calls
- Localization, currency, unit, date/time, and timezone issues
- Mobile/desktop differences where relevant
- Privacy, retention, export, and deletion requirements
- Observability, support tooling, and audit trail needs

### Acceptance criteria

Acceptance criteria should be:
- Observable by QA or analytics
- Specific enough to test
- Written in outcome language
- Inclusive of errors and edge cases
- Traceable to a user story or requirement

Avoid:
```text
The flow should be fast and intuitive.
```

Prefer:
```text
Given a user with an expired session, when they submit the form, then the system preserves entered data and redirects them to login within 1 second before resuming submission.
```

## Troubleshooting

### Template not found

Ask whether to:
1. Retry the exact template lookup
2. Use a user-provided template excerpt
3. Switch to flexible format

### Codebase not found

Ask for an explicit local path or Git URL. Do not guess architectural constraints from repo names alone.

### Documentation search unavailable

Proceed only if the user approves a draft without documentation context. Mark assumptions and open questions.

### Save location invalid

Ask for a new path or use `~/Documents/Projects/draft-prds/` if the user accepts the default.
