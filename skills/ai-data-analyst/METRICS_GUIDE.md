# Dispatch Orders MIS — Finance Metrics Guide

> Last updated: 2026-05-08

One row per Delivery Order. Combines procurement, invoice, payment, and forecast data.

---

## How to Read This View

- **One row = one DO.** Each row tracks a single dispatch order from PO through payment.
- **Actuals are booked; provisionals are forecast.** Actual metrics reflect what happened; provisional columns estimate what will happen based on unbooked deductions.
- All amounts in **INR**; quantities in **Quintals (Qtl)**. 1 Qtl = 100 kg.

---

## Actuals — What Happened

### Dimensions

| Column | Description |
|---|---|
| `business_unit` | BU of the PA who created the DO |
| `do_number` | Human-readable DO identifier (e.g. DORJALR018482) |
| `po_number` | PO this DO belongs to |
| `so_number` | Sales order this DO is fulfilling |
| `do_status` | Current status of the DO |
| `invoice_number` | Invoice raised for this DO |
| `buyer_name` | Buyer (mill / processor) |
| `buyer_group` | Buyer group from reference sheet |
| `supplier_business_name` | Farmer / supplier |
| `crop` / `variety` | Commodity being traded |
| `supplier_state` / `delivery_state` | Origin and destination states |
| `broker` | Broker on the SO |
| `do_created_by` | PA who created the DO |
| `so_created_by` | PA who created the SO |
| `so_booked_by` | PA whose team is responsible for fulfilling the SO *(added Apr 2026)* |
| `bill_available` | `Yes` / `No` — whether a Primary Bill of Transport document was uploaded *(added Apr 2026)* |
| `po_origin_type` | `Supplier` (sauda_type=1) or `PA` |
| `truck_number` | Vehicle number from dispatch |
| `rejected_destination` | `RTV` (returned to vendor), warehouse name, or NULL (no rejection) |

### Timestamps

| Column | Description |
|---|---|
| `do_created_on` | When the DO was created |
| `unloaded_on` | When the truck was unloaded at the buyer |
| `invoice_date` | Date of the invoice — **use this for period analysis** |
| `do_part_1_on` | First non-GST supplier payment date |
| `gst_part_1_on` | First GST payment date |
| `first_buyer_payment_on` | First buyer collection timestamp |

### Quantity

| Column | Formula / Source | Unit |
|---|---|---|
| `qty_bought_qtl` | `dispatch_net_weight_kg / 100` | Qtl |
| `accepted_qty_qtl` | Weight accepted by buyer at unloading (type_id=2 from unloading records) *(added Apr 2026)* | Qtl |
| `rejected_qty_unloading_qtl` | Physical rejection at gate: (buyer rejected + shortage + damage) kg ÷ 100 | Qtl |
| `rejected_qty_cn_qtl` | CN-derived rejection allocated to this DO: `cn_rejection_qty × rejection_share + cn_weight_loss_qty × weight_loss_share` | Qtl |
| `gross_invoice_qty_qtl` | `do_qty − (cn_rejection_qty × rejection_share + cn_weight_loss_qty × weight_loss_share)` — deducted only if combined > 10 Qtl. Used as Selling Price denominator. | Qtl |
| `net_invoice_qty_qtl` | `do_qty − cn_rejection_qty × rejection_share` (always) `− cn_weight_loss_qty × weight_loss_share` (only if weight loss × share > 10 Qtl) | Qtl |

> **Note on shares (updated Apr 2026):** `rejection_share` is allocated by actual buyer-rejected kg at unloading (type_id=4); `weight_loss_share` is allocated by shortage+damage kg (type_id=6+8). Both fall back to `do_share` (invoice qty proportion) when no unloading data exists. Previously both used `do_share` — this was corrected.

> `rejected_qty_unloading_qtl` and `rejected_qty_cn_qtl` will differ when the CN doesn't perfectly match the physical rejection at the gate.

### Procurement Costs

