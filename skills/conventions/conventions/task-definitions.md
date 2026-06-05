# ECS task definitions

Prefer task definitions that are explicit, health-aware, secret-safe, and easy to templatize in CI.

## Core rules

- Keep task definitions in JSON files committed with the repo.
- Use placeholders for deploy-time values like image, env, CPU, memory, and roles.
- Prefer immutable image references at deploy time.
- Use immutable tags such as commit SHA for deployments; do not deploy from `latest`.
- Use `awsvpc` network mode and `FARGATE` compatibilities for standard ECS/Fargate services.
- Separate infrastructure template values from app runtime values.

## Recommended structure

### Task-level fields
- `family`
- `requiresCompatibilities`
- `networkMode`
- `cpu`
- `memory`
- `executionRoleArn`
- `taskRoleArn`

### Container-level fields
- `name`
- `image`
- `essential`
- `portMappings` when the container serves traffic
- `environment` for non-secret runtime values
- `secrets` for secret runtime values when available
- `healthCheck`
- `logConfiguration`
- `dependsOn` for startup ordering when multiple containers run in one task

## Environment variables

Prefer:
- `APP_ENV` as the canonical environment selector
- `NODE_ENV=production` for production-optimized Node services
- consistent `PORT`, `HOST`, and `HOSTNAME` values where needed

### Avoid
- duplicating both `ENV` and `APP_ENV` unless there is a proven compatibility need
- storing secrets in plain `environment` arrays

## Health checks

- Every traffic-serving container should have a health check.
- Prefer localhost HTTP health checks against an explicit endpoint like `/health` or `/api/health`.
- Tune `startPeriod` generously for cold starts, migrations, or Next.js boot time.
- Worker-only containers do not always need health checks, but they should be marked and wired deliberately.

### Example

```json
"healthCheck": {
  "command": [
    "CMD-SHELL",
    "node -e \"fetch('http://127.0.0.1:3000/api/health').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))\""
  ],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 60
}
```

## Logging

- Every container should have explicit `awslogs` configuration.
- Use a distinct log group or stream prefix for each major container role.
- Sidecars like OpenTelemetry collectors should log separately from the main app.
- Prefer log group names that map clearly to service names.

## Multi-container tasks

Use a single task with multiple containers when the containers are operationally coupled and scaling them together is acceptable.

### Good fits
- app + otel collector sidecar
- frontend + backend that intentionally share localhost networking inside one task
- multiple worker containers when they share the same lifecycle, scale characteristics, release cadence, and failure domain

### Ask before splitting
- do the workers need independent scaling?
- do they have very different CPU or memory profiles?
- should one worker restart without affecting the others?
- do they release on different cadences?

### Be careful with
- multiple long-running worker types in one task when one noisy worker can starve the others
- mixing unrelated services into one task definition
- coupling everything behind one health dependency chain without a strong reason

## Roles and permissions

- Prefer separate values for `executionRoleArn` and `taskRoleArn`.
- The execution role should cover ECS pull/logging/bootstrap concerns.
- The task role should cover the app's runtime AWS permissions.
- Avoid using one broad role for everything unless there is a deliberate temporary constraint.

## Deployment templating

Prefer placeholders like:
- `$ENV`
- `$IMAGE`
- `$TASK_CPU`
- `$TASK_MEMORY`
- `$TASK_ROLE_ARN`
- `$TASK_EXECUTION_ROLE_ARN`
- `$OTEL_COLLECTOR_IMAGE`

CI should render these placeholders predictably before deploy.

## Sidecars

For observability sidecars like `otel-collector`:
- expose only the necessary ports
- mark the sidecar as `essential` when the service truly depends on it
- use separate logs
- keep the collector image pinned and versioned like the main app

## Do

- commit task definitions to the repo
- keep them templatized but readable
- add health checks for serving containers
- use immutable deploy image tags
- use separate log groups/prefixes for different containers
- use task roles and execution roles intentionally

## Don’t

- put secrets in plain environment values
- deploy from `latest`
- duplicate environment selectors without a reason
- split or combine worker containers blindly; decide based on scaling, isolation, and operational coupling

---

**Version**: 1.1.0
**Last Updated**: 2026-04-22
