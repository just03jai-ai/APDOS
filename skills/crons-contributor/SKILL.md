---
name: fmt-crons-contributor
description: Contribute safely to FarMart CRONs. Use when adding, changing, testing, documenting, or reviewing jobs in the CRONs repo, including cron services, job registry metadata, schedules, env handling, lifecycle/status handling, scheduler API contracts, Go jobs, and operational runbooks.
---

# FarMart CRONs Contributor

Use this skill when working in the `CRONs/` repository. The goal is to make scheduled jobs safe to run, easy to operate, well documented, and consistent with the repo's current direct-runtime startup, explicit PM2 scripts, native ESM, pnpm, Biome, `APP_ENV`, job registry, lifecycle/status model, scheduler API versioning rules, and observability conventions.

## When to Use

Use this skill when the user asks to:

- add a new cron job or cron service
- change an existing job's behavior, schedule, or parameters
- update job metadata, job IDs, registry entries, or Mongo `JobConfig` reconciliation
- modify `runtimes/javascript/cron_services/**`, `jobs/**`, `server/api/scheduler/**`, `runtimes/go/**`, `metadata/**`, or `config/**`
- improve CRONs docs, service READMEs, runbooks, env handling, or operational alerts
- debug CRONs tests, ESM imports, Biome checks, direct startup, PM2 startup, SQS scheduling, Bull jobs, or worker execution
- review a CRONs PR for safety, idempotency, observability, lifecycle correctness, data-store impact, or deployment risk

## Required Context Before Changing Code

Before making recommendations or edits, read the relevant files from the repo. At minimum:

1. `CRONs/README.md`
2. `CRONs/docs/architecture.md`
3. `CRONs/docs/code-layout.md`
4. `CRONs/docs/environment.md`
5. `CRONs/docs/runtime-startup-flow.md`
6. `CRONs/docs/cron-service-readmes.md`
7. `CRONs/docs/new-job-boilerplate.md`
8. `CRONs/docs/job-status-lifecycle.md`
9. `CRONs/docs/scheduler-api-versioning.md`
10. `CRONs/package.json`

Then read task-specific docs:

- For inventory or job metadata: `CRONs/docs/inventory.md`
- For lifecycle/status work: `CRONs/docs/job-status-lifecycle.md`
- For scheduler API or downstream contract work: `CRONs/docs/scheduler-api-versioning.md`
- For business summary: `CRONs/docs/business-summary.md`
- For Go jobs: `CRONs/docs/go-jobs.md`
- For security or dependency changes: `CRONs/docs/security-audit-report.md` and `CRONs/docs/vulnerability-remediation-plan.md`
- For a JavaScript service change: `CRONs/runtimes/javascript/cron_services/<service>/README.md`

If the relevant docs conflict with code, inspect the code path and call out the mismatch before changing behavior.

## Repo Defaults

- Runtime: Node.js `22.22.2` via Volta.
- Package manager: `pnpm@10.33.0`.
- Module format: native ESM (`"type": "module"`).
- Lint/format/check: Biome.
- Naming direction: `lower_snake_case` for repo-owned variables, functions, constants, files, and folders where practical.
- Environment selector: `APP_ENV` is the FarMart business-environment selector. Current repo conventions center on `dev`, `stage`, and `prod` with tracked `.env.<mode>` files plus optional `.env.local` overrides.
- Local runtime: direct Node is the default local workflow.
- Process manager: PM2 is explicit via `*:pm2` scripts only.
- Schedules and active/inactive state: Mongo `JobConfig` is the operational source of truth.
- Code-owned registry: `jobs/registry/job_registry.js` uses snake_case fields such as `job_id`, `runner_type`, `service_directory`, `docs_path`, and `source_entrypoint`.
- Job config code ergonomics: use snake_case in application code (`job_id`, `current_run_status`, `active_cron_time`, etc.), but preserve legacy persisted Mongo keys via model aliases/translation. Do not opportunistically rename legacy persisted fields during normal runtime paths.
- Scheduler API base path: `/scheduler/api/v1`.
- Execution identity: `execution_id` is the logical run identifier; timestamps are for chronology/order.

