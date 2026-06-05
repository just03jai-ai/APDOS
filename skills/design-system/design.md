# FarMart Design System Specification (v1.0.0)

## 1. Architecture & Base

FarMart is built as a **Central Component Library (CCL)** that wraps **MUI Joy UI**.

- **Base Framework:** [MUI Joy UI](https://mui.com/joy-ui/getting-started/)
- **Theme Entry Point:** `central-component-library/src/theme/themeTokens.ts`

## 2. Global Foundation Overrides

We deviate from MUI Joy defaults to support a data-dense agri-commerce environment.

| Token Category  | MUI Joy Default | FarMart Override  | Reference                   |
| :-------------- | :-------------- | :---------------- | :-------------------------- |
| **Spacing**     | 8px             | **4px (0.25rem)** | `joyThemeTokens.spacing`    |
| **Main Font**   | Inter           | **Noto Sans**     | `joyThemeTokens.fontFamily` |
| **Radius (sm)** | 6px             | **4px**           | `joyThemeTokens.radius.sm`  |

## 3. Typography

We use **Noto Sans** for all UI copy. Font weights are shifted up to ensure clarity.

- **Regular:** 400 (`fontWeight.xs`)
- **Semi-bold:** 600 (`fontWeight.md`) — Primary for buttons and labels.
- **Bold:** 700 (`fontWeight.lg`) — Primary for headings.

### Custom Levels

- **`label-sm / label-md`**: 10px (0.625rem).
- **`body-xxs`**: 12.8px (0.8rem) / Medium weight. Used for secondary metadata.

## 4. Typography Component Rules

All text **must** be rendered with `<Typography>` from `@farmart-engineering/central-component-library`. Configure it through three props — never inline-style colors.

### 4.1 The three props

| Prop            | Purpose                                                                            | Examples                                                                                     |
| :-------------- | :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| `level`         | Sets size + weight + line-height (the typographic scale)                           | `title-lg`, `title-md`, `title-sm`, `body-md`, `body-sm`, `body-xxs`, `label-md`, `label-sm` |
| `textColor`     | Sets a **neutral** semantic text shade                                             | `text.primary`, `text.secondary`, `text.tertiary`                                            |
| `designVariant` | Sets a **semantic palette color** (Primary / Danger / Warning / Success / Neutral) | `PlainPrimary`, `PlainDanger`, `PlainWarning`, `PlainSuccess`, `PlainNeutral`                |

### 4.2 When to use which

- **Default body copy / headings / labels** → use `textColor='text.primary'`. This is the right choice for ~80% of text. Resolves to `var(--joy-palette-neutral-800)` per `themeTokens.ts`.
- **De-emphasised text** (helper text, metadata, captions) → `textColor='text.secondary'` (neutral-600) or `textColor='text.tertiary'` (neutral-400).
- **Semantic / colored text** (errors, warnings, success states, brand callouts) → use `designVariant`, **never** `sx={{ color: '#hex' }}`.
  - Error / destructive context → `designVariant='PlainDanger'`
  - Warning / caution / pending → `designVariant='PlainWarning'`
  - Success / confirmed → `designVariant='PlainSuccess'`
  - Brand emphasis → `designVariant='PlainPrimary'`

### 4.3 Hard rules

1. **Never** write `<Typography sx={{ color: '#C41C1C' }}>`. Use `designVariant='PlainDanger'`.
2. **Never** write `<Typography sx={{ color: '#9A5B13' }}>`. Use `designVariant='PlainWarning'`.
3. **Never** write `<Typography sx={{ color: '#019881' }}>`. Use `designVariant='PlainPrimary'`.
4. **Never** combine `textColor` and `designVariant` on the same element — `designVariant` already owns the color.
5. `level` is **always** required. Pick from the scale; do not override `fontSize` via `sx`.
6. Use the theme font family as-is. Do not add custom font-family overrides for IDs, weights, quantities, or code-like values unless the actual theme tokens are updated to support them.

### 4.4 Examples

```tsx
// Modal heading
<Typography level='title-lg' textColor='text.primary'>Terminate DO</Typography>

// Body copy (the common case)
<Typography level='body-sm' textColor='text.primary'>
  Are you sure you want to terminate this dispatch order?
</Typography>

// Helper / metadata
<Typography level='body-xxs' textColor='text.tertiary'>Updated 2 min ago</Typography>

// Destructive callout (e.g. the entity being acted on)
<Typography level='body-sm' designVariant='PlainDanger'>
  DO: {doNumber}
</Typography>

// Warning callout
<Typography level='body-sm' designVariant='PlainWarning'>
  Reason: {selectedReason}
</Typography>
```

### 4.5 Token reference (from `themeTokens.ts`)

| Level      | Size            | Weight | Line-height     | Used for                     |
| :--------- | :-------------- | :----- | :-------------- | :--------------------------- |
| `title-lg` | 1.125rem (18px) | 700    | 1.33334 (~24px) | Modal titles, page headings  |
| `title-md` | 1rem (16px)     | 600    | 1.5 (24px)      | Section headings             |
| `title-sm` | 0.875rem (14px) | 600    | 1.42858 (~20px) | Field labels, primary values |
| `body-md`  | 1rem (16px)     | 400    | 1.5 (24px)      | Default paragraph            |
| `body-sm`  | 0.875rem (14px) | 400    | 1.42858 (~20px) | Default body in dense UI     |
| `body-xxs` | 0.8rem (12.8px) | 500    | 1rem (16px)     | Metadata, captions           |
| `label-md` | 0.625rem (10px) | 600    | 0.875rem (14px) | Table headers, tags          |
| `label-sm` | 0.625rem (10px) | 400    | 0.875rem (14px) | Table helper text            |

| `textColor`      | Resolves to   | Use for                |
| :--------------- | :------------ | :--------------------- |
| `text.primary`   | `neutral-800` | Default — most text    |
| `text.secondary` | `neutral-600` | Supporting text        |
| `text.tertiary`  | `neutral-400` | Metadata, disabled-ish |

## 5. Components Logic

### Buttons

Button rounding is dynamically mapped to the component size via `styleOverrides`:

- **Small / Medium Size:** `8px` (`radius.md`)
- **Large Size:** `12px` (`radius.lg`)

### Data Tables

- **Header:** Uses `#FBFCFE` background with `label-md` typography.
- **Cell Content:** Numeric values, IDs, and weights should continue using the theme font family unless the theme tokens explicitly introduce a separate data/code font.

## 6. Development Rules

1. **No Magic Numbers:** Never hardcode pixel values. Use `theme.vars.spacing` or `theme.vars.radius`.
2. **Semantic Colors:** Prefer `text.primary` over raw neutral hex codes. For colored text use `designVariant` (see §4.3) — never `sx={{ color: '#hex' }}` on `Typography`.
3. **Data-First:** Prioritize column alignment and density over white space.

## 7. Common Values

| Token          | Value     | Usage                                   |
| -------------- | --------- | --------------------------------------- |
| Divider/Border | `#CDD7E1` | Modal borders, card borders, separators |
| Surface        | `#FBFCFE` | Card backgrounds, table headers         |
| Primary        | `#019881` | Brand teal - CTAs, links, focus rings   |
| Danger         | `#C41C1C` | Destructive actions, errors             |
| Warning        | `#9A5B13` | Caution states, pending items           |
| Success        | `#1F7A1F` | Confirmed states, positive deltas       |

## 8. Templates

For component-specific patterns, see (all paths relative to this skill folder):

- **Modal:** `templates/modal/modal-template.md`
- **Design Variants:** `templates/design-variants.md`
