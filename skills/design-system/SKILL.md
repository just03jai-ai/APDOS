---
name: fmt-design-system
description: Expert assistant for FarMart's MUI Joy-based design system.
user-invocable: true
---

# FarMart Design Skill

Apply these rules when generating UI code or mockups for FarMart:

1. **Base Framework:** Always use **MUI Joy UI** patterns.
2. **Typography:** Use **Noto Sans** (never Inter) for both body and display text, matching the theme tokens.
3. **Typography component:** All text via `<Typography>`. Use `level` for size, `textColor='text.primary'` (default) / `'text.secondary'` / `'text.tertiary'` for neutral shades, and `designVariant` (`PlainDanger`, `PlainWarning`, `PlainSuccess`, `PlainPrimary`) for semantic colors. **Never** set Typography color via `sx={{ color: '#hex' }}`. Full rules in `design.md` §4.
4. **Spacing:** 4px base. All margins/padding must be multiples of 4.
5. **Primary Color:** Use `#019881` (Teal) for main actions.
6. **Radius:** Default to **8px** (md) for most components; **4px** (sm) for tags.
7. **Implementation:** Reference tokens from the `central-component-library` theme.

## Reference Files

Load these files for full context before generating any UI code:

- `design.md` — full token spec, Typography rules (§4), component patterns, and common values
- `templates/design-variants.md` — `designVariant` prop system: all valid combinations for Button, Typography, Input, Table
- `templates/modal/modal-template.md` — reusable modal shell pattern with header/body/footer layout rules