## Canonical Execution Status Model

Use only these canonical statuses:

- `TRIGGERED`
- `SPAWNED`
- `RUNNING`
- `COMPLETED`
- `FAILED`
- `FAILED_TO_START`
- `SKIPPED`
- `TIMED_OUT`
- `CANCELLED`

Rules:

- legacy `PENDING` is normalized to `RUNNING` on read paths
- do not introduce new writers that emit `PENDING`
- use `SKIPPED` for intentional healthy no-op exits
- do not use `SKIPPED` to hide real failures

## Status Ownership Model

### Orchestrator / queue / worker owned

These statuses belong to the scheduler/orchestration layer:

- `TRIGGERED`
- `SPAWNED`
- `FAILED_TO_START`

Primary code paths:

- `jobs/queue/bull_scheduler.js`
- `jobs/runtime/spawn_child.js`
- `jobs/utils/update_job_status.js`

### JavaScript job owned

JavaScript jobs own business execution lifecycle through `jobLogger`:

- `RUNNING` via `jobLogger.start(...)`
- `COMPLETED` via `jobLogger.end(...)`
- `SKIPPED` via `jobLogger.skip(...)`
- `FAILED` via `jobLogger.error(...)`

Rules:

- `jobLogger.error(...)` is for whole-job failure only
- item-level failures inside loops/batches should use local logging / Chronolog / error helpers, not whole-job failure logging
- do not call `jobLogger.error(...)` and later `jobLogger.end(...)` for the same run

### Go job owned by child process with worker fallback

Go jobs do not call the JavaScript `jobLogger`, but they now participate in the same `joblogs` lifecycle contract from inside the Go process.

Go jobs receive shared run metadata through environment variables:

- `CRON_JOB_ID`
- `CRON_EXECUTION_ID`
- `CRON_TRIGGER_TIME`
- `CRON_TRIGGERED_BY`

Current Go ownership:

- Go process records `RUNNING`
- Go process records terminal status (`COMPLETED`, `SKIPPED`, or `FAILED`)
- worker keeps fallback ownership only for spawn/startup handoff failure cases and non-terminal exit reconciliation

Primary code path:

- `runtimes/go/internal/jobruntime/job_lifecycle.go`

## Common Commands

Run commands from `CRONs/` unless noted:

```bash
pnpm install
pnpm dev                           # Direct Node + watch using .env.dev (+ optional .env.local) with APP_ENV=dev
pnpm stage                         # Direct Node + watch using .env.stage (+ optional .env.local) with APP_ENV=stage
pnpm prod                          # Direct Node using .env.prod (+ optional .env.local) with APP_ENV=prod
pnpm dev:pm2                       # PM2 with CRONS_PM2_ENV=dev
pnpm stage:pm2                     # PM2 with CRONS_PM2_ENV=stage
pnpm prod:pm2                      # PM2 with CRONS_PM2_ENV=prod
pnpm test                          # Jest, passWithNoTests
pnpm test:coverage
pnpm lint                          # Biome lint + JS filename validation
pnpm lint:fix
pnpm check                         # Biome check + JS filename validation
pnpm check:fix
pnpm validate:js-filenames
pnpm validate:cron-inventory
pnpm validate:job-lifecycle
pnpm reconcile:job-config
pnpm migrate:legacy-job-data
pnpm migrate:legacy-job-config-data
pnpm build:go
pnpm validate:staged-binaries
```

Use direct `dev|stage|prod` for local development. Use explicit `*:pm2` commands in deployment/workflow automation.

## Workflow for a New or Changed Job