| Column | Formula / Source | Unit |
|---|---|---|
| `qty_purchased_at_rs_per_qtl` | `procurement_lots.retailer_locked_price` — display price shown to supplier | Rs/Qtl |
| `cogs_rs` | `dispatch_net_weight_kg × pco.price / 100` — 100% purchase cost at PO price | Rs |
| `commodity_cost_rs` | `COGS × 0.99` — net cost paid to farmer | Rs |
| `discount_to_farmer_rs` | `COGS × 0.01` — 1% notional farmer incentive (mechanical, not actual payout) | Rs |
| `gunny_bag_and_labour_cost_rs` | Per-Qtl rate (bill component id=3) × dispatch weight | Rs |
| `commission_cost_rs` | Per-Qtl rate (bill component id=2) × dispatch weight | Rs |
| `mandi_tax_rs` | Absolute amount (bill component id=1) | Rs |
| `halting_charge_rs` | Absolute amount (bill component id=6) — vehicle detention | Rs |
| `supplier_deduction_rs` | SUM(deduction logs where reason_id ≠ 6) + `pco.fulfillment_charge` | Rs |
| `transporter_cost_payable_rs` | Gross transport (halting + unloading + route change + commodity_cost) − transporter deductions; sourced from `payment_deductions_for_transports` | Rs |
| `transport_cost_grn_po_for_gm` | Transport cost booked via GRN/PO flow (`order_delivery_details.transport_cost_for_grn_po`) — **separate channel from transporter payable** *(added Apr 2026)* | Rs |
| `net_cogs_rs` | `commodity_cost_rs − supplier_deduction_rs` | Rs |
| `total_procurement_cost_rs` | `COGS + labour + commission + mandi + halting + transporter_cost_payable − supplier_deduction − do_rejected_qty_cost` | Rs |

> ⚠️ `transport_cost_grn_po_for_gm` is **deducted from GM but NOT from CM2**. When this column is non-zero and `transporter_cost_payable_rs = 0`, GM and CM2 will differ by this amount. See the Profit section below.

### Payable / Paid

| Column | Description |
|---|---|
| `supplier_payable_rs` | Amount FarMart owes supplier (from payment ledgers) |
| `supplier_paid_rs` | Amount already paid to supplier |
| `transport_payable_rs` | Amount due to transporter |
| `transporter_paid_rs` | Amount already paid to transporter |
| `gst_payable_rs` | GST liability |
| `gst_paid_rs` | GST remitted |

### Revenue

| Column | Formula | Unit |
|---|---|---|
| `gmv_rs` | `invoice_subtotal (DO share) − cn_rejection_deduction × rejection_share + dn_subtotal × do_share` | Rs |
| `rejection_deduction_cn_rs` | `cn_rejection_deduction × rejection_share` | Rs |
| `quality_deduction_cn_rs` | `cn_quality_deductions × do_share` | Rs |
| `bardana_deduction_rs` | `cn_bardana_deduction × do_share` | Rs |
| `cd_deduction_rs` | `cn_cd_deduction × do_share` | Rs |
| `net_invoice_value_rs` | `GMV − quality − bardana − CD deductions` | Rs |
| `selling_price_rs` | `GMV / gross_invoice_qty_qtl` | Rs/Qtl |

### Profit

| Column | Formula | Notes |
|---|---|---|
| `gm_rs` | `GMV − net_cogs_rs [− transport_cost_grn_po_for_gm when transporter_cost_payable_rs = 0]` | Zero when GMV=0 AND NIV=0 *(updated Apr 2026)* |
| `cm2_rs` | `net_invoice_value − total_procurement_cost_rs` | Does **not** deduct GRN-PO transport; zero when GMV=0 AND NIV=0 |
| `actual_cm2_pct` | `cm2_rs / net_invoice_value_rs × 100` | Never average across DOs — recompute from sums; zero when GMV=0 AND NIV=0 |

> **GM vs CM2 gap:** If `transport_cost_grn_po_for_gm > 0` and `transporter_cost_payable_rs = 0`, then `GM < CM2`. This is correct — transport was paid via the GRN/PO channel, reducing GM but not the formal procurement cost used in CM2.

### Working Capital & Days

