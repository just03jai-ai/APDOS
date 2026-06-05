# Modal Template

This document captures a reusable modal pattern based on the implementation style used in `MapSoTemplate.tsx`. It is intended as a generic template for create-order and similar modals.

> **Note:** For `designVariant` prop values, see [design-variants.md](../design-variants.md)

## Base Modal Shell

- Component: `Modal` from `@farmart-engineering/central-component-library`
- Recommended width: `600px` for standard form/detail modals
- Modal padding: `0`
- Header bottom border: `1px solid #CDD7E1`
- Footer top border: `1px solid #CDD7E1`
- Footer horizontal padding: `5` spacing units = `20px`
- Footer vertical padding: `4` spacing units = `16px`
- Open state: controlled by parent `open` boolean
- Close handler:
  - call parent toggle or close callback
  - optionally reset modal-specific transient state

## App Font

- Primary font family: `Noto Sans, sans-serif`
- Imported globally in the app root

## Spacing Scale

The shared theme uses `spacing(n) = n * 4px`.

- `paddingX={5}` = `20px`
- `paddingY={4}` = `16px`
- `padding={4}` = `16px`
- `mb={2}` = `8px`
- `mb={3}` = `12px`
- `gap={4}` = `16px`
- `spacing={6}` in `Grid` = `24px`

## Typography Tokens

These are the common typography levels that fit this modal pattern.

| Usage | Token | Size | Weight | Line height | Color |
| --- | --- | --- | --- | --- | --- |
| Modal title | `title-lg` | `1.125rem` / `18px` | `700` | `1.33334` (`~24px`) | `text.primary` |
| Section title | `title-md` | `1rem` / `16px` | `600` | `1.5` (`24px`) | default/primary |
| Primary field value | `title-sm` | `0.875rem` / `14px` | `600` | `1.42858` (`~20px`) | `text.primary` |
| Supporting label | `body-sm` | `0.875rem` / `14px` | regular | `1.5` (`21px`) | `text.primary` |
| Metadata label | `body-xxs` | `0.8rem` / `12.8px` | `500` | `1rem` (`16px`) | `text.tertiary` |
| Table header | `label-md` | `0.625rem` / `10px` | `600` | `0.875rem` (`14px`) | `text.primary` |
| Table/body helper text | `label-sm` | `0.625rem` / `10px` | `400` | `0.875rem` (`14px`) | `text.primary` |

## Header Layout

- Wrapper: `Row`
- Direction: `row`
- Width: `100%`
- Justification: `space-between`
- Padding X: `20px`
- Padding Y: `16px`
- Title: `Typography level='title-lg'`
- Header should contain only the modal title and dismiss action unless a modal explicitly requires status metadata in the header
- Do not place helper or warning copy in the header; keep explanatory text in the body
- Close button:
  - `IconButton`
  - `designVariant='PlainSmNeutral'`
  - `sx={{ padding: 0 }}`
  - icon: `CloseRounded fontSize='medium'`

## Body Layout

### Loading State

- Wrapper: centered `Box`
- Suggested height: `350px` when body content is async
- Show `CircularProgress`

### Content State

- Outer wrapper: `Box px={5} py={4}` or `Column px={5} py={4}` = `20px` horizontal and `16px` vertical
- Use `title-md` for internal section headings
- Use `Grid container spacing={6}` for paired key-value or two-column details
- Use `Column gap={4}` for primary stacked modal sections
- Place helper, warning, or irreversible-action copy at the top of the body, above identifiers and form controls
- Show an entity reference only when the modal needs contextual identification such as an order number, supplier ID, request ID, or document ID
- If an entity reference is shown, place it below the helper copy
- Render conditional blocks only when the related state exists
- For data tables:
  - `borderAxis='both'`
  - `designVariant='PlainLgNeutral'`
  - `borderRadius='xl'` = `16px`

## Footer Layout

- Wrapper: `Grid container justifyContent='flex-end'`
- Footer should use `px={5}` and `py={4}`
- Primary action:
  - `Button`
  - `designVariant='SolidMdPrimary'`
- Optional secondary action can sit to the left with a small gap

## Destructive Modal Pattern

Use this variant for terminate, reject, delete, or irreversible operational actions.

