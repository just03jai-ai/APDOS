# Core principles

These principles apply to all FarMart repo convention work.

## Principles

1. **Standardize interfaces first.** Prefer consistent commands, workflows, env conventions, and docs before deep internal rewrites.
2. **Use repo metadata as the source of truth.** Avoid hardcoding runtime versions in CI when they can be read from committed config.
3. **Preserve behavior while normalizing.** Migrate incrementally; do not break working production behavior to chase stylistic purity.
4. **Prefer shared automation over copy-paste.** Reuse central GitHub workflows and shared scripts wherever possible.
5. **Make conventions legible to both humans and AI.** Optimize for discoverability, low ambiguity, and predictable execution.

## Change strategy

- Prefer additive, low-risk changes first.
- Normalize commands, workflows, env files, Dockerfiles, task definitions, and docs before structural refactors.
- Keep backward-compatible aliases or shims when a repo already relies on older names.
- Do not mass-rename stable files or folders without explicit approval.

## Critical review

- Do not standardize a weak pattern just because it already exists somewhere.
- If a proposed convention creates ambiguity, operational risk, or excessive coupling, call it out.
- Ask clarifying questions when environment strategy, package-manager migration, deployment tagging, or ECS shape is underspecified.
- Prefer suggesting a better default with a brief rationale instead of silently applying a questionable pattern.

---

**Version**: 1.1.0
**Last Updated**: 2026-04-22
