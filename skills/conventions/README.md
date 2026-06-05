# fmt-conventions

FarMart engineering conventions skill for standardizing repo setup across Node.js/Express, Python monorepos, Nx React monorepos, and miscellaneous repos.

## Installation

```bash
npx skills add FarMart-Engineering/skills@fmt-conventions
```

## What this skill provides

- shared GitHub workflow guidance
- JavaScript runtime/tooling standards using `package.json`, Volta, Corepack, and pnpm
- `APP_ENV` and `.env` file conventions
- standard script names such as `dev`, `stage`, `prod`, `lint`, `test`, and `check`
- a standard `scripts/` folder pattern so hooks stay thin and delegate to shared scripts
- naming, formatting, branching, and git hook guidance
- Dockerfile and ECS task-definition guidance, including BuildKit, non-root containers, and immutable image tags
- critical-review guidance so agents ask questions and suggest better defaults
- repo-type overlays for Node/Express, Python monorepos, Nx workspaces, and misc repos
- individually maintained markdown files for each convention under `conventions/`
- Husky as the standard hook runner, including pure Python repos via a minimal Node tooling layer and Python repos that invoke `pre-commit` through Husky
- starter templates under `templates/` for ECS deploy workflows, Dockerfiles, task definitions, and anti-drift git hooks

## When to use

Use this skill when you want an AI agent to:
- audit a repo for consistency gaps
- standardize or modernize CI/CD workflows
- normalize runtime metadata and package manager setup
- introduce or enforce FarMart repo conventions
- create a rollout plan for cross-repo guardrails

## Documentation

- Full skill index: [SKILL.md](./SKILL.md)
- Convention files:
  - [core-principles.md](./conventions/core-principles.md)
  - [repo-detection.md](./conventions/repo-detection.md)
  - [github-workflows.md](./conventions/github-workflows.md)
  - [javascript-tooling.md](./conventions/javascript-tooling.md)
  - [runtime-environment.md](./conventions/runtime-environment.md)
  - [env-files.md](./conventions/env-files.md)
  - [scripts.md](./conventions/scripts.md)
  - [naming.md](./conventions/naming.md)
  - [formatting.md](./conventions/formatting.md)
  - [branching.md](./conventions/branching.md)
  - [git-hooks.md](./conventions/git-hooks.md)
  - [hook-standard.md](./conventions/hook-standard.md)
  - [guardrail-scripts.md](./conventions/guardrail-scripts.md)
  - [reviewer-assist-scripts.md](./conventions/reviewer-assist-scripts.md)
  - [dockerfiles.md](./conventions/dockerfiles.md)
  - [task-definitions.md](./conventions/task-definitions.md)
  - [critical-review.md](./conventions/critical-review.md)
  - [repo-overlays.md](./conventions/repo-overlays.md)
  - [audit-and-rollout.md](./conventions/audit-and-rollout.md)
- Templates:
  - [templates/README.md](./templates/README.md)
  - [github-workflows/ecs-deploy.yml](./templates/github-workflows/ecs-deploy.yml)
  - [dockerfiles/node-service.Dockerfile](./templates/dockerfiles/node-service.Dockerfile)
  - [dockerfiles/python-service.Dockerfile](./templates/dockerfiles/python-service.Dockerfile)
  - [task-definitions/ecs-service.json](./templates/task-definitions/ecs-service.json)
  - [git-hooks/README.md](./templates/git-hooks/README.md)
  - [git-hooks/shared/README.md](./templates/git-hooks/shared/README.md)
  - [git-hooks/scaffold/README.md](./templates/git-hooks/scaffold/README.md)
  - [git-hooks/javascript/README.md](./templates/git-hooks/javascript/README.md)
  - [git-hooks/python/README.md](./templates/git-hooks/python/README.md)

## Maintainer

FarMart Engineering

## License

ISC
