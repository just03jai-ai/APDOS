# Repo-type overlays

Apply the common contract differently depending on the repo archetype.

## Node.js + Express

Prefer:
- complete runtime metadata in `package.json`
- standard scripts: `dev`, `stage`, `prod`, `test`, `lint`, `format`, `check`
- env files following the `APP_ENV` contract
- shared GitHub workflows instead of copied CI logic
- Husky + lint-staged + commitlint
- kebab-case for new service names, scripts, docs, and workflows where practical
- pinned Docker base images, Docker BuildKit, secret mounts for private package installs, cache-friendly layer ordering, and non-root runtime containers
- ECS task definitions with `APP_ENV`, immutable image tags, health checks, explicit logs, and separate execution/task roles where practical

## Nx React monorepos

Prefer:
- root `package.json` as the runtime source of truth
- standard workspace scripts plus project-specific Nx targets
- predictable target names: `build`, `test`, `lint`, `typecheck`, `serve`
- `nx affected` or reusable shared workflows in CI where appropriate
- kebab-case app and library names
- preservation of framework-required route filenames

## Python monorepos

Prefer:
- `pyproject.toml` as the source of truth
- `.python-version` for local interpreter pinning
- `uv` for env and dependency management where standardization is in scope
- `pytest`, `ruff check`, `ruff format`
- `snake_case` for Python files, folders, modules, and packages
- pinned slim Python base images with Docker BuildKit, `uv` cache mounts, and non-root runtime containers where Docker is used
- shared docs explaining which directories are production packages vs experiments
- a thin common command surface via `Makefile`, `justfile`, or documented `uv run` commands

## Misc repos

Apply the minimum contract:
- document runtime
- add clear run/test/lint/check instructions
- add shared CI where possible
- add branch and commit guardrails
- keep naming and docs consistent
- if Docker or ECS is involved, also follow the shared Dockerfile and task-definition conventions

---

**Version**: 1.3.0
**Last Updated**: 2026-04-22
