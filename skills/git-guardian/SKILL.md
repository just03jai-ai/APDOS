---
name: fmt-git-guardian
description: Guide FarMart git workflows for docs and code repos. Use when creating branches, syncing with remote, committing, pushing, opening PRs, running release candidate flows, resolving merge conflicts, using MC branches, or deciding whether to use docs ticket branches, release branches, hotfix branches, or feature/task/bug branches.
metadata:
  short-description: Guard FarMart git workflow
---

# Git Guardian

Use this skill to keep FarMart git workflows safe, fast, and consistent across documentation and code repositories.

## When to Use

Use this skill when the user asks to:

- create or choose a branch
- sync with remote changes
- commit or push changes
- open or prepare a PR
- merge docs ticket branches to `main`
- collaborate with multiple people on one Jira ticket
- resolve push rejection, rebase, or merge conflicts
- decide whether to work directly on a shared branch or use a personal branch
- understand FarMart docs repo workflow

## Core Principles

1. **Never push directly to protected environment branches** (`prod`, `stage`, `dev`, `main`, `master`) unless repo owners explicitly instruct it.
2. **Use PRs for promotion** into `dev`, `stage`, `prod`, `main`, and `master`.
3. **Code repos use merge commits** for PR merges and branch sync unless a repo-specific owner says otherwise.
4. **Pull before reading/editing shared docs** so the agent sees the latest state.
5. **Push soon after meaningful docs changes** so collaborators can see updates.
6. **Do not force-push shared branches** unless all active collaborators agree.
7. **Use `--force-with-lease`, never plain `--force`, and only on personal branches unless coordinated.**
8. **Use conventional commits and include Jira keys when work is ticketed.**
9. **Keep commits small and scoped.**
10. **Do not commit secrets, `.env`, credentials, generated binaries, or private data.**

## FarMart Docs Repo Workflow

The docs repo has two active workspaces:

```text
docs/tickets/<JIRA-KEY>-<slug>/   # Jira-linked source of truth
docs/thoughts/<name>/             # exploratory unticketed work
```

Contributor identity comes from `docs/.env`, not from the active git branch:

```bash
cd docs
test -f .env || cp .env.example .env
grep '^name=' .env
```

`docs/.env` must not be committed.

### Jira-linked ticket work

For Jira-linked docs, use one shared ticket branch:

```text
docs/<JIRA-KEY>-<short-kebab-slug>
```

Example:

```text
docs/FMOS-9803-crons-cleanup-standardization
```

Create it from latest `main`:

```bash
git fetch origin
git checkout main
git pull --rebase origin main
git checkout -b docs/FMOS-9803-crons-cleanup-standardization
git push -u origin docs/FMOS-9803-crons-cleanup-standardization
```

### Pull-before-read, push-after-write loop

When working on a shared docs ticket branch:

```bash
# 1. Pull latest before reading or editing
git fetch origin
git checkout docs/FMOS-9803-crons-cleanup-standardization
git pull --rebase origin docs/FMOS-9803-crons-cleanup-standardization

# 2. Read latest ticket files and edit

# 3. Commit and push meaningful changes quickly
git add docs/tickets/FMOS-9803-crons-cleanup-standardization
git commit -m "docs(FMOS-9803): update HLD after stakeholder feedback"
git push origin docs/FMOS-9803-crons-cleanup-standardization
```

Push after meaningful edits to:

- `prd.md`
- `hld.md`
- `lld.md`
- `implementation-plan.md`
- `test-plan.md`
- `change-log.md`
- `README.md`
- `research/`
- `decisions/`
- `updates/`
- `assets/`

### Personal branches in docs

Personal branches are optional for docs and should be used only when changes are:

- risky
- large
- experimental
- likely to temporarily break canonical docs

Example:

```text
deepak.mishra/FMOS-9803-rewrite-hld
```

Merge back into the shared ticket branch as soon as the work is useful.

### Merge docs ticket branch to main

When ticket docs are coherent enough to become reviewed source of truth:

```text
docs/<JIRA-KEY>-<slug> -> main
```

PR checklist:

- PR title includes Jira key.
- Description lists docs changed and why.
- Canonical docs are updated in place, not duplicated.
- `change-log.md` is updated for meaningful changes.
- `decisions/` and `updates/` are linked when relevant.
- Reviewer checks consistency across PRD, HLD, LLD, implementation plan, and test plan.

After merge:

```bash
git checkout main
git pull --rebase origin main
```

If more ticket work is needed after merge, recreate or refresh the ticket branch from latest `main` in coordination with active contributors.

## Exploratory Docs Workflow

Exploratory unticketed work can live under:

```text
docs/thoughts/<name>/
```

where `name` comes from `docs/.env`.

For exploratory work, a personal branch is fine:

```text
<name>/exploratory-<short-topic>
```

Example:

```text
deepak.mishra/exploratory-system-token-prd
```

When an exploratory doc gets a Jira key, promote the relevant content into:

