---
name: fmt-conventions
description: >
  Apply and enforce FarMart engineering conventions across Node.js/Express,
  Python monorepos, Nx React monorepos, and miscellaneous repos. Use when
  standardizing GitHub workflows, tooling, runtime metadata, env handling,
  scripts, naming, formatting, branching, or git hooks.
---

# FarMart Conventions

Use this skill to make repos more consistent and easier for humans and AI agents to work in.

## When to Use

Use this skill when the user asks to:
- standardize or modernize repo setup
- add or refactor GitHub Actions workflows
- normalize package manager, runtime, or environment conventions
- add or enforce scripts like `dev`, `stage`, `prod`, `lint`, `test`, or `check`
- introduce consistent naming, formatting, or branch rules
- add guardrails through Husky, commitlint, lint-staged, or similar hooks
- document repo conventions for future contributors or agents
- audit a repo against FarMart standards

## How to Use This Skill

Before making recommendations or changes:

1. Read [`conventions/core-principles.md`](./conventions/core-principles.md)
2. Read [`conventions/repo-detection.md`](./conventions/repo-detection.md)
3. Read the convention files relevant to the user's task
4. Read [`conventions/critical-review.md`](./conventions/critical-review.md) whenever proposing or challenging standards
5. Read [`conventions/repo-overlays.md`](./conventions/repo-overlays.md) for repo-type specifics
6. Read [`conventions/audit-and-rollout.md`](./conventions/audit-and-rollout.md) when auditing or planning

If the task spans multiple areas, read all relevant convention files before responding.

## Convention Files

- [`conventions/core-principles.md`](./conventions/core-principles.md)
- [`conventions/repo-detection.md`](./conventions/repo-detection.md)
- [`conventions/github-workflows.md`](./conventions/github-workflows.md)
- [`conventions/javascript-tooling.md`](./conventions/javascript-tooling.md)
- [`conventions/runtime-environment.md`](./conventions/runtime-environment.md)
- [`conventions/env-files.md`](./conventions/env-files.md)
- [`conventions/scripts.md`](./conventions/scripts.md)
- [`conventions/naming.md`](./conventions/naming.md)
- [`conventions/formatting.md`](./conventions/formatting.md)
- [`conventions/branching.md`](./conventions/branching.md)
- [`conventions/git-hooks.md`](./conventions/git-hooks.md)
- [`conventions/hook-standard.md`](./conventions/hook-standard.md)
- [`conventions/guardrail-scripts.md`](./conventions/guardrail-scripts.md)
- [`conventions/reviewer-assist-scripts.md`](./conventions/reviewer-assist-scripts.md)
- [`conventions/dockerfiles.md`](./conventions/dockerfiles.md)
- [`conventions/task-definitions.md`](./conventions/task-definitions.md)
- [`conventions/critical-review.md`](./conventions/critical-review.md)
- [`conventions/repo-overlays.md`](./conventions/repo-overlays.md)
- [`conventions/audit-and-rollout.md`](./conventions/audit-and-rollout.md)
- [`templates/README.md`](./templates/README.md)

## Starter Templates

Use these when the user asks to scaffold or standardize implementation artifacts:
- [`templates/github-workflows/ecs-deploy.yml`](./templates/github-workflows/ecs-deploy.yml)
- [`templates/dockerfiles/node-service.Dockerfile`](./templates/dockerfiles/node-service.Dockerfile)
- [`templates/dockerfiles/python-service.Dockerfile`](./templates/dockerfiles/python-service.Dockerfile)
- [`templates/task-definitions/ecs-service.json`](./templates/task-definitions/ecs-service.json)
- [`templates/git-hooks/README.md`](./templates/git-hooks/README.md)
- [`templates/git-hooks/shared/README.md`](./templates/git-hooks/shared/README.md)
- [`templates/git-hooks/scaffold/README.md`](./templates/git-hooks/scaffold/README.md)
- [`templates/git-hooks/javascript/README.md`](./templates/git-hooks/javascript/README.md)
- [`templates/git-hooks/python/README.md`](./templates/git-hooks/python/README.md)

## Quick Reference

### Common FarMart defaults
- shared GitHub workflows from `FarMart-Engineering/github-actions`
- `package.json` as JS runtime source of truth
- Volta + Corepack + pnpm for JavaScript repos
- `APP_ENV=dev|stage|prod`
- `.env.dev`, `.env.stage`, `.env.prod`, `.env.local`, `.env.example`
- standard scripts: `dev`, `stage`, `prod`, `test`, `lint`, `format`, `check`
- GitHub Packages auth uses `GITHUB_TOKEN`; agents must not commit real tokens or local `.npmrc` auth changes
- a standard `scripts/` folder with `scripts/hooks/` and `scripts/conventions/`
- kebab-case for JavaScript/TypeScript files and folders
- snake_case for Python files and folders
- pinned Docker base images and Docker BuildKit by default
- non-root runtime containers by default
- immutable image tags for deployments
- ECS task definitions with health checks and explicit logs
- Husky as the standard hook runner across repos
- pure Python repos should add a minimal Node tooling layer for Husky + commitlint
- lint-staged + commitlint for JS guardrails
- Python checks can run through Husky via `pre-commit`, `ruff`, and `pytest`

