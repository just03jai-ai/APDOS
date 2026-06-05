# GitHub workflows

Prefer shared, reusable workflows over copied workflow logic.

## Standard

- Prefer reusable shared workflows from `FarMart-Engineering/github-actions` wherever possible.
- Avoid duplicating the same CI logic across repositories.
- Keep workflow filenames in **kebab-case**.
- Never hardcode secrets or API keys in workflow files.

## Expected baseline

- `commit-lint`
- `branch-lint`
- `ci` or `pre-merge-test`
- release workflow if the repo publishes artifacts
- deployment workflows only where needed

## CI runtime rules

### JavaScript repos
- Read Node and package manager versions from `package.json`.
- Prefer runtime setup derived from `volta`, `engines`, and `packageManager`.
- Use `corepack` or package-manager-specific setup driven by repo metadata.

### Python repos
- Read Python version from `pyproject.toml` and/or `.python-version`.

## Workflow design details

### Triggers
- Use branch filters intentionally.
- Use `paths` filters to avoid running deployment workflows for unrelated changes.
- Use `workflow_call` for shared workflows that multiple repos should consume.

### Permissions
- Set the minimum permissions required for the job.
- Common patterns:
  - `contents: read`
  - `id-token: write` for AWS OIDC
  - `packages: read` for private package installs
  - `pull-requests: read` or `checks: write` only when needed

### Checkout strategy
- Use shallow checkout by default.
- Use `fetch-depth: 0` only when release, diff, or base-branch detection actually needs history.

### Branch and environment normalization
- Normalize branch names to a small environment set once near the start of the workflow.
- Prefer deriving deploy envs like `dev`, `stage`, and `prod` from branch rules in one place.
- Avoid spreading environment-selection logic across multiple steps.

### AWS deployment workflows
- Prefer OIDC with `aws-actions/configure-aws-credentials@v4`.
- Prefer creating or validating ECR repositories explicitly when deployment workflows own that lifecycle.
- Keep cluster names, service names, task definition paths, and Dockerfile paths in top-level env vars.
- Use immutable image tags such as commit SHA for deployments.
- `latest` may be pushed as a convenience tag, but it must not be the deployment tag or the only published tag.
- Enable Docker BuildKit for Docker builds, especially when secret mounts and cache mounts are used.

### Secrets and package auth
- Prefer GitHub secrets or platform credentials over inline values.
- Package registry auth should be written ephemerally during the workflow and cleaned up automatically.
- Never commit real tokens or API keys into workflow files.

## Do

- centralize common CI behavior in reusable workflows
- keep workflow names readable and consistent
- rely on GitHub secrets, OIDC, or secret managers
- make required PR checks predictable across repos
- use path filters for expensive or deploy-specific workflows
- use least-privilege permissions
- read runtime versions from repo metadata

## Don’t

- hardcode secrets or tokens in workflow YAML
- hardcode runtime versions when repo metadata already exists
- copy the same install/test pipeline into every repo
- deploy using `latest` instead of an immutable image tag
- request broad workflow permissions without a reason
- fetch full git history unless the workflow needs it

---

**Version**: 1.2.0
**Last Updated**: 2026-04-22