```text
docs/tickets/<JIRA-KEY>-<slug>/
```

## Code Repository Workflow

FarMart code repos are converging on three protected environment branches:

```text
prod   # production-ready branch; may be named main or master in older repos
stage  # staging / pre-production verification branch
dev    # development integration branch
```

Existing repos may still use different names. Always inspect the repo and confirm the actual protected branches before creating PRs.

### Development task types and branch prefixes

Jira work usually falls into one of these types:

| Prefix | Meaning | Jira type | Use when |
| ------ | ------- | --------- | -------- |
| `F` | Feature | Story | Building a new user-visible feature or meaningful feature change |
| `T` | Task | Task | Adding scoped functionality or technical work inside an existing feature |
| `B` | Bug | Bug | Fixing incorrect or unexpected behavior |
| `HOTFIX` | Hotfix | Bug/incident | Urgent production fix |
| `RELEASE` | Release candidate | Release coordination | Clubbing one or more approved feature/task/bug branches for stage/prod promotion |
| `MC` | Merge conflict | Conflict resolution | Resolving conflicts between a base env branch and a head branch |

Recommended feature/task/bug branch format:

```text
<F|T|B>-<JIRA-KEY>-<short-kebab-description>
```

Examples:

```text
F-FMOS-9803-crons-cleanup-standardization
T-FMCA-4234-add-view-count-guardrails
B-FMCA-4234-fix-view-count-tracking
```

Hotfix format:

```text
HOTFIX-<JIRA-KEY>-<short-kebab-description>
```

Example:

```text
HOTFIX-FMOS-1234-fix-prod-login-failure
```

### Branch cut base

Cut development branches from the production branch:

```text
prod / main / master
```

Example:

```bash
git fetch origin
git checkout prod       # or main/master, depending on repo
git pull origin prod    # use merge commits; do not rebase shared/protected branches
git checkout -b F-FMOS-9803-crons-cleanup-standardization
```

### Backend release candidate workflow

Backend repos generally use `dev`, `stage`, and `prod` branches.

Flow:

1. Create feature/task/bug branch from production branch.
2. Develop locally and push regularly.
3. Open PR from feature/task/bug branch to `dev`.
4. Dev testing happens on `dev`.
5. When dev testing passes, create a release branch from `prod`.
6. Merge feature/task/bug branches into the release branch via PRs so human reviews are visible.
7. Open PR from release branch to `stage`.
8. QA verifies on stage.
9. Open PR from the same release branch to `prod`.
10. Merge with merge commits.

Release branch naming:

```text
RELEASE-<JIRA-KEY>-<short-kebab-description>
```

For grouped releases with multiple Jira tickets, use a date or release scope:

```text
RELEASE-2026-05-09-crons-cleanup
RELEASE-FMOS-9803-FMCA-4234-platform-cleanup
```

No direct push to `dev`, `stage`, or `prod`; always use PRs.

### Frontend release candidate workflow

Frontend repos may not need persistent `dev` or `stage` branches. The stable production branch is typically `prod` / `main` / `master`.

Flow:

1. Create feature/task/bug branch from production branch.
2. Create release branch from production branch.
3. Open PR from feature branch to release branch so GitHub human reviews are visible.
4. Multiple feature branches can be clubbed into the same release branch.
5. Deploy the release branch to dev or stage environments using Shipyard.
6. After QA passes in stage, open PR from release branch to production branch.
7. Merge with merge commits.

No direct push to production branches.

### Environment deployments

Backend:

```text
dev branch   -> dev environment
stage branch -> stage environment
prod branch  -> production environment
```

Frontend:

```text
prod/main/master -> production environment
any release/feature branch -> deployable to assumed dev/stage env through Shipyard
```

### Hotfix workflow

Use hotfixes for urgent production fixes:

```text
HOTFIX-<JIRA-KEY>-<short-kebab-description>
```

Flow:

1. Cut hotfix from production branch.
2. Implement and validate locally.
3. PR hotfix to `stage` first for a quick check.
4. After stage verification, PR the same hotfix branch to `prod`.
5. Back-merge or include the hotfix in active release/dev flows as needed so environments do not drift.

### Before making changes

```bash
git status
git branch --show-current
git fetch origin
```

Before committing:

```bash
git status
git diff --stat
git diff
```

Run relevant checks for the repo before pushing. Examples:

```bash
pnpm lint
pnpm test
pnpm check
npm run lint
npm test
pytest
```

Use repo-specific instructions from `AGENTS.md`, package scripts, and contributor docs.

### Pending repo-specific guidance

The detailed code review expectations, PR size/stacking rules, and repo-specific exceptions are still evolving. Until they are finalized, follow repo-local `AGENTS.md`, package scripts, PR templates, team lead instructions, and the safety checks in this skill.

## Commit Message Rules

Use conventional commits and include the Jira key for ticketed work.

Format:

```text
<type>(<JIRA-KEY>): <imperative summary>
```

Common types:

