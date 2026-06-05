# Runtime environment

`APP_ENV` is the canonical environment selector across FarMart repos.

## Allowed values

- `dev`
- `stage`
- `prod`

## Rules

- Use `APP_ENV` to decide which runtime configuration should load.
- Do **not** use `NODE_ENV` as the primary deployment selector.
- Keep `NODE_ENV` only for framework or runtime optimization when needed.

## Preferred mapping

- `APP_ENV=dev` → usually `NODE_ENV=development`
- `APP_ENV=stage` → usually `NODE_ENV=production`
- `APP_ENV=prod` → `NODE_ENV=production`

If an existing repo behaves differently, preserve behavior unless the user asked to normalize it.

## Do

- make `APP_ENV` the single human-facing environment switch
- document which config is loaded for each value
- keep local, CI, and deployment behavior aligned

## Don’t

- use multiple overlapping environment selectors without a clear source of truth
- make users guess whether `NODE_ENV`, `ENV`, `APP_ENV`, or custom flags win

---

**Version**: 1.0.0
**Last Updated**: 2026-04-22
