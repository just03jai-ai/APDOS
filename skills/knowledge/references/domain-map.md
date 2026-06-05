# FarmartOS Domain Map

Module dependencies derived from prod code in `MarketLinkage-BE` (`main` branch).
When in doubt, read `apis/v1/<module>/` in MarketLinkage-BE and
`apps/farmart-os/src/page/<module>/` in central-admin-panel — do not infer from names.

> Owner-verified 2026-05-23. No open questions remain.

---

## Core Flow (Happy Path)

```
Supplier Onboarding (KYC)
  └── Sample Creation (master_sample)
        └── Purchase Order Creation (master_purchase_order / purchase_order)
              ├── Sales Order Allocation (sales)
              ├── Dispatch (trip_tracking / consignment)
              │     └── Unloading (po_unloading)
              │           └── Invoicing (po_so_invoicing / auto_invoice)
              │                 └── Payment (payment / supplier_payable_management)
              │                       └── Zoho Sync (cross-cutting)
              └── Buyer Order (buyer / buyer_group)
                    └── Buyer Repayment (payment sub-flow)
```

---

## Module Dependencies

### Purchase Orders (`master_purchase_order`, `purchase_order`)
- **Requires:** KYC approved supplier (`kyc`) — PO cannot be created without an onboarded supplier
- **Requires:** Approved sample (`master_sample`) — sample must exist before PO is raised
- **Feeds into:** Invoicing (`auto_invoice`) after dispatch+unloading
- **Feeds into:** Supplier payable (`supplier_payable_management`) after PO completion
- **Linked to:** Sales Orders (`sales`) via SO→PO allocation flow
- **Linked to:** Trip tracking (`trip_tracking`) for dispatch logistics
- **GMV + GTV are unified** under `master_purchase_order` (MPO). Originally GMV = `purchase_crop_orders`,
  GTV = `trade_saudas` + `trade_dispatches`. Both now create an MPO → DOs (Dispatch Orders = PO in BE).
  ProApp creates POs from SO allocation or supplier directly. FarmartApp (separate repo) handles GTV
  cases from trades directly — these are called **Buyer Prices** in OS-app.

### Trade (`trade`)
- **Live module** (not legacy) — handles inter-trader GTV flows
- `trade` prices and sauda logic work as-is; the unification happened at the MPO layer above it
- **`broker`** in `apis/v1/broker/` is just an entry input field on the SO form — data collection only, no business logic

### Sales Orders (`sales`)
- **Linked to:** Purchase Orders — SOs are allocated against available POs
- **Linked to:** Buyer (`buyer`, `buyer_group`) — SO is raised on behalf of a buyer
- **Feeds into:** Invoicing when SO is fulfilled

### Invoicing (`po_so_invoicing`, `auto_invoice`, `e_invoicing`)
- **Requires:** Completed PO unloading (`po_unloading`) — invoice generated post-unloading
- **Requires:** Buyer GST details (`buyer`, `gst_summary`) for tax calculation
- **Feeds into:** Payments (`payment`) — payment initiated post-invoice
- **Syncs to:** Zoho Books (cross-cutting) — invoice mirrored in accounting system
- **Depends on:** Mandi tax calculation (`mandi_taxation`) for tax line items
- **`po_so_invoicing` is legacy** — service layer is dead. Its Sequelize **models**
  (`po_so_invoice`, `po_so_invoice_doc`, `po_so_invoice_status_log`) in
  `database/models_v2/po_so_invoicing/` are still live shared models used by buyer,
  purchase_order (v2), and consignment modules. `auto_invoice` is the active path.
- **`e_invoicing`** = GST/IRN layer for taxable commodities (not a payment flow)
- **`gst_summary`** = FarmartApp only (separate from OS-app and ProApp); shows consolidated
  GST view to suppliers. Not part of the invoicing pipeline.

### Payments (`payment`, `supplier_payable_management`, `supplier_recovery`)
- **Does NOT require an invoice** — payment initiation guards on: APPROVED payment status,
  valid fundsource, and bank account details only. No invoice existence check. (verified in `initiate_batch_transfer_service.js`)
- **Requires:** Supplier bank details from KYC (`kyc`) — for payout initiation
- **Syncs to:** Zoho Books for reconciliation
- **Related:** Buyer payment reconciliation (`buyer_payment_reconciliation`) is a separate flow

### Logistics / Trip (`trip_tracking`, `consignment`)
- **Triggered by:** PO dispatch action (`master_purchase_order`)
- **Feeds into:** Unloading (`po_unloading`) — trip end triggers unloading flow
- **Does NOT require location serviceability** — `location` module is used only in the trade flow, not for trip creation

### KYC (`kyc`)
- **Prerequisite for:** Purchase Orders — supplier must be KYC approved
- **Prerequisite for:** Payments — bank details captured in KYC flow
- **Providers:** Cashfree KYC (primary), Gridlines (secondary) — see `docs/research/kyc.md`

### Buyer Onboarding (`buyer`, `buyer_group`)
- **Used by:** Sales Orders — buyer must exist before SO can be raised
- **Linked to:** Access control (`access_control`) — buyer has role-based visibility [verify]
- **Linked to:** Repayments — buyer repayment tracking

### Access Control / RBAC (`access_control`)
- **Cross-cutting:** Applied to all modules via `check_resource_control` middleware
- **Row Level Security:** Controls which records a user can see (region/role-based)
- **Feeds:** Permission mappings in `policy_permission_mappings` DB table

### Zoho Integration (cross-cutting)
- **Receives from:** Invoicing — invoice data synced to ZohoBooks
- **Receives from:** Payments — payment data synced for reconciliation
- **Buyer reconciliation:** `buyer_payment_reconciliation` syncs receivables

---

## FE Page → BE Module Mapping

| FE Page | BE Modules |
|---|---|
| `procurement/` | `master_purchase_order`, `purchase_order`, `master_sample`, `retailer` |
| `sales/` | `sales`, `buyer`, `buyer_group` |
| `trade/` | `trade`, `master_purchase_order`, `master_sample` |
| `payments/` | `payment`, `supplier_payable_management`, `supplier_recovery`, `farmart_bank` |
| `logistic/`, `logisticsV3/` | `trip_tracking`, `consignment` |
| `inventory/` | `consignment`, `po_unloading` |
| `accessCreation/` | `access_control`, `users` |
| `dashboard/` | `dashboard`, cross-cutting aggregations |

---

## Shared DB Tables (cross-module risk)

> Reading or writing these tables from multiple modules creates coupling.
> Changes to these tables require checking all consumers.

| Table | Used by |
|---|---|
| `master_purchase_orders` | purchase_order, sales, invoicing, supplier_payable |
| `master_samples` | master_sample, purchase_order |
| `retailers` | retailer (supplier profile), kyc, purchase_order |
| `buyers` | buyer, sales, payment, invoicing |
| `policy_permission_mappings` | access_control (all routes check this) |

> Full table list is not yet exhaustive — add entries as cross-module coupling is discovered.
