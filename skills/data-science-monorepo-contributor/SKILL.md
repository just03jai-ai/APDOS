---
name: fmt-data-science-monorepo-contributor
description: >
  Contribute safely to FarMart's data_science_monorepo. Use when writing,
  changing, testing, documenting, packaging, or reviewing Python services,
  libraries, jobs, Dockerfiles, and GitHub Actions in the monorepo, including
  uv-native packaging, Python 3.14 standardization, local path dependencies,
  ARM container builds, AWS-backed smoke checks, and data_pipelines/harvester
  job workflows.
---

# FarMart Data Science Monorepo Contributor

Use this skill when working in `data_science_monorepo/`. The goal is to keep the monorepo consistent, deployable, and safe while preserving behavior across shared libraries, deployable services, cron-style job packages, Docker images, and GitHub Actions.

## Required Context Before Changing Code

Before making recommendations or edits, read the smallest relevant set of files for the task.

Start with these repo-wide files when the task is broad:

1. `data_science_monorepo/README.md`
2. `data_science_monorepo/docs/getting-started/README.md`
3. `data_science_monorepo/docs/how-to-guides/README.md`
4. `data_science_monorepo/docs/how-to-guides/migrate-python-packages-to-uv.md`
5. `data_science_monorepo/pyproject.toml`
6. `data_science_monorepo/.python-version`
7. `data_science_monorepo/scripts/setup.sh`
8. `data_science_monorepo/scripts/setup.fish`

Then read task-specific files:

- For a shared library: the library `pyproject.toml`, `README.md`, main package modules, and any consumers using `[tool.uv.sources]`
- For a service: the service `pyproject.toml`, `Dockerfile`, `README.md`, runtime config module, and matching GitHub workflow
- For `harvester` jobs: the root `harvester/pyproject.toml`, the target job directory, and `harvester/scripts/update_environments.*`
- For `data_pipelines` jobs: the root `data_pipelines/pyproject.toml`, the target job directory, and `data_pipelines/scripts/update_environments.*`
- For repo-root discovery or packaging helpers: `libraries/ds_utils/ds_utils/file_utils.py`, `libraries/ds_utils/ds_utils_async/file_utils.py`, and related job helpers
- For CI/CD changes: the exact workflow file under `.github/workflows/` plus the touched Dockerfile and task definition

If docs and code disagree, inspect the live code path and call out the mismatch before changing behavior.

## Repo Defaults

### Runtime and packaging

- Python version target: **3.14** everywhere
- Package manager and lock tool: **uv**
- Package source of truth: **`pyproject.toml`**
- Lockfile model: **service-local or job-local `uv.lock` files**, not one monorepo workspace lock
- Local package linkage: **`[tool.uv.sources]` with editable local paths**
- Compatibility shim: keep `setup.py` as thin `from setuptools import setup; setup()` only when legacy tooling still expects it
- `requirements.txt` is **not** the source of truth for normal package management
- Root `pyproject.toml` is for repo tooling; package/runtime dependency truth lives in each package or job root

### Monorepo layout

Use these mental buckets:

- `libraries/` → reusable Python libraries
- `projects/` → deployable services, APIs, experiments, and model-serving apps
- `data_pipelines/` → root package plus nested job packages
- `harvester/` → root package plus nested scraper/job packages
- `common_data_queries/` → standalone shared package
- `.github/workflows/` → deploy/build automation, mostly Docker + ECS oriented

### Discovery and config rules

- For uv-managed packages, prefer `get_repo_root(..., "pyproject.toml")`
- Do not add new runtime logic that assumes `requirements.txt` is the marker file
- If a helper already supports both legacy and uv markers, preserve backward compatibility unless the task explicitly removes it

### CI/CD and Docker defaults

- ARM image builds should prefer **native ARM runners**, not x64 + QEMU emulation
- Current convention is Blacksmith ARM runners plus `useblacksmith/setup-docker-builder@v1`
- Docker builds should generally use `uv sync --frozen --no-dev`
- GitHub Actions should prefer:
  - `actions/checkout@v4`
  - `aws-actions/amazon-ecr-login@v2`
  - `actions/setup-python@v5` when Python is needed in CI
- Workflow path filters must include all local path-source dependencies that materially affect the image or runtime
- If a workflow builds ARM images, prefer `blacksmith-2vcpu-ubuntu-2404-arm` plus `DOCKER_CACHE_MAX_SIZE_MB: 30720`

## Known Repo-Specific Pitfalls

These are the exact categories of mistakes that have already caused breakage in this repo.

### 1. Workflow triggers can silently drift from uv path dependencies

A service can build successfully locally while its GitHub workflow never triggers on a local dependency change.

Watch these known relationships carefully:

- `projects/agents` depends on:
  - `libraries/ds_utils`
  - `projects/fraud_detection`
- `projects/vizdum/backend` depends on:
  - `libraries/ds_utils`
  - `data_pipelines`
  - `data_pipelines/data_pipelines/jobs/community_post_automation`
  - `harvester`
  - `projects/fraud_detection`
