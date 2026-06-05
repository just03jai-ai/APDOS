---
name: fmt-implement-plan
description: Execute approved FarMart implementation plans from Jira ticket workspaces. Use when implementing docs/tickets/<JIRA-KEY>-slug/implementation-plan.md phase by phase, syncing with the docs ticket branch, validating against PRD/HLD/LLD/test-plan, updating progress, and handling plan-vs-code reality gaps.
metadata:
  short-description: Implement approved ticket plans
---

# Implement Plan

Execute an approved FarMart implementation plan safely and systematically.

Primary input:

```text
docs/tickets/<JIRA-KEY>-<slug>/implementation-plan.md
```

This skill ties implementation back to the complete ticket story:

```text
prd.md                    # what and why
hld.md                    # high-level architecture
lld.md                    # detailed behavior/contracts
implementation-plan.md    # phased execution plan
test-plan.md              # manual QA expectations
change-log.md             # meaningful changes over time
decisions/                # decision rationale
updates/                  # stakeholder/QA/implementation discoveries
```

## When to Use

Use this skill when the user asks to:

- implement an approved `implementation-plan.md`
- execute a phase from a Jira ticket workspace
- resume a partially completed implementation plan
- verify plan completion with automated and manual criteria
- reconcile an implementation plan with codebase reality
- update ticket docs after delayed implementation discoveries

## Required Companion Skills

Load these when relevant:

- `fmt-git-guardian` for branch, commit, PR, release candidate, and MC branch workflow.
- Repo contributor skill such as `fmt-crons-contributor` or `fmt-farmartos-backend-contributor` when implementing in a specific repo.
- `fmt-tech-spec-writer` when implementation discoveries require HLD/LLD/implementation-plan changes.
- `fmt-test-plan-writer` when implementation changes alter QA scenarios or expected behavior.

## Pre-flight: Read the Ticket Story

Before changing code, read these files fully when they exist:

1. `docs/tickets/<JIRA-KEY>-<slug>/README.md`
2. `docs/tickets/<JIRA-KEY>-<slug>/prd.md`
3. `docs/tickets/<JIRA-KEY>-<slug>/hld.md`
4. `docs/tickets/<JIRA-KEY>-<slug>/lld.md`
5. `docs/tickets/<JIRA-KEY>-<slug>/implementation-plan.md`
6. `docs/tickets/<JIRA-KEY>-<slug>/test-plan.md`
7. `docs/tickets/<JIRA-KEY>-<slug>/change-log.md`
8. Relevant files under `research/`, `decisions/`, and `updates/`

Do not implement from `implementation-plan.md` alone if the other canonical docs exist. The plan is the execution guide, but PRD/HLD/LLD/test-plan define the story and constraints.

## Docs Branch Sync

For Jira-linked docs, use the shared ticket branch:

```text
docs/<JIRA-KEY>-<short-kebab-slug>
```

Before reading or editing ticket docs:

```bash
git fetch origin
git checkout docs/<JIRA-KEY>-<short-kebab-slug>
git pull --rebase origin docs/<JIRA-KEY>-<short-kebab-slug>
```

Do not commit or push docs changes unless the user explicitly asks or confirms. If not committing, report exact commit/push commands.

## Process

### Phase 1: Plan analysis

1. Read the full implementation plan.
2. Check existing checkboxes (`- [x]`) to identify completed work.
3. Read referenced source files, docs, and research fully enough to verify current state.
4. Identify:
   - phases and dependencies
   - affected repositories
   - expected branches
   - automated verification
   - manual verification
   - rollout/rollback steps
   - pause points
5. Create an implementation todo list from unchecked plan tasks.

### Phase 2: Code repo setup

For each affected code repo:

1. Read repo instructions: `AGENTS.md`, README, package scripts, repo-specific skill.
2. Inspect branch state:
   ```bash
   git status
   git branch --show-current
   git fetch origin
   ```
3. Confirm correct branch strategy using `fmt-git-guardian`:
   - development branch from production branch (`prod` / `main` / `master`)
   - backend release candidate flow when promoting
   - frontend release candidate + Shipyard flow when promoting
   - no direct push to `dev`, `stage`, `prod`, `main`, or `master`