- Title should stay short and direct, for example `Terminate Order`, `Reject Request`, `Delete Item`
- Explanatory copy belongs in the body, not the header
- Body copy should clearly state the consequence of the action
- If an identifier is needed for context, place it immediately below the message, for example `Order: {entityId}` or `Supplier ID: {entityId}`
- Primary action should use a danger variant such as `SolidMdDanger`
- Secondary action should usually use `OutlinedMdNeutral`

## Testing Contract

When implementing this modal pattern in FarMart apps, interactive elements should include explicit `data-testid` props.

- Required on footer action buttons
- Required on form inputs/selects when they are part of the main action path
- Prefer stable names such as:
  - `entity-action-submit-button`
  - `entity-action-cancel-button`
  - `entity-action-comment-input`

## Generic Structure

This modal pattern is organized into three parts:

1. Header with title and dismiss action
2. Body for details, form controls, or conditional content
3. Footer with right-aligned actions

## Reusable Template

```tsx
const handleClose = () => {
  onClose();
  // Reset modal-only local state here if needed
};

const modalTitle = (
  <Row
    flexDirection='row'
    width='100%'
    justifyContent='space-between'
    paddingX={5}
    paddingY={4}
  >
    <Typography designVariant='PlainNeutral' level='title-lg'>
      Modal Title
    </Typography>

    <IconButton
      sx={{ padding: 0 }}
      autoFocus
      onClick={handleClose}
      designVariant='PlainSmNeutral'
    >
      <CloseRounded fontSize='medium' />
    </IconButton>
  </Row>
);

const modalBody = isLoading ? (
  <Box height={350} alignItems='center' justifyContent='center' display='flex'>
    <CircularProgress />
  </Box>
) : (
  <Column px={5} py={4} gap={4}>
    <Typography level='body-sm' textColor='text.secondary' mb={2}>
      After performing this action, no further action can be performed on it.
    </Typography>

    {showEntityReference && (
      <Typography
        level='title-sm'
        designVariant='PlainDanger'
        mb={3}
      >
        {entityLabel}: {entityId}
      </Typography>
    )}

    <Typography level='title-md' designVariant='PlainNeutral' mb={2}>
      Section Title
    </Typography>

    <Grid container spacing={6} mb={3}>
      <Grid xs={6}>{/* left content */}</Grid>
      <Grid xs={6}>{/* right content */}</Grid>
    </Grid>

    <Typography level='body-sm' textColor='text.primary'>
      Supporting Label
    </Typography>

    <Column gap={4}>{/* inputs / details / table */}</Column>
  </Column>
);

const modalFooter = (
  <Grid container justifyContent='flex-end' px={5} py={4}>
    <Button
      data-testid='modal-submit-button'
      designVariant='SolidMdPrimary'
      onClick={handleSubmit}
    >
      Submit
    </Button>
  </Grid>
);

return (
  <Modal
    open={open}
    onClose={handleClose}
    modalDialogProps={{
      sx: { padding: 0, width: 600 },
      dialogTitleProps: {
        children: modalTitle,
        sx: { borderBottom: '1px solid #CDD7E1', width: '100%' },
      },
      dialogContentProps: {
        children: modalBody,
      },
      dialogActionsProps: {
        children: modalFooter,
        sx: { borderTop: '1px solid #CDD7E1', padding: 0 },
      },
    }}
  />
);
```

## Reuse Rules

- Keep the border color consistent: `#CDD7E1`
- Use `px={5}` and `py={4}` on modal header, body, and footer
- Use `title-lg` only for the modal heading
- Use `title-md` for section headings inside the modal
- Use `body-xxs`, `label-sm`, or `label-md` for supporting text and metadata
- Keep helper or consequence messaging in the body, not in the header
- For destructive flows, place the entity identifier directly below the message only when that reference adds necessary context
- Keep actions right-aligned unless the flow explicitly needs a split footer
- Use `gap={4}` for the main stacked sections in the modal body and footer actions row
- Keep `dialogActionsProps.sx.padding` at `0` when the footer wrapper applies `px={5}` and `py={4}`
- Add stable `data-testid` values on interactive elements in implementation code
- Reset modal-local state in the close handler if reopening should start clean
