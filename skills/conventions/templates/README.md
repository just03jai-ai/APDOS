# Templates

Starter templates for applying FarMart conventions consistently.

Where hooks are involved, the preferred pattern is:
- thin `.husky/*` wrappers
- real logic in `scripts/hooks/*`
- reusable checks in `scripts/conventions/*`

## Included

### GitHub workflows
- [`github-workflows/ecs-deploy.yml`](./github-workflows/ecs-deploy.yml)
  - ECS deployment workflow with:
    - immutable image tags
    - Docker BuildKit
    - AWS OIDC
    - branch-to-environment normalization
    - ECR build and push
    - ECS task definition render + deploy

### Dockerfiles
- [`dockerfiles/node-service.Dockerfile`](./dockerfiles/node-service.Dockerfile)
  - Node.js service template with:
    - pinned Node version
    - Corepack + pnpm
    - BuildKit secrets
    - non-root runtime user
- [`dockerfiles/python-service.Dockerfile`](./dockerfiles/python-service.Dockerfile)
  - Python service template with:
    - pinned Python + uv versions
    - BuildKit cache mounts
    - non-root runtime user

### ECS task definitions
- [`task-definitions/ecs-service.json`](./task-definitions/ecs-service.json)
  - ECS/Fargate task definition template with:
    - `APP_ENV`
    - health checks
    - explicit `awslogs`
    - split execution and task roles
    - immutable image placeholders

### Git hooks
- [`git-hooks/README.md`](./git-hooks/README.md)
  - starter anti-drift hook templates for JavaScript and Python repos
- [`git-hooks/shared/README.md`](./git-hooks/shared/README.md)
  - shared Husky stubs and shared convention scripts used by both JS and Python templates
- [`git-hooks/scaffold/README.md`](./git-hooks/scaffold/README.md)
  - final merged repo layout after combining shared assets with JS or Python-specific scripts
- [`git-hooks/javascript/README.md`](./git-hooks/javascript/README.md)
  - full JavaScript repo hook setup using shared assets + JS-specific scripts
- [`git-hooks/python/README.md`](./git-hooks/python/README.md)
  - full pure-Python repo hook setup using shared assets + Python-specific scripts

## Usage

These templates are intentionally generic.

Before using them in a real repo:
- replace placeholder values like `__SERVICE_NAME__`
- align ports and health endpoints with the app
- confirm CPU/memory sizing
- wire correct AWS account, cluster, and service names
- ensure secrets come from GitHub Secrets, AWS Secrets Manager, or ECS `secrets`
