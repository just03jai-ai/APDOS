# AI Data Analyst

Answer FarMart business and finance data questions backed by the gold-layer views, dispatch-order MIS, and finance reconciliation views.

## Installation

```bash
npx skills add FarMart-Engineering/skills/ai-data-analyst
```

## What This Skill Provides

- Gold view catalog and grain reference (`vw_do_summary`, `vw_co_do_summary`, `vw_do_business_summary`, `vw_invoices_summary`, `vw_buyer_collections`, `vw_supplier_payments`, `vw_sales_orders_summary`, `vw_finance_*`)
- Silver schema reference for `master.app_os_db_silver`
- Consignment (CO) flow and secondary-sales modeling
- Dispatch Orders MIS column-by-column guide: actuals, provisionals, expected CN/supplier deduction branches A–N and E–K
- Business metric formulas: GMV, NIV, GM, CM2, CM2 %, AP Days, AR Days, WC Days, ROCE
- Default filter and date-field conventions
- Documented gotchas (G1–G32) for edge-case formula behavior
- SQL-writing workflow against `master.gold` and `master.app_os_db_silver`

## When To Use

Use this skill when you need to:
- Answer FarMart business or finance metric questions
- Write SQL against `master.gold.*` or `master.app_os_db_silver.*`
- Reconcile invoiced P&L, AP/AR Days, working capital, or supplier/buyer payments
- Compute provisional vs actual margins
- Investigate consignment / secondary-sales flow
- Explain the difference between OS-booked deductions and formal CNs/DNs

## Important: You Are Bounded By Your Databricks Access

This skill writes SQL but does not execute it. You run the generated query in your own Databricks workspace, so the data you actually see is limited by:

- **Unity Catalog grants** on `master.gold`, `master.app_os_db_silver`, `master.google_sheet_data_silver`, `master.data_science_db_silver`
- **SQL warehouse / cluster access** — no compute, no query
- **Row-level security and column masks** — e.g. BU-restricted views show only your slice
- **Materialized view freshness** — `mv_do_summary` and `mv_co_do_summary` lag until refreshed

Two users running the same generated SQL can get different results based on their grants. For permission errors, contact your Databricks admin — not this skill.

## Quick Example

```text
Show me CM2 % by business unit for invoices in April 2026,
recomputed from sums (no averaged percentages).
Use the gold view that gives one row per DO with selling + procurement.
```

The skill will pick `vw_do_business_summary`, apply the invoice whitelist, filter on `invoice_date`, group by `business_unit`, aggregate `SUM(cm2_rs) / SUM(net_invoice_value_rs) * 100`, and call out any GM-vs-CM2 gap or provisional caveat that applies.

## Defaults

| Convention | Default |
|---|---|
| Period column | `invoice_date` |
| Currency | INR |
| Quantity unit | Quintals (Qtl), 1 Qtl = 100 kg |
| Active filter | `is_active = 1` on every silver join |
| Invoice whitelist | `status_id IN (4, 6, 9, 10)` |
| BU attribution | `MIN(business_unit)` per `user_profile_id` from `employee_business_unit_mapping` |
| Percentages | Aggregate numerator + denominator separately, then divide |

## File Structure

```text
ai-data-analyst/
├── SKILL.md                 # Workflow and operating rules
├── README.md                # This file
├── DATABASE_KNOWLEDGE.md    # Gold view catalog, silver schema, gotchas, metric formulas
├── METRICS_GUIDE.md         # Dispatch Orders MIS column-by-column guide
└── AUTOMATION.md            # Webhook-triggered sync from cerebro (maintainer setup)
```

## Source of Truth

The two reference docs in this skill are snapshots from the cerebro repo:
- `cerebro/agent/queries/people/sukhpreet.sekhon/notes/farmart_db_knowledge.md`
- `cerebro/agent/queries/people/sukhpreet.sekhon/notes/dispatch_orders_finance_metrics_guide.md`

A webhook from cerebro triggers an auto-sync PR in this repo whenever those files change on `main`. Reviewers approve the diff, bump the version, and merge. See [AUTOMATION.md](AUTOMATION.md) for the setup. Live view definitions in cerebro still override anything in this skill if they conflict.

## Maintainer

Sukhpreet Sekhon — sukhpreet.sekhon@farmart.co

## License

ISC
