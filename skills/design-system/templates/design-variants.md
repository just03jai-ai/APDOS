# CCL Design Variants

The `designVariant` prop is a unified styling system used across all components in `@farmart-engineering/central-component-library`. It combines MUI Joy's variant, size, and color into a single string.

## Pattern

```
designVariant = {Variant}{Size}{Color}
```

All parts are **PascalCase** and concatenated together.

---

## Variant Options

| Variant | Description |
|---------|-------------|
| `Solid` | Filled background with contrasting text |
| `Soft` | Light tinted background with darker text |
| `Outlined` | Transparent with border |
| `Plain` | No background, no border (ghost style) |

---

## Size Options

| Size | Description |
|------|-------------|
| `Sm` | Small - compact padding |
| `Md` | Medium - default size |
| `Lg` | Large - spacious padding |

---

## Color Options

| Color | Hex | Usage |
|-------|-----|-------|
| `Primary` | `#019881` | Brand teal - main CTAs, links, focus |
| `Neutral` | `#636B74` | Gray - secondary actions, default text |
| `Danger` | `#C41C1C` | Red - destructive actions, errors |
| `Success` | `#1F7A1F` | Green - confirmations, positive states |
| `Warning` | `#9A5B13` | Amber - caution states, pending items |

---

## Component-Specific Patterns

### Button / IconButton

Pattern: `{Variant}{Size}{Color}`

```tsx
// Primary CTA
<Button designVariant="SolidMdPrimary">Submit</Button>

// Danger/Destructive action
<Button designVariant="SolidMdDanger">Delete</Button>

// Secondary action
<Button designVariant="OutlinedMdNeutral">Cancel</Button>

// Tertiary/Ghost action
<Button designVariant="PlainSmNeutral">Skip</Button>

// Soft style
<Button designVariant="SoftMdSuccess">Approve</Button>
```

**Common Button Variants:**

| Use Case | designVariant |
|----------|---------------|
| Primary CTA | `SolidMdPrimary` |
| Destructive action | `SolidMdDanger` |
| Secondary action | `OutlinedMdNeutral` |
| Cancel/Dismiss | `PlainMdNeutral` |
| Success action | `SolidMdSuccess` |
| Warning action | `SolidMdWarning` |
| Small ghost button | `PlainSmNeutral` |
| Large primary | `SolidLgPrimary` |

### IconButton

Pattern: `{Variant}{Size}{Color}`

```tsx
// Close button in modal header
<IconButton designVariant="PlainSmNeutral">
  <CloseRounded />
</IconButton>

// Delete icon button
<IconButton designVariant="PlainSmDanger">
  <DeleteOutlined />
</IconButton>
```

**Common IconButton Variants:**

| Use Case | designVariant |
|----------|---------------|
| Modal close | `PlainSmNeutral` |
| Toolbar action | `PlainMdNeutral` |
| Delete action | `PlainSmDanger` |
| Edit action | `PlainSmPrimary` |

---

### Typography

Pattern: `{Variant}{Color}` (no size - size is controlled by `level` prop)

```tsx
// Default text
<Typography designVariant="PlainNeutral" level="body-sm">
  Regular text
</Typography>

// Error/Danger text
<Typography designVariant="PlainDanger" level="title-sm">
  Error message
</Typography>

// Warning text
<Typography designVariant="PlainWarning" level="title-sm">
  Warning: DO ID: 12345
</Typography>

// Success text
<Typography designVariant="PlainSuccess" level="body-sm">
  Payment successful
</Typography>
```

**Common Typography Variants:**

| Use Case | designVariant |
|----------|---------------|
| Default text | `PlainNeutral` |
| Error message | `PlainDanger` |
| Warning/Caution | `PlainWarning` |
| Success message | `PlainSuccess` |
| Link/Action text | `PlainPrimary` |

---

### Input

Pattern: `{Variant}{Size}{Color}`

```tsx
<Input
  designVariant="OutlinedLgNeutral"
  placeholder="Enter value"
/>
```

**Common Input Variants:**

| Use Case | designVariant |
|----------|---------------|
| Standard input | `OutlinedMdNeutral` |
| Large input | `OutlinedLgNeutral` |
| Error state | `OutlinedMdDanger` |

---

### Table

Pattern: `{Variant}{Size}{Color}`

```tsx
<Table
  designVariant="PlainLgNeutral"
  borderAxis="both"
/>
```

---

## All Valid Combinations

### For Button/IconButton/Input (with Size):

```
Solid   + Sm/Md/Lg + Primary/Neutral/Danger/Success/Warning
Soft    + Sm/Md/Lg + Primary/Neutral/Danger/Success/Warning
Outlined+ Sm/Md/Lg + Primary/Neutral/Danger/Success/Warning
Plain   + Sm/Md/Lg + Primary/Neutral/Danger/Success/Warning
```

**Total: 60 combinations** (4 variants x 3 sizes x 5 colors)

### For Typography (without Size):

```
Plain   + Primary/Neutral/Danger/Success/Warning
Soft    + Primary/Neutral/Danger/Success/Warning
Solid   + Primary/Neutral/Danger/Success/Warning
Outlined+ Primary/Neutral/Danger/Success/Warning
```

**Total: 20 combinations** (4 variants x 5 colors)

---

## Quick Reference Table

| Component | Pattern | Example |
|-----------|---------|---------|
| Button | `{Variant}{Size}{Color}` | `SolidMdPrimary` |
| IconButton | `{Variant}{Size}{Color}` | `PlainSmNeutral` |
| Typography | `{Variant}{Color}` | `PlainWarning` |
| Input | `{Variant}{Size}{Color}` | `OutlinedLgNeutral` |
| Table | `{Variant}{Size}{Color}` | `PlainLgNeutral` |

---

## Usage with theme

The designVariant is parsed internally by CCL's `parseDesignVariant()` function which extracts:

```typescript
parseDesignVariant('SolidMdDanger')
// Returns: { variant: 'solid', size: 'md', color: 'danger' }
```

These values are then applied to the underlying MUI Joy component.

---

## Do's and Don'ts

**Do:**
- Use `SolidMdPrimary` for the single most important CTA per screen
- Use `SolidMdDanger` only for destructive actions (delete, terminate, reject)
- Use `PlainSmNeutral` for close/dismiss icon buttons
- Use `PlainWarning` or `PlainDanger` for highlighting important IDs/numbers

**Don't:**
- Don't mix multiple `Solid` primary buttons in the same view
- Don't use `Danger` color for non-destructive actions
- Don't hardcode colors - always use designVariant for consistency
