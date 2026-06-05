# FarmartOS Module Contacts

**Primary** = module owner (design + delivery accountability).
**Secondary / Tertiary** = key contributors.

> Source: owner review session 2026-05-23. Git log contacts below are now secondary to
> this owner table. Release checklist leads (s02–s13) do not exist — confirmed.

---

## Module Owners (from owner review session, 2026-05-23)

| Module | BE Directory | Primary | Secondary | Tertiary | Notes |
|---|---|---|---|---|---|
| Master Purchase Order | `apis/v1/master_purchase_order/` | Yash | Yogesh | Vivek | |
| Sales Orders | `apis/v1/sales/` | Yogesh | Yash | Vivek | |
| Payments | `apis/v1/payment/` | Uttkarsh | Yashpal | Vivek | |
| Auto Invoice | `apis/v1/auto_invoice/` | Yogesh | Vivek | — | |
| Logistics / Trip | `apis/v1/trip_tracking/` | Yashpal | Navnesh | Ankit | |
| KYC | `apis/v1/kyc/` | Uttkarsh | Yashpal | Vivek | |
| Access Control | `apis/v1/access_control/` | Vivek | Mehtab | Ankit | |
| Buyer | `apis/v1/buyer/` | Vivek | Uttkarsh | Yashpal | |
| Broker | `apis/v1/broker/` | Ankit | Aslam | Yogesh | Data-collection only (SO form input field) |
| DS Integration | `apis/v1/ds_integartion/` | Uttkarsh | Mehtab | — | Calls internal Data Science service |
| Consignment / Inventory | `apis/v1/consignment/` | Navnesh | Yash | Ankit | |
| Supplier Payable | `apis/v1/supplier_payable_management/` | Vivek | Yashpal | Uttkarsh | |
| Buyer Reconciliation | `apis/v1/buyer_payment_reconciliation/` | Yogesh | Vivek | — | |
| Retailer (Supplier profile) | `apis/v1/retailer/` | Yashpal | — | — | |
| Mandi Tax | `apis/v1/mandi_taxation/` | Ankit | Yashpal | Yash | |
| Audit Resolution | `apis/v1/audit_resolution/` | Mahesh | Deepak | — | |
| Crop Creation | `apis/v1/crop/` | Sukhpreet | Vivek | Yogesh | |
| E-Invoicing | `apis/v1/e_invoicing/` | Yogesh | Vivek | — | GST/IRN layer for taxable commodities |
| GST Summary | `apis/v1/gst_summary/` | Yatharth | Yashpal | — | FarmartApp only (not OS/ProApp) |
| Buyer Onboarding | `apis/v1/buyer_onboarding/` | Vivek | Yashpal | Uttkarsh | |

---

## Git Log Contacts (pre-session, for reference only)

> These were derived from `git log` and may reflect last-touch not ownership.
> Use the owner table above as the authoritative source.

| Module | Last Git Committer | Email |
|---|---|---|
| Purchase Orders | Vidhatra Shukla | `shuklavidhatra@gmail.com` |
| Sales Orders | Vivek Anand | `vivek.Anand@farmart.co` |
| Payments | ankitfarmart | `ankitfarmart@users.noreply.github.com` |
| Auto Invoice | ankitfarmart | `ankitfarmart@users.noreply.github.com` |
| Logistics / Trip | master-27 (Mohit) | `mohitkandwalkaku@gmail.com` |
| KYC | Vivek Anand | `vivek.Anand@farmart.co` |
| Access Control | AnushkaBhattacharjee | `anushka.bhattacharjee@farmart.co` |
| Buyer | Vivek Anand | `vivek.Anand@farmart.co` |

---

## Delivery Leads & PMs by Sprint

> To be populated from release checklists. Fetch each sprint's release checklist
> doc via Outline MCP and extract the delivery lead and PM names.

| Sprint | Feature | Delivery Lead | PM |
|---|---|---|---|
| s09 | Create Order & PO T&C | [fetch from checklist `7b53df5c`] | — |
| s13 | Mark as Complete (PO) | [fetch from checklist `6907252e`] | — |
| s14 | SO Approval v1 | [fetch from checklist `f4780ba3`] | — |
| s16 | Trip Management v2 | — | — |
| s18 | API Based Payments | [fetch from checklist `0199a917`] | — |
| s21 | Auto Invoicing | [fetch from checklist `70333ee4`] | — |
| s22 | Supplier KYC v1 | [fetch from checklist `ac43931c`] | — |
| s24 | RBAC in Access Creation | [fetch from checklist `1199b52b`] | — |
| s25 | Row Level Security | — | — |
| s28 | Purchase Booking v1 | [fetch from checklist `8d4fc505`] | — |
| s29 | Restructuring POs | [fetch from checklist `d033ea1d`] | — |
| s32 | Supplier KYC v2 | [fetch from checklist `c94d184c`] | — |
| s33 | Buyer Deduction | [fetch from checklist `6dd2b670`] | — |
| s35 | Purchase Booking v2 | [fetch from checklist `d401a315`] | — |
| s37 | SO Approval v2 | [fetch from checklist `64ca3a23`] | — |
| s38 | Update Invoice | — | — |
| s39 | Single Click CN | [fetch from checklist `372b4a21`] | — |
| s40 | SO Approval v3 | [fetch from checklist `96222dba`] | — |
| s41 | Buyer Onboarding | [fetch from checklist `ed562215`] | — |
| s45 | Buyer Reconciliation | [fetch from checklist `d05d1c09`] | — |

---

## How to resolve `[fetch from checklist <id>]`

```
outline_fetch({ documentId: "<checklist-id>" })
```

Look for the fields: "Delivery Lead", "PM", "Product Owner", or equivalent.
Update this table in place when resolved.