| Column | Description |
|---|---|
| `ap_days` | Days from unloading to supplier payment. Grows daily until fully paid. NULL if not yet unloaded. |
| `ar_days` | Days from unloading to buyer collection. Caps at invoice due date if not yet overdue, else today. |
| `wc_days` | `ar_days − ap_days`. Positive = cash tied up; negative = buyer paid first (favorable). |
| `repayment_days` | Buyer credit terms from SO (days to pay). |
| `estimated_ap_days` | Forecast supplier payment timing from `po_estimated_margins`. |
| `first_buyer_payment_on` | Timestamp of first buyer payment collection. |

> Both AP Days and AR Days are NULL for Cancelled + RTV DOs with no invoice.

---

## Provisionals — What We Expect

Some recoveries and deductions aren't booked yet. These columns forecast the final numbers based on OS-posted buyer deductions not yet formalised as CNs.

### Expected Recoveries

**`expected_supplier_deduction`** — forecast of what FarMart will recover from the supplier.

The view uses two computation paths depending on the DO type *(updated May 2026)*:

**Residual path** — non-inland, single-DO invoice, non-secondary-sales DOs:
```
expected_supplier_deduction = GREATEST(total_raw_expected − supplier_deduction_rs, 0)
```
The full expected deduction is computed from all applicable components (rejection, weight loss, cash, bag, SO provisions, approved other deductions) and the already-applied deduction is subtracted. This correctly shows the remaining gap even when `supplier_deduction_rs > 300`.

**Guarded path** — inland DOs, multi-DO invoices, secondary-sales DOs:
All branches below gate on `_invoice_max_supplier_deduction ≤ 300`. Once more than ₹300 has been deducted across the invoice, all branches stop firing.

| Branch | Trigger | What it adds |
|---|---|---|
| **A** | Rejected qty exists (CN or unloading), supplier not yet charged | Rejected qty × (total proc cost ÷ dispatched qty) |
| **B** | Gross-price SO, OS cash discount posted, supplier not yet charged | Full OS cash discount |
| **B2** | Gross-price SO, OS bardana deduction posted, supplier not yet charged *(added Apr 2026)* | Full OS bardana |
| **C** | Gross-price SO, SO cash % negotiated, OS hasn't posted it, deduction not approved, supplier_deduction = 0 | SO cash % × provisional net invoice qty |
| **D** | Gross-price SO, SO bag % negotiated, OS hasn't posted it, deduction not approved, supplier_deduction = 0 | SO bag % × provisional net invoice qty |
| **K** | Buyer deduction approved (`is_deduction_approved = 1`), supplier not yet charged | Sum of approved OS quality + bank processing + weighing + rate diff + other + excess weight loss |
| **L** | OS weight loss claim > shortage qty × selling price | Absorbs the excess; uses full OS claim instead of estimated shortage cost |
| **M** | Net-price SO, SO has no cash %, but OS posted a cash discount | Full OS cash discount |
| **N** | Net-price SO, SO has no bag %, but OS posted a bardana deduction | Full OS bardana |
| **Inland vendor credit** | Inland buyer DOs (always added) | Gap between actual margin and 2% CM2 target on Inland vendor credit deals |
| **P** | Selling price − purchase price = ₹100 exactly **AND** OS deduction not yet approved *(added 2026-05-06)* | `GREATEST(est_cm2_pct × GMV, 0)` — additive on top of all other blocks; applies on **both** the residual and guarded paths. Stops firing once `is_deduction_approved = 1`. |

> **Block P scope at deploy:** 254 DOs since Apr 2025 — RAJASTHAN (224), JHARKHAND (19), MP (9), 2 others. Captures the est-CM2% margin on price-diff-100 deals where the ₹100 gap is an accounting convention rather than a real margin; the actual CM2 will eventually be collected as a supplier deduction.

---

**`expected_credit_note_amount`** — forecast of buyer CN deductions not yet raised.

The formula picks one of three paths depending on the DO's state:

- **Path 0 — Cancelled DO:** the full remaining net invoice value is expected back as a CN. The buyer has already paid for goods now being returned, so the view assumes a full reversal.
- **Path 1 — No formal CN raised yet (`_has_cn = 0`):** components below add together (E–J for buyer-side deductions, K–L for SO-rate forward provisions).
- **Path 2 — A formal CN already exists (`_has_cn = 1`):** the M-branch comparison (single row at the bottom of the table).

