# FarMart Database Knowledge Base

> Last updated: 2026-05-06

---

## Index

1. [Overview](#1-overview)
   - 1.1 Business Model
   - 1.2 Database Architecture & Gold Views
   - 1.3 Consignment (CO) Flow
   - 1.4 Gold View Dependency Chain
   - 1.5 View-Specific Gotchas
2. [Schema Reference](#2-schema-reference)
   - 2.1 Key Identifiers
   - 2.2 Key Tables by Domain
3. [Critical Gotchas & Common Mistakes](#3-critical-gotchas--common-mistakes)
4. [Business Metrics Reference](#4-business-metrics-reference)
   - 4.1 Default Filters (Always Apply)
   - 4.2 Metric Summary Table
   - 4.3 AP Days (Detail)
   - 4.3a AP Days for DOs within COs (Detail)
   - 4.4 AR Days (Detail)
   - 4.5 Estimated Margin (Detail)
   - 4.6 Provisional P&L (Detail)
5. [Analysis Guide](#5-analysis-guide)
   - 5.1 Date Field Guide
   - 5.2 Aggregation & Slicing
   - 5.3 Common Business Questions
   - 5.4 Common Query Patterns
6. [System Controls & Business Rules](#6-system-controls--business-rules)
   - 6.1 PO-Level Controls
   - 6.2 DO-Level Controls
   - 6.3 Buyer Deduction & Unloading Edit Controls
   - 6.4 GST Controls

---

## 1. Overview

### 1.1 Business Model

FarMart is an agricultural commodity trading platform that sits between farmers (suppliers) and buyers (mills/processors).

**Core flow:**
```
Supplier (Farmer)
    → Purchase Order (PO)  [master_purchase_crop_orders]
        → Dispatch Order (DO)  [purchase_crop_orders]
            → Invoice  [invoices]
                → Credit / Debit Notes
                    → Payment & Collection
    ← Sales Order (SO)  [buyer_order_details]  ← Buyer (Mill)
```

**Key relationships:**
- One **PO** can have multiple **DOs**
- One **SO** can be mapped to multiple **POs** — every DO under a PO inherits the SO mapped to that PO
- One DO can have only one Invoice that is not Cancelled (status_id=5) or Settled (status_id=8)
- One Invoice can cover multiple DOs — CN/DN metrics are at invoice level and must be scaled to each DO via `do_share`
- One SO can have multiple Invoices
- POs are **never** linked directly to Invoices — the link is always via DO

**Business Units** (sourced from `master.google_sheet_data_silver.employee_business_unit_mapping`):
Bihar, UP, MP, Maharashtra, Rajasthan, Karnataka, Jharkhand, Chhattisgarh, AP-TL, Spices, West Bengal, Gujarat

**Two business types:**
- `Procurement` — `user_role_id = 11`
- `B2B` — everything else

---

### 1.2 Database Architecture & Gold View

| Layer | Catalog / Schema | Purpose |
|---|---|---|
| Silver (transactional) | `master.app_os_db_silver` | Raw operational data — POs, DOs, invoices, payments |
| Gold (analytical) | `master.gold` | Pre-computed view layers for BI / analysis |
| Google Sheets | `master.google_sheet_data_silver` | Reference data synced from Sheets (BU mapping, buyer grouping) |
| Data Science | `master.data_science_db_silver` | ML / DS outputs (e.g. `customer_payment` for AR days) |

**Gold View Catalog:**

| View | Grain | Purpose | Dependencies |
|---|---|---|---|
| `vw_do_summary` | One row per DO | Base DO-level metrics from silver (first-pass sales only) | Silver tables only |
| `vw_co_do_summary` | One row per (origin DO, CO) | DO-level detail within consignments; prorated procurement + selling | `vw_do_summary`, silver |
| `vw_do_business_summary` | One row per DO (+ secondary CO rows) | Combined view: first-pass DO sales UNION ALL secondary CO sales | `mv_do_summary`, `mv_co_do_summary` |
| `vw_co_summary` | One row per CO | CO-level aggregation from DO-within-CO detail | `vw_co_do_summary`, silver |
| `vw_invoices_summary` | One row per invoice | Invoice-level P&L, AR Days, payment tracking | `vw_do_business_summary`, silver |
| `vw_buyer_collections` | One row per payment-invoice mapping | Buyer cash collection detail | Silver tables only |
| `vw_supplier_payments` | One row per procurement payment | Supplier payment detail with TAT | `vw_do_business_summary`, silver |
| `vw_sales_orders_summary` | One row per SO | SO pipeline: qty buckets (to-dispatch, in-transit, fulfilled, rejected) | Silver tables only |
| `vw_finance_cn_tracker` | One row per invoiced DO | CN deduction tracking: OS deductions vs formal CNs, expected CN amount | `vw_do_summary`, silver |
| `vw_finance_credit_notes` | One row per credit note | CN detail for finance: GST split, Zoho sync, quantity, subtotal/total | `vw_do_business_summary`, silver |
| `vw_finance_supplier_deductions` | One row per deduction log | Supplier & transporter deduction detail with unloading weights and remarks | `vw_do_summary`, `vw_finance_cn_tracker`, silver |
| `vw_finance_purchase_booking` | One row per DO | DO-level purchase booking summary: cost, GST, payment, transport breakdown | `mv_do_summary`, silver |
| `vw_farmartai_metrics` | One row per IST calendar day | Daily FarMart AI adoption % across 5 operation types | Silver, bronze, MongoDB |

**Materialized views (MV):** `mv_do_summary` and `mv_co_do_summary` are precomputed versions of the corresponding views. `vw_do_business_summary` references these MVs for performance (avoids expanding the full CTE chain on every query).

**Key conventions across all gold views:**
- All monetary values in INR; all quantity outputs in quintals
- Column names use snake_case (e.g. `do_number`, `cm2_rs`, `actual_cm2_pct`)
- `is_active = 1` filter applied on every silver table join
- Invoice whitelist: `status_id IN (4, 6, 9, 10)` — Created, Completed, Cancellation Pending, Settlement Pending
- Business unit attribution: `employee_business_unit_mapping` deduplicated by `MIN(business_unit)` per user_profile_id

---

### 1.3 Consignment (CO) Flow

When a DO's stock is rejected at the buyer and sent to a warehouse (not RTV), it enters the consignment flow:

```
DO (truck arrives at buyer) → Unloading → Rejection/Shortage
    ↓
po_pending_inhand_details (stock enters pending pool; consignment_id IS NULL)
    ↓
po_consignment_mappings (selected_quantity allocated to a CO)
    ↓
consignments (CO created, dispatched from warehouse to new buyer)
    ↓
invoice_items (via consignment_id — CO gets its own invoice)
    ↓
If CO itself is rejected → back to po_pending_inhand_details (consignment_id = parent CO)
    → po_consignment_mappings → new child CO  (recursive chain, up to 15 hops)
```

**Key tables:**

| Table | Role |
|---|---|
| `consignments` | Core CO record: `farmart_id` (CO number), `buyer_order_id` (SO link), `dispatched_by`, `warehouse_details_id`, `consignment_quantity_kg` |
| `po_pending_inhand_details` | Stock pool: `consignment_id IS NULL` = from DO; `IS NOT NULL` = from rejected CO |
| `po_consignment_mappings` | Allocation: `po_pending_inhand_id` → `consignment_id` with `selected_quantity` |
| `invoice_items` | CO invoice link via `consignment_id` (parallel to `purchase_crop_order_id` for DOs) |
| `order_delivery_details` | CO unloading via `consignment_id` |

**Key identifiers:**
- `consignments.farmart_id` = CO number (e.g. COHRGUM002252)
- `consignments.id` = internal CO key

---

### 1.4 Gold View Dependency Chain

```
Silver tables
    ↓
vw_do_summary ────────→ mv_do_summary (materialized)
    ↓
vw_co_do_summary ─────→ mv_co_do_summary (materialized)
    ↓                         ↓
vw_co_summary        vw_do_business_summary (UNION of mv_do_summary + mv_co_do_summary)
                              ↓
                     vw_invoices_summary
                     vw_supplier_payments
```

`vw_buyer_collections` and `vw_sales_orders_summary` read from silver directly (no gold dependencies).

`vw_finance_purchase_booking` reads from `mv_do_summary` (the MV, not `vw_do_summary`). `vw_finance_credit_notes` and `vw_finance_supplier_deductions` read from `vw_do_business_summary` / `vw_do_summary` + silver. `vw_farmartai_metrics` reads from silver, `app_os_db_bronze`, and `fmt_mongodb_bronze` — no gold dependencies.

---

### 1.5 View-Specific Gotchas

#### vw_do_summary
- New columns added (2026-04-22 onwards): `do_dispatched_on` (pco.dispatched_date), `supplier_id` (mmd.farmart_id), `accepted_qty_qtl` (po_unloading_qty_details type_id=2 ÷100), `bill_available` (Yes/No), `transport_cost_grn_po_for_gm`, `unloading_remarks` (po_unloading_deduction_reports.unloading_comment)
- **Mandi tax** sourced from `pco.mandi_tax_value` (absolute Rs), NOT from bill_components id=1
- **DN quantity** tracked and netted against CN qty: DN qty reduces cn_weight_loss_qty first, remainder reduces cn_rejection_qty — see G27
- **Transport cost fallback**: when payment_deductions_for_transports is empty, falls back to payment_ledgers transporter_payable — see G28
- **Scenario 1 CN allocation**: cancelled DO absorbs CN rejection first on multi-DO invoices — see G29
- **_cn_alloc_share**: quality/bardana/CD CN allocated by OS deduction amounts (not do_share) when all DOs have approved OS — see G30
- **Inland vendor logic**: Inland buyer DOs get crop/variety overridden to Rice/Parboiled Broken, and a vendor credit provision applied to provisional P&L — see G31
- **Float noise guard**: `GREATEST(ROUND(qty, 9), 0.0)` on gross/net invoice qty; gmv=0 AND niv=0 forces gm/cm2/pct to 0.0 and AP/AR/WC to 0 — see G32

#### vw_do_business_summary
- **UNION of two sources:** First-pass DO sales from `mv_do_summary` + secondary CO sales from `mv_co_do_summary` (only `warehouse_name = 'Secondary Sales'`)
- `co_number` is NULL for first-pass rows, populated for secondary sales rows
- Selling metrics (GMV, CM2, etc.) are NULL when `invoice_number IS NULL` — enforced by CASE guards
- Secondary sales recalculate COGS as `qty × rate` (not from DO-level procurement cost components)
- `ap_days`, `ar_days`, `wc_days`, `rejected_destination` are NULL when `invoice_number IS NULL`
- Includes full provisional P&L columns for first-pass DO rows (from `mv_do_summary`) AND secondary CO rows (from `mv_co_do_summary`) — CO provisional columns were NULL before 2026-05-05; requires `mv_co_do_summary` refresh after `vw_co_do_summary` changes
- Columns propagated from vw_do_summary: `do_dispatched_on`, `supplier_id`, `bill_available`, `transport_cost_grn_po_for_gm`, `so_booked_by`, `accepted_qty_qtl`

#### vw_finance_cn_tracker
- **Grain:** one row per invoiced, non-terminated DO (filters out DOs without invoice, and terminated DOs)
- **Purpose:** finance reconciliation of buyer deductions — compares OS-booked deductions vs formal CNs raised
- **Sorted by** `buyer_deduction_approved_on DESC`
- **Deduction columns** (from `po_deduction_history_details`): `deduction_cash_discount`, `deduction_bag_deduction`, `deduction_weight_loss`, `deduction_rejection` (= formal CN rejection deduction, NOT from po_deduction_history_details), `deduction_quality`, `deduction_bank_processing_charges`, `deduction_rate_difference`, `deduction_weighing_charges`, `deduction_others`, `deduction_total`
- ⚠️ `deduction_rejection` = `rejection_deduction_cn_rs` from vw_do_summary (formal CN), not the REJECTION type from po_deduction_history_details
- `expected_cn_amount` = pulled from `vw_do_summary.expected_credit_note_amount` — see G26 for K-logic
- `buyer_deduction_approved_on` = MAX(verified_at) from po_deduction_history_details for that DO
- `quality_remark` and `deduction_remark` from `po_deduction_history_details.metadata` JSON: `get_json_object(metadata, '$.quality_remark')` and `$.deduction_remarks`
- `rejected_qty_qtl`, `shortage_qty_qtl`, `damage_qty_qtl` from `po_unloading_qty_details` types 4/6/8 ÷ 100 (direct, not derived)
- `total_cn_amount` = formal CN only (quality + bardana + CD from vw_do_summary) — not OS amounts
- `cn_pending` flag: 'Yes' when `expected_credit_note_amount > 0 AND all formal CN amounts = 0`

#### vw_invoices_summary
- **902 CO/consignment invoices** have no active DO linkage — uses `invoice_direct_so` fallback via `invoices.so_farmart_id`
- Primary DO/SO/PO selected by largest weight/qty per invoice (ROW_NUMBER approach)
- AR Days: pending portion capped at `due_date` if not yet overdue, `CURRENT_DATE()` if overdue
- `cn_dn` = `basic_amt − net_invoice_value_rs` (net credit/debit note impact)
- `delay_days` clamped to 0 (no negative delays)
- `zoho_sync_status`: Synced/Not Synced — cancelled invoices (status_id=9) need action_type=10 completed; non-cancelled need action_type=1 completed OR (action_type=1 failed + action_type=7 completed)
- Added columns: `irn`, `eway_number`, `created_by` (COALESCE(up.name, 'FarMart AI')), `taxable_status` (TAXABLE if buyer_details.kyc_gst_id IS NOT NULL)

#### vw_finance_credit_notes
- **Grain:** one row per credit note. Excludes `is_invoice_from_zoho = 1` invoices.
- **cn_quantity_qtl**: sum of cndm.quantity for description_id IN (2=weight_loss, 7=rejection) — already in qtl
- **GST split**: inter-state (`inv.igst > 0`) → igst = total−subtotal, cgst=sgst=0; intra-state → cgst=sgst=(total−subtotal)/2, igst=0
- **Primary DO/PO**: highest dispatch weight per invoice, deterministic tie-break on farmart_id
- **Zoho sync**: action_type=3 (create CN) and action_type=9 (update CN). "Synced" = create completed OR (create failed + update completed)
- `business_unit` and `buyer_name` from `vw_do_business_summary` (joined on do_number)

#### vw_finance_supplier_deductions
- **Grain:** one row per `payment_deduction_logs_for_retailers` entry (status IN 'ACTIVE', 'FULFILLMENT_CHARGES')
- Dimensions from `vw_do_summary`; `quality_remark` from `vw_finance_cn_tracker`
- `supplier_deduction_reason` from `retailer_payment_deduction_reasons`; defaults to 'Other Deductions'
- `zoho_sync_status` from `supplier_debit_note_mappings.zoho_sync_status` — 'DONE' = Synced
- `reject_destination` from `po_pending_inhand_send_to_enums` (via po_pending_inhand_details)
- Weight breakdown: accepted/rejected/shortage/damage from `po_unloading_qty_details` types 2/4/6/8

#### vw_finance_purchase_booking
- **Grain:** one row per DO. Sources `mv_do_summary` (NOT `vw_do_summary`) for cost/payment columns
- **GST amounts**: `(latest payment_ledgers net_payable + tds + SUM(all recovery)) × GST%`
- **Transport**: `revised_transport_cost` from `payment_deductions_for_transports` if available, else `total_transport_cost` from `order_delivery_details`
- `fulfillment_charge` from `pco`; `halting_charges` from `procurement_order_bill_components` id=6; `supplier_deduction_recovery` from deduction logs reason_id=6
- `for_status`: `procurement_lots.f_o_r` (0=No, else=Yes)

#### vw_farmartai_metrics
- **Grain:** one row per IST calendar day (2025-04-01+). Five AI metrics: invoices, KYC, buyer mapping, invoice mapping, CN/DN
- **AI identification**: invoices = `invoice_items.auto_invoicing_status = 5`; CN/DN = `created_by IS NULL or not in user_profiles`; KYC = `approved_by IS NULL or not in user_profiles`; buyer mapping = webhook req_url; invoice mapping = `user_profile_id = 0 or not in user_profiles`
- **MongoDB timestamps** (change_logs): true UTC — shift +330 minutes before casting to IST date. Silver timestamps: use directly (IST mislabelled UTC)
- **KYC**: uses `app_os_db_bronze.master_merchant_details` CDC for approval timestamps; status 11=AUTO_APPROVED, 13=MANUAL_APPROVED
- **Buyer exclusion**: buyer_id NOT IN (2171, 2344, 2451, 2891, 2903, 2925, 3027) and buyer_name ≠ 'FMT AGRO SERVICE PRIVATE LIMITED'

#### vw_co_do_summary
- **Two distinct proration shares:** `do_weight_share` (procurement: accepted_kg / DO_total_kg) vs `do_within_co_share` (selling: accepted_kg / CO_total_accepted_kg) — different denominators
- **AP Days uses CO unloading date:** `SUM(DATEDIFF(co_unloaded_on, pay_date) × amount) / SUM(amount)` — NOT the DO's own unloading date
- **Recursive depth capped at 15 hops** in the po_flow CTE to prevent infinite loops
- CN/DN deductions are at invoice level, prorated to CO (by co_share), then to DO (by do_within_co_share) — two-step proration
- SO dimensions (buyer, broker, delivery state) come from the **CO's SO**, not the DO's SO
- **Provisional metrics** (7 columns: `expected_supplier_deduction`, `expected_credit_note_amount`, `provisional_niv`, `provisional_gmv`, `provisional_gm`, `provisional_cm2`, `provisional_cm2_pct`) added 2026-05-05 — all NULL for Inland/FMT Agro/Farmart buyers; OS deductions from `po_deduction_history_details WHERE consignment_id IS NOT NULL`; proration uses `do_within_co_share` (not `do_weight_share`); GREATEST guard on both expected deductions to handle fully-forwarded rows where `do_within_co_share ≤ 0` — see G33

#### vw_co_summary
- Aggregates from `vw_co_do_summary` via GROUP BY co_number
- **Actual CM2% recomputed from sums** — never averaged (G18 applies)
- **AP Days uses procurement-cost weighting:** `SUM(ap_days × proc_cost) / SUM(proc_cost)` across DOs
- `is_multi_bu_co` flag when DOs from different BUs contribute to the same CO
- Crop/Variety use `MAX_BY(field, qty_bought_qtl)` — picks the dominant value by quantity

#### vw_invoices_summary
- **902 CO/consignment invoices** have no active DO linkage — uses `invoice_direct_so` fallback via `invoices.so_farmart_id`
- Primary DO/SO/PO selected by largest weight/qty per invoice (ROW_NUMBER approach)
- AR Days: pending portion capped at `due_date` if not yet overdue, `CURRENT_DATE()` if overdue
- `cn_dn` = `basic_amt − net_invoice_value_rs` (net credit/debit note impact)
- `delay_days` clamped to 0 (no negative delays)

#### vw_buyer_collections
- Grain is one row per `buyer_payment_invoice_mappings` entry (multiple rows per invoice possible)
- Primary DO selected by largest `net_weight` (not quantity or cost)
- BU attribution via the primary DO's creator → employee_business_unit_mapping

#### vw_supplier_payments
- Grain is one row per `procurement_payments` entry (multiple installments per DO)
- `payment_transactions` deduplicated by MAX aggregation to avoid fan-out from multiple transaction attempts
- `payment_for = 1` filter: only supplier payments (excludes transporter and GST)
- TAT = `TIMESTAMPDIFF(MINUTE, pp.created_at, pp.paid_at)`
- DO date filter: `created_at >= '2025-04-01'`

#### vw_sales_orders_summary
- **Quantity pipeline buckets** are mutually exclusive by DO status:
  - In-transit: status 7,8,9 → dispatch net weight
  - Fulfilled: status 10,12,13,14,16 → accepted weight from unloading
  - Rejected: type 4 from unloading (excludes in-transit DOs)
  - To-dispatch: residual (po_qty − fulfilled − in_transit − rejected)
  - Pending: SO qty − PO qty (not yet PO'd)
- `master_purchase_orders.quantity` is in **MT** (×10 for quintals)
- No gold dependencies — reads entirely from silver

---

## 2. Schema Reference

### 2.1 Key Identifiers

| DB Field | Table | View Label | Description |
|---|---|---|---|
| `id` | `master_purchase_crop_orders` | PO ID | PO defines price and terms. One PO → many DOs |
| `id` | `purchase_crop_orders` | DO ID | Base unit. One row per dispatch |
| `farmart_id` | `purchase_crop_orders` | **DO Number** | Human-readable DO identifier (e.g. DOAPKUL017936) — use this, not `.id` |
| `farmart_id` | `master_purchase_crop_orders` | PO Number | Human-readable PO identifier |
| `farmart_id` | `buyer_order_details` | SO Number | Human-readable SO identifier |
| `id` | `buyer_order_details` | SO ID | Internal SO key |
| `id` | `invoices` | Invoice ID | One active (non-Cancelled, non-Settled) invoice per DO |
| `id` | `master_merchant_details` | Supplier ID | |
| `id` | `buyer_details` | Buyer ID | |
| `id` | `buyers_broker_details` | Broker ID | Broker on the SO linked to the DO |
| `user_profile_id` | `purchase_crop_orders` | DO Created By ID | PA who created the DO |
| `placed_by` | `buyer_order_details` | SO Created By ID | PA who created the SO |
| `order_booked_by_id` | `buyer_order_details` | SO Booked By ID | PA whose team fulfils the SO |

---

### 2.2 Key Tables by Domain

#### Purchase Orders (PO)

There are **two distinct PO tables** with different status enums — do not mix them up:

**Supplier-side PO** (linked to DOs):
| Table | Grain | Key Fields |
|---|---|---|
| `master_purchase_crop_orders` | One row per PO | id, farmart_id, status, termination_reason_id, rejection_reason_id, sauda_type, created_at, master_po_id |
| `master_purchase_crop_order_statuses` | Lookup | id, name |

**Supplier-side PO Status Enum** (`master_purchase_crop_orders.status`):
| id | name | id | name |
|---|---|---|---|
| 1 | RECONSENT_PENDING | 6 | REJECTED |
| 2 | SUPPLIER_CONSENT_PENDING | 7 | PO_APPROVED |
| 3 | SUPPLIER_CONSENT_REJECTED | 8 | COMPLETED |
| 4 | TERMINATED | 9 | PO_REQUESTED |
| 5 | INCOMPLETE | | |

**Buyer-side PO** (linked to SOs):
| Table | Grain | Key Fields |
|---|---|---|
| `master_purchase_orders` | One row per buyer PO | id, farmart_id, buyer_order_id (→ SO), quantity (MT), status, created_at, is_active |
| `master_purchase_order_statuses` | Lookup | id, name |

**Buyer-side PO Status Enum** (`master_purchase_orders.status`):
| id | name | id | name |
|---|---|---|---|
| 1 | PO_REQUESTED | 6 | REJECTED |
| 2 | SUPPLIER_CONSENT_PENDING | 7 | SUPPLIER_CONSENT_REJECTED |
| 3 | PO_APPROVED | 8 | TERMINATED |
| 4 | INCOMPLETE | 9 | RECONSENT_PENDING |
| 5 | COMPLETED | | |

#### Dispatch Orders (DO)
| Table | Grain | Key Fields |
|---|---|---|
| `purchase_crop_orders` | One row per DO | id, farmart_id, status, master_po_id, buyer_order_id, crop_id, quantity, **price** (used for COGS), procurement_lot_id, **fulfillment_charge**, user_profile_id, dispatched_date |
| `purchase_crop_order_statuses` | Lookup | id, name |

**DO Status Enum:**
| id | name | id | name |
|---|---|---|---|
| 1 | PO_CREATED | 10 | DELIVERED |
| 3 | VEHICLE_ARRIVED | 11 | CANCELLED |
| 4 | LOADING_STARTED | 12 | PARTIAL_DELIVERED |
| 5 | LOADING_FINISHED | 13 | DEDUCTION_SUBMITTED |
| 6 | READY_TO_DISPATCH | 14 | COMPLETED |
| 7 | DISPATCHED | 15 | TERMINATED |
| 8 | ARRIVED_AT_BUYER | 16 | INCOMPLETE |
| 9 | UNLOADING | | |

#### Sales Orders (SO)
| Table | Grain | Key Fields |
|---|---|---|
| `buyer_order_details` | One row per SO | id, farmart_id, buyer_id, placed_by, order_booked_by_id, **buyer_offering_price_quintal** (Rs/Qtl), **net_price** (Rs/Qtl), **is_margin_on_gross_price**, order_quantity_in_ton, repayment_days, status, created_at |
| `buyer_order_statuses` | Lookup | id, name |

**SO Status Enum** (`buyer_order_details.status`):
| id | name | id | name |
|---|---|---|---|
| 1 | SO_CREATED | 7 | REJECTED_PRICE_PARITY |
| 2 | MODIFY_PRICE | 8 | APPROVED_BY_VP |
| 3 | MODIFY_QUANTITY | 9 | APPROVED_BY_CFO |
| 4 | REJECTED_NO_CREDIT_LIMIT | 10 | REJECTED_BY_CFO |
| 5 | REJECTED_CREDIT_OVERDUE | 15 | *(COMPLETED — not yet in lookup table)* |
| 6 | REJECTED_BAD_CREDIT | | |

Note: status 15 appears on completed SOs (confirmed on SOKAKLR029514) but has no row in `buyer_order_statuses`, so it renders as NULL in any status-name join.

#### Supplier & Buyer Masters
| Table | Key Fields |
|---|---|
| `master_merchant_details` | id, farmart_id, business_name, name, district_id, state_id |
| `buyer_details` | id, farmart_id, zoho_id, kyc_gst_id ← GST flag |
| `buyer_order_delivery_infos` | buyer_order_id, address, state_name, district_name, pincode |
| `buyers_broker_details` | id, name, mobile_number |
| `buyer_grouping` *(google_sheet_data_silver)* | buyer_id, buyer_group_name |
| `master_districts` | id, name |
| `master_states` | id, name |

#### Procurement Configuration
| Table | Key Fields |
|---|---|
| `procurement_lots` | id, **retailer_locked_price** (display price to supplier), fulfillment_charge, transport_cost_est, bag_deduction, **f_o_r** (1=FOR), **halting_charges_to_be_borne_by** (1=FARMART, 2=SUPPLIER), **unloading_charges_to_be_borne_by** (1=FARMART, 2=SUPPLIER), **dispatch_by** (1=FARMART, 2=SUPPLIER) |
| `procurement_order_bill_components` | procurement_lot_id, order_bill_component_id, amount — IDs: **1=Mandi Tax** (absolute Rs), **2=Commission** (Rs/Qtl rate), **3=Labour+Gunnybag** (Rs/Qtl rate), **6=Halting** (absolute Rs) |
| `crop_details` | id, name |
| `crop_varieties_details` | id, name |

#### Delivery & Logistics
| Table | Key Fields |
|---|---|
| `order_delivery_details` | id, purchase_crop_order_id, gross_weight **(kg)**, net_weight **(kg)**, weight_slip_generated_on (= unloading timestamp). **One active row per DO — always filter `is_active = 1`** |
| `po_delivery_details` | purchase_crop_order_id, dispatch_date, expected_delivery_date |
| `order_delivery_logs` | order_detail_id, order_delivery_stage_id, log_time — stage 9=vehicle arrived, 6/8/10=unloading |
| `order_delivery_documents` | order_delivery_id, created_at — first doc = dispatch start |

#### Unloading & Quality
| Table | Key Fields |
|---|---|
| `po_unloading_qty_details` | purchase_crop_order_id, po_unloading_qty_type_id, value **(kg)** — type IDs: **2=accepted**, **4=rejected**, **6=shortage**, **8=damage** |
| `po_pending_inhand_details` | purchase_crop_order_id, send_to — **send_to=3 = RTV** (cargo returned to vendor) |
| `po_unloading_history_qty_details` | purchase_crop_order_id, created_at (unloading_added_at), verified_at (unloading_approved_at), metadata (remark) |
| `po_unloading_deduction_reports` | purchase_crop_order_id, deduction_amount, deduction_remarks |

#### Payments & Ledger
| Table | Key Fields |
|---|---|
| `payment_ledgers` | purchase_crop_order_id, **payment_type_id** (1=supplier, 2=transporter, 3=GST), net_payable, paid_amount, tds, recovery |
| `procurement_payments` | purchase_crop_order_id, order_delivery_id, amount, paid_at, **is_gst_payment** (0=DO, 1=GST), **payment_for** (1=supplier, 2=transporter, 3=GST), utr_number, is_active |
| `payment_transactions` | procurement_payment_id, **created_at** (= actual payment timestamp for AP Days), is_active |
| `payment_deduction_logs_for_retailers` | purchase_crop_order_id, deduction_amount, **retailer_payment_deduction_reason_id** — **reason_id=6 = recovery** (exclude from deduction total) |
| `payment_deduction_logs_for_transports` | purchase_crop_order_id, deduction_amount, is_active |
| `payment_deductions_for_transports` | purchase_crop_order_id, halting_charges, unloading_charges, route_change_charges, **commodity_cost** (transport cost component, NOT procurement COGS), revised_transport_cost, is_active |

#### Invoicing & Notes
| Table | Key Fields |
|---|---|
| `invoices` | id, invoice_no, status_id, subtotal, total, due_date, date, repayment_days, created_at, **balance_due**, reconciliation_status, reconciled_at, reconciled_by, **paid_amount** (⚠️ auto-includes credit_amount — not purely cash paid) — **whitelist: status_id IN (4, 6, 9, 10)** |
| `invoice_items` | id, invoice_id, purchase_crop_order_id, quantity **(quintals)**, subtotal — **one row per DO per invoice** |
| `credit_notes` | id, invoice_id, status_id — **active: status_id = 1** |
| `credit_notes_and_description_mappings` | credit_note_id, description_id, subtotal, quantity — IDs: **1/2/5/6/9=Quality, 3=CD, 4=Bardana, 7/8=Rejection**; qty field: **desc_id=7 → rejection qty**, **desc_id=2 → weight loss qty** |
| `debit_notes` | invoice_id, subtotal, total, status_id — **active: status_id = 1; DNs INCREASE GMV (buyer owes more)** |

#### Buyer Collections (AR)
| Table | Key Fields |
|---|---|
| `bank_transactions` | id, zoho_account_id (→ zoho_bank_accounts), **type** — `type`: `uncategorised` = not yet allocated to a buyer; `matched`/`categorised` = entry exists in buyer_payment_collections |
| `zoho_bank_accounts` | id, **account_name** — display name for the FarMart receiving bank account |
| `buyer_payment_collections` | id, **collection_id** (receipt number), buyer_id, **collection_date** (paid_at), **utr_reference**, **unapplied_amount** (portion not yet mapped to an invoice), **amount** (total collection amount), **payment_status** — enum: `pending`, `partially_mapped`, `completed`, `adjusted` |
| `buyer_payment_collections` (cont.) | **bank_transaction_id** (→ bank_transactions.id) — direct FK, no linking table |
| `buyer_payment_invoice_mappings` | id, **payment_collection_id** (→ buyer_payment_collections.id), **invoice_id** (→ invoices.id), **mapped_amount** — the amount settled against this specific invoice |

**Collection flow:**
```
bank_transactions (incoming credit)
    → buyer_payment_collections (buyer identified; bank_transaction_id is direct FK)
        → buyer_payment_invoice_mappings (mapped to specific invoice)
```

**Key gotchas:**
- `bank_transactions.type = 'uncategorised'` means not yet allocated — exclude from collection analysis
- `invoices.paid_amount` automatically includes credit_note amounts, so it ≠ cash collected; use `buyer_payment_invoice_mappings.mapped_amount` for actual cash payments against an invoice
- `unapplied_amount` on buyer_payment_collections = portion of the collection not yet mapped to any invoice (available for future mapping)

**Invoice status whitelist for analysis:**
| id | Status | Include? |
|---|---|---|
| 1 | Incomplete | No |
| 2 | Placed Payment Pending | No |
| 3 | Payment Received | No |
| 4 | Created | **Yes** |
| 5 | Cancelled | No |
| 6 | Completed | **Yes** |
| 7 | Creation Pending | No |
| 8 | Settled | No — settled by CN of equivalent value |
| 9 | Cancellation Pending | **Yes** |
| 10 | Settlement Pending | **Yes** |

#### Margin Estimation
| Table | Key Fields |
|---|---|
| `po_estimated_margins` | buyer_order_id, assigned_user_id, master_merchant_id, price (estimated procurement cost Rs/Qtl), quantity, ap_days, status ('completed'), is_active |

#### AR Collection
| Table | Key Fields |
|---|---|
| `customer_payment` *(data_science_db_silver)* | invoice_number, amount, created_time |

#### Trade / Sauda
| Table | Key Fields |
|---|---|
| `trade_sauda_dispatch_details` | purchase_crop_order_id, trade_sauda_id |
| `trade_saudas` | id, sauda_type |

#### Users & Business Units
| Table | Key Fields |
|---|---|
| `user_profiles` | id, name, employee_id, mobile_number, user_role_id |
| `user_state_district_maps` | user_id, state_id, district_id |
| `employee_business_unit_mapping` *(google_sheet_data_silver)* | **user_profile_id**, business_unit — join via `user_profiles.id` (not employee_id; column was renamed) |

---

## 3. Critical Gotchas & Common Mistakes

> Read this section before writing any query. These are the most common sources of wrong results.

---

### G1. DO Number ≠ DO ID
`purchase_crop_orders.farmart_id` is the human-readable DO number (e.g. `DOAPKUL017936`).
`purchase_crop_orders.id` is the internal integer key. **Never filter on `.id` when the user gives you a DO number like `DOAPKUL...`.**

---

### G2. Dispatch weights are ALWAYS in kg in silver — divide by 100 for quintals
`order_delivery_details.net_weight` and `gross_weight` are stored in **kg**.
`po_unloading_qty_details.value` is also **kg**.
All business metrics (Qty Bought, Rejected Qty, etc.) are in **quintals** = kg ÷ 100.
`invoice_items.quantity` is the exception — it is already in **quintals**.

---

### G3. SO prices are already in Rs/Qtl — do NOT divide by 10
`buyer_offering_price_quintal` and `net_price` on `buyer_order_details` are stored directly as **Rs per quintal**. No unit conversion needed. (Historical queries sometimes applied `/ 10.0` — this is wrong.)

---

### G4. `order_delivery_details` has one row per DO (when `is_active = 1`)
With the standard `is_active = 1` filter applied, there is effectively one active row per DO in `order_delivery_details`. Soft-deleted rows (`is_active = 0`) may exist for the same DO — omitting the filter can return multiple rows and produce wrong weights. Always filter `is_active = 1`.

---

### G5. CANCELLED DOs are NOT excluded from the gold view — only CANCELLED + RTV are
The gold view only excludes DOs where `do_status = 'CANCELLED' AND rtv_flag IS NOT NULL`.
Plain CANCELLED DOs (cargo not returned) remain in the view. **Do not add a blanket filter on CANCELLED status** unless you specifically want to exclude them.
RTV is identified via `po_pending_inhand_details WHERE send_to = 3`, not via a column named `rejected_destination`.

---

### G6. Total Procurement Cost uses COGS (100%), not Commodity Cost (99%)
```
Total Procurement Cost = COGS + Labour + Commission + Mandi + Halting
                       + Transport Net − Supplier Deduction − DO Rejected Qty Cost
```
`COGS = dispatch_net_weight_kg × pco.price / 100` (the full 100% cost).
`Commodity Cost = COGS × 0.99` is a separate metric shown in the output, but the P&L formula starts from COGS. Using Commodity Cost here will under-state Total Procurement Cost by 1%.

---

### G7. GMV ≠ Net Invoice Value — they deduct different CN components
```
GMV             = do_subtotal − rejection_CN × rejection_share + DN × do_share
Net Invoice Val = GMV − quality_CN × do_share − bardana_CN × do_share − CD_CN × do_share
```
Quality, Bardana, and CD credit notes are **not** in GMV — they only reduce Net Invoice Value.
Debit notes **add** to GMV (the buyer owes more, not less). A common mistake is to treat DNs as a deduction.

**Important:** rejection CNs use `rejection_share` (not `do_share`) — see G21.
Quality, Bardana, and CD still use `do_share`.

---

### G8. Gross Invoice Qty ≠ Net Invoice Qty — different treatment of weight loss, and both use per-type shares (not do_share)
```
Gross Invoice Qty = do_qty − (cn_rejection_qty × rejection_share + cn_weight_loss_qty × weight_loss_share)
                    [deducted only if combined total > 10 Qtl]

Net Invoice Qty   = do_qty − cn_rejection_qty × rejection_share              [always]
                           − cn_weight_loss_qty × weight_loss_share           [only if weight_loss × weight_loss_share > 10 Qtl]
```
`Gross Invoice Qty` is used as the **Selling Price denominator**. It combines rejection and weight_loss for the threshold check. `Net Invoice Qty` assesses weight_loss independently.

Both formulas use `rejection_share` (type_id=4) and `weight_loss_share` (type_id=6+8) — NOT `do_share`. See G21 for share definitions. (Changed from do_share in 2026-04-21.)

---

### G9. Bill component rates are NOT all the same type — and Mandi Tax moved to the DO table
From `procurement_order_bill_components`:
- **id=2 (Commission)** and **id=3 (Labour+Gunnybag)** → stored as **Rs/Qtl rates** → multiply by `dispatch_net_weight_kg / 100` to get total cost
- **id=6 (Halting)** → stored as **absolute Rs amount** → use directly
- ~~**id=1 (Mandi Tax)**~~ → **DO NOT use** bill_components id=1 for mandi tax. The gold view sources mandi tax from `purchase_crop_orders.mandi_tax_value` (absolute Rs per DO) instead.

**Mandi tax source:** `purchase_crop_orders.mandi_tax_value` — this is an absolute rupee amount on the DO, not a rate. Using bill_components for mandi gives wrong or zero results.

Multiplying a per-Qtl rate as if it were an absolute amount (or vice versa) gives wildly wrong figures.

---

### G10. AP Days / AR Days / WC Days are NULL — not zero — when unloading hasn't happened
- **AP Days**: only computed when `unloaded_on IS NOT NULL AND total_net_payable > 0`
- **AR Days**: only computed when `invoice_unloaded_at IS NOT NULL AND invoice_total_inc_gst > 0`
- **WC Days**: only computed when both AR Days and AP Days are non-NULL
- **Cancelled + RTV + no invoice**: AP/AR/WC are forced to NULL when `do_status = 'Cancelled' AND rejected_destination = 'RTV' AND (invoice_number IS NULL OR TRIM(invoice_number) = '')` — see G24
- **Always filter `IS NOT NULL` before averaging any of these**
- Do not use `COALESCE(..., 0)` — zero would pull the average down incorrectly
- Negative AP Days (payment recorded before unloading timestamp) is valid — do not treat as an error

---

### G11. AP Days uses `payment_transactions.created_at`, NOT `procurement_payments.paid_at`
The payment timestamp for AP Days is `payment_transactions.created_at`.
`procurement_payments.paid_at` is used only as a cutoff filter (`paid_at >= '2023-04-01'`), not as the date in the formula.

---

### G12. CN rejection qty and weight_loss qty come from different description rows
In `credit_notes_and_description_mappings`:
- Rejection quantity → `quantity` field WHERE `description_id = 7`
- Weight loss quantity → `quantity` field WHERE `description_id = 2`
- **Quality deductions** include `description_id IN (1, 2, 5, 6, 9, 10)` — id=10 was added and is now in scope

Both contribute to `Rejected Qty`. The subtotal fields on these rows are the rejection deduction amounts — do not confuse the `quantity` and `subtotal` fields.

**Allocation:** these CN values are at invoice level and must be split across DOs. Rejection uses `rejection_share` (proportional to actual buyer-rejected kg at unloading), not `do_share`. Weight loss uses `weight_loss_share` (proportional to shortage+damage kg). Both fall back to `do_share` when no unloading data exists. See G21.

**DN quantity netdown:** active debit notes (`status_id = 1`) carry a `quantity` field that offsets CN quantities. DN qty is applied to `cn_weight_loss_qty` first; any remainder reduces `cn_rejection_qty`. This prevents double-counting when a DN reverses a weight-loss or rejection CN. See G27.

---

### G13. `pco.price` and `retailer_locked_price` are different fields
- `purchase_crop_orders.price` → used to compute **COGS** (the actual price per Qtl for the transaction)
- `procurement_lots.retailer_locked_price` → the **display price shown to the supplier** (`Qty Purchased At` in reports)

These can differ. COGS must use `pco.price`, not `retailer_locked_price`. The DO Rejected Qty Cost uses `retailer_locked_price`.

---

### G14. `payment_deductions_for_transports.commodity_cost` is NOT procurement COGS
This field is a transport cost component (part of the gross freight cost). It has nothing to do with the commodity purchase price. The two fields happen to share the name `commodity_cost` but are completely unrelated.

---

### G15. Supplier Deduction includes `fulfillment_charge` — and it's on the DO, not the lot
```
Supplier Deduction = SUM(payment_deduction_logs_for_retailers.deduction_amount WHERE reason_id ≠ 6)
                   + purchase_crop_orders.fulfillment_charge
```
`fulfillment_charge` lives on `purchase_crop_orders`, not on `procurement_lots`. Joining to `procurement_lots` to find it will give wrong results.
`reason_id = 6` is a recovery (refund to supplier for over-deduction) — it is excluded from the total, not subtracted separately.

---

### G16. Est CM2% is NULL for SOs created before 2025-04-01
The estimated margin calculation filters `buyer_order_details.created_at >= '2025-04-01'`. DOs linked to SOs created before this date will have NULL `Est CM2%` and NULL `Est AP Days`. This is a known data gap, not a query error.

---

### G17. `do_share` denominator uses ALL active `invoice_items`, not just whitelisted invoices
The denominator for `do_share` is `SUM(invoice_items.quantity WHERE is_active=1)` for that `invoice_id`. The invoice status whitelist is applied separately when joining to the `invoices` table. The share calculation itself does not filter by invoice status.

---

### G18. Never average CM2% or Selling Price across DOs — always recompute from sums
```sql
-- CORRECT
SUM(`CM2 (Rs)`) / NULLIF(SUM(`Net Invoice Value (Rs)`), 0)
SUM(`GMV (Rs)`) / NULLIF(SUM(`Gross Invoice Qty`), 0)

-- WRONG
AVG(`Actual CM2 %`)
AVG(`Selling Price (Rs)`)
```
Each DO may represent different volumes. Averaging ratios without weighting by volume gives misleading aggregate figures.

---

### G19. The gold view column names have spaces and special characters
When filtering or referencing columns from `vw_do_business_summary`, use backtick quotes:
```sql
WHERE `DO #` = 'DOAPKUL017936'
SELECT `Business Unit`, `CM2 (Rs)`, `Actual CM2 %`
```
Column names like `DO Number`, `CM2 (Rs)`, `Actual CM2 %`, `DO #` will fail without backticks.

---

### G20. DO share is at invoice level, not DO level — one DO can appear on multiple invoices
In theory a DO can appear in multiple invoices (e.g. partial billing). Always group `invoice_items` by both `invoice_id` and `purchase_crop_order_id` when aggregating from silver.

---

### G21. CN rejection is allocated by actual unloading rejection weight, NOT by do_share

When multiple DOs share an invoice and a rejection CN is raised, the CN value must be split proportionally by how much each DO actually had rejected at unloading — NOT by `do_share` (invoice qty proportion).

**Two separate share fields** computed in the `unloading_invoice_shares` CTE:

| Share | Type IDs | Used for |
|---|---|---|
| `rejection_share` | type_id=4 (buyer rejected) | `rejected_qty_cn_qtl` (rejection portion), `rejection_deduction_cn_rs`, GMV |
| `weight_loss_share` | type_id=6 (shortage) + type_id=8 (damage) | `rejected_qty_cn_qtl` (weight loss portion) |

**Fallback:** if `invoice_rejected_kg = 0` (no unloading data), both shares fall back to `do_share`. This handles DOs that were invoiced before unloading data was recorded.

**Why this matters:** using `do_share` for rejection misattributes cost when one DO had a large rejection and another had none. Validated on DOs DORJALR016629 + DORJALR016641.

**Both `gross_invoice_qty_qtl` and `net_invoice_qty_qtl` use the same per-type shares** (rejection_share for rejection, weight_loss_share for weight loss). This was updated 2026-04-21 — the previous behaviour used `do_share` for both in net_invoice_qty_qtl.

**Two rejection qty columns in `vw_do_business_summary`:**
- `rejected_qty_unloading_qtl` — physical kg rejected at the buyer gate (type 4+6+8 from `po_unloading_qty_details`)
- `rejected_qty_cn_qtl` — CN-derived rejection allocated to this DO by weight share

These will differ when the CN doesn't perfectly match the physical rejection.

---

### G22. `procurement_payments` rows with `paid_at IS NULL` are draft/pending — exclude from paid totals

`procurement_payments` can have rows where `paid_at IS NULL` — these are draft or pending payment records, not actual completed payments. A separate row with the same amount and a non-NULL `paid_at` represents the actual payment.

**Always filter `paid_at IS NOT NULL`** when summing paid amounts (supplier, transporter, GST). Without this filter, paid totals are inflated — sometimes nearly 2x.

The AP Days CTE (`ap_paid`) is not affected because it already filters `paid_at >= '2023-04-01'`, which naturally excludes NULLs.

**Discovered on:** POUPFRD059766 — had payment_id 128493 (`paid_at = NULL`, amount 7,71,800) duplicating payment_id 128505 (`paid_at = 2025-07-28`, same amount). Correct paid = 8,22,571; inflated = 15,94,371.

---

### G23. AP Days: overpaid DOs must rescale the paid portion

When `total_paid_ap > total_net_payable`, the paid-portion weights (`amount / total_net_payable`) sum to > 1.0, inflating AP Days (often making it wildly negative when payments precede unloading).

**Fix:** multiply the paid portion by `total_net_payable / total_paid_ap` so the effective denominator becomes `total_paid_ap` and weights sum to 1.0. The pending portion is already 0 (fully paid). When not overpaid, the rescale factor is 1.0 (no change).

**Example:** DOUPJPN017134 — payable = 20,701.50, paid = 4,83,895 (23x overpaid). Payment was 2 days before unloading. Without rescaling: AP = −46.75. With rescaling: AP = −2.0.

**Note:** the CO-level AP Days formula (`vw_co_do_summary`) already uses `SUM(payment_amount)` as the denominator, so it doesn't have this issue.

---

### G24. Cancelled + RTV DOs with no invoice → NULL AP/AR/WC Days

DOs where `do_status = 'Cancelled' AND rejected_destination = 'RTV' AND invoice_number is empty` should have NULL AP Days, AR Days, and WC Days — even if they have unloading and payment data. These represent returned-to-vendor cargo with no buyer-side financial activity.

Implemented in the final SELECT of `vw_do_summary` and in the first-pass SELECT of `vw_do_business_summary`.

---

### G25. GRN-PO transport cost appears in GM but NOT in CM2

Some DOs have transport costs booked via the GRN/PO flow (field: `order_delivery_details.transport_cost_for_grn_po`) rather than the formal transporter payable flow (`payment_deductions_for_transports` → `transport_cost_net_rs`). These are different cost channels.

```
transport_cost_grn_po_for_gm = SUM(order_delivery_details.transport_cost_for_grn_po)
```

**GM deducts it** when `transporter_cost_payable_rs = 0` (i.e. no formal transport payable was raised):
```
GM = GMV − Net COGS − transport_cost_grn_po_for_gm   [when transporter_cost_payable_rs = 0]
```

**CM2 does NOT deduct it** — by design. CM2 only subtracts `transport_cost_net_rs` (formal payable). So for GRN-PO transport DOs, `GM < CM2` is expected and correct.

`gm_rs`, `cm2_rs`, and `actual_cm2_pct` all zero out when `gmv = 0 AND net_invoice_value = 0` (fully rejected DOs).

---

### G26. Provisional P&L — OS buyer deductions, K-logic, and expected CN

`vw_do_summary` (and first-pass rows of `vw_do_business_summary`) carries a full provisional P&L block for DOs that are invoiced but don't yet have finalised CNs.

**OS buyer deductions** — sourced from `po_deduction_history_details` (CTE: `os_buyer_deductions`):

| detail_type | Column |
|---|---|
| QUALITY_DEDUCTION | `os_quality_deduction_rs` |
| BAG_DEDUCTION | `os_bardana_deduction_rs` |
| WEIGHT_LOSS | `os_weight_loss_rs` |
| CASH_DISCOUNT | `os_cash_discount_rs` |
| BANK_PROCESSING_CHARGES | `os_bank_processing_rs` |
| RATE_DIFFERENCE | `os_rate_difference_rs` |
| WEIGHING_CHARGES | `os_weighing_charges_rs` |
| OTHER_DEDUCTIONS | `os_other_deductions_rs` |
| REJECTION | `os_rejection_rs` |

All 9 types are summed into `_total_os_buyer_deductions`. **Do not forget REJECTION** — it is a distinct detail_type in `po_deduction_history_details` and is often the largest OS deduction.

**`expected_credit_note_amount`** (output column) — gated entirely by `_has_cn`:

**When `_has_cn = 0` (no formal CN at all):** sum all OS buyer deductions + SO-rate provisions:
- E: rejection CN gap (fires only when `is_deduction_approved = 0`)
- F: OS quality + bardana + weight_loss
- G: OS cash discount
- H: OS other deductions (bank processing + rate diff + weighing + other)
- I: SO cash_discount_pct × prov_net_invoice_qty (when os_cash_discount = 0 and unapproved)
- J: SO bag_deduction_pct × prov_net_invoice_qty (when os_bardana = 0 and unapproved)
- K: SO brokerage_charges × gross_invoice_qty (when unapproved)
- L: SO unloading_charges × gross_invoice_qty (when unapproved)

**When `_has_cn = 1` (formal CN exists):** only M-logic:
- M: if `_total_formal_cn < _invoice_os_total × _cn_alloc_share` → expected = shortfall; else 0

`_total_formal_cn = cn_rejection × rejection_share + cn_quality × _cn_alloc_share + cn_bardana × _cn_alloc_share + cn_cd × _cn_alloc_share`
`_total_os_buyer_deductions` = all 9 types from po_deduction_history_details (including REJECTION type — see G26 table).
`_has_cn = 1` when any of cn_rejection_qty / cn_weight_loss_qty / cn_quality / cn_bardana / cn_cd > 0.

**`expected_supplier_deduction`** — two paths (as of May 2026):

**Residual path** (single-DO invoice, non-inland, including secondary-sales DOs):
`GREATEST(_raw_sup_ded − supplier_deduction_rs, 0)` — full expected deduction minus what's already been charged.
Secondary-sales DOs (rejected_destination ≠ RTV) use this path because the primary DO's P&L is self-contained; the supplier owes for the full rejected qty regardless of what the secondary CO does.

**Guarded path** (inland DOs and multi-DO invoices):
- **A:** rejection-based (supplier_deduction ≤ 300 and there is rejected qty)
- **B/B2:** OS cash discount / bardana on gross-price SO
- **K (approved):** OS quality + bank processing + weighing + rate diff + other + excess weight_loss

**Provisional output columns:**

| Column | ESD variant used | Formula |
|---|---|---|
| `provisional_niv` | — | `net_invoice_value − expected_credit_note_amount` |
| `provisional_gmv` | — | `gmv − rejection_CN_gap` |
| `provisional_gm` | `expected_supplier_deduction` (proc-cost rate) | `provisional_gmv − net_cogs + expected_supplier_deduction` |
| `provisional_cm2` | `_expected_supplier_deduction_cogs` (COGS rate) | `provisional_niv − (total_procurement_cost_rs − _esd_cogs)` |
| `provisional_cm2_pct` | `_expected_supplier_deduction_cogs` (COGS rate) | `provisional_cm2_numerator / provisional_niv × 100` |

`provisional_cm2` and `provisional_cm2_pct` use the same COGS-rate ESD — they are always sign-consistent. `provisional_gm` uses the proc-cost rate ESD (same as `expected_supplier_deduction`). All are NULL when `_provisional_niv ≤ 0`.

**`expected_supplier_deduction`** — also includes Inland vendor credit provision:
- For Inland buyer DOs, a credit provision closes the gap between actual cost and 2% CM2 target. Rate-diff DOs: `_total_proc_cost − net_invoice_value × 0.98`. Non-rate-diff Inland: `GREATEST(0, _total_proc_cost − net_invoice_value × 0.98)`. See G31.

**Component P — price-diff-100 provision (added 2026-05-06):**
Additive block applied on top of all other components (both residual and guarded paths). Fires when `ROUND(selling_price − purchase_price, 2) = 100.00 AND is_deduction_approved = 0`.
Formula: `GREATEST(COALESCE(est_cm2_pct, 0) × gmv, 0)` — added to both `_expected_supplier_deduction` and `_expected_supplier_deduction_cogs`.
Business logic: purchase and sale price are technically equal; ₹100 is an accounting convention. The real margin (est_cm2_pct × GMV) will be collected as a supplier deduction, so it is provisioned immediately. Stops firing once OS approves the deduction.
Proxy for `is_deduction_approved = 0` when querying the view: `supplier_deduction_rs <= 300`.

**`_raw_sup_ded_cogs`** — the COGS-rate raw deduction for `provisional_cm2`. Component A is at `net_cogs_rs / dispatched_qty` rate. No pending-payable cap (removed May 2026 — FarMart can raise supplier deductions even after the supplier has been fully paid).

---

### G27. Debit note quantity nets against CN quantities — apply DN qty to weight_loss first

Active debit notes (`debit_notes.status_id = 1`) now carry a `quantity` column in addition to `subtotal`. This quantity offsets credit note quantities for the same invoice in the following order:

```
cn_weight_loss_qty_net = GREATEST(cn_weight_loss_qty - dn_qty, 0)
remaining_dn           = GREATEST(dn_qty - cn_weight_loss_qty, 0)
cn_rejection_qty_net   = GREATEST(cn_rejection_qty - remaining_dn, 0)
```

**Why:** A debit note can cancel a weight-loss CN or rejection CN on the same invoice (e.g. quality was disputed and the CN is reversed via a DN). Without netting, `rejected_qty_cn_qtl` is overstated and `net_invoice_qty_qtl` is understated.

---

### G28. Transport cost: fallback to payment_ledgers when deductions table is empty

Pre-April 2025, the backend wrote gross transport cost to `payment_deductions_for_transports` and deductions to `payment_deduction_logs_for_transports`. Post-April 2025, the backend writes only the net payable directly to `payment_ledgers` — the deductions table row may not exist.

**Formula in gold view:**
```sql
CASE
    WHEN transport_gross > 0   -- payment_deductions_for_transports has data
    THEN transport_gross - transporter_deduction_total
    ELSE payables.transporter_payable   -- fall back to payment_ledgers
END AS transport_cost_net_rs
```

Always check whether `payment_deductions_for_transports` has a row before using it as the transport cost source.

---

### G29. Scenario 1: cancelled DO on a multi-DO invoice absorbs CN rejection first

When an invoice has multiple DOs, more than one of which has unloading rejection, and exactly one DO is CANCELLED, and the CN rejection qty is less than the total invoice rejection — the cancelled DO's rejection is deducted first before splitting the remainder among active DOs.

**Condition check (QUALIFY window):** >1 DO on invoice, >1 DO with rejection, exactly 1 CANCELLED, CN rejection qty (in qtl) × 100 < total invoice rejected kg.

**Allocation:**
- Cancelled DO's rejection share = `MIN(cancelled_do_rejected_kg, CN_rejection_qty × 100) / (CN_rejection_qty × 100)`
- Non-cancelled DOs split the remaining CN proportionally by their rejected kg

This prevents a fully-rejected-and-cancelled DO from appearing to have zero CN deduction while active DOs bear the full CN.

---

### G30. _cn_alloc_share: deduction-based CN allocation for quality/bardana/CD

When all DOs on an invoice have **approved** OS buyer deductions (`is_deduction_approved = 1`) and the total invoice-level OS deductions > 0, quality/bardana/CD CN amounts are allocated by each DO's OS deduction share rather than by `do_share` (invoice qty proportion).

**Hierarchy:**
1. Scenario 1 (cancelled DO present): cancelled DO → 0 quality share; non-cancelled split by OS deductions among non-cancelled DOs only
2. All DOs approved + invoice_os_total > 0 → `_do_os_total / _invoice_os_total`
3. Otherwise → `do_share`

**Why:** When one DO has a large quality deduction and another has zero, allocating by qty share misattributes the CN. Deduction-based allocation matches the actual financial exposure per DO.

---

### G31. Inland vendor business logic

Inland Power Limited (and any buyer with `UPPER(buyer_name) LIKE '%INLAND%'`) operates on a vendor credit model where FarMart targets exactly 2% CM2.

**Inland DO identification:** `UPPER(buyer_name) LIKE '%INLAND%' AND do_created_on >= '2025-04-01'`

**Rate-difference DO:** identified by `po_unloading_deduction_reports.unloading_comment` containing any of: `D.P.`, `D.D.`, `DIFFERENCE PO`, `DIFFERENCE D.O.`, `DIFFERENCE DO`. These DOs have no purchase booking in Zoho — cost is forced to 98% of NIV.

**Vendor credit provision (`_inland_vendor_credit_provision`):**
```
Rate-diff DO:         _total_proc_cost - net_invoice_value × 0.98   (can be +ve or −ve)
Non-rate-diff Inland: GREATEST(0, _total_proc_cost - net_invoice_value × 0.98)
Non-Inland:           0
```

**Impact:**
- Added to `expected_supplier_deduction` (reduces the effective cost to 98% of NIV)
- Added to `provisional_gm`, `provisional_cm2`, `provisional_cm2_pct`
- Crop/variety in final SELECT: overridden to 'Rice' / 'Parboiled Broken' for all Inland DOs

**Note:** This provision does NOT affect actual (non-provisional) CM2 — only the expected/provisional P&L.

---

### G32. Fully rejected DOs: metrics zero out, not null

When `gmv = 0 AND net_invoice_value = 0` (the DO had a formal invoice but was fully rejected — all revenue reversed by CN), the following output behaviour applies:

| Metric | Behaviour |
|---|---|
| `gm_rs`, `cm2_rs`, `actual_cm2_pct`, `ideal_roce_pct` | **0.0** (not NULL, not calculated) |
| `ap_days`, `ar_days`, `wc_days` | **0** (not NULL) |
| `gross_invoice_qty_qtl`, `net_invoice_qty_qtl` | **0.0** (float noise guard: `GREATEST(ROUND(qty, 9), 0.0)`) |

This is distinct from Cancelled+RTV DOs with no invoice (G24), which use NULL.

The float-noise guard (`GREATEST(ROUND(..., 9), 0.0)`) prevents artifacts like `-7e-15` appearing in qty columns when floating-point subtraction yields a tiny negative from a true zero.

---

### G33. CO provisional metrics — design differences from DO provisional metrics

CO provisional metrics (`vw_co_do_summary`) were added 2026-05-05 and flow into the CO leg of `vw_do_business_summary`. Key differences from the DO version:

**Exclusion flag (`_is_excluded_co`):**
`UPPER(buyer_name) LIKE '%INLAND%' OR '%FMT AGRO%' OR '%FARMART%'` → all 7 provisional columns return NULL.

**Proration share:**
`do_within_co_share = current_accepted_qty_kg / total_accepted_kg` (CO's total, not DO's total). This can be ≤ 0 for fully-forwarded rows where all stock was rejected to a next-generation CO.

**GREATEST guard:**
Both `_expected_supplier_deduction` and path-1 `_expected_credit_note_amount` are wrapped in `GREATEST(..., 0.0)` to prevent negatives when `do_within_co_share ≤ 0`.

**OS deduction source:**
`po_deduction_history_details WHERE consignment_id IS NOT NULL` — CO-specific deductions, not DO-level deductions.

**`_co_has_cn` switch:**
`= 1` when `SUM(rejection_deduction + quality_deductions + bardana_deduction + cd_deduction) > 0` for the CO. Switches ECA from path-1 (component sum) to path-2 (M-branch shortfall).

**`expected_supplier_deduction` (CO):**
Rate-difference recovery: `(primary_do_selling_price_rs − co_so_rate_per_qtl) × current_accepted_qty_kg / 100` (capped at 0). Plus approved OS quality/weight-loss/bank/weighing/other deductions, CD, and bardana, each prorated by `do_within_co_share`.

**`expected_credit_note_amount` (CO):**
- Path 1 (no CN): rejection gap at SO rate + OS quality/bag/WL + approved rejection + CD + bank + weighing + other + SO forward provisions
- Path 2 (CN exists): M-branch shortfall = `(OS total × do_within_co_share) − (CN total × co_share × do_within_co_share)` if OS > CN else 0

**Provisional P&L formulas (CO):**
```
provisional_niv = co_net_invoice_value_rs × do_within_co_share − ECA
provisional_gmv = co_gmv_rs × do_within_co_share [path-2] or minus rejection gap [path-1]
provisional_gm  = provisional_gmv − (do_net_cogs_rs × do_weight_share − ESD)
provisional_cm2 = provisional_niv − (do_total_procurement_cost_rs × do_weight_share − ESD)
provisional_cm2_pct = provisional_cm2 / provisional_niv × 100
```
Where ESD = `_expected_supplier_deduction`, ECA = `_expected_credit_note_amount`. All NULL when `_is_excluded_co = 1` or when the CO has no NIV yet.

---

## 4. Business Metrics Reference

### 4.1 Default Filters (Always Apply)

**Every query against silver tables must include all applicable filters below.**

| Filter | Where to apply |
|---|---|
| `is_active = 1` | Every silver table joined — no exceptions |
| `invoice.status_id IN (4, 6, 9, 10)` | `invoices` table and any join through it |
| `credit_notes.status_id = 1` | Active CNs only |
| `debit_notes.status_id = 1` | Active DNs only |
| `NOT (do_status = 'CANCELLED' AND rtv_flag IS NOT NULL)` | All DO-level analysis — exclude RTV cancellations |
| `retailer_payment_deduction_reason_id != 6` | Supplier deduction sum only |
| `procurement_payments.paid_at >= '2023-04-01'` | AP Days paid portion only |
| `po_estimated_margins.status = 'completed'` | Est margin queries |
| `buyer_order_details.created_at >= '2025-04-01'` | Est margin queries |

---

### 4.2 Metric Summary Table

| Metric | Gold View Column | Formula | Key Source Tables | Notes |
|---|---|---|---|---|
| **Qty Bought (Qtl)** | `Qty Bought (Qtl)` | `SUM(net_weight) / 100` | `order_delivery_details` | Silver in kg; SUM for multi-truck DOs |
| **Qty Purchased At (Rs)** | `Qty Purchased At (Rs)` | `procurement_lots.retailer_locked_price` | `procurement_lots` | Display/locked price — may differ from COGS price |
| **COGS (Rs)** | `COGS (Rs)` | `dispatch_net_weight_kg × pco.price / 100` | `purchase_crop_orders`, `order_delivery_details` | 100% of purchase cost; uses `pco.price` not `retailer_locked_price` |
| **Commodity Cost (Rs)** | `Commodity Cost (Rs)` | `COGS × 0.99` | — | Net cost paid to farmer |
| **Discount to Farmer (Rs)** | `Discount to Farmer (Rs)` | `COGS × 0.01` | — | 1% FarMart retention |
| **Labour & Gunny Cost (Rs)** | `Gunny Bag & Labour Cost (Rs)` | `rate_per_qtl (id=3) × dispatch_kg / 100` | `procurement_order_bill_components` | Per-Qtl rate × dispatched qty |
| **Commission Cost (Rs)** | `Commission Cost (Rs)` | `rate_per_qtl (id=2) × dispatch_kg / 100` | `procurement_order_bill_components` | Per-Qtl rate × dispatched qty |
| **Mandi Tax (Rs)** | `Mandi Tax (Rs)` | `amount` (id=1) | `procurement_order_bill_components` | Absolute Rs — not per-Qtl |
| **Halting Charge (Rs)** | *(in Total Proc Cost)* | `amount` (id=6) | `procurement_order_bill_components` | Absolute Rs — not per-Qtl |
| **Supplier Deduction (Rs)** | `Supplier Deduction (Rs)` | `SUM(deduction_logs WHERE reason_id≠6) + pco.fulfillment_charge` | `payment_deduction_logs_for_retailers`, `purchase_crop_orders` | reason_id=6 excluded; fulfillment_charge is on the DO, not the lot |
| **Net COGS (Rs)** | `Net COGS (Rs)` | `Commodity Cost − Supplier Deduction` | — | = `COGS × 0.99 − Supplier Deduction` |
| **Transport Cost Net (Rs)** | `Transporter Cost (Payable) (Rs)` | `Transport Gross − Transporter Deductions` | `payment_deductions_for_transports`, `payment_deduction_logs_for_transports` | Gross = halting+unloading+route_change+commodity_cost (transport component) |
| **GRN-PO Transport Cost (Rs)** | `transport_cost_grn_po_for_gm` | `SUM(order_delivery_details.transport_cost_for_grn_po)` | `order_delivery_details` | Only deducted from GM (not CM2) when transporter_cost_payable_rs = 0 — see G25 |
| **DO Rejected Qty Cost (Rs)** | *(in Total Proc Cost)* | `retailer_locked_price × (dispatch_qtl − shortage_qtl − damage_qtl − gross_invoice_qty)` | `procurement_lots`, `po_unloading_qty_details`, `order_delivery_details` | Only when deficit > 3 Qtl AND not RTV; else 0 |
| **Total Procurement Cost (Rs)** | `Total Procurement Cost (Rs)` | `COGS + Labour + Commission + Mandi + Halting + Transport Net − Supplier Deduction − DO Rejected Qty Cost` | Multiple | Uses COGS (100%), not Commodity Cost (99%) |
| **Supplier Payable (Rs)** | `Supplier Payable (Rs)` | `SUM(payment_ledgers.net_payable WHERE type_id=1)` | `payment_ledgers` | |
| **Supplier Paid (Rs)** | `Supplier Paid (Rs)` | `SUM(procurement_payments.amount WHERE payment_for=1 AND paid_at IS NOT NULL)` | `procurement_payments` | `paid_at IS NULL` = draft/pending record, not an actual payment — see G22 |
| **Transport Payable (Rs)** | `Transport Payable (Rs)` | `SUM(payment_ledgers.net_payable WHERE type_id=2)` | `payment_ledgers` | |
| **Transporter Paid (Rs)** | `Transporter Paid (Rs)` | `SUM(procurement_payments.amount WHERE payment_for=2 AND paid_at IS NOT NULL)` | `procurement_payments` | Same `paid_at IS NOT NULL` filter — see G22 |
| **GST Payable (Rs)** | `GST Payable (Rs)` | `SUM(payment_ledgers.net_payable WHERE type_id=3)` | `payment_ledgers` | |
| **GST Paid (Rs)** | `GST Paid (Rs)` | `SUM(procurement_payments.amount WHERE payment_for=3 AND paid_at IS NOT NULL)` | `procurement_payments` | Same `paid_at IS NOT NULL` filter — see G22 |
| **do_share** | *(intermediate)* | `SUM(invoice_items.qty for this DO) / SUM(invoice_items.qty for invoice)` | `invoice_items` | Denominator = all active items regardless of invoice status |
| **Gross Invoice Qty (Qtl)** | `gross_invoice_qty_qtl` | `do_qty − (cn_rejection_qty × rejection_share + cn_weight_loss_qty × weight_loss_share)` (only if combined > 10 Qtl) | `invoice_items`, `credit_notes_and_description_mappings`, `po_unloading_qty_details` | Selling Price denominator; uses per-type shares not do_share — see G8, G21 |
| **Rejected Qty — CN (Qtl)** | `rejected_qty_cn_qtl` | `cn_rejection_qty × rejection_share + cn_weight_loss_qty × weight_loss_share` | `credit_notes_and_description_mappings`, `po_unloading_qty_details` | desc_id=7 → rejection qty; desc_id=2 → weight loss qty; shares fallback to do_share if no unloading data |
| **Rejected Qty — Unloading (Qtl)** | `rejected_qty_unloading_qtl` | `(buyer_rejected_kg + shortage_kg + damage_kg) / 100` | `po_unloading_qty_details` (type_id 4+6+8) | Physical rejection measured at unloading, not CN-derived; type 4=buyer rejected, 6=shortage, 8=damage |
| **Net Invoice Qty (Qtl)** | `net_invoice_qty_qtl` | `do_qty − cn_rejection_qty × rejection_share [always] − cn_weight_loss_qty × weight_loss_share [only if weight_loss × weight_loss_share > 10 Qtl]` | `invoice_items`, `credit_notes_and_description_mappings`, `po_unloading_qty_details` | Uses per-type shares not do_share — see G8, G21 |
| **Rejection Deduction (CN) (Rs)** | `rejection_deduction_cn_rs` | `cn_rejection_deduction × rejection_share` | `credit_notes_and_description_mappings` (desc_id 7+8) | Uses rejection_share (not do_share) — see G21 |
| **GMV (Rs)** | `gmv_rs` | `do_subtotal − cn_rejection_deduction × rejection_share + DN × do_share` | `invoice_items`, `credit_notes_and_description_mappings`, `debit_notes` | DNs ADD to GMV; quality/bardana/CD CNs are NOT in GMV; rejection uses rejection_share |
| **Quality Deduction (Rs)** | `Quality Deduction (CN) (Rs)` | `quality_CN × do_share` | `credit_notes_and_description_mappings` (desc_id 1,2,5,6,9) | |
| **Bardana Deduction (Rs)** | `Bardana Deduction (Rs)` | `bardana_CN × do_share` | `credit_notes_and_description_mappings` (desc_id 4) | |
| **CD Deduction (Rs)** | `CD Deduction (Rs)` | `cd_CN × do_share` | `credit_notes_and_description_mappings` (desc_id 3) | |
| **Net Invoice Value (Rs)** | `Net Invoice Value (Rs)` | `GMV − Quality − Bardana − CD` | — | All CN components scaled by do_share |
| **Selling Price (Rs/Qtl)** | `Selling Price (Rs)` | `GMV / Gross Invoice Qty` | — | Uses Gross Invoice Qty as denominator |
| **GM (Rs)** | `gm_rs` | `GMV − Net COGS [− transport_cost_grn_po_for_gm when transporter_cost_payable_rs = 0]` | — | Zeroes out when GMV=0 AND NIV=0; see G25 |
| **CM2 (Rs)** | `cm2_rs` | `Net Invoice Value − Total Procurement Cost` | — | Primary profitability metric; does NOT deduct GRN-PO transport — see G25; zeroes out when GMV=0 AND NIV=0 |
| **Actual CM2%** | `actual_cm2_pct` | `CM2 / Net Invoice Value` | — | Never average across DOs — see G18; zeroes out when GMV=0 AND NIV=0 |
| **SO Booked By** | `so_booked_by` | `user_profiles.name WHERE id = buyer_order_details.order_booked_by_id` | `buyer_order_details`, `user_profiles` | PA whose team fulfils the SO (different from SO Created By) |
| **Accepted Qty (Qtl)** | `accepted_qty_qtl` | `po_unloading_qty_details.value / 100 WHERE type_id = 2` | `po_unloading_qty_details` | Physical qty accepted at unloading; type_id 2 only |
| **Bill Available** | `bill_available` | `'Yes' / 'No'` — whether Primary Bill of Transport document exists | `order_delivery_details`, `order_delivery_documents` | Checks for doc with name = 'Primary Bill of Transport' |
| **Expected Supplier Deduction** | `expected_supplier_deduction` | Multi-branch (A/B/B2/C/D/K/M/N) — see G26 | `po_deduction_history_details`, `buyer_order_details` | Provisional recovery expected from supplier |
| **Expected CN Amount** | `expected_credit_note_amount` | K-logic shortfall or OS deductions sum — see G26 | `po_deduction_history_details`, `credit_notes_and_description_mappings` | Provisional CN expected from buyer |
| **Provisional NIV** | `provisional_niv` | `net_invoice_value − expected_credit_note_amount` | — | NULL if ≤ 0 (clamped to 0 if between −1 and 1) |
| **Provisional GMV** | `provisional_gmv` | `GMV − rejection_CN_gap` | — | NULL if provisional_niv ≤ 0 |
| **Provisional GM** | `provisional_gm` | `provisional_gmv − net_cogs [− transport_cost_grn_po_for_gm]` | — | NULL if provisional_niv ≤ 0 |
| **Provisional CM2** | `provisional_cm2` | `provisional_niv − total_procurement_cost` | — | NULL if provisional_niv ≤ 0 |
| **Provisional CM2%** | `provisional_cm2_pct` | `provisional_cm2 / provisional_niv × 100` | — | NULL if provisional_niv ≤ 0 |
| **Est CM2%** | `Est CM2% (in SO)` | `COALESCE(PA+Supplier, PA, SO)` from `po_estimated_margins` | `po_estimated_margins`, `buyer_order_details` | NULL for SOs before 2025-04-01 — see G16 |
| **Ideal ROCE** | `Ideal ROCE` | `est_cm2_pct × 30 / repayment_days` | — | |
| **Repayment Days** | `Repayment Days` | `invoices.repayment_days` | `invoices` | |
| **AP Days** | `AP Days` | Paid portion + pending portion | `procurement_payments`, `payment_transactions`, `payment_ledgers`, `order_delivery_details` | NULL when not yet unloaded — see G10 |
| **AR Days** | `AR Days` | Paid portion + pending portion at invoice level | `buyer_payment_invoice_mappings`, `buyer_payment_collections`, `invoices`, `order_delivery_details` | NULL when no unloading date or no invoice value; negative AP Days (payment before unloading) is valid |
| **WC Days** | `WC Days` | `AR Days − AP Days` | — | NULL if either is NULL |
| **DO Part 1 On** | `DO Part 1 On` | `MIN(payment_transactions.created_at WHERE is_gst_payment=0)` | `procurement_payments`, `payment_transactions` | First non-GST payment timestamp |
| **GST Part 1 On** | `GST Part 1 On` | `MIN(payment_transactions.created_at WHERE is_gst_payment=1)` | `procurement_payments`, `payment_transactions` | First GST payment timestamp |
| **Est AP Days** | `Est AP Days` | `AVG(po_estimated_margins.ap_days)` at PA+Supplier level | `po_estimated_margins` | Pre-trade estimate |

---

### 4.3 AP Days (Detail)

Two-part weighted average at the DO level, measuring days from unloading to supplier payment.

**Part 1 — Paid portion** (filter: `paid_at >= 2023-04-01`):
```
contribution_per_payment = DATEDIFF(payment_transactions.created_at,
                                    order_delivery_details.weight_slip_generated_on)
                           × (ROUND(payment_amount) / total_net_payable)

AP_paid = SUM(contribution) across all active payments for this DO
```

**Part 2 — Pending portion:**
```
pending_amount = total_net_payable - total_paid_ap

IF pending_amount > 0:
    pending_contribution = (pending_amount / total_net_payable)
                           × DATEDIFF(CURRENT_DATE, CAST(unloaded_on AS DATE))
ELSE: 0
```

**Total AP Days = AP_paid × rescale_factor + pending_contribution**

**Overpaid rescaling** (when `total_paid_ap > total_net_payable`):
```
rescale_factor = total_net_payable / total_paid_ap
```
When total paid exceeds total payable, the paid weights (each `amount / total_net_payable`) sum to > 1.0, inflating AP days. The rescale factor normalizes them back to 1.0 by effectively using `total_paid_ap` as the denominator. The pending portion is already 0 in this case (ELSE branch). When not overpaid, `rescale_factor = 1.0` (no change). See G23.

Conditions: only computed when `unloaded_on IS NOT NULL AND total_net_payable > 0`.

**Key implementation details:**
- `total_net_payable` = SUM(`payment_ledgers.net_payable`) for the DO, `is_active=1`
- Payment timestamp = `payment_transactions.created_at` — **not** `procurement_payments.paid_at`
- Join path for unloading date: `procurement_payments.order_delivery_id → order_delivery_details.id`

---

### 4.3a AP Days for DOs within COs (Detail)

When a DO contributes stock to a Consignment Order (CO), AP Days is recomputed using the **CO's unloading date** as the anchor instead of the DO's own unloading date.

**Per (DO, CO) row:**
```
AP Days = SUM(DATEDIFF(co_unloaded_on, payment_date) × payment_amount)
        / SUM(payment_amount)
```

This is a payment-weighted average of days between each DO supplier payment and the CO's unloading date. The CO weight share cancels out at the (DO, CO) level — it only matters when aggregating across DOs to a CO-level AP Days.

**Aggregating to CO-level AP Days:**
```
CO AP Days = SUM(DO_total_paid × co_weight_share × DO_AP_Days)
           / SUM(DO_total_paid × co_weight_share)
```
Where `co_weight_share = current_accepted_qty_kg / (DO qty_bought_qtl × 100)`.

Equivalently (and more precisely, avoids two-step rounding):
```
CO AP Days = SUM across all DOs (
               SUM per DO (DATEDIFF(co_unloaded_on, pay_date) × amount × co_weight_share)
             )
           / SUM across all DOs (
               SUM per DO (amount × co_weight_share)
             )
```

**Key differences from DO-level AP Days:**
- Uses `co_unloaded_on` (from `order_delivery_details WHERE consignment_id = CO.id`), not the DO's `weight_slip_generated_on`
- No pending portion — only actual payments from `procurement_payments` + `payment_transactions`
- Typically yields larger positive values since the CO unloading happens well after DO supplier payments
- Filter: `paid_at >= '2023-04-01'` (same as DO AP Days)

---

### 4.4 AR Days (Detail)

Two-part weighted average at the **invoice level**, measuring days from unloading to buyer payment. Computed once per invoice and shared across all DOs on that invoice.

**Source tables:** `buyer_payment_invoice_mappings` → `buyer_payment_collections` (collection_date, mapped_amount) → `invoices` (total inc. GST, due_date)
**Unloading anchor:** MAX `weight_slip_generated_on` across all DOs in the invoice (`invoice_unloaded_at` CTE)

**Part 1 — Paid portion:**
```
contribution = DATEDIFF(collection_date, invoice_unloaded_at)
               × (mapped_amount / invoices.total)
AR_paid = SUM(contribution) across all active payments for this invoice
```

**Part 2 — Pending portion** (denominator is `invoices.total`, inc. GST):
```
pending = invoices.total - SUM(mapped_amount)

IF pending > 0 AND TODAY < invoice_due_date:
    contribution = (pending / total) × DATEDIFF(invoice_due_date, invoice_unloaded_at)
IF pending > 0 AND TODAY ≥ invoice_due_date:
    contribution = (pending / total) × DATEDIFF(TODAY, invoice_unloaded_at)
```
Unlike AP Days (always uses today for pending), AR Days caps at due date when not yet overdue.

**Total AR Days = AR_paid + pending contribution**

Conditions: only computed when `invoice_unloaded_at IS NOT NULL AND invoices.total > 0`.

**Key implementation notes:**
- Negative AP Days (payment made before unloading timestamp) is valid and expected occasionally
- `collection_date` = `buyer_payment_collections.collection_date` (not `created_at`)
- All DATEDIFF calls use DATE casts for day-level granularity

---

### 4.5 Estimated Margin (Detail)

**Price basis per SO** — determined by `buyer_order_details.is_margin_on_gross_price`:
- `= 1` → use `buyer_offering_price_quintal` (Rs/Qtl directly — no conversion)
- `= 0` → use `net_price` (Rs/Qtl directly — no conversion)

**Three granularity levels — most specific available wins (COALESCE):**

| Priority | Level | Join keys on `po_estimated_margins` |
|---|---|---|
| 1 | PA + Supplier | `buyer_order_id + assigned_user_id + master_merchant_id` |
| 2 | PA only | `buyer_order_id + assigned_user_id` |
| 3 | SO only | `buyer_order_id` |

**Formula (all levels):**
```
est_margin = SUM((SO_price - pem.price) × pem.quantity)
           / (MIN(SO_price) × SUM(pem.quantity))
```
Where `pem.price` = estimated procurement cost (Rs/Qtl).

**Base filters:**
- `po_estimated_margins.is_active = 1` AND `status = 'completed'`
- `buyer_order_details.is_active = 1` AND `status NOT IN (1, 2, 3, 8, 11)`
- `buyer_order_details.created_at >= '2025-04-01'`

---

### 4.6 Provisional P&L (Detail)

Provisional P&L gives a forward-looking estimate of where a DO's financials will land once deductions are formalised. It is computed in `vw_do_summary` (first-pass DOs) and in `vw_co_do_summary` (secondary CO rows). Both sets of columns are surfaced in `vw_do_business_summary`. See G33 for CO-specific design differences.

**When it applies:** DOs that are invoiced but deductions are not yet settled (status = DEDUCTION_SUBMITTED, DELIVERED, etc.).

**Two categories of expected deductions:**

**`expected_credit_note_amount`** — what the buyer will deduct from the invoice:
```
CASE
  WHEN _has_cn = 0:
      -- No formal CN at all: surface all OS buyer deductions + SO rate provisions
      os_quality + os_bardana + os_weight_loss + os_cash_discount
      + os_bank_processing + os_rate_difference + os_weighing + os_other
      + CASE WHEN rejection gap > 0 THEN gap × selling_price ELSE 0 END
      + CASE WHEN so_cash_discount_pct > 0 AND os_cash_discount = 0 THEN pct × prov_net_invoice_qty ELSE 0 END
      + CASE WHEN so_bag_deduction_pct > 0 AND os_bardana = 0 THEN pct × prov_net_invoice_qty ELSE 0 END

  WHEN _total_formal_cn < _total_os_buyer_deductions:
      -- K-logic: formal CN raised but it doesn't cover all OS deductions
      _total_os_buyer_deductions − _total_formal_cn

  ELSE: 0
END
```

`_total_os_buyer_deductions` = sum of all 9 types from po_deduction_history_details (including REJECTION type).
`_total_formal_cn` = cn_rejection_deduction × rejection_share + cn_quality × do_share + cn_bardana × do_share + cn_cd × do_share.

**`expected_supplier_deduction`** — what FarMart will recover from the supplier:
- **Branch A:** Rejection-based (when supplier hasn't been charged yet — `supplier_deduction_rs ≤ 300` at DO level). **Not affected by multi-DO guard.**
- **Branch B/B2:** OS cash discount / OS bardana deduction on gross-price SOs
- **Branch C/D:** SO cash_discount_pct / bag_deduction_pct not yet in OS (gross-price, unapproved, no OS equivalent)
- **Branch K (approved):** OS approved deductions (quality, bank processing, weighing, rate diff, other, excess weight loss)
- **Branch M/N:** Net-price SOs with unexpected OS cash discount / bardana

**Multi-DO invoice provision guard (2026-04-30):**
Branches B, B2, C, D, K, L, M, N are gated on `_invoice_max_supplier_deduction <= 300` (invoice-level MAX) instead of `supplier_deduction_rs <= 300` (DO-level). If any sibling DO on the same invoice already has a real supplier deduction passed (`> 300`), these branches are suppressed on this DO — preventing double-counting when OS buyer deductions are entered on a different DO than where the payment deduction was applied. Branch A is DO-specific (physical rejection) and remains gated at DO level. Same guard applies identically inside `provisional_gm`, `provisional_cm2`, and `provisional_cm2_pct`. Actual metrics (`gm_rs`, `cm2_rs`, `net_invoice_value_rs`) are unaffected.

**Path selection for expected_supplier_deduction (2026-05-06):**
Secondary-sales DOs (rejected_destination ≠ RTV) now use the residual path — same as any other single-DO non-inland DO. Previously they used the guarded path, which incorrectly suppressed all provisioning once `supplier_deduction_rs > 300`. The primary DO's P&L is self-contained; the supplier owes for the full rejected qty regardless of whether that stock is re-sold via a secondary CO.

**`_raw_sup_ded_cogs` pending-payable cap removed (2026-05-06):**
The COGS-rate raw deduction no longer has a `LEAST(..., _pending_payable)` cap. Capping by unpaid balance was wrong — FarMart can raise supplier deductions after full payment via a separate recovery transaction.

**`provisional_cm2_pct` ESD consistency fix (2026-05-06):**
`provisional_cm2_pct` now uses `_expected_supplier_deduction_cogs` (matching `provisional_cm2`). Previously it used `_expected_supplier_deduction` (proc-cost rate), which could produce opposite signs to `provisional_cm2` when the two ESD variants diverged.

**Component P — price-diff-100 additive provision (2026-05-06):**
When `ROUND(selling_price_rs − qty_purchased_at_rs_per_qtl, 2) = 100.00` and `is_deduction_approved = 0`, `GREATEST(est_cm2_pct × gmv, 0)` is added on top of all other `expected_supplier_deduction` components. Impacts `provisional_gm`, `provisional_cm2`, `provisional_cm2_pct`. Does NOT affect `provisional_gmv`. 254 DOs since Apr 2025; total additional provision ≈ ₹30.7L.

**Practical use:**
- `provisional_niv = net_invoice_value − expected_credit_note_amount`
- `provisional_cm2 = provisional_niv − total_procurement_cost` → tells you if a trade is profitable after expected buyer deductions
- `provisional_cm2_pct = provisional_cm2 / provisional_niv × 100`
- All provisional output columns are NULL when `provisional_niv ≤ 0` (DO is expected to be fully written off)

---

## 5. Analysis Guide

### 5.1 Date Field Guide

| Analysis Type | Use This Date | Column in Gold View | Notes |
|---|---|---|---|
| Revenue / GMV / P&L by period | `invoices.date` | `Invoice Date` | **Default for business reporting** |
| Procurement booking volume | `purchase_crop_orders.created_at` | `DO Created On` | When the DO was created |
| Physical delivery & AP Days | `order_delivery_details.weight_slip_generated_on` | `Unloaded On` | NULL until truck unloaded at buyer |
| Payment tracking | `payment_transactions.created_at` | `DO Part 1 On` / `GST Part 1 On` | First payment date per type |
| SO pipeline | `buyer_order_details.created_at` | — | When SO was placed |
| MTD / QTD / YTD | `DATE_TRUNC('month', invoice_date)` | — | |
| Fiscal year (FY2025-26) | `invoice_date >= '2025-04-01' AND < '2026-04-01'` | — | April–March fiscal year |

---

### 5.2 Aggregation & Slicing

**Standard dimensions for GROUP BY:**

| Dimension | Gold View Column | Notes |
|---|---|---|
| Business Unit | `` `Business Unit` `` | From BU mapping sheet via employee_id |
| Crop | `` `Crop` `` | |
| Variety | `` `Variety` `` | |
| PA (DO owner) | `` `DO Created By` `` | FarMart employee who created the DO |
| SO owner | `` `SO Created By` `` | FarMart employee who created the SO |
| Supplier | `` `Supplier Business Name` `` | |
| Supplier State | `` `Supplier State` `` | |
| Delivery State | `` `Delivery State` `` | Buyer location |
| Buyer | `` `Buyer Name` `` | |
| DO Status | `` `DO Status` `` | |
| Month | `DATE_TRUNC('month', \`Invoice Date\`)` | |

**Aggregation rules:**

| Metric | How to aggregate | Why |
|---|---|---|
| GMV, CM2, costs | `SUM()` | Additive |
| CM2% | `SUM(CM2) / SUM(Net Invoice Value)` | Never `AVG(CM2%)` — volume-weighted |
| Selling Price | `SUM(GMV) / SUM(Gross Invoice Qty)` | Never `AVG(Selling Price)` — volume-weighted |
| AP Days | `AVG()` after filtering `IS NOT NULL` | Or recompute weighted at aggregate level |
| Rejection Rate | `SUM(Rejected Qty) / SUM(Qty Bought)` | |
| Utilisation | `SUM(Gross Invoice Qty) / SUM(Qty Bought)` | |

---

### 5.3 Common Business Questions

| Question | Approach | Key Filter / Group By |
|---|---|---|
| CM2% by BU this month | `SUM(CM2) / SUM(Net Invoice Value)` | `GROUP BY Business Unit`, filter `Invoice Date` in current month |
| Top suppliers by GMV | `SUM(GMV)` | `GROUP BY Supplier Business Name ORDER BY SUM DESC` |
| PA performance (volume + margin) | `SUM(Qty Bought)`, `SUM(GM)`, `SUM(CM2)/SUM(Net Invoice Value)` | `GROUP BY DO Created By` |
| Pending supplier payments | `SUM(Supplier Payable) - SUM(Supplier Paid)` | Exclude CANCELLED DOs |
| Rejection rate by crop | `SUM(Rejected Qty) / SUM(Qty Bought)` | `GROUP BY Crop` |
| AP Days by BU | `AVG(AP Days)` | Filter `AP Days IS NOT NULL`, `GROUP BY Business Unit` |
| DOs with high rejection | `Rejected Qty / Qty Bought > 0.1` | Sort by rejection rate |
| CM2% vs Est CM2% gap | `` `Actual CM2 %` - `Est CM2% (in SO)` `` | Sort descending — worst-performing vs estimate |
| Dispatched DOs not yet unloaded | Filter `DO Status = 'DISPATCHED'` | Count or list |
| First payment turnaround | `DATEDIFF(DO Part 1 On, Unloaded On)` | Filter `DO Part 1 On IS NOT NULL` |
| Invoice-level GMV | Sum GMV from the gold view grouped by `Invoice #` | One invoice can map to multiple DOs |

---

### 5.4 Common Query Patterns

**Preferred: always query from the gold view for DO-level analysis**
```sql
SELECT *
FROM master.gold.vw_do_business_summary
WHERE `DO #` = 'DOAPKUL017936'
```

**CM2% correctly aggregated**
```sql
SUM(`CM2 (Rs)`) / NULLIF(SUM(`Net Invoice Value (Rs)`), 0) AS cm2_pct
```

**Selling Price correctly aggregated**
```sql
SUM(`GMV (Rs)`) / NULLIF(SUM(`Gross Invoice Qty`), 0) AS selling_price_rs_per_qtl
```

**Fiscal year filter**
```sql
WHERE `Invoice Date` >= '2025-04-01' AND `Invoice Date` < '2026-04-01'
```

**AP Days — safe average**
```sql
AVG(`AP Days`) FILTER (WHERE `AP Days` IS NOT NULL)
-- or equivalently:
AVG(CASE WHEN `AP Days` IS NOT NULL THEN `AP Days` END)
```

**Scale CN / DN to DO share (when querying silver directly)**
```sql
cndm.subtotal
  * CAST(ii.quantity AS DOUBLE)
  / NULLIF(CAST(itq.total_qty AS DOUBLE), 0.0)
-- itq.total_qty = SUM(invoice_items.quantity WHERE is_active=1) for that invoice_id
```

**Get first payment dates per DO**
```sql
MIN(CASE WHEN pp.is_gst_payment = 0 THEN pt.created_at END) AS do_part1_on,
MIN(CASE WHEN pp.is_gst_payment = 1 THEN pt.created_at END) AS gst_part1_on
FROM procurement_payments pp
INNER JOIN payment_transactions pt
    ON pp.id = pt.procurement_payment_id AND pt.is_active = 1
WHERE pp.is_active = 1
GROUP BY pp.purchase_crop_order_id
```

**Check if buyer has GST**
```sql
WHERE buyer_details.kyc_gst_id IS NOT NULL
```

**Check FOR DO**
```sql
JOIN procurement_lots pl ON pl.id = purchase_crop_orders.procurement_lot_id
WHERE pl.f_o_r = 1
```

**Filter active DOs for count/pipeline (excludes Cancelled + Terminated)**
```sql
WHERE status NOT IN (11, 15)
```

---

## 6. System Controls & Business Rules

### 6.1 PO-Level Controls

#### PO Rejection
PO status → `REJECTED` (id=6). Stored in `rejection_reason_id`.

**Manual reasons:** PO price/margin issue, terms misalignment, supplier backed out, buyer backed out, incorrectly created.
**Supplier rejection remark:** *"Consent rejected by Supplier."*

**Auto-rejection:**
| Condition | Remark |
|---|---|
| `PO_REQUESTED` (9) not approved for 2 days | *"Auto rejected as request pending for 2 days."* |
| `SUPPLIER_CONSENT_PENDING` (2) not resolved for 2 days | *"Auto rejected as supplier consent pending for 2 days."* |

#### PO Termination
PO status → `TERMINATED` (id=4). Stored in `termination_reason_id`.

**Manual pre-conditions (ALL must be true):** Payment = 0, all invoices cancelled/settled, all DOs terminated or cancelled with 100% RTV.

**Auto-termination:**
| Condition | Remark |
|---|---|
| No SO mapped, no DO created for 5 days | *"Auto terminated as no SO mapped and DO created for 5 days."* |
| SO mapped, no DO created for 10 days | *"Auto terminated as buyer delivery timeline elapsed by 5 days and no DO created."* |

#### Other PO Controls
- **Weight change:** Can increase (with permission) until Complete; cannot decrease below existing DO weight. ⚠️ Consent flow for weight change is NOT currently active.
- **Payment terms:** Cannot update once PO is approved.
- **Ship From:** Can modify until invoice is generated on a DO.
- **De-attach SO:** Allowed if payment=0 AND no active invoice for all DOs in PO.
- **Once Complete:** DOs cannot be marked Incomplete (requires PO reopen first).
- **PO Reopen reasons:** Update unloading qty / Make payment / Update deductions / All of the above.

---

### 6.2 DO-Level Controls

#### Payment Initiation
Cannot initiate payment unless truck tracking is live (driver consent) OR unloading is approved. Override available with specific permission.

#### DO Creation Limits
DOs can be created until total active DO weight ≤ PO quantity + 5%. Active = all statuses except CANCELLED (11) and TERMINATED (15).

#### DO Termination
**Blocked if:** paid amount > 0 or invoice is not Cancelled/Settled.

**Auto-termination:**
| DO Status | Condition |
|---|---|
| DISPATCHED (7) | No unloading + payments=0 + no active invoice + 20 days elapsed |
| VEHICLE_ARRIVED (3) or READY_TO_DISPATCH (6) | No status update for 10 days |

#### Other DO Controls
- **Weight change:** Allowed if no payment and no active invoice; cannot exceed PO remaining fulfilment weight.
- **Vehicle number change:** Allowed if invoice not generated/cancelled/settled AND unloading not approved.
- **Halting charges:** FOR DOs with supplier-borne halting — not allowed at any time. Others: allowed in DISPATCHED, ARRIVED_AT_BUYER, DELIVERED, PARTIAL_DELIVERED, CANCELLED, INCOMPLETE. Limit: ₹0–₹15,000 AND ≤10% of PO supplier payable.
- **Payment terms:** Derived from PO; modifiable with permission for unloading delay cases.
- **Commodity details:** Cannot change once status = ARRIVED_AT_BUYER (8).
- **Once Complete:** No payment, no invoice cancellation, no new CN/DN.
- **DO Reopen:** Only if PO is not Complete. Same reopen reasons as PO.

---

### 6.3 Buyer Deduction & Unloading Edit Controls

All deduction/unloading edits require: invoice NOT in completed tab.
If CN present within 24 hours → CN must be cancelled first.
If CN present after 24 hours → no action required.

**CN Auto-Creation:** If deduction added before invoice is generated → CNs are NOT auto-created. Finance must create manually after invoice is generated.

---

### 6.4 GST Controls

- **No-GST buyer** (`kyc_gst_id` null): SOs cannot be created for taxable crops.
- **GST crop mismatch:** If SO is for a non-GST crop and PO is for a GST crop → mapping is blocked.