## Do / Don’t

### ✅ Do
- standardize interfaces before internals
- preserve behavior while normalizing
- prefer shared automation over duplication
- use repo metadata as the source of truth
- make conventions easy for both humans and AI to discover

### ❌ Don’t
- hardcode runtime versions in CI when metadata exists
- commit `.env.local` or secrets
- use `NODE_ENV` as the only environment selector
- invent bespoke names for common scripts
- bulk rename stable files without approval
- add slow hooks that developers will bypass

---

**Version**: 2.8.0
**Last Updated**: 2026-05-26
**Maintainer**: FarMart Engineering

## Changelog

### v2.8.0 (2026-05-26)
- Added GitHub Packages auth guidance so agents use shell-level `GITHUB_TOKEN` setup and never commit local `.npmrc` token changes

### v2.7.0 (2026-04-22)
- Made the style-drift suggestion script directory-aware so it prefers nearby in-module reference files

### v2.6.0 (2026-04-22)
- Added reviewer-assist guidance covering plagiarism-detection techniques, Sonar-style analysis, and non-blocking AI style-drift suggestions
- Added a non-blocking staged style-drift suggestion script based on nearest in-repo references

### v2.5.0 (2026-04-22)
- Upgraded the staged-file similarity template from raw Jaccard to token-based winnowing fingerprints with containment scoring
- Expanded guardrail guidance on stronger similarity detection for near-clones

### v2.4.0 (2026-04-22)
- Added guardrail script guidance covering security, duplication, and fuzzy similarity checks
- Added shared guardrail script templates for forbidden files, dangerous patterns, duplication, and staged-file similarity

### v2.3.0 (2026-04-22)
- Added a repo scaffold guide showing the final merged hook layout for JavaScript and pure Python repos

### v2.2.0 (2026-04-22)
- Introduced shared git-hook assets to reduce duplication between JavaScript and Python templates
- Moved common Husky stubs, commit-msg hook logic, secret scanning, and branch lint into a shared template folder

### v2.1.0 (2026-04-22)
- Added full JavaScript hook setup guidance alongside the Python setup guide
- Strengthened Python script templates with runtime checks, staged secret scanning, and smoke-test script wrappers

### v2.0.0 (2026-04-22)
- Standardized the `scripts/` folder pattern for hook orchestration and convention checks
- Updated git-hook templates so `.husky/*` files stay thin and delegate to `scripts/hooks/*`
- Added reusable `scripts/conventions/*` templates for JavaScript and Python repos

### v1.9.0 (2026-04-22)
- Added a full pure-Python repo hook setup guide and `pyproject.toml` snippet

### v1.8.0 (2026-04-22)
- Clarified that pure Python repos should add a minimal Node tooling layer so Husky remains the standard hook runner
- Added a minimal Python hook-tooling `package.json` template

### v1.7.0 (2026-04-22)
- Clarified that Husky is the standard hook runner across repos, including Python repos with `pre-commit` behind Husky
- Added Husky-based Python hook templates

### v1.6.0 (2026-04-22)
- Added an opinionated FarMart hook standard with mandatory baselines by repo type

### v1.5.0 (2026-04-22)
- Expanded git-hook conventions to focus on anti-drift checks
- Added starter git-hook templates for JavaScript and Python repos

### v1.4.0 (2026-04-22)
- Added starter templates for ECS deploy workflows, Node/Python Dockerfiles, and ECS task definitions
- Linked templates from the main skill index

### v1.3.0 (2026-04-22)
- Made immutable deployment image tags a requirement
- Made Docker BuildKit the default for standardized Docker builds
- Made non-root runtime containers the default rule
- Refined multi-worker ECS guidance to focus on operational coupling, scaling, and isolation tradeoffs

### v1.2.0 (2026-04-22)
- Added dedicated conventions for Dockerfiles, ECS task definitions, and critical review behavior
- Expanded workflow guidance with permissions, path filters, branch normalization, OIDC, and immutable image tag recommendations

### v1.1.1 (2026-04-22)
- Clarified naming convention split: JavaScript/TypeScript uses kebab-case, Python uses snake_case

### v1.1.0 (2026-04-22)
- Split conventions into individually maintainable markdown files under `conventions/`
- Updated the main skill file to act as an index and entrypoint

### v1.0.0 (2026-04-22)
- Initial release
- Added cross-repo conventions for workflows, runtime metadata, `APP_ENV`, env files, scripts, naming, formatting, branching, and hooks
- Added repo-type overlays for Node/Express, Python monorepos, Nx React, and misc repos