1. **Identify execution path**
   - Find the service directory under `runtimes/javascript/cron_services/<service>/` or the Go entrypoint under `runtimes/go/cmd/`.
   - Find registry metadata and any enum job ID definitions.
   - Find how the worker/scheduler invokes the job.
   - Find how lifecycle state is written for that runner type.

2. **Preserve operational safety**
   - Make jobs idempotent where possible.
   - Avoid duplicate external side effects on retries.
   - Use explicit guards around destructive updates, bulk writes, notifications, and third-party calls.
   - Add dry-run or scoped parameters when useful for safe local/dev execution.

3. **Use repo environment conventions**
   - Use `APP_ENV`, not `NODE_ENV`, for FarMart business environment selection.
   - Prefer `runtimes/javascript/config/app_config.js` in JavaScript code.
   - Prefer `app_config.env.*` for env-backed values and `app_config.secrets.*` for secret-backed values.
   - Treat `runtimes/javascript/config/env.js` as an internal config building block, not the default consumer import.
   - Keep non-secret defaults in tracked env files where appropriate.
   - Keep secrets in Secrets Manager / cron secret bundle, not committed files.
   - Do not create hidden behavior based on `.env.local` presence.

4. **Respect lifecycle ownership**
   - For JavaScript jobs, wire whole-job lifecycle through `jobLogger.start/end/skip/error`.
   - For Go jobs, use the Go lifecycle helper pattern, not JS `jobLogger`.
   - Keep `TRIGGERED`/`SPAWNED`/`FAILED_TO_START` in orchestrator-owned code.
   - Use `SKIPPED` for intentional no-op exits.
   - Do not introduce new status meanings inside `/scheduler/api/v1`.

5. **Update metadata and docs together**
   - Add or update stable job IDs.
   - Add or update job registry metadata.
   - Keep `docs_path` pointing to useful service documentation.
   - Update `runtimes/javascript/cron_services/<service>/README.md` with job IDs, entrypoints, parameters, dependencies, data stores, observability, runbook, failure modes, and owner/business context.

6. **Preserve scheduler API compatibility**
   - The current stable contract is `/scheduler/api/v1`.
   - Do not silently change request/response semantics within a version.
   - Breaking route/shape/semantic changes require a new versioned module tree.
   - When changing scheduler responses, consider downstream callers explicitly.

7. **Add tests for pure logic**
   - Extract pure transformation/decision logic where possible.
   - Use dependency injection or mocks instead of importing modules that connect to AWS, Redis, Mongo, MySQL, or external APIs at import time.
   - Keep tests deterministic and safe to run without production credentials.

8. **Validate**
   - Run the smallest useful test/check first.
   - Run `pnpm check` or at least `pnpm lint` for JS/doc changes.
   - Run `pnpm validate:job-lifecycle` when touching lifecycle expectations.
   - Run `pnpm validate:cron-inventory` when touching registry/job metadata/docs.
   - Run `pnpm build:go` and `pnpm validate:staged-binaries` when touching Go jobs.

## JavaScript Job Skeleton

Use this shape for simple Node.js job entrypoints and adapt it to the existing service style:

```js
import jobLogger from '../../logging/job_logger.js';
import jobIds from '../../metadata/enum/job_ids.js';

const job_id = jobIds.NEW_JOB_ID;
const pid = process.pid;

const main = async () => {
    try {
        await jobLogger.start(job_id, pid);

        // Add job logic here.

        await jobLogger.end(job_id, pid);
    } catch (error) {
        await jobLogger.error(job_id, pid, error);
        throw error;
    }
};

main();
```

If the job has a healthy no-op path, use `await jobLogger.skip(job_id, pid, reason)` instead of forcing `COMPLETED` or `FAILED`.

Follow nearby patterns if a service already has a stronger wrapper, shared helper, or dependency-injected structure.

## Go Job Guidance

For Go jobs:

