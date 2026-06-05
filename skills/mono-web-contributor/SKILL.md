---
name: fmt-mono-farmart-web-contributor
description: >
  Contribute safely to FarMart mono-farmart-web. Use when writing, changing,
  testing, documenting, or reviewing code in the mono-farmart-web repository,
  including Farmart mobile web, Capacitor app surfaces, tracking frontend,
  Farmart AI, shared packages, WebView bridge behavior, frontend contracts, and
  generated feature UI scaffolds.
---

# Mono Farmart Web Contributor

Use this skill inside the `mono-farmart-web` repository. It is an orchestrator:
first identify the owning app or package, then follow the repository's own docs
and nearby maintained patterns. Keep this skill as routing and review guidance;
do not duplicate the repo documentation here.

## When To Use

Use this skill for:

- `apps/farmart-web` mobile web or Capacitor app work
- `apps/tracking-service` tracking, trip, consent, or GPS-facing UI work
- `apps/farmart-ai` frontend changes
- shared packages such as trade, tracking, auth context, API utilities, UI
  components, bridge utilities, and reusable app shells
- WebView bridge or external app-shell compatibility work
- frontend API/query/contract wiring for mobile-web features
- PR review or self-review of `mono-farmart-web` changes

If the task starts from a parent workspace and repo ownership is unclear, route
with `fmt-repo-router` first. For UI generated from PRD/HLD/LLD inputs, use
`fmt-feature-ui-generator` after selecting the target app/package. For visual
rules, component styling, Typography, spacing, modal layout, and design variants,
use `fmt-design-system` when CCL or shared FarMart UI components are involved.

## Required Repo Context

Before editing, resolve the target surface:

- `apps/farmart-web`: mobile web / Capacitor app experience
- `apps/tracking-service`: trip tracking, location, consent, and tracking UI
- `apps/farmart-ai`: Farmart AI frontend
- `packages/*`: shared mobile-web packages and bridge utilities

Then read the repo-maintained docs that match the target. Start with:

- `README.md`
- `package.json`
- app or package-local docs near the owning code

Search for additional app/package docs before opening sibling implementations:

- `apps/<app>/README.md`
- `apps/<app>/docs/**`
- `packages/<package>/README.md`
- `packages/<package>/docs/**`
- route, API, bridge, environment, and package usage docs near the owner

If the relevant docs are absent or stale, inspect the smallest nearby code path
that proves the current pattern and report the documentation gap.

## Workflow

1. **Resolve owner.** Decide whether the work belongs to an app or a shared
   package. Do not treat mobile web as native React Native unless code evidence
   proves native integration is the actual task.
2. **Map adjacent services.** For API-backed behavior, identify whether the
   provider is `farmart-app-backend`, `tracking-service-backend`,
   `farmartos-backend`, or another service before changing contracts.
3. **Load docs first.** Use app/package docs for routes, state, query clients,
   environment handling, bridge contracts, and UI patterns before copying a
   sibling implementation.
4. **Respect package boundaries.** Put reusable behavior in the documented shared
   package only when more than one app/package needs it. Keep feature-specific
   code in the owning app.
5. **Preserve bridge contracts.** Treat WebView, Capacitor, and RPC bridge APIs
   as compatibility surfaces. Avoid changing message names, payload shapes, or
   callback semantics without checking all consumers.
6. **Wire data intentionally.** Add typed request/response shapes and query or
   mutation hooks when backend contracts are known. If contract detail is missing,
   add a typed boundary with explicit TODOs and report the gap.
7. **Use existing UI systems.** Prefer documented repo UI components and package
   wrappers. When using CCL or FarMart shared UI, defer style rules to
   `fmt-design-system`.
8. **Validate with repo scripts.** Read `package.json`, workspace config, and
   app/package docs to choose targeted lint, type, test, build, and app-specific
   checks.

## Missing Documentation Policy

When repo docs are missing or incomplete:

- inspect the smallest nearby implementation that proves the pattern
- record the missing doc as a documentation gap in the response
- prefer adding or updating repo docs when the task changes a repeatable pattern
- do not invent route, bridge, package, environment, or API conventions from scratch

## Review Checklist

Before finishing, verify:

- [ ] Owning app/package was identified with evidence.
- [ ] Relevant repo docs were read and named in the response.
- [ ] Adjacent backend or service ownership is clear for data-backed changes.
- [ ] Shared package changes have more than one proven consumer or a clear contract reason.
- [ ] WebView, Capacitor, and bridge compatibility surfaces are preserved.
- [ ] UI follows documented repo patterns and shared design rules where applicable.
- [ ] API/query/contract code is typed or an explicit gap is reported.
- [ ] Tests/checks were run, or skipped with a clear reason.
