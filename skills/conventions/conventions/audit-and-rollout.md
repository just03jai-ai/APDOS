# Audit and rollout

Use this structure when auditing a repo or proposing a rollout plan.

## Audit output pattern

1. Repo archetype
2. Current gaps against the FarMart repo contract
3. Recommended changes in priority order
4. Safe incremental rollout path
5. Guardrails to enforce in CI, hooks, Dockerfiles, and task definitions
6. Open questions or proposed improvements where the current standard is weak

## Agent workflow

1. **Classify the repo**
   - Determine whether it is Node/Express, Python monorepo, Nx, or misc.
2. **Read the current contract**
   - Inspect root metadata, workflows, hooks, and env conventions.
3. **Find the smallest standardization step**
   - Prefer additive or low-risk changes first.
4. **Normalize names and interfaces**
   - Commands, env files, workflows, runtime metadata, and hooks before deeper refactors.
5. **Preserve backward compatibility**
   - If existing scripts or deployment behavior are relied upon, keep aliases or compatibility shims.
6. **Explain the delta clearly**
   - In planning, list current vs desired state.
   - In implementation, keep changes scoped and easy to review.

## Quick reference

### JavaScript baseline
- `packageManager` + `engines` + `volta`
- `corepack`
- `pnpm`
- `APP_ENV=dev|stage|prod`
- `.env.dev`, `.env.stage`, `.env.prod`, `.env.local`
- scripts: `dev`, `stage`, `prod`, `test`, `lint`, `format`, `check`
- Husky + lint-staged + commitlint

### Workflow baseline
- reusable shared GitHub workflows
- no hardcoded secrets
- runtime versions read from repo metadata
- consistent kebab-case workflow filenames
- least-privilege workflow permissions
- path filters for expensive or deploy-specific workflows

### Container baseline
- pinned Docker base images
- Docker BuildKit enabled by default
- BuildKit secrets for private package installs
- non-root runtime containers by default
- immutable deployment image tags required; never deploy from `latest`
- ECS task definitions with health checks, explicit logs, and task-role / execution-role separation where practical

---

**Version**: 1.2.0
**Last Updated**: 2026-04-22