- source lives under `runtimes/go/`
- built binaries belong in `bin/`
- do not commit generated binaries from `bin/` or ad-hoc compiled outputs from `runtimes/go/`
- after touching Go jobs, rebuild via `pnpm build:go`
- use the shared lifecycle helper under `runtimes/go/internal/jobruntime/job_lifecycle.go`
- keep scheduler trigger/spawn ownership in worker code; keep business execution lifecycle in the Go process

## Service README Checklist

Every cron service directory should have `README.md`. For new jobs or meaningful behavior changes, ensure the service README contains:

```md
# <Cron Service Name>

## Purpose

## Job IDs

## Entrypoints

## Schedule Source

Schedules are managed through Mongo `JobConfig`.

## Parameters

## External Dependencies

## Data Stores Touched

## Observability

## Safe Local/Dev Runbook

## Failure Modes and Alerts

## Owner / Business Context
```

## Review Checklist

Before finalizing a CRONs change, verify:

- [ ] Job ID is stable and documented.
- [ ] Registry metadata matches the source entrypoint and docs path.
- [ ] Schedule expectations are documented as Mongo `JobConfig` managed.
- [ ] The job is safe for retries or documents why it is not.
- [ ] External side effects are guarded, scoped, or idempotent.
- [ ] Secrets are not committed or moved into tracked env files.
- [ ] Code uses `APP_ENV`, not new `NODE_ENV` business-environment branching.
- [ ] No new writer emits legacy `PENDING`.
- [ ] Lifecycle uses canonical statuses only.
- [ ] JavaScript jobs use `jobLogger` correctly for whole-job lifecycle.
- [ ] Go jobs participate in child-owned lifecycle using shared execution metadata.
- [ ] Scheduler API changes preserve `/scheduler/api/v1` expectations unless a new version is intentionally introduced.
- [ ] Code uses snake_case `JobConfig` fields while preserving legacy persisted Mongo keys.
- [ ] Local/dev guidance uses direct Node scripts; PM2 is explicit only.
- [ ] Local/dev runbook is specific enough for another engineer to execute safely.
- [ ] Failure modes and alerts are documented.
- [ ] Relevant tests and checks were run or explicitly skipped with a reason.

## Do / Don't

### Do

- Read the service README, lifecycle docs, and nearby code before editing.
- Keep behavior-compatible refactors small and reviewable.
- Prefer pure helpers plus small IO wrappers.
- Use explicit batching, concurrency limits, and pagination for large datasets.
- Log counts, job IDs, parameters, `execution_id`, and safe correlation context where useful.
- Use timestamps for chronology and `execution_id` for run identity.
- Document touched data stores and external systems.
- Preserve backward compatibility for existing job IDs and operational schedules unless the user explicitly requests migration.
- Keep recent-activity fidelity in mind when changing run metadata fields.

### Don't

- Don't add new business-environment selection through `NODE_ENV`.
- Don't commit credentials, generated reports, or ad-hoc output files.
- Don't build Go binaries inside `runtimes/go/` and commit them.
- Don't stage compiled binaries in guarded artifact paths.
- Don't add import-time connections to external systems in modules that tests may import.
- Don't silently change schedules, job IDs, status semantics, or active/inactive semantics.
- Don't remove or rename legacy jobs without an explicit migration and rollback plan.
- Don't mutate legacy persisted `jobconfigs` keys during normal runtime code paths.
- Don't silently repurpose `/scheduler/api/v1` fields or routes for a breaking contract.
- Don't reintroduce hidden startup behavior or make PM2 the implied local default.

## Output Expectations

When reporting back to the user:

- List the files changed.
- Summarize operational impact and any schedule/registry/doc/lifecycle changes.
- List commands run and their results.
- Call out skipped validations and why.
- Highlight any follow-up needed in Mongo `JobConfig`, downstream callers, deployment, secrets, or dashboards.

---

**Version**: 1.1.0
**Last Updated**: 2026-05-15
**Maintainer**: FarMart Engineering