**Path 1 — components when no formal CN exists:**

| Branch | Trigger | What it adds |
|---|---|---|
| **E** | Unloading rejection > CN-allocated rejection **AND** OS deductions not yet approved | Rejection gap × selling price (excludes shortage if OS weight loss seems overclaimed). Switches off once OS approved — F2 takes over. |
| **F** | No CN exists at all | Full OS quality + bardana + weight loss. Weight loss excluded when invoice was raised only for accepted qty. Suppressed for Inland DOs with a large settled supplier deduction (avoids double-count with payment-deduction mechanism). |
| **F2** | OS deductions approved (`is_deduction_approved = 1`) AND no formal CN yet | Exact `os_rejection_rs` instead of E's physical-qty estimate. Only fires when invoice was not raised purely for accepted qty. |
| **G** | No CN exists at all | Full OS cash discount. Same Inland double-count suppression as F. |
| **H** | No CN exists at all | OS bank processing + weighing + rate difference + other deductions. Same Inland suppression as F. |
| **I** | No CN, SO cash % negotiated, OS hasn't posted it, deduction not approved | SO cash % × provisional net invoice qty |
| **J** | No CN, SO bag % negotiated, OS hasn't posted it, deduction not approved | SO bag % × provisional net invoice qty |
| **K — SO brokerage** | SO has a per-Qtl brokerage charge AND deductions not yet approved | Brokerage rate × provisional net invoice qty. No separate OS entry — comes purely from the SO contract. |
| **L — SO unloading** | SO has a per-Qtl unloading charge AND deductions not yet approved | Unloading rate × provisional net invoice qty. Same SO-only sourcing as K. |

**Path 2 — formal CN exists (M-branch):**

| Branch | Trigger | What it adds |
|---|---|---|
| **M-branch** | CN exists but `total_formal_cn < total_OS_buyer_deductions` *(added Apr 2026)* | `total_OS_buyer_deductions − total_formal_cn` — the shortfall between what OS booked and what the formal CN covers. Invoice-level OS total excludes rejection and weight loss when the invoice was raised only for accepted qty. |

> **M-branch explained:** `_total_formal_cn` = rejection_deduction × rejection_share + quality × do_share + bardana × do_share + CD × do_share. `_total_OS_buyer_deductions` = sum of all 9 OS deduction types from `po_deduction_history_details`: QUALITY_DEDUCTION, BAG_DEDUCTION, WEIGHT_LOSS, CASH_DISCOUNT, BANK_PROCESSING_CHARGES, RATE_DIFFERENCE, WEIGHING_CHARGES, OTHER_DEDUCTIONS, **REJECTION**. When the formal CN raised is less than what OS has already booked as buyer deductions, the shortfall is the expected additional CN.

### Forecast Financials

| Column | Formula | Notes |
|---|---|---|
| `provisional_niv` | `net_invoice_value − expected_credit_note_amount` | NULL if result ≤ 0 (clamped to 0 if between −1 and 1) |
| `provisional_gmv` | `GMV − expected rejection gap` | NULL if provisional_niv ≤ 0 |
| `provisional_gm` | `provisional_gmv − (net_cogs_rs − expected_supplier_deduction)` *(updated May 2026)* | NULL if provisional_niv ≤ 0 |
| `provisional_cm2` | `(net_invoice_value − expected_credit_note_amount) − (total_procurement_cost_rs − expected_supplier_deduction_cogs)` *(updated May 2026)* | NULL if provisional_niv ≤ 0; uses COGS-rate deduction variant |
| `provisional_cm2_pct` | `provisional_cm2_numerator / provisional_niv × 100` *(updated May 2026)* | NULL if provisional_niv ≤ 0; uses proc-cost rate deduction consistent with provisional_gm |
| `est_cm2_pct_in_so` | Margin % anchored at SO creation time (from `po_estimated_margins`) | NULL for SOs created before 2025-04-01 |
| `ideal_roce_pct` | `est_cm2_pct × so_days_in_month / (repayment_days − est_ap_days)` | Pre-trade return estimate |

