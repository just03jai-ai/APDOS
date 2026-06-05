# JavaScript tooling

For JavaScript and TypeScript repos, prefer committed runtime metadata and a single package manager contract.

## Preferred standards

- `package.json` is the source of truth
- `volta.node` pins the Node version
- `packageManager` pins the package manager version
- `engines` declares enforceable runtime expectations
- `corepack` activates the package manager
- `pnpm` is the default package manager for standardized repos

## Preferred `package.json` shape

```json
{
  "packageManager": "pnpm@9.15.4",
  "engines": {
    "node": "22.22.2",
    "pnpm": "9.15.4"
  },
  "volta": {
    "node": "22.22.2"
  }
}
```

## Rules

- Treat `package.json` as the canonical source for Node and package manager versions.
- Use `corepack` in CI and local setup instead of ad hoc package manager installs.
- Prefer `pnpm` for new standardization work unless the user explicitly wants to keep a legacy toolchain.
- If a legacy repo still uses npm, migrate intentionally; do not partially mix npm and pnpm behavior.
- For GitHub Packages installs, use `GITHUB_TOKEN` from the environment and keep committed `.npmrc` files limited to placeholder-based registry config.

## GitHub Packages auth

When dependency installation fails or is likely to fail because `GITHUB_TOKEN` is missing:

1. Check whether `GITHUB_TOKEN` is already present in the current environment.
2. If it is missing, ask the user for a GitHub token instead of editing `.npmrc`.
3. Detect the user's shell and add the export to the matching shell config:
   - zsh: `~/.zshrc`
   - bash: `~/.bashrc` or `~/.bash_profile`, matching the user's shell setup
   - fish: `~/.config/fish/config.fish`
4. Reload that shell config before retrying the install.
5. Tell the user how to create a GitHub personal access token: GitHub `Settings` -> `Developer settings` -> `Personal access tokens`.
6. For internal package installs, request `read:packages`; add `repo` only when private repository package access requires it. For publishing, request `write:packages` and `read:packages`.

Never commit a real token. Never update, create, or commit repository `.npmrc` files just to unblock local authentication; use the user's shell config, CI secrets, or Docker build secrets for the actual token.

## Do

- keep version metadata in one place
- expose helper scripts like `print:node-version` or `print:pnpm-version` when useful for CI
- keep local setup and CI aligned on the same runtime versions

## Don’t

- rely on undocumented local Node versions
- mix npm, pnpm, and yarn casually in the same repo
- hardcode one runtime in CI and another locally
- commit real GitHub Packages tokens or local auth changes in `.npmrc`

---

**Version**: 1.1.0
**Last Updated**: 2026-05-26
