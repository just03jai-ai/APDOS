# Usage Examples

Patterns for using `fmt-prd-writer`.

## Basic Examples

### Minimal PRD

```text
Create a PRD for user authentication.
```

Expected behavior:
- Fetch exact `PRD Template` from Outline.
- Start with a short `/grill-me` pass to clarify user, success metric, scope, and obvious edge cases.
- Search related Outline docs unless skipped.
- Save Markdown to `~/Documents/Projects/draft-prds/`.
- Mark unknowns as `TBD` if the user asks for a quick draft.

### Fully configured PRD

```text
Create a PRD for two-factor authentication:
- Template: 'Security PRD Template'
- Codebase: ~/repos/auth-service
- Documentation: Search for 'Authentication Architecture' and 'Security Guidelines'
- Save to: ~/repos/auth-service/docs/prds/
- Add section: 'Compliance considerations'
```

Expected behavior:
- Start with `/grill-me` unless explicitly disabled.
- Use the named template.
- Inspect the local codebase for existing auth patterns.
- Search the named docs directly through Outline.
- Add only the requested extra section.
- Cover enrollment, verification, recovery, lockout, fallback, audit, and support flows.

### Greenfield project

```text
Create a PRD for a supplier onboarding portal:
- Skip codebase analysis
- Skip database knowledge
- Use flexible format
- Save to: ~/projects/supplier-onboarding/docs/
```

Expected behavior:
- Start with `/grill-me` unless explicitly disabled.
- Do not search for a codebase.
- Do not inject FarMart database schema.
- Include open questions for unknown platforms, roles, integrations, and success metrics.

### `grill-me` not installed

```text
Create a PRD for supplier onboarding.
```

Expected behavior:
- Try to use `/grill-me` first.
- If `/grill-me` is unavailable, suggest `npx skills add https://github.com/mattpocock/skills --skill grill-me`.
- If it still is unavailable, continue by asking the same style of focused one-at-a-time discovery questions directly in `fmt-prd-writer`.
- Do not block PRD work only because `/grill-me` is missing.

### Strictly disable the discovery grill

```text
Create a PRD for supplier onboarding:
- Disable grill-me strictly
- Use flexible format
- Save to: ~/projects/supplier-onboarding/docs/
```

Expected behavior:
- Do not run `/grill-me`.
- Ask only direct blocker clarifications if the prompt is too ambiguous to draft responsibly.
- Mark unresolved facts as `TBD` instead of expanding into a longer discovery interview.

## Domain Examples

### API feature

```text
Create a PRD for order management API endpoints:
- Codebase: ~/repos/ecommerce-api
- Documentation: Search for 'API Standards' and 'REST Guidelines'
- Template: 'API PRD Template'
- Save to: ~/repos/ecommerce-api/docs/api-prds/
```

Senior-PM coverage:
- Caller types and permissions
- Idempotency and retries
- Error codes and partial failures
- Rate limits and audit logging
- Backward compatibility and rollout
- Acceptance criteria for success, failure, and permission-denied cases

### FarMart data-modeling feature

```text
Create a PRD for inventory reservation:
- Codebase: ~/repos/inventory-service
- Database knowledge: https://farmart.getoutline.com/doc/os-database-knowledge-41z12bCjRa
- Documentation: Search for 'Inventory HLD' and 'Order Fulfillment PRD'
- Save to: ~/repos/inventory-service/docs/prds/
```

Expected behavior:
- Use FarMart database knowledge because the request is FarMart/data-modeling related.
- Identify impacted entities and relationships.
- Cover migration, backfill, reporting, audit, and rollback considerations.
- Avoid inventing table names not found in available context.

### Frontend workflow

```text
Create a PRD for dashboard analytics widgets:
- Codebase: ~/repos/frontend-app
- Documentation: Search for 'Design System' and 'Analytics Events'
- Add section: 'Accessibility considerations'
- Save to: ~/repos/frontend-app/docs/features/
```

Senior-PM coverage:
- Entry points and navigation
- Loading, empty, and error states
- Role-based visibility
- Analytics events
- Accessibility acceptance criteria
- Mobile and desktop layout implications

### Payment integration

```text
Create a PRD for Stripe payment integration:
- Codebase: ~/repos/ecommerce
- Documentation: Search for 'Payment Processing' and 'Refund Policy'
- Add section: 'Webhook handling'
- Add section: 'Fraud prevention'
- Save to: ~/repos/ecommerce/docs/integrations/
```

Senior-PM coverage:
- Authorization, capture, failure, retry, refund, and dispute flows
- Idempotency and duplicate event handling
- Compliance and data handling boundaries
- User and operator notifications
- Support tooling and audit trail

## Failure-Mode Examples

### Missing template

```text
Create a PRD for checkout recovery:
- Template: 'Checkout PRD Template'
```

If the template cannot be fetched, stop and ask whether to retry, use a provided template excerpt, or switch to flexible format.

### Contradictory configuration

```text
Create a PRD for search:
- Skip documentation search
- Documentation: Search for 'Search HLD'
```

Ask the user which instruction wins before drafting.

### Unknown codebase

```text
Create a PRD for seller payouts:
- Codebase: payouts-service
```

Search common local locations. If not found, ask for a path or Git URL.

### Quick draft with unknowns

```text
Create a quick PRD for referral rewards. Use flexible format.
```

Proceed only if the user requested a quick draft. Mark unknowns as `TBD` and include open questions for reward rules, fraud controls, eligibility, success metrics, and rollout.

### Conflicting grill instructions

```text
Create a PRD for returns automation:
- Disable grill-me strictly
- Grill me on this before you draft
```

Ask the user which instruction wins before proceeding.

## Better Prompting Tips

Good:
```text
Create a PRD for checkout optimization to reduce cart abandonment:
- Codebase: ~/repos/ecommerce
- Documentation: Search for 'Checkout Analytics' and 'Payment Failures'
- Save to: ./docs/prds/
```

Weak:
```text
Create a PRD for checkout.
```

The stronger prompt includes the problem, context sources, and output location.
