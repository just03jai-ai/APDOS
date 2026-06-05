# FMT PRD Writer

Generate senior-PM-grade Product Requirements Documents with discovery, flow validation, measurable acceptance criteria, and technical context.

## Installation

```bash
npx skills add FarMart-Engineering/skills/fmt-prd-writer
```

## Defaults

- Use `/grill-me` before drafting unless the user says `Disable grill-me strictly`
- If `/grill-me` is unavailable, suggest `npx skills add https://github.com/mattpocock/skills --skill grill-me`, then fall back to the same discovery interview directly in `fmt-prd-writer`
- Use the exact Outline document named `PRD Template` unless another template is provided
- Search Outline directly unless skipped
- Analyze a codebase when existing behavior matters
- Use database knowledge only for relevant FarMart/backend/data-modeling PRDs
- Output Markdown suitable for Outline

## Example

```text
Create a PRD for payment integration:
- Template: 'Engineering PRD Template'
- Codebase: ~/repos/payment-service
- Documentation: Search for 'Payment Standards' and 'Checkout HLD'
- Save to: ~/repos/payment-service/docs/prds/
```

## Configuration

```text
Disable grill-me strictly
Template: 'Custom Template Name'
Codebase: ~/path/to/repo
Documentation: Search for 'Architecture Guide'
Database knowledge: ~/path/to/schema.md
Save to: ./docs/prds/
Filename: checkout-recovery-prd.md
Skip codebase analysis
Skip documentation search
Skip database knowledge
Use flexible format
Add section: 'Compliance considerations'
Add sections: 'Compliance considerations' and 'Rollout plan'
```

See [REFERENCE.md](REFERENCE.md) for rules and [EXAMPLES.md](EXAMPLES.md) for prompt patterns.
