---
name: fmt-repo-router
description: >
  Route FarMart tasks from the multi-repo workspace root to the right repository
  and likely adjacent repos before editing. Use when Codex is asked to implement,
  debug, review, research, or plan a change from any parent directory that
  contains multiple FarMart repos, when the owning repo is unclear, or when a
  change may touch multiple FarMart repos such as frontend, backend, mobile,
  crons, QA automation, shared UI, docs, logging, GitHub Actions, or feature
  flags.
---

# FarMart Repo Router

## Overview

Use this skill before code search or edits when the user starts from the FarMart
workspace root or describes a product behavior rather than a repository. The goal
is to pick the right repo with evidence, then name concrete adjacent repos when
the change may cross boundaries.

## Routing Workflow

1. Classify the task by product surface and capability:
   - UI, API/backend, mobile/native, scheduled job, communication, tracking,
     shared component, observability, docs, CI/release, QA automation, or tool.
2. Read [references/repo-map.md](references/repo-map.md) and choose candidate
   repos. Start broad if the request is ambiguous.
3. Verify ownership before editing. Use repo-scoped code search for route names,
   package names, API paths, feature terms, env vars, queue names, migration
   names, and component imports.
4. After choosing the owner repo, briefly name adjacent repos that may be
   affected. Keep this concrete: API consumers, backend providers, automation
   tests, shared UI packages, crons, or docs.
5. Load companion skills only after routing:
   - UI or design-system work: `fmt-design-system`
   - logging/tracing: `farmart-chronolog-logging`
   - `farmartos-backend`: `fmt-farmartos-backend-contributor`
   - `crons`: `fmt-crons-contributor`
   - PRD/HLD/LLD/implementation/test docs: writer skills
   - branch, commit, push, PR, release flow: `fmt-git-guardian`

## Evidence Standard

Do not make a code edit from workspace-root intuition alone. Before editing,
collect at least one concrete ownership signal:

- a matching route, screen, controller, endpoint, job, worker, package, migration,
  test suite, environment variable, or README/agent doc in the candidate repo
- a caller/consumer relationship between repos when the work crosses boundaries

If evidence points to multiple repos, state the primary repo and secondary impact
repos before editing. If evidence is weak or contradictory, ask one concise
ownership question instead of guessing.

## Common Search Scopes

From the parent workspace, search likely repo groups first:

- OS web/API terms: `farmartos-frontend`, `farmartos-backend`
- Mobile-web/app terms: `mono-farmart-web`, `farmart-app-backend`
- Communication terms: `communication-service`
- Tracking/trip/consent terms: `tracking-service-backend`, `mono-farmart-web`
- Scheduled job terms: `crons`

Use whatever code-search tool is available in the environment. Narrow to likely
repos first to avoid matching generated files, build output, or unrelated legacy
copies.

## Guardrails

- Do not create repo-specific skills as a substitute for this first-mile routing.
- Do not duplicate full repo docs into context. Load the repo's README, CLAUDE,
  AGENTS, or docs only after choosing candidate repos.
- Do not make broad abstract impact maps. Name only the adjacent repos supported
  by evidence from code search or repo docs.
- Do not edit generated build artifacts, `node_modules`, `dist`, or coverage
  output while routing.
- Do not checkout, reset, or pull over dirty worktrees. If latest base is needed
  and the repo is dirty, inspect `origin/<base>` or use a temporary worktree.
- Do not assume `Farmart Pro` means one repo. It may mean `farmartos-frontend`
  PWA, `mono-farmart-web`, or legacy/native `farmart-pro-v2`; verify with terms.