---

## Things to Watch

### CN Deductions May Lag One to Two Days
Breakdown rows sometimes lag the CN header. CN rejection/quality may show as 0 until the line-item rows sync from the source system.

### GMV Zero Doesn't Always Mean No Sale
Only invoices with status Created, Completed, Cancellation Pending, or Settlement Pending are included. Other invoice statuses are excluded; GMV becomes 0 even if a sale occurred.

### One Invoice Across Multiple DOs Is Pro-Rated
When one invoice covers multiple DOs, all money metrics are scaled by each DO's quantity share. Rejection and weight loss CNs use unloading-weight shares (not invoice qty shares) — so a DO with a large physical rejection absorbs more of the CN deduction than one with no rejection.

### Small Rejections Under 10 Qtl Are Ignored
Rejections under 10 Qtl (after share allocation) do not reduce gross invoice qty. Small spoilage is written off. The 10 Qtl threshold is checked on the combined (rejection + weight loss) for gross_invoice_qty_qtl, and independently on weight loss for net_invoice_qty_qtl.

### Commodity Cost Is 99% of COGS by Design
The remaining 1% is a notional farmer incentive allocation — mechanical, not tied to actual farmer payout.

### "Supplier Not Yet Charged" Gate — Guarded Path Only *(updated May 2026)*
The ≤ 300 threshold that suppresses provisional supplier recovery branches now applies **only** to guarded-path DOs (inland, multi-DO invoices, secondary-sales). For qualifying DOs (non-inland, single-DO invoice, non-secondary-sales), `expected_supplier_deduction` uses the residual approach and reflects the remaining gap even when `supplier_deduction_rs > 300`. This also means `provisional_gm`, `provisional_cm2`, and `provisional_cm2_pct` are no longer understated for DOs that have been partially deducted but not yet fully settled.

### GRN-PO Transport Reduces GM but Not CM2
`transport_cost_grn_po_for_gm` captures transport costs booked via the GRN/PO flow (not the formal transporter payable). It is deducted from `gm_rs` but not from `cm2_rs`. For these DOs, GM will be lower than what CM2 implies — this is correct behaviour, not a data error. *(Added Apr 2026)*

### Fully Rejected DOs Show Zero, Not NULL, for P&L Columns
When `gmv = 0 AND net_invoice_value = 0` (cargo fully rejected), `gm_rs`, `cm2_rs`, and `actual_cm2_pct` are forced to 0 rather than being computed (which would produce division errors or meaningless negatives). *(Added Apr 2026)*

### OS REJECTION Type Is a Separate Deduction From Formal CN Rejection
In `po_deduction_history_details`, the `REJECTION` detail_type represents the buyer's OS-posted rejection deduction. This is distinct from the formal CN rejection (`cn_rejection_deduction`). Both flow into the K-logic comparison — the OS total (including REJECTION) is compared to the formal CN total to determine the expected shortfall. Do not confuse the two.

---

## Quick Reference — Formulas Explained

### GMV — Gross Merchandise Value
**Formula:** `Invoice subtotal (DO share) − CN rejection deduction × rejection_share + DN value × do_share`

- **Invoice subtotal (DO share):** Raw invoice amount × this DO's quantity proportion (when one invoice spans multiple DOs).
- **CN rejection deduction:** Amount buyer deducted for quantity rejected via credit note — allocated by actual rejected kg at unloading, not by invoice qty share.
- **DN value:** Debit notes add back to GMV (buyer owes more).

**Why it matters:** Starting point for all revenue metrics; base for selling price calculation.

---

### Net COGS — Net Cost of Goods Sold
**Formula:** `Commodity cost × 0.99 − Supplier deduction`

- **Commodity cost × 0.99:** 99% of gross COGS; the 1% is reserved for farmer incentive (mechanical).
- **Supplier deduction:** Cash discount or recovery already charged back to supplier.

**Why it matters:** Net cost to FarMart after supplier-side recoveries; feeds into gross margin.

---

