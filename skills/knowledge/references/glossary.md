# FarmartOS Glossary

Critical terms — many are non-obvious or internally redefined.

## Core Platform Terms

| Term | Meaning | Common Mistake |
|---|---|---|
| **ML** | Market Linkage — the business concept linking farmers to markets | Confused with Machine Learning |
| **FarmartOS** | Internal web app (desktop) used by FarMart operations teams | Not the mobile app |
| **FarMartPro** | Mobile PWA used by field staff (PAs, drivers) for daily tasks | Not the same as FarmartOS |
| **FarMart App** | Retailer/supplier-facing mobile app (separate BE: `farmart-app-backend`) | Different codebase from MarketLinkage-BE |

## Roles

| Term | Full Name | What They Do |
|---|---|---|
| **PA** | Procurement Agent | Field role — visits retailers/suppliers, creates samples, initiates POs |
| **SH** | State Head Procurement | Approves/rejects samples in Supply Visibility |
| **RPM** | Regional Procurement Manager | Regional oversight of procurement operations |
| **Buyer** | — | FarMart's customer who purchases the produce |
| **Supplier** | — | Also called "Retailer" in code (`apis/v1/retailer/`) — the farmer/aggregator selling produce |

## Trade & Procurement

| Term | Meaning | Notes |
|---|---|---|
| **SO** | Sales Order | Created by buyers; represents demand |
| **PO** | Purchase Order | Created against a supplier; represents supply commitment |
| **Master PO** | — | Top-level PO entity in the system (`master_purchase_order` in BE) |
| **PCO** | Delivery Order / Purchase Confirmation Order | Confusing name — refers to a delivery order, NOT a purchase confirmation |
| **Sample** | — | Physical crop sample created by PA before a PO can be raised (`master_sample` in BE) |
| **Sauda** | — | A trade deal/agreement; "Supplier Sauda" = deal with supplier |
| **GTV** | Gross Trade Value | Total value of a trade transaction |
| **Trade** | — | The core procurement flow: Sample → PO → Dispatch → Unloading |

## Finance

| Term | Meaning | Notes |
|---|---|---|
| **CN** | Credit Note | Issued when buyer is owed money |
| **DN** | Debit Note | Issued when buyer owes money |
| **Supplier Payable** | — | Amount owed to supplier after PO completion (`supplier_payable_management` in BE) |
| **Supplier Recovery** | — | Recovery from supplier for disputes/deductions (`supplier_recovery` in BE) |
| **Mandi Tax** | — | Agricultural market tax levied at the mandi (marketplace) |
| **TDS** | Tax Deducted at Source | Tax deducted on payments to suppliers |

## Logistics

| Term | Meaning | Notes |
|---|---|---|
| **Dispatch** | — | PO goods loaded onto a vehicle and sent to warehouse |
| **Unloading** | — | Goods received at warehouse, quantity/quality verified |
| **Consignment** | — | A shipment batch tracked through logistics (`consignment` in BE) |
| **Trip** | — | A vehicle journey from supplier to warehouse (`trip_tracking` in BE) |

## Technical

| Term | Meaning | Notes |
|---|---|---|
| **entities/** | Legacy model directory | Do not use — deprecated in favour of `models_v2/` |
| **entities_v2/** | Also legacy | Transitional layer — being cleaned up |
| **models_v2/** | Current Sequelize models | Canonical model location |
| **BFF** | Backend for Frontend | Auth layer introduced in Sprint 37 |
| **RLS** | Row Level Security | Data isolation per role/region (Sprint 25) |
