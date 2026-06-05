# fmt-data-science-monorepo-contributor

Repository-specific contributor skill for FarMart's `data_science_monorepo`.

## What it covers

- uv-native Python packaging with per-package `pyproject.toml` and `uv.lock`
- Python 3.14 repo standardization
- local editable monorepo dependencies with `[tool.uv.sources]`
- `libraries/`, `projects/`, `data_pipelines/`, `harvester/`, and `common_data_queries/`
- Dockerfile and GitHub Actions conventions for deployable services
- ARM-native Blacksmith workflow expectations for ARM images
- validation flow with `uv lock`, `uv sync`, compile checks, tests, and AWS-backed smoke imports
- guardrails for cross-cutting helpers in `libraries/ds_utils`
- exact repo pitfalls already seen in practice, such as workflow trigger drift from local uv path dependencies, `get_repo_root(..., "requirements.txt")` bugs after migration, and Python 3.14 dependency-resolution fixes

## Intended use

Use this skill when an agent needs to safely change packaging, runtime config, CI/CD, jobs, services, or shared libraries inside `data_science_monorepo/`.

## Install locally for testing

```bash
npx skills add file:./fmt-data-science-monorepo-contributor
```
