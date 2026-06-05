# Automated Sync Setup

`DATABASE_KNOWLEDGE.md` and `METRICS_GUIDE.md` are snapshots from the cerebro repo. They are kept in sync via a webhook trigger from cerebro to skills.

## How It Works

1. A change lands on `main` in cerebro touching either source file.
2. A workflow in cerebro (`notify-skills-on-refs-change.yml`) fires a `repository_dispatch` event of type `cerebro-refs-updated` against the skills repo.
3. The workflow `sync-ai-data-analyst-refs.yml` in this repo receives the event, fetches the latest versions of both files, bumps the "Last Updated" date in `SKILL.md`, and opens (or updates) a PR titled `chore(ai-data-analyst): sync references from cerebro`.
4. A reviewer reads the diff, optionally bumps the version + changelog in `SKILL.md`, and merges.

## One-Time Setup

### 1. Create cross-repo tokens

Pick **one** of these auth approaches:

**Option A — GitHub App (recommended for org-wide use)**
- Create a GitHub App owned by FarMart-Engineering.
- Permissions:
  - cerebro: `Contents: Read`
  - skills: `Contents: Write`, `Pull requests: Write`, `Metadata: Read`
- Install the app on both repos.
- Generate an installation token in each workflow (e.g. via `actions/create-github-app-token`).

**Option B — Fine-grained PATs (simpler)**
- Create two fine-grained PATs from a service account or maintainer:
  - `CEREBRO_READ_TOKEN`: read-only access to `FarMart-Engineering/cerebro` (`Contents: Read`).
  - `SKILLS_DISPATCH_TOKEN`: write access to `FarMart-Engineering/skills` (`Contents: Write`, `Pull requests: Write`, `Metadata: Read`).

### 2. Add secrets

- **In skills repo settings → Secrets and variables → Actions:** add `CEREBRO_READ_TOKEN`.
- **In cerebro repo settings → Secrets and variables → Actions:** add `SKILLS_DISPATCH_TOKEN`.

### 3. Add the cerebro-side trigger workflow

Open a PR in `FarMart-Engineering/cerebro` adding the file below at `.github/workflows/notify-skills-on-refs-change.yml`:

```yaml
name: Notify skills on ai-data-analyst reference change

on:
  push:
    branches: [main]
    paths:
      - 'agent/queries/people/sukhpreet.sekhon/notes/farmart_db_knowledge.md'
      - 'agent/queries/people/sukhpreet.sekhon/notes/dispatch_orders_finance_metrics_guide.md'

jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - name: Fire repository_dispatch in skills repo
        env:
          GH_TOKEN: ${{ secrets.SKILLS_DISPATCH_TOKEN }}
        run: |
          gh api repos/FarMart-Engineering/skills/dispatches \
            -f event_type=cerebro-refs-updated \
            -f 'client_payload[sha]=${{ github.sha }}' \
            -f 'client_payload[ref]=${{ github.ref }}'
```

### 4. Verify

- Manually run `Sync ai-data-analyst references from cerebro` from the Actions tab in the skills repo (`workflow_dispatch`). It should succeed and either open no PR (if files match) or a sync PR.
- In cerebro, push a no-op edit to one of the two source files on a test branch, merge to main, and confirm the dispatch event triggers a sync PR in skills within ~1 minute.

## Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Sync workflow runs but errors on `gh api` 404 | `CEREBRO_READ_TOKEN` missing or lacks `Contents: Read` on cerebro | Re-issue PAT or check GitHub App install |
| Sync workflow runs but no PR opens | `peter-evans/create-pull-request` failed silently — check `GITHUB_TOKEN` permissions | Ensure `permissions.contents: write` and `pull-requests: write` in the workflow |
| Cerebro pushes don't trigger anything | `paths:` filter is wrong, or the file moved | Update the paths in the cerebro workflow to match the new location |
| PR opens but with no changes | Cerebro file content is base64-encoded with different line endings | Ensure `gh api ... --jq '.content' \| base64 -d` is used (not raw download which may add a trailing newline) |
| Multiple sync PRs pile up | Branch name not stable | Confirm `branch: chore/sync-ai-data-analyst-refs` is set; the action updates the same branch on subsequent runs |

## Disabling the Sync

If you need to pause auto-syncs (e.g. during a major refactor of the cerebro source files):

- Disable the workflow in skills: Actions tab → `Sync ai-data-analyst references from cerebro` → ⋯ → Disable workflow.
- Or remove the cerebro-side workflow with a one-line PR.

Re-enable when ready.