### Total Procurement Cost — Rolled-Up Landed Cost
**Formula:** `COGS + Labour + Commission + Mandi + Halting + Transporter payable − Supplier deduction − Rejected qty cost`

- **COGS:** Full 100% PO price × dispatch weight (not 99% commodity cost).
- **Labour + Bagging / Commission:** Per-Qtl rates × dispatch weight.
- **Mandi tax / Halting:** Absolute amounts from bill components.
- **Transporter payable** (`transporter_cost_payable_rs`): From `payment_deductions_for_transports`. Does **not** include GRN-PO transport.
- **Rejected qty cost:** Cost of goods not recovered (only deducted if deficit > 3 Qtl AND not RTV).

**Why it matters:** Complete cost to procure and deliver; denominates CM2 calculation.

---

### GM vs CM2 — Why They Differ
**GM:** `GMV − Net COGS [− transport_cost_grn_po_for_gm when transporter payable = 0]`
**CM2:** `Net Invoice Value − Total Procurement Cost`

GM captures a broader cost (including GRN-PO transport) but uses a lighter revenue base (GMV, before quality/bardana/CD CNs). CM2 uses the full procurement cost stack but excludes GRN-PO transport. When `transport_cost_grn_po_for_gm > 0` and `transporter_cost_payable_rs = 0`, expect `GM < CM2`.

---

### CM2% — Contribution Margin 2 Percentage
**Formula:** `(net_invoice_value − total_procurement_cost) ÷ net_invoice_value × 100`

- **Numerator (CM2):** Profit retained after all operational costs.
- **Denominator:** Net revenue; smaller if many CN deductions.

**Why it matters:** Primary KPI for deal health. Never average across DOs — always recompute: `SUM(cm2_rs) / SUM(net_invoice_value_rs)`.

---

### WC Days — Working Capital Cycle
**Formula:** `AR Days − AP Days`

- **Positive WC Days:** Cash tied up; buyer pays after supplier is paid.
- **Negative WC Days:** Favorable; supplier paid after buyer paid.

---

### AP Days — Days to Pay Supplier
**Calculation:** Paid portion + pending portion.

```
Paid portion   = SUM(payment_amount × days_from_unloading_to_payment) / total_net_payable
Pending portion = (total_net_payable − total_paid) / total_net_payable × days_from_unloading_to_today
```

- **Overpayment rescaling:** If total paid > total payable, rescale paid weights by `payable / paid` so they sum to 1.0.
- **Grows daily** until supplier fully paid.
- **NULL** if not yet unloaded or payable = 0.
- Payment date used = `payment_transactions.created_at` (not `procurement_payments.paid_at`).

---

### Expected Credit Note Amount — Forecast Buyer Deductions

Two modes depending on whether a formal CN exists:

**No CN yet (`_has_cn = 0`):** Surface all OS-posted deductions — quality, bardana, weight loss, cash discount, other — plus SO-negotiated rates not yet posted. Six branches (E–J) can fire independently.

**CN exists but is incomplete (`_has_cn = 1`, K-logic):** Compare `_total_formal_cn` vs `_total_OS_buyer_deductions`. If the OS has booked more deductions than the formal CN covers, the shortfall is the expected additional CN amount. `_total_OS_buyer_deductions` includes all 9 types from `po_deduction_history_details` including the REJECTION type.

**Why it matters:** Forecast of buyer CNs; used to compute provisional NIV (conservative revenue estimate).

---

### Provisional CM2% — Conservative Margin Estimate
**Formula:** `(provisional_niv − total_procurement_cost) ÷ provisional_niv × 100`

- **Provisional NIV:** Actual NIV − expected CN deductions (what buyer will actually pay after all CNs).
- More conservative than actual CM2%; accounts for unbooked deductions.
- NULL when provisional_niv ≤ 0 (deal expected to be loss-making after all deductions).

**Why it matters:** Safe margin estimate for forecasting; actual CM2% may improve if provisioned items don't materialise.

---

## CO Provisional Metrics — `vw_co_do_summary`

As of 2026-05-05, `vw_co_do_summary` computes the same 7 provisional columns for secondary-sales COs (rejected stock re-sold via consignments). The column **names** match the DO view's, but the **formulas differ** — they ask a different question.

