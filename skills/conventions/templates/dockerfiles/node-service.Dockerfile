# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.22.2
FROM node:${NODE_VERSION}-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable \
    && PACKAGE_MANAGER=$(node -p 'require("./package.json").packageManager') \
    && corepack prepare "$PACKAGE_MANAGER" --activate

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    --mount=type=secret,id=github_token \
    export GITHUB_TOKEN="$(cat /run/secrets/github_token)" \
    && pnpm install --prod --frozen-lockfile --ignore-scripts

FROM node:${NODE_VERSION}-alpine AS runtime

ENV NODE_ENV=production \
    APP_ENV=prod

RUN addgroup -g 1001 -S nodejs \
    && adduser -S appuser -u 1001 -G nodejs

WORKDIR /app

COPY --from=base --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --chown=appuser:nodejs . .

# Optional: only if your runtime still expects a materialized non-secret env file.
# ARG APP_ENV_FILE=prod
# RUN cp .env.${APP_ENV_FILE} .env

EXPOSE 3000

USER appuser

CMD ["node", "./server.js"]
