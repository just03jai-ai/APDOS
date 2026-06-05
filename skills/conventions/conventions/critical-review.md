# Critical review and questions

This skill should not enforce conventions blindly. It should challenge weak proposals, point out tradeoffs, and ask clarifying questions when the standard is underspecified or likely to create operational pain.

## Default behavior

When a proposal is incomplete, inconsistent, or risky:
- ask clarifying questions
- suggest a better alternative
- explain the tradeoff briefly
- avoid codifying a weak pattern just because it already exists somewhere

## Common questions to ask

### Environment model
- Should `APP_ENV` include `local` as a first-class value, or should local runs use `APP_ENV=dev` plus `.env.local` overrides?
- If `NODE_ENV` is no longer the deployment selector, where is it still required by the framework?

### Package manager standardization
- Should all JS repos move to `pnpm`, or do some legacy repos intentionally stay on npm for now?
- Do you want a migration path with compatibility scripts, or a hard cutover?

### Deployment workflows
- Are deployments using immutable image tags such as commit SHA?
- If `latest` is still pushed, is it only a convenience alias and not the deployment tag?
- Do all repos really need custom deployment workflows, or can more of them call reusable workflows from `github-actions`?

### ECS shape
- Are the workers operationally coupled enough to belong in one task, or do they need independent scaling or isolation?
- Should execution role and task role be split everywhere?

### Dockerfiles
- Is Docker BuildKit enabled by default for CI builds and secret/cache mount use cases?
- Does the final runtime container run as a non-root user?

## Known anti-patterns to flag

- hardcoded secrets or API keys in workflows
- deploying with `latest` instead of an immutable image tag
- runtime versions hardcoded in CI even though metadata exists in the repo
- using one overloaded environment variable set without a clear source of truth
- putting secrets in ECS `environment` instead of secret-backed injection
- combining or splitting worker processes without checking scaling, isolation, and failure-domain needs
- copying auth files like `.npmrc` into Docker images instead of using secret mounts

## Suggest better defaults when possible

### Prefer
- immutable image tags
- reusable workflows
- least-privilege permissions
- runtime metadata as the source of truth
- BuildKit enabled by default with secret mounts and cache mounts
- non-root runtime containers
- health checks for serving containers
- task-role / execution-role separation

### Example guidance

Instead of:
- “let’s use `latest` everywhere for simplicity”

Suggest:
- “use commit SHA tags for deployments and optionally also push `latest` for convenience, but never deploy from `latest`”

Instead of:
- “put frontend, backend, and all workers in one ECS task”

Suggest:
- “keep tightly coupled workers together when they share lifecycle and scaling needs; split them only when independent scaling, isolation, or release cadence matters”

Instead of:
- “just hardcode Node 20 in the workflow”

Suggest:
- “read Node and package manager versions from `package.json` so local and CI stay aligned”

---

**Version**: 1.1.0
**Last Updated**: 2026-04-22
