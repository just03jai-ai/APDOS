# Dockerfiles

Prefer deterministic, cache-friendly, secret-safe Dockerfiles that work for both local development and CI/CD.

## Core rules

- Pin the base image to a specific version. Avoid unqualified `latest` tags.
- Prefer slim or alpine images when compatible with the runtime and native dependencies.
- Use Docker BuildKit by default for CI builds and for any build that benefits from secret mounts or cache mounts.
- Keep dependency installation cache-friendly by copying manifests before full source.
- Avoid baking secrets into images.
- Keep runtime configuration in environment variables, not build-time secrets.
- Run containers as a non-root user unless there is a documented technical reason not to.

## JavaScript / TypeScript Dockerfiles

Prefer:
- `ARG NODE_VERSION=...` and `FROM node:${NODE_VERSION}-alpine` or equivalent
- `corepack enable` and package manager activation from `package.json`
- `COPY package.json pnpm-lock.yaml ./` before app source
- `pnpm install --frozen-lockfile --ignore-scripts` for deterministic installs
- explicit rebuilds only for packages that need native postinstall steps, e.g. `bcrypt`, `sharp`
- `APP_ENV` or an env-file selection strategy that does not expose secrets in the image

### Preferred patterns

```dockerfile
ARG NODE_VERSION=22.22.2
FROM node:${NODE_VERSION}-alpine

WORKDIR /app
COPY package.json pnpm-lock.yaml ./

RUN corepack enable \
    && PACKAGE_MANAGER=$(node -p 'require("./package.json").packageManager') \
    && corepack prepare "$PACKAGE_MANAGER" --activate

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    --mount=type=secret,id=github_token \
    export GITHUB_TOKEN="$(cat /run/secrets/github_token)" \
    && pnpm install --prod --frozen-lockfile --ignore-scripts

COPY . .
```

## Python Dockerfiles

Prefer:
- pinned Python base images
- `uv` for deterministic sync where the repo standard supports it
- copying dependency metadata before copying the full project
- cache mounts for package downloads
- `PYTHONUNBUFFERED=1` and `PYTHONDONTWRITEBYTECODE=1`
- a clear app root and venv path in `PATH`

### Preferred patterns

```dockerfile
# syntax=docker/dockerfile:1.7
FROM ghcr.io/astral-sh/uv:0.11.3 AS uv
FROM python:3.14-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_LINK_MODE=copy

COPY --from=uv /uv /uvx /bin/
```

## BuildKit requirement

- BuildKit is the default and should be enabled for standardized Docker builds.
- It is required when using secret mounts, cache mounts, or other BuildKit-only features.
- The default assumption is that BuildKit improves both build speed and secret safety; do not fall back to legacy builds without a reason.

## Build secrets and private packages

### Do
- use BuildKit secret mounts for `.npmrc`, GitHub tokens, or other package registry auth
- keep package registry auth out of the final filesystem layers
- use CI-provided secrets only during build steps that need them

### Don’t
- `COPY` a real `.npmrc` or secret file into the image
- store tokens in `ENV` or committed Dockerfile instructions
- depend on local machine auth that CI cannot reproduce

## Runtime configuration

- Prefer runtime env vars and secret managers over build args for secret config.
- If a legacy app needs a concrete `.env` file at runtime, materialize it from a non-secret committed file plus runtime overrides as an implementation detail.
- Avoid using build args like `ARG ENV=development` as the only runtime switch.

## Entry points and commands

- Use JSON exec-form `CMD` where possible.
- If shell expansion is required for optional entrypoints, keep it deliberate and documented.
- If one image runs multiple worker entrypoints, make the override mechanism explicit, e.g. `APP_ENTRY`.

## Health and operability

- Expose only the ports actually used.
- Add a container `HEALTHCHECK` only when it adds real value for local/container-native runs.
- For ECS/Fargate, task-definition health checks are usually the canonical source.
- Containers should run as a non-root user by default.
- If a container must run as root, document the reason in the Dockerfile or deployment docs.

## Caching and image size

- Copy dependency metadata first, then install, then copy source.
- Use multi-stage builds when a separate build artifact exists.
- Remove package manager caches or apt lists when appropriate.
- Keep runtime images free of compilers and build-only tooling unless truly needed.

## Do

- pin image versions
- use cache-friendly layer ordering
- use BuildKit secrets and caches
- run the final container as a non-root user
- keep build-time and runtime concerns separate
- document why native rebuilds or extra system packages are needed

## Don’t

- use `latest` for production base images
- bake secrets into layers
- run production containers as root without a documented exception
- install dev dependencies into production images without a reason
- depend on mutable runtime behavior that differs between local and CI

---

**Version**: 1.1.0
**Last Updated**: 2026-04-22
