# Guardrail scripts

Well-maintained repos should have a small set of focused guardrail scripts that catch risky drift early without becoming noisy or expensive.

## Design principles

- Keep scripts focused and composable.
- Prefer running cheap checks in `pre-commit`.
- Prefer running heavier or fuzzier checks in `pre-push` or CI.
- Keep the implementation in `scripts/conventions/` and let hooks or CI call into those scripts.
- Treat fuzzy checks as guardrails, not perfect truth detectors.

## Recommended guardrail script families

## 1. Security guardrails

### Must-have
- `scan-staged-secrets.sh`
  - scan staged diff only
  - block likely secrets before commit
- `check-forbidden-files.sh`
  - block files like `.env.local`, `.env`, private keys, raw credential dumps
- `check-forbidden-patterns.mjs`
  - block known dangerous patterns like disabled TLS verification or `shell=True`-style footguns

### Good additions
- dependency audit in CI
- Dockerfile lint in CI
- ECS/task-definition secret placement check in CI

### Placement
- `scan-staged-secrets.sh` → `pre-commit`
- `check-forbidden-files.sh` → `pre-commit`
- `check-forbidden-patterns.mjs` → `pre-commit` or `pre-push` depending on cost

## 2. Code redundancy guardrails

### Recommended
- `check-duplication.mjs`
  - detect exact or normalized duplicate files
  - good for catching copy-paste modules that should have been refactored

### Placement
- usually `pre-push` or CI
- avoid running repo-wide duplicate scans in `pre-commit` for large repos

## 3. Fuzzy staged-file similarity guardrails

### Recommended
- `check-staged-similarity.mjs`
  - compare staged files against known repo files
  - flag staged files that are suspiciously similar to an existing file
  - useful for catching near-clones, copy-paste forks, or accidental duplicate implementations
  - prefer token-based winnowing fingerprints with containment scoring over raw Jaccard alone

### Better than raw Jaccard

Plain Jaccard over all shingles is easy to implement, but it is not the best default for code.

Prefer:
- **token-based winnowing fingerprints** for robust near-clone detection
- **containment score** for catching copied subsets
- **Jaccard only as a secondary signal**, not the only score

Why this is better:
- more robust to small edits and renames
- better at detecting copy-paste of a subset into a larger file
- less noisy than comparing every shingle directly

### Important note
This is best-effort, not perfect.

Use it to ask:
- is this new file really a new abstraction?
- should this logic have been shared instead?
- did someone copy an existing module and only tweak a few names?

### Placement
- `pre-push` for smaller repos
- CI for large monorepos or noisier codebases

## Suggested script names

Prefer these filenames in `scripts/conventions/`:
- `scan-staged-secrets.sh`
- `check-forbidden-files.sh`
- `check-forbidden-patterns.mjs`
- `check-duplication.mjs`
- `check-staged-similarity.mjs`

## Suggested command surface

These scripts map well to package scripts like:
- `check:security`
- `check:duplication`
- `check:similarity`
- `check:guardrails`

Example:

```json
{
  "scripts": {
    "check:security": "./scripts/conventions/check-forbidden-files.sh && node ./scripts/conventions/check-forbidden-patterns.mjs && ./scripts/conventions/scan-staged-secrets.sh",
    "check:duplication": "node ./scripts/conventions/check-duplication.mjs",
    "check:similarity": "node ./scripts/conventions/check-staged-similarity.mjs",
    "check:guardrails": "pnpm run check:security && pnpm run check:duplication && pnpm run check:similarity"
  }
}
```

## Practical recommendation by axis

### Security
Strongest ROI:
1. staged secret scan
2. forbidden committed files check
3. dangerous-pattern scan

### Code redundancy
Strongest ROI:
1. exact or normalized duplicate detector
2. follow-up refactor guidance in code review or CI comments

### Fuzzy similarity
Strongest ROI:
1. staged-file similarity check against same-extension files
2. token-based winnowing + containment scoring
3. high threshold to reduce false positives
4. run in `pre-push` or CI, not every `pre-commit`

## Caveats

- Similarity checks can produce false positives for boilerplate-heavy code.
- Similarity thresholds should be tuned per repo if generated or heavily patterned code is common.
- Duplicate detection should ignore generated, vendored, minified, and fixture files.
- Security pattern checks must be customizable per repo.
- These scripts should complement, not replace, code review.

---

**Version**: 1.1.0
**Last Updated**: 2026-04-22