| Type | Use for |
| ---- | ------- |
| `feat` | User-visible feature or meaningful capability |
| `fix` | Bug fix |
| `docs` | Documentation-only change |
| `test` | Tests or QA automation |
| `refactor` | Behavior-preserving code restructuring |
| `perf` | Performance improvement |
| `chore` | Tooling, config, maintenance |
| `ci` | CI/CD changes |
| `build` | Build system or dependency changes |
| `style` | Formatting-only changes |

Examples:

```text
docs(FMOS-9803): add CRONs cleanup HLD
docs(FMOS-9803): update QA test plan after review
feat(FMOS-9803): add job registry validation
fix(FMOS-9803): preserve legacy cron proxy route
chore(FMOS-9803): normalize env docs
```

Good commits are:

- conventional
- small
- reviewable
- scoped to one logical change
- descriptive enough to understand without opening the diff

## Safe Sync Commands

### Update current branch from its upstream in code repos

Use merge commits for code repos:

```bash
git pull
```

or explicitly:

```bash
git fetch origin
git merge origin/<branch-name>
```

### Update shared docs ticket branch

For docs ticket branches, pull latest before reading/editing:

```bash
git fetch origin
git checkout docs/<JIRA-KEY>-<slug>
git pull --rebase origin docs/<JIRA-KEY>-<slug>
```

The docs branch workflow optimizes for fast Markdown collaboration. Do not rebase or force-push a shared branch after pushing commits unless all active contributors agree.

### Push current branch

```bash
git push origin HEAD
```

### First push with upstream

```bash
git push -u origin HEAD
```

### After rewriting a personal branch

```bash
git push --force-with-lease origin HEAD
```

Do not use `--force`.

## Conflict Handling

### What is a merge conflict?

A merge conflict happens when Git cannot automatically combine changes, usually because two branches edited the same lines or one branch deleted a file that another branch changed.

### Code repo MC branch convention

When a PR into an environment branch has conflicts, create a merge-conflict branch named:

```text
MC-<dev|stage|prod>-<head-branch-name>
```

This makes it clear the MC branch exists to resolve conflicts between the base environment branch and the head branch.

Examples:

```text
MC-dev-F-FMOS-9803-crons-cleanup-standardization
MC-stage-RELEASE-FMOS-9803-crons-cleanup-standardization
MC-prod-HOTFIX-FMOS-1234-fix-prod-login-failure
```

Flow:

1. Checkout the target/base branch (`dev`, `stage`, or `prod`).
2. Pull latest target branch.
3. Create the MC branch from the target branch.
4. Merge the head branch into the MC branch.
5. Resolve conflicts locally with the relevant teammate(s).
6. Commit and push the MC branch.
7. Open PR from MC branch to the target branch.
8. Delete the MC branch after merge.

Example:

```bash
git fetch origin
git checkout stage
git pull origin stage
git checkout -b MC-stage-RELEASE-FMOS-9803-crons-cleanup-standardization
git merge origin/RELEASE-FMOS-9803-crons-cleanup-standardization
# resolve conflicts
git status
git diff
git add <resolved-files>
git commit -m "chore(FMOS-9803): resolve stage release merge conflicts"
git push -u origin MC-stage-RELEASE-FMOS-9803-crons-cleanup-standardization
```

### General conflict rules

1. Stop and read the conflict.
2. Preserve canonical docs unless the user explicitly asked to replace them.
3. For docs conflicts, prefer combining non-overlapping updates rather than choosing one side blindly.
4. For code conflicts, understand both branches before choosing either side.
5. Update `change-log.md` when conflict resolution changes canonical docs meaningfully.
6. Run `git status` before continuing.
7. If unsure, ask before resolving.

## Safety Checks Before Commit or Push

Always inspect:

```bash
git status
git diff --stat
git diff --cached --stat
```

Before committing, ensure:

- no secrets or `.env` files are staged
- no unrelated files are staged
- no generated binaries are staged unless explicitly expected
- docs paths are correct (`docs/tickets/` for Jira-linked, `docs/thoughts/` for exploratory)
- canonical docs are updated in place
- `change-log.md` is updated for meaningful ticket-doc changes

## What Not to Do

- Do not infer contributor identity from branch name.
- Do not commit `docs/.env`.
- Do not push directly to `prod`, `stage`, `dev`, `main`, or `master`.
- Do not create duplicate final docs like `hld-v2.md` or `final-prd.md`.
- Do not force-push shared docs ticket branches without explicit coordination.
- Do not silently overwrite another contributor's canonical docs.
- Do not leave meaningful docs changes only on a local machine during active collaboration.

## Final Response Expectations

When reporting git work back to the user:

- State current branch.
- State whether the branch was synced with remote.
- List commits created, if any.
- List files staged/changed.
- List checks run.
- If not pushed, provide exact push command.
- If a PR is needed, state source branch and target branch.

---

**Version**: 1.0.0
**Last Updated**: 2026-05-09
**Maintainer**: FarMart Engineering
