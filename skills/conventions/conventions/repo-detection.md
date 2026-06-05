# Repo detection

Always inspect the repo before proposing or applying conventions.

## Detect the repo archetype

### Node.js / Express
Look for:
- `package.json`
- `server.js`, `app.js`, or `bin/www`
- `.github/workflows/`
- `express` in dependencies

### Nx React monorepo
Look for:
- `nx.json`
- `apps/`
- `libs/`
- workspace `package.json`

### Python monorepo
Look for:
- `pyproject.toml`
- `requirements.txt`
- `setup.py`
- `.python-version`
- multiple nested Python packages or projects

### Misc
Anything else. Still apply the minimum repo contract.

## Always inspect first

- `README.md`
- `AGENTS.md` if present
- root `package.json` / `pyproject.toml` / `nx.json`
- `.github/workflows/`
- hook config like `.husky/`, `lint-staged`, `commitlint`, `pre-commit`

## Rule

If the repo already has a strong convention, align with it unless the user explicitly asked to migrate.

---

**Version**: 1.0.0
**Last Updated**: 2026-04-22
