# FarMart Design System

## Overview

FarMart is an agri-commerce platform. This design system documents the FarMart visual language built on top of **MUI Joy UI**, with specific token overrides defined in `central-component-library/src/theme/themeTokens.ts`.

---

## CONTENT FUNDAMENTALS

- **Tone:** Professional, trustworthy, practical — built for farmers and agri-businesses. Clear over clever.
- **Casing:** Sentence case for body copy. Title case for navigation and buttons.
- **Voice:** Direct, functional. No fluff. "Place order" not "Let's get started on your order journey."
- **Emoji:** Not used in UI. Reserved for informal communications only.
- **Numbers:** Use numerals (1, 2, 3) not words (one, two, three) — farm context is quantity-heavy.

---

## VISUAL FOUNDATIONS

### Colors

- **Primary:** Teal-green `#019881` — brand color, used for CTAs, links, focus rings
- **Neutral:** Cool gray scale from `#FBFCFE` (surface) to `#0B0D0E` (near-black)
- **Status:** Red (danger), Green (success), Amber (warning) — standard semantic colors
- **Backgrounds:** White body, `#FBFCFE` for cards/panels, no gradients

### Typography

- **Font:** Noto Sans everywhere (body + display).
- **Weight scale:** Shifted up — "regular" = 400, "semibold" = 600, "bold" = 700
- **Sizes:** 10px–36px scale; 16px base

### Spacing

- **Base unit:** 4px (not MUI's default 8px). `spacing(4)` = 16px.

### Borders & Radius

- `sm` = 4px, `md` = 8px (default), `lg` = 12px, `xl` = 16px, `circular` = 1000px
- Cards use `md` (8px) radius with subtle border or shadow

### Shadows / Elevation

- Inherited from MUI Joy (xs → xl)
- Cards: light shadow or neutral-200 border

### Animation

- Inherited from MUI Joy — standard easing, no custom animations documented

### Icons

- MUI Joy icon set (Material Icons) — no custom icon font documented
- No emoji used as icons

### Imagery

- No brand imagery specified in source. Functional, product-centric photography implied by agri-commerce context.

---

## VISUAL MOTIFS

- Clean, minimal. No gradients on backgrounds.
- Teal accent on interactive elements only.
- Tables and data grids are prominent (agri-commerce = lots of SKUs, orders, prices).
- Cards: white/surface bg, md radius, subtle border or shadow.

---

## FILE INDEX

```
README.md                    ← This file
SKILL.md                     ← Agent skill descriptor (OpenCode)
design.md                    ← Full token spec and component patterns
templates/                   ← Reusable UI patterns (modal, design-variants)
```

---

## ICONOGRAPHY

FarMart uses **MUI Joy / Material Icons** (the standard icon library bundled with MUI Joy UI). No custom icon font or SVG sprite was provided in source materials. Icons are inline `<svg>` elements from the `@mui/icons-material` package in the codebase.

- Style: Filled and Outlined variants from Material Icons
- Size: Follows MUI sizing conventions (sm/md/lg)
- Color: `text.icon` = `#636B74` (neutral-500)
- Inverse: `text.icon-inverse` = `#FFFFFF` (on dark backgrounds)
- No emoji used as icons in UI
