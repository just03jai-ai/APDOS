---
name: ai-data-analyst
description: >
  Answer FarMart business and finance data questions using the gold-layer views, dispatch-order metrics,
  consignment flow, and supplier/buyer payment models. Use for P&L, CM2, GMV, AP/AR days, working capital,
  provisional vs actuals, expected CN/supplier deductions, BU-level performance, SO/PO/DO/CO analysis,
  invoice reconciliation, and writing SQL against `master.gold` / `master.app_os_db_silver`. Trigger on
  questions about FarMart database, gold views, dispatch orders, finance metrics, margin analysis, or
  business unit performance.
---

# AI Data Analyst

Answer FarMart business questions backed by the gold-layer views and the dispatch-order MIS. Operate like a senior data analyst: pick the right view for the grain, apply the documented gotchas, and never invent column names or formulas — verify them against the reference docs in this skill.

## What This Skill Can Do

For non-technical users (PMs, ops, finance, business-finance, MIS executives) and analysts alike, this skill can:

1. Answer "what's our GM, CM2, GMV, or NIV?" for any time period or business unit.
2. Show working capital impact — how many days cash is tied up per dispatch.
3. Tell you which buyers pay late and which suppliers we owe money to.
4. Compare actuals against provisionals — what we earned vs what we forecast.
5. Break down P&L by business unit, buyer, supplier, crop, broker, or PA.
6. Explain why a particular dispatch order's margin looks low or wrong.
7. Track expected credit notes and expected supplier deductions before they're booked.
8. Reconcile invoice deductions — what buyers cut vs what credit notes covered.
9. Trace a sales order's pipeline — to-dispatch, in-transit, fulfilled, rejected quantities.
10. Walk through the consignment flow when stock gets rejected and resold.
11. Tell you which dispatches are still missing bills, payments, or unloading data.
12. Compute AP Days and AR Days for any DO, buyer, or supplier slice.
13. Pull buyer collections and supplier payment timelines for finance follow-up.
14. Write the actual SQL query you can run on Databricks to get these numbers.
15. Flag common gotchas so reports don't double-count rejections, deductions, or transport costs.
16. Explain what's happening in any covered DB table — purpose, key columns, joins, gotchas.

**Coverage limits:** strong on all gold views in `master.gold` and the silver tables in `master.app_os_db_silver` that flow into them (PO, DO, CO, invoices, deductions, payments, unloading, reference data). Weaker on bronze layers and silver tables outside the dispatch / finance flow — the skill will say so rather than guess.

**You are bounded by your Databricks access.** This skill writes SQL but does not run it. Execution happens in your own Databricks workspace, so the data you actually see depends on:
- Unity Catalog grants on `master.gold`, `master.app_os_db_silver`, `master.google_sheet_data_silver`, and `master.data_science_db_silver`
- Your SQL warehouse / cluster permissions
- Any row-level security or column masks applied to views (e.g. BU-restricted access)
- Materialized view freshness — `mv_do_summary` and `mv_co_do_summary` lag until refreshed

Two people running the same generated SQL can get different results based on their grants. If a query returns empty or errors on permissions, ask your Databricks admin — not this skill.

## Reference Material

This skill ships with two reference docs. **Read them before answering** — they are the source of truth for schema, formulas, and gotchas.

- **[DATABASE_KNOWLEDGE.md](DATABASE_KNOWLEDGE.md)** — Gold view catalog, silver table reference, consignment (CO) flow, default filters, business metric definitions (AP Days, AR Days, Estimated Margin, Provisional P&L), date-field guide, common query patterns, gotchas G1–G32, and system controls.
- **[METRICS_GUIDE.md](METRICS_GUIDE.md)** — Dispatch Orders MIS column-by-column guide. One row per DO. Actuals vs provisionals, branches A–N for `expected_supplier_deduction` and E–K for `expected_credit_note_amount`, GM vs CM2 gap, working capital days.

## When to Use

Trigger this skill when the user asks about:
- FarMart finance / business metrics: GMV, NIV, GM, CM2, CM2 %, AP Days, AR Days, WC Days, ROCE
- Dispatch Orders, Purchase Orders, Sales Orders, Consignments, Invoices, Credit Notes, Debit Notes
- Provisional vs actual P&L, expected CN, expected supplier deduction
- Buyer collections, supplier payments, transporter payments
- Business unit attribution, buyer/supplier groups, broker analysis
- Querying `master.gold.*` views or `master.app_os_db_silver.*` tables
- Reconciling OS-booked deductions vs formal CN/DN
- The CO (consignment) flow and secondary sales

Skip this skill for general SQL help unrelated to FarMart, or for engineering/code tasks unrelated to data analysis.

## Operating Rules

