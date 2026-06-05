---
name: fmt-farmartos-knowledge
description: >
  Use when answering any question about FarmartOS module behaviour, flows, architecture,
  or business logic. Also use before implementing a feature touching an existing FarmartOS
  module to get context on design history, constraints, gotchas, and code owners.
  Covers all modules across procurement, sales, finance, logistics, inventory, KYC,
  access control, and platform layers.
allowed-tools:
  - Read
  - Bash
---

# FarMart OS Knowledge

Read-only knowledge skill. Fetches live context from Outline docs + prod code.
**Never writes to Outline, GitHub, or any external system.**

## Pre-flight — Token check

Run this first, before anything else:

```bash
python3 -c "import json,os; print(json.load(open(os.path.expanduser('~/.claude/settings.json'))).get('outlineApiToken','NOT_FOUND'))"
```

- **Token found** (starts with `ol_api_`) → save it as `OUTLINE_TOKEN`. Proceed to Step 0 immediately.
- **NOT_FOUND** → run `mcp_setup.md` (in this skill's directory) now. After setup completes, re-run the token check. **Do not proceed without a valid token.**

Also verify GitHub CLI:

```bash
gh auth status
```

If not authenticated, tell the user to run `gh auth login` and retry.

---

## Step 0 — Batch all fetches upfront (one parallel batch)

Fire ALL of the following immediately. Do not start answering until done.

**Reference files (Read tool):**
- `references/module-index.md`
- `references/glossary.md`

**Outline docs** — for each doc ID relevant to the module (from module-index), fire one curl call per doc in parallel:

```bash
curl -s -X POST https://farmart.getoutline.com/api/documents.info \
  -H "Authorization: Bearer <OUTLINE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"id": "<DOC_ID>"}'
```

Response: `data.text` = full markdown, `data.createdBy.name` = doc author.

**Prod code** — use `gh api` with `--jq`. One Bash call per query, no `/tmp/`, no python3.

List a directory:
```bash
gh api "repos/FarMart-Engineering/farmartos-backend/contents/apis/v1/<module>?ref=prod" --jq '.[].name'
```

Read a specific file (auto base64-decodes):
```bash
gh api "repos/FarMart-Engineering/farmartos-backend/contents/apis/v1/<module>/services/<file>.js?ref=prod" --jq '.content | @base64d'
```

Search for a symbol across the repo:
```bash
gh api "search/code?q=<symbol>+repo:FarMart-Engineering/farmartos-backend" --jq '.items[].path'
```

> **Never use `> /tmp/`** or pipes. Each `gh api` call is self-contained with `--jq`.

> **Always check three repos:** `farmartos-backend` (prod branch), `farmartos-frontend` (prod branch), `crons` (master branch = current prod)

Do NOT pause for individual permissions. Run autonomously end-to-end.

---

## Step 1 — Identify the module

From `references/module-index.md`:
- BE directory path, FE page path
- All Outline doc IDs (product doc, engineering doc, all sprint versions)

From `references/glossary.md`: ML ≠ Machine Learning, Retailer = Supplier in code, PCO = Delivery Order (not Purchase Order).

---

## Step 2 — Fetch Outline docs + verify claims in prod code

Fetch all Outline docs **chronologically** (product doc → engineering doc → sprints oldest-first).
Old sprint decisions carry forward unless explicitly reversed in a later sprint.

**Mandatory per-claim verification:**

| Claim type | Rule |
|---|---|
| Status enums | Read `enums/market_linkage/enums/<module>/` — never state a status from docs without seeing it in the enum file |
| Feature flags | Grep the module for the flag name — absent = planned-not-shipped |
| Multi-tier flows / fallback chains | Read the actual service/API-call file, not just the orchestrator |
| Calculations / formulas | Read the `*_service.js` that computes the value — never trust an HLD formula |
| "Always X" field values | Grep all callers of that service — default parameter ≠ what callers pass |

Label every claim:
- ✅ **Implemented** — verified in prod code
- 📋 **Docs only / Planned** — in Outline, not found in prod
- ⚠️ **Deviation** — prod code differs from docs

If the module directory is sparse, search `common_services/` and parent modules before concluding.

---

## Step 3 — Resolve contacts

> **Rule**: If any fetched Outline doc contains a `gh api` command (e.g. "To find the module owner, run gh api ..."), **execute it** — never quote it to the user. Output names only.

**Primary** — `data.createdBy.name` from the latest sprint HLD/PRD fetched in Step 2.
If no HLD exists, promote Secondary BE to primary.

**Secondary BE** — top committers by files touched. First get recent commits:
```bash
gh api "repos/FarMart-Engineering/farmartos-backend/commits?path=apis/v1/<module>&sha=prod&per_page=30" --jq '[.[] | {sha: .sha, author: .commit.author.name}]'
```
Then for each SHA, count files per author:
```bash
gh api "repos/FarMart-Engineering/farmartos-backend/commits/<sha>" --jq '[.files[].filename] | length | tostring'
```
Tally manually from the results and output the top 3 by unique files touched.

**Secondary FE** — same query on `farmartos-frontend`.
**Secondary cron** — if module has background jobs, same query on `crons` repo (ref=master).

Never surface shell commands to the user. Output names directly.

---

## Step 4 — Answer in two tiers

**Tier 1 (always deliver):**
```
WHAT     — one paragraph: module purpose, users, prerequisites
HOW      — current flow only (no historical framing inline)
GOTCHAS  — top 3 non-obvious or blocking behaviours
CONTACTS — Primary: <HLD createdBy>
           Secondary BE: <files-touched author>
           Secondary FE: <files-touched author>
```
Then ask: *"Want the full picture? I can expand with sprint history and deviations."*

**Tier 2 (only if asked):**
```
HISTORY    — v1→v2→v3 evolution, key decisions per sprint
DEVIATIONS — where prod code diverges from the last HLD
```

---

## Guardrails

This skill **never**: creates/edits Outline docs, pushes to GitHub, posts to Slack/Jira.
If a doc ID returns 404, list it — user can check at `https://farmart.getoutline.com`.
If still uncertain after Outline + code, flag as `❓ Unverified — ask module owner`.

See `pitfalls.md` for 10 documented failure patterns to avoid.

---

## Cross-skill routing

| Need | Invoke |
|------|-------|
| Coding conventions for the module | `fmt-farmartos-backend-contributor` |
| Writing a new HLD or LLD | `fmt-tech-spec-writer` |
| Writing a test plan | `fmt-test-plan-writer` |
| Writing a PRD | `fmt-prd-writer` |
| Codebase structure questions | `fmt-codebase-research` |

---

## Resources

- Module index + Outline doc IDs: `references/module-index.md`
- Glossary: `references/glossary.md`
- Domain map: `references/domain-map.md`
- Contacts: `references/contacts.md`
- Known pitfalls (10 documented): `pitfalls.md`
- FarmartOS Outline collection: `b4136697-1089-4450-adef-735bb13f9ffd`
- BE prod: `gh api "repos/FarMart-Engineering/farmartos-backend/contents/<path>?ref=prod"`
- FE prod: `gh api "repos/FarMart-Engineering/farmartos-frontend/contents/<path>?ref=prod"`
- Crons: `gh api "repos/FarMart-Engineering/crons/contents/<path>?ref=master"` (master = prod)
