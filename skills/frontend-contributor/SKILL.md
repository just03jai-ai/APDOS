---
name: fmt-farmartos-frontend-contributor
description: >
  Contribute safely to FarMart farmartos-frontend. Use when writing, changing,
  testing, documenting, or reviewing UI code in the farmartos-frontend repository,
  including Farmart OS, Farmart Pro PWA, route integration, app-local docs,
  central component library usage, permissions, frontend contracts, and generated
  feature UI scaffolds.
---

# FarMart OS Frontend Contributor

Use this skill inside the `farmartos-frontend` repository. It is an orchestrator:
route the task to the correct app docs, load only the relevant local guidance,
then edit code using the repo's documented patterns. Do not copy large repo docs
into this skill.

## When To Use

Use this skill for:

- Farmart OS web UI changes under `apps/farmart-os`
- Farmart Pro PWA changes under `apps/farmart-pro`
- shared frontend package changes under `packages/*`
- route, navigation, route-builder, module registration, or permission work
- app-level forms, listings, detail pages, drawers, modals, search screens, and filters
- API/query/contract wiring for frontend screens
- PR review or self-review of `farmartos-frontend` changes

If the task starts from a parent workspace and repo ownership is unclear, route
with `fmt-repo-router` first. For UI generated from PRD/HLD/LLD inputs, use
`fmt-feature-ui-generator` after selecting the target app. For visual rules,
component styling, Typography, spacing, modal layout, and design variants, use
`fmt-design-system`.

## Required Repo Context

Before editing, resolve the target surface:

- `farmart-os`: operations web app, admin/ops workflows, OS routes, access and policy screens
- `farmart-pro`: Farmart Pro PWA/mobile web style app inside this repo
- `packages/*`: shared frontend packages consumed by either app

Then read the repo-maintained docs that match the target. Start with:

- `README.md`
- `package.json`
- app or package-local docs near the owning code

For `farmart-os`, prefer these when present:

- `docs/apps/farmart-os/patterns/README.md`
- `docs/apps/farmart-os/patterns/listing-template-v2.md`
- `docs/apps/farmart-os/patterns/detail-screen-generator.md`
- `docs/apps/farmart-os/patterns/form-screen-generator.md`
- `docs/apps/farmart-os/patterns/search-screen-generator.md`
- `docs/apps/farmart-os/patterns/modal-screen-generator.md`
- `docs/apps/farmart-os/patterns/document-viewer.md`
- `docs/apps/farmart-os/patterns/route-integration-checklist.md`
- `docs/apps/farmart-os/routing.md`

For `farmart-pro`, prefer these when present:

- `docs/apps/farmart-pro/patterns/README.md`
- `docs/apps/farmart-pro/patterns/listing-screen-generator.md`
- `docs/apps/farmart-pro/patterns/detail-screen-generator.md`
- `docs/apps/farmart-pro/patterns/form-screen-generator.md`
- `docs/apps/farmart-pro/patterns/search-screen-generator.md`
- `docs/apps/farmart-pro/patterns/route-integration-checklist.md`
- `docs/apps/farmart-pro/patterns/mobile-list-template.md`
- `docs/apps/farmart-pro/patterns/form-template.md`
- `docs/apps/farmart-pro/patterns/detail-card.md`
- `docs/apps/farmart-pro/packages/README.md`

If a listed doc is absent, search the nearest `docs/apps/<app>/`, app root, and
owning module. If the docs conflict with working code, call out the mismatch and
use the smallest code inspection needed to proceed.

## Workflow

1. **Resolve app and owner.** Decide whether the change belongs to `farmart-os`,
   `farmart-pro`, or a shared package. Do not mix OS and Pro route conventions.
2. **Load docs before patterns.** Prefer documented route, screen, package,
   API/query, and contract patterns before inspecting sibling implementations.
3. **Use existing feature shape.** Follow the documented folder ownership for
   route component, `view/`, `hooks/`, `types/`, `query/`, `schema/`, package
   wrappers, and module-local files.
4. **Integrate routes fully.** For new route-owned screens, update the route
   source of truth, run the documented route-generation step when required,
   register the module route, and navigate through generated builders or helpers.
5. **Keep permissions explicit.** Check existing ability/permission docs and
   nearby route guards before adding or changing visibility, action availability,
   or protected navigation.
6. **Wire data intentionally.** When backend contracts are known, add typed
   request/response shapes and query/mutation hooks in the repo style. If API
   facts are missing, add typed stubs only with explicit TODOs and surface the
   gap in the response.
7. **Use CCL correctly.** Import approved UI primitives from
   `@farmart-engineering/central-component-library` and defer style rules to
   `fmt-design-system`.
8. **Validate with repo scripts.** Read `package.json`, workspace config, and
   app docs to choose targeted lint, type, test, and route-generation commands.

## Missing Documentation Policy

When repo docs are missing or incomplete:

- inspect the smallest nearby implementation that proves the pattern
- record the missing doc as a documentation gap in the response
- prefer adding or updating repo docs when the task changes a repeatable pattern
- do not invent route, permission, package, or API conventions from scratch

## Review Checklist

Before finishing, verify:

- [ ] Target app/package was identified with evidence.
- [ ] Relevant repo docs were read and named in the response.
- [ ] Route-owned screens are reachable through documented routing.
- [ ] Navigation uses route builders or documented helpers, not hardcoded paths.
- [ ] UI follows CCL and `fmt-design-system` rules.
- [ ] Permissions and hidden/disabled states match existing ability patterns.
- [ ] API/query/contract code is typed or an explicit gap is reported.
- [ ] Tests/checks were run, or skipped with a clear reason.
