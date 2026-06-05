# Formatting and style

Keep formatting predictable, mostly automated, and consistent with the repo's chosen toolchain.

## Shared preferences

- 2 spaces indentation
- single quotes where supported
- semicolons in JS/TS
- trailing commas in multiline structures
- keep lines readable; use 80 chars as a target, not a hard blocker unless the repo enforces it
- group imports as: framework, third-party, internal

## Tooling guidance

### JavaScript / TypeScript
- **New standardization work**: prefer Biome for formatting
- keep ESLint for semantic rules where needed
- respect the current formatter unless the user asked to migrate

### Python
- prefer `ruff format` + `ruff check`
- keep `black` only where already standardized or explicitly required

## Do

- automate formatting where possible
- avoid style-only debates when a formatter can settle them
- preserve existing tool choice unless migration is requested

## Don’t

- mix multiple formatters without a clear reason
- switch tools as part of an unrelated change unless the user asked for it

---

**Version**: 1.0.0
**Last Updated**: 2026-04-22