- news-scraper jobs depend on:
  - `libraries/news_scraper_python`

If you change local uv sources or add package metadata to a dependency, update workflow `on.push.paths` and re-lock downstream consumers.

### 2. Root and package scripts are now uv-first, not requirements-first

The repo has already been normalized to:

- root `pyproject.toml`
- root `.python-version = 3.14`
- root `uv.lock`
- uv-based setup/update scripts

Do not reintroduce fresh `requirements.txt` fallbacks in:

- `scripts/setup.*`
- `data_pipelines/scripts/update_environments.*`
- `harvester/scripts/update_environments.*`
- `scripts/git-hooks/pre-push`

If an external tool truly needs requirements export, route that through helper/export logic rather than handwritten dependency files.

### 3. Repo-root markers should be `pyproject.toml` for uv-managed packages

Several packages historically used `get_repo_root(..., "requirements.txt")` and broke after migration. For uv-managed packages, prefer `pyproject.toml` as the marker.

Be especially cautious in:

- service config modules
- job config modules
- scripts that write artifacts relative to package root

### 4. Python 3.14 compatibility often needs dependency upgrades, not Python downgrades

When locks fail under 3.14, prefer upgrading constraints rather than dropping back to older Python.

Previously needed fixes in this repo included:

- `Pillow>=11.3.0`
- `psycopg2-binary>=2.9.12`
- `google-cloud-logging>=3.15.0`
- `google-cloud-vision>=3.14.0`

Also avoid direct `grpcio-status` pins when they conflict with `vertexai` / `google-cloud-aiplatform`; a direct `grpcio` pin is usually the safer choice in this repo.

### 5. Some jobs are script roots, not importable packages

For script-style job roots:

- `packages = []` is acceptable
- compile checks are often more appropriate than import-based smoke tests
- use `py_compile` or `compileall` when runtime imports would require credentials, databases, or side effects at import time

### 6. AWS-backed smoke checks need explicit env wiring

For secrets/config codepaths, do not rely on ambient shell state. Set these explicitly during smoke validation:

```bash
PROJECT_NAME=...
SERVICE_NAME=...
ENV=dev
```

This matters for services and jobs that read AWS Secrets Manager config during import or initialization.

### 7. The migration bar is now higher than “mixed state support works”

The current desired end state is:

- zero legacy package directories
- zero mixed package directories
- `pyproject.toml` + `uv.lock` as the package truth everywhere

Use `python3 scripts/conventions/audit_uv_migration.py` to confirm reality before claiming the repo is fully normalized.

## Standard Workflow

### 1. Map the package boundary first

Before editing, identify:

- the package/job root
- whether it is a real installed package or a script-style job root
- the direct runtime imports actually used in code
- local monorepo dependencies that should be represented as uv path sources
- downstream consumers that may need re-locking after metadata changes

Do not copy a bloated legacy dependency list blindly from old `requirements.txt` files. Prefer the smallest dependency set that matches actual imports and known runtime expectations.

### 2. Keep packaging uv-native

For a normal migrated package or job root, expect:

- `pyproject.toml`
- `.python-version` with `3.14`
- `uv.lock`
- optional thin `setup.py` shim if compatibility is needed

For script-style jobs, `setuptools.build_meta` with `packages = []` is acceptable when the job is not meant to install a Python package namespace.

### 3. Use local path dependencies explicitly

When one monorepo package depends on another, encode that with `[tool.uv.sources]`.

Example categories you will often wire together:

- `ds-utils`
- `fraud-detection`
- `agents`
- `ds-data-pipelines`
- `community-post-automation`
- `ds-harvester`
- `news-scraper-python`
- package/job-local helper libraries

If you add package metadata to a formerly legacy local dependency, re-lock downstream consumers that import it through path sources.

### 4. Preserve runtime behavior while normalizing

When migrating or refactoring:

- preserve existing import paths unless there is a clear bug
- preserve entrypoints and operational behavior
- update local READMEs, setup scripts, Dockerfiles, and workflows when package metadata changes make them stale
- avoid broad opportunistic rewrites outside the scoped task

### 5. Validate in increasing depth

Use the smallest useful validation first, then go deeper as needed:

```bash
uv lock --python 3.14
uv sync --python 3.14
uv run python -m compileall <package_or_files>
```

Then add targeted checks such as:

```bash
uv run pytest
uv run pytest path/to/test_file.py
uv run python - <<'PY'
# import smoke script
PY
python -m py_compile path/to/file.py
```

For AWS/secrets-backed runtime checks, explicitly set:

```bash
PROJECT_NAME=...
SERVICE_NAME=...
ENV=dev
```

Prefer import/smoke checks for secret-loading codepaths once AWS CLI auth is available.

## Packaging and Migration Rules

### For new or legacy package migrations

When adding or migrating a package/job:

