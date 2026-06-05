# Env files

Use a predictable env file layout tied to `APP_ENV`.

## Preferred files

- `.env.dev`
- `.env.stage`
- `.env.prod`
- `.env.local` for local overrides only
- `.env.example` for documented keys

## Rules

- `.env.local` must be gitignored.
- Secrets must never be committed.
- Prefer `.env.<app_env>` as the source of committed defaults.
- Use `.env.local` only for developer-specific overrides.
- CI and deployed environments should rely on secrets managers or platform env vars, not `.env.local`.
- Avoid making plain `.env` the long-term source of truth. If a legacy app requires `.env`, generate it from the selected environment file as an implementation detail.

## Load order

1. `.env.dev` / `.env.stage` / `.env.prod` based on `APP_ENV`
2. `.env.local` overrides for local execution

## Do

- commit `.env.example`
- document required keys and defaults
- keep environment file names consistent across repos

## Don’t

- commit `.env.local`
- rely on undocumented env precedence
- scatter env contracts across README comments and tribal knowledge

---

**Version**: 1.0.0
**Last Updated**: 2026-04-22