4. Do not create or switch branches destructively without user confirmation when local changes exist.

### Phase 3: Implement one phase at a time

For each phase:

1. Re-read the phase objective and success criteria.
2. Implement only that phase's scope.
3. Follow existing codebase patterns, not just the written plan.
4. Keep changes small enough to review.
5. Do not silently expand scope.

### Phase 4: Handle plan-vs-reality mismatches

If the plan does not match the codebase:

1. Stop and investigate.
2. Identify whether the mismatch is:
   - code drift since the plan was written
   - incorrect plan assumption
   - hidden requirement
   - missing HLD/LLD decision
   - implementation constraint
   - QA expectation mismatch
3. Present the mismatch clearly:

```markdown
Issue in Phase [N]

Expected from implementation-plan.md:
[what the plan says]

Found in code/docs:
[actual situation with file:line references]

Impact:
[why this matters]

Recommended options:
1. [Option A]
2. [Option B]

Docs that may need updates:
- hld.md / lld.md / implementation-plan.md / test-plan.md / change-log.md

How should I proceed?
```

Do not push through a meaningful design mismatch without user confirmation.

### Phase 5: Verification

After each phase, run automated verification from the plan and repo scripts.

Examples:

```bash
pnpm lint
pnpm test
pnpm check
npm run lint
npm test
pytest
```

Then separate results:

```markdown
## Phase [N] automated verification

Passed:
- [command]

Failed:
- [command and reason]

Not run:
- [command and why]
```

Manual verification belongs to humans/QA. Do not check manual items unless the user confirms.

Pause unless the user explicitly asked to continue:

```markdown
Phase [N] is ready for manual verification.

Automated verification completed:
- [checks]

Manual verification needed:
- [items from implementation-plan.md and test-plan.md]

Please confirm when manual testing is complete so I can proceed.
```

### Phase 6: Progress updates

When a phase is complete:

1. Update checkboxes in `implementation-plan.md` only for completed automated items.
2. Leave manual checkboxes unchecked until confirmed.
3. Update `change-log.md` if implementation changed scope, design, rollout, or QA expectations.
4. Add `updates/` note for implementation discoveries.
5. Add `decisions/` record if a design decision changed.
6. Call out if `hld.md`, `lld.md`, or `test-plan.md` needs updating.

## Resuming Work

If the plan already has completed checkboxes:

1. Trust completed work by default.
2. Resume from the first unchecked task.
3. Verify previous work only if something appears inconsistent.
4. Read `change-log.md` and recent `updates/` before continuing.

## Commit and PR Guidance

Use `fmt-git-guardian`.

Commit messages must be conventional and include Jira key:

```text
feat(FMOS-9803): add job registry validation
fix(FMOS-9803): preserve legacy cron proxy behavior
docs(FMOS-9803): update implementation progress
```

Do not commit/push unless the user explicitly asks or confirms. If asked to commit:

1. Show `git status`.
2. Ensure no secrets, `.env`, generated binaries, or unrelated files are staged.
3. Run relevant checks.
4. Commit small logical changes.
5. Push to the correct non-protected branch.

## What Not to Do

- Do not implement from stale plans without reading `change-log.md` and updates.
- Do not mark manual verification complete without user confirmation.
- Do not skip HLD/LLD constraints because the implementation plan is more tactical.
- Do not silently change scope.
- Do not directly push to protected branches.
- Do not create duplicate final docs like `implementation-plan-v2.md`.
- Do not ignore QA implications; update or flag `test-plan.md` when behavior changes.

## Final Response Expectations

When reporting back:

- State ticket and phase worked on.
- List files changed by repo.
- Summarize implementation done.
- List automated checks run and results.
- List manual verification still needed.
- List docs updated or docs that need updates.
- State current branch and whether anything was committed/pushed.
- If not committed/pushed, provide exact next git commands.

---

**Version**: 2.0.0
**Last Updated**: 2026-05-09
**Maintainer**: FarMart Engineering
