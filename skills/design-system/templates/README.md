# FarMart Templates

Reusable UI patterns for the FarMart agri-commerce platform. Each template includes:
- A markdown spec (`.md`) — spacing, typography, layout rules, and a TSX code template
- An HTML preview (`.html`) — live visual reference with annotations

---

## Template Index

| Template | File/Folder | Description |
|----------|-------------|-------------|
| Design Variants | `design-variants.md` | CCL `designVariant` prop reference for all components |
| Modal | `modal/` | Generic create/detail modal — header + body + footer, 600px wide |

---

## Adding a New Template

Create a new subfolder under `templates/` with:
```
templates/
  <template-name>/
    <template-name>-template.md   ← spec + code template
    <template-name>-preview.html  ← visual reference
```

Then ask the design system agent to register it in the Design System tab.

---

## Naming Conventions

- Folder: `kebab-case`
- Spec file: `<name>-template.md`
- Preview file: `<name>-preview.html`