### What a CO provisional metric is estimating

Where the DO provisional logic asks *"how much of this invoice will be reversed by buyer CNs and supplier deductions?"*, the CO version asks: *"for this DO's portion of stock that went into this CO, how much will FarMart ultimately net out after the CO deductions are finalised?"*

The key concept is `do_within_co_share` — how much of the CO's total accepted stock came from this particular origin DO. Most deductions and P&L amounts are prorated by this share.

### Excluded COs

COs where the buyer is Inland Power, FMT Agro Service, or FarMart itself are excluded (`_is_excluded_co = 1`) — all 7 provisional columns return NULL. These are internal or vendor-credit buyers whose CO economics are handled differently.

### `expected_supplier_deduction` (CO version)

Estimates what FarMart expects to recover from the original DO's supplier for the stock that went through this CO.

The main driver is the **rate-gap recovery** — if the DO's internal selling price exceeded the CO's actual SO rate, the gap should be borne by the supplier:

```
rate_gap_recovery = GREATEST(primary_do_selling_price_rs − co_so_rate_per_qtl, 0)
                    × current_accepted_qty_kg / 100
```

On top of that, approved OS buyer deductions (quality, weight loss, bank charges, weighing, other) are prorated by `do_within_co_share`. Cash discount and bardana deductions are added when the CO's SO is on a gross-price basis.

The full expression is floored at 0 (`GREATEST(..., 0.0)`) because `do_within_co_share` can be zero or negative for rows where all stock was forwarded to a next-generation CO.

### `expected_credit_note_amount` (CO version)

Two paths, controlled by the `_co_has_cn` flag (`_co_has_cn = 1` when formal CN amounts already exist for rejection / quality / bardana / CD).

**Path 1 — no formal CN yet:**

- **Rejection gap:** stock that flowed out to a next-gen CO (`step_outflow_kg`) × CO's SO rate
- **OS deductions** prorated by `do_within_co_share`: quality, bag, weight loss, and — if approved — rejection
- **Other OS deductions:** cash discount, bank charges, weighing, other
- **SO-rate provisions** for cash discount and bardana when not yet in OS and deductions not yet approved
- **SO brokerage and unloading** charge provisions when not yet in OS

The path-1 ECA is also floored at 0 for the `do_within_co_share` edge case.

**Path 2 — CN exists (M-branch):**

```
ECA = (OS total × do_within_co_share) − (CN total × co_share × do_within_co_share)
      [if positive; else 0]
```

### `provisional_niv`, `provisional_gmv`, `provisional_gm`, `provisional_cm2`, `provisional_cm2_pct` (CO version)

```
provisional_niv  = co_net_invoice_value_rs × do_within_co_share − ECA
provisional_gmv  = co_gmv_rs × do_within_co_share                            [path 2, CN exists]
                or co_gmv_rs × do_within_co_share − rejection_outflow_value  [path 1, no CN]
provisional_gm   = provisional_gmv − (do_net_cogs_rs × do_weight_share − ESD)
provisional_cm2  = provisional_niv − (do_total_procurement_cost_rs × do_weight_share − ESD)
provisional_cm2_pct = provisional_cm2 / provisional_niv × 100
```

Where:

| Symbol | Definition |
|---|---|
| `ESD` | `_expected_supplier_deduction` (CO version) |
| `ECA` | `_expected_credit_note_amount` (CO version) |
| `do_weight_share` | `current_accepted_qty_kg / (do_qty_bought_qtl × 100)` — procurement share |
| `do_within_co_share` | `current_accepted_qty_kg / total_co_accepted_kg` — selling share |

> **Why the two share denominators differ:** `provisional_gm` and `provisional_cm2` use `do_weight_share` (procurement share) for prorating procurement cost and net COGS because those costs were borne against the **full** DO quantity, not just the CO's portion. Selling-side metrics use `do_within_co_share`.

All 5 columns are NULL when `_is_excluded_co = 1` or when the CO's NIV is not yet known. None of these columns flow through to the CO leg of `vw_do_business_summary` until `mv_co_do_summary` is refreshed after deployment.
