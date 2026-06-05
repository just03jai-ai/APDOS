# Naming

Prefer consistent, readable names across files, folders, workflows, and scripts.

## Default rules by ecosystem

### JavaScript / TypeScript repos

Prefer **kebab-case** for new files and folders.

### Python repos

Prefer **snake_case** for new files and folders.

## Examples

- `user-service.ts`
- `order-summary-card.tsx`
- `branch-lint.yml`
- `build-client.ts`

## Exceptions

Preserve framework- or language-native exceptions:
- React component symbols remain `PascalCase`
- Python modules, packages, files, and folders should use `snake_case`
- framework special files keep required names like `layout.tsx` and `page.tsx`
- do not bulk rename stable files without user approval

## Enforcement guidance

- Keep naming consistent within a folder or subsystem.
- In JavaScript and TypeScript repos, prefer kebab-case for new folders, scripts, docs, workflows, and most JS/TS filenames.
- In Python repos, prefer snake_case for files, folders, modules, and packages.
- Avoid mixing `camelCase`, `PascalCase`, kebab-case, and snake_case arbitrarily in the same area.

## Do

- optimize for predictability
- keep repo-specific naming exceptions explicit

## Don’t

- rename working framework-constrained files for stylistic reasons
- introduce inconsistent naming inside the same subsystem

---

**Version**: 1.1.0
**Last Updated**: 2026-04-22