1. inspect imports and runtime entrypoints
2. create or update `pyproject.toml`
3. set `.python-version` to `3.14`
4. generate `uv.lock`
5. remove handwritten `requirements.txt` files when they are no longer the source of truth
6. convert `setup.py` to a thin shim if legacy editable install compatibility is still useful
7. update `README.md`, config markers, and scripts that still point at `requirements.txt`
8. re-lock any downstream local consumers that depend on the package through `[tool.uv.sources]`
9. validate with lock, sync, and compile/import checks

### For shared helpers

Be careful when touching:

- `libraries/ds_utils/ds_utils/file_utils.py`
- `libraries/ds_utils/ds_utils_async/file_utils.py`
- `libraries/ds_utils/ds_utils/jobs/utils.py`
- `libraries/ds_utils/ds_utils/jobs/training.py`
- `libraries/ds_utils/ds_utils/cron_utils/*`

These files are cross-cutting and can affect many packages. Preserve compatibility for Vertex/job flows and standalone job execution unless the task explicitly changes repo-wide behavior.

### For root scripts

Repo scripts should prefer uv-native flows. If package directories are already migrated, do not reintroduce `requirements.txt`-based fallback logic casually.

## Docker and Workflow Guidance

### Dockerfiles

Prefer this pattern for deployable Python services:

- pinned Python 3.14 base image
- install `uv`
- copy repo
- set `VIRTUAL_ENV` and `PATH`
- `uv sync --frozen --no-dev`
- minimal runtime command

If native extensions are present, install build dependencies only as needed and remove them afterward where practical.

### GitHub Actions

When changing workflows:

- ensure path filters match all local uv path-source dependencies
- keep runner architecture aligned with target Docker platform
- use OIDC AWS auth and current action versions
- avoid stale references to `requirements.txt` after package migration
- prefer cache keys based on `pyproject.toml` + `uv.lock`
- prefer native ARM builders over emulated multi-arch builds for active ARM deploy workflows

If the workflow builds an image for a service that consumes local packages via uv path sources, include those dependency directories in `on.push.paths`.

For modal-style Python steps in workflows, prefer:

- `actions/setup-python@v5`
- Python `3.14`
- uv cache under `~/.cache/uv`
- `uv sync --frozen --no-dev`
- `uv run ...` rather than plain `python` when running package-scoped commands

## Review Checklist

Before finalizing a change, verify:

- [ ] Python 3.14 is used everywhere touched
- [ ] `pyproject.toml` is the dependency source of truth for touched package/job roots
- [ ] `uv.lock` is present and current for touched package/job roots
- [ ] local path dependencies are encoded with `[tool.uv.sources]`
- [ ] downstream consumers were re-locked after local package metadata changes
- [ ] no new code assumes `requirements.txt` is the package marker for uv-managed packages
- [ ] Dockerfiles and workflows match the new packaging model
- [ ] workflow path filters include local dependency directories when required
- [ ] compile/import/test validation was run at the smallest reasonable scope
- [ ] AWS-backed smoke checks were used when secret-loading codepaths needed runtime proof
- [ ] docs and READMEs were updated where developer workflow changed

## Guardrails

- Do not introduce a single monorepo-wide uv workspace lock unless explicitly requested.
- Do not switch Python versions away from 3.14 without explicit approval.
- Do not copy legacy `requirements.txt` contents wholesale into new `pyproject.toml` files without checking actual imports.
- Do not break local path-source relationships by forgetting to re-lock downstream consumers.
- Do not fix Python 3.14 resolution issues by silently downgrading Python.
- Do not use x64 emulation for ARM images when native ARM runners are available.
- Do not change shared helper behavior in `ds_utils` casually; treat those files as cross-repo infrastructure.
- Do not remove compatibility shims or legacy helper behavior unless the scope explicitly includes that cleanup.
- Do not claim repo-wide migration is finished without checking the audit script output.

## Useful Commands

Run from the relevant package/job root unless noted.

```bash
uv lock --python 3.14
uv sync --python 3.14
uv sync --frozen --no-dev
uv run python -m compileall <path>
uv run pytest
python3 scripts/conventions/audit_uv_migration.py
```

For Docker- or workflow-adjacent validation:

```bash
git diff --check
ruby -e 'require "yaml"; YAML.load_file("path/to/workflow.yml")'
```

## Output Expectations

When reporting back to the user:

- list files changed
- summarize packaging/runtime/CI impact
- list validation commands run and their results
- call out any skipped validations and why
- mention downstream packages re-locked because of local uv source relationships
- highlight deployment or secrets follow-up if runtime checks depend on AWS auth

---

**Version**: 1.1.0
**Last Updated**: 2026-05-17
**Maintainer**: FarMart Engineering

## Changelog

### v1.1.0 (2026-05-17)
- Tightened the skill with repo-specific pitfalls found during the full uv migration
- Added explicit guidance for workflow trigger drift caused by local uv path dependencies
- Added guardrails for root uv-native scripts and `pyproject.toml` repo markers
- Added Python 3.14 dependency-resolution guidance based on actual repo fixes
- Added stronger downstream re-lock and AWS-backed smoke-check instructions