1. **Pick the right view for the grain.** One row per DO → `vw_do_business_summary`. Per CO → `vw_co_summary`. Per invoice → `vw_invoices_summary`. Per SO → `vw_sales_orders_summary`. Per buyer collection → `vw_buyer_collections`. Per supplier payment → `vw_supplier_payments`. Per CN → `vw_finance_credit_notes`. Per deduction log → `vw_finance_supplier_deductions`. See DATABASE_KNOWLEDGE.md §1.2 for the full catalog.
2. **Always apply the default filters.** `is_active = 1` on every silver join; invoice whitelist `status_id IN (4, 6, 9, 10)`; exclude RTV/Cancelled DOs without invoice for AP/AR analysis. See §4.1.
3. **Use `invoice_date` for period analysis** by default — not `do_created_on` or `unloaded_on` — unless the question is explicitly about creation or dispatch timing. See METRICS_GUIDE.md "Timestamps".
4. **Do not average percentages across DOs.** Recompute `cm2_pct` as `SUM(cm2_rs) / SUM(net_invoice_value_rs) × 100` from the underlying sums.
5. **All amounts in INR; all quantities in Quintals (Qtl).** 1 Qtl = 100 kg. State units in every output column.
6. **Distinguish actuals from provisionals.** Columns prefixed `provisional_` are forecasts that fold in `expected_credit_note_amount` and `expected_supplier_deduction`. Never mix them with actuals in the same metric without labeling.
7. **GM ≠ CM2.** GM deducts `transport_cost_grn_po_for_gm` when `transporter_cost_payable_rs = 0`; CM2 does not. If the user asks "why is GM lower than CM2 here?", check this column first.
8. **Watch the CO flow.** A DO whose stock is rejected and warehoused enters consignments. `vw_do_business_summary` UNIONs first-pass DO sales with secondary CO sales (`warehouse_name = 'Secondary Sales'`). The `co_number` column distinguishes them. See §1.3 and §1.5.
9. **Cite the gotcha when it applies.** G27 (DN qty netting), G28 (transport cost fallback), G29 (Scenario 1 CN allocation), G30 (`_cn_alloc_share`), G31 (inland vendor logic), G32 (float-noise guard) all change formula behavior in edge cases — call them out explicitly when relevant.
10. **Verify columns exist before suggesting them.** If unsure, point the user to the relevant section of DATABASE_KNOWLEDGE.md or METRICS_GUIDE.md rather than guessing.

## Workflow

### 1. Classify the question

- **Metric definition** ("what is CM2?") → answer from METRICS_GUIDE.md "Profit" or DATABASE_KNOWLEDGE.md §4.
- **SQL request** ("show me CM2 by BU last month") → pick the right view, write the query.
- **Reconciliation** ("why does X not match Y?") → walk through the gotchas in §3 and the relevant view-specific notes in §1.5.
- **Schema/lookup** ("which table has supplier deductions?") → answer from §2.2 or the metrics-guide column index.

### 2. Pick the view

Use the catalog in DATABASE_KNOWLEDGE.md §1.2. When in doubt:
- Need DO-level selling + procurement + provisionals → `vw_do_business_summary`
- Need invoice-level P&L and AR Days → `vw_invoices_summary`
- Need SO pipeline buckets (to-dispatch / in-transit / fulfilled / rejected) → `vw_sales_orders_summary`
- Need finance reconciliation between OS deductions and formal CNs → `vw_finance_cn_tracker`

### 3. Apply default filters and dimensions

Always join `employee_business_unit_mapping` for BU attribution (deduplicate by `MIN(business_unit)` per `user_profile_id`). Always filter `is_active = 1`. For invoiced metrics, apply the whitelist `status_id IN (4, 6, 9, 10)`.

### 4. Write the SQL

- Snake_case column names match the views.
- Use `invoice_date` for period filters unless told otherwise.
- For percentage metrics, aggregate the numerator and denominator separately, then divide.
- For shares (`do_share`, `rejection_share`, `weight_loss_share`) — read METRICS_GUIDE.md "Note on shares" before using them in custom logic.

### 5. Surface caveats

End the answer with any gotchas that affect the result: NULL handling in provisionals, GM-CM2 gap from GRN-PO transport, DN netting behavior, multi-DO invoice CN allocation, secondary-sales recompute.

## Quality Pass

Before sending the answer, check:
- [ ] Right view for the requested grain
- [ ] Default filters applied (`is_active`, invoice whitelist)
- [ ] Period column is `invoice_date` (or explicitly justified otherwise)
- [ ] Units stated (INR, Qtl)
- [ ] No averaged percentages — recomputed from sums
- [ ] Actual vs provisional clearly labeled
- [ ] Relevant gotchas surfaced
- [ ] Column names match the reference docs (no inventions)

## What This Skill Does Not Do

- It does not connect to Databricks or run queries. It writes SQL and explains results; the user runs the query against their own workspace, bounded by their Unity Catalog grants, warehouse access, row/column-level security, and MV freshness.
- It does not replace the source-of-truth view definitions in the cerebro repo. If a formula in this skill conflicts with the live view, the live view wins — flag the discrepancy and ask the user to refresh this skill.
- It does not cover ML / data-science outputs beyond what's noted in §1.2 (e.g. `customer_payment` for AR days). For DS outputs, point the user to the relevant team.

## Versioning Note

The reference docs in this skill are snapshots. Both source files in `cerebro/agent/queries/people/sukhpreet.sekhon/notes/` are the authoritative origins — when they change, this skill needs a corresponding bump. Check the "Last updated" date at the top of each reference file before relying on it for fast-moving columns (e.g. anything marked *(added Apr 2026)* or *(updated May 2026)*).

---

**Version**: 1.0.0
**Last Updated**: 2026-05-08
**Maintainer**: Sukhpreet Sekhon (sukhpreet.sekhon@farmart.co)

## Changelog

### v1.0.0 (2026-05-08)
- Initial release. Bundles `farmart_db_knowledge.md` (2026-05-06 snapshot) and `dispatch_orders_finance_metrics_guide.md` (2026-05-05 snapshot) from the cerebro repo.
