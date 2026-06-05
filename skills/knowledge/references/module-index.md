# FarmartOS Module Index

Outline workspace: `https://farmart.getoutline.com`
FarmartOS collection: `b4136697-1089-4450-adef-735bb13f9ffd`

**How to use:** For any module, fetch docs in this order:
1. Product doc (what) → Engineering doc (how) → Sprint docs oldest→newest (why + evolution)
2. Release checklist of the latest sprint → confirms what shipped + contacts

---

## Procurement

### Purchase Orders
BE module: `apis/v1/purchase_order/`, `apis/v1/master_purchase_order/`
FE page: `apps/farmart-os/src/page/procurement/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `cf3c674b-5999-4587-a428-d7f47074fd7f` | Purchase Orders overview |
| Engineering doc | `8f3f1c09-1620-4b18-8828-694a8c1e3779` | Sample & PO workflow |
| s09 PRD (Create Order) | `5c1d7255-0d2c-48bb-a7b9-39d938d030fe` | PO T&C |
| s09 HLD | `d47eb4d4-755f-415a-be8a-590f345f18cd` | |
| s09 LLD | `910e888f-84bd-41b4-bdba-3aaf5c5766b7` | |
| s13 PRD (Mark Complete) | `0ec456c4-e911-495c-852b-eafe885b2733` | |
| s13 HLD | `be5d6651-b938-4fb0-9120-2856d8122655` | |
| s13 LLD | `80cdcf56-03f5-468c-b71e-43e58a0490f0` | |
| s28 PRD (Purchase Booking v1) | `7a6ef88b-bbb4-4634-872a-52e34b94a156` | |
| s28 HLD | `7aae5a56-1280-45ae-ab0b-a5486a5d076e` | |
| s28 LLD | `21185c53-2bda-45f1-953a-fa0d6c112d8e` | |
| s29 PRD (Restructuring POs) | `32b6a637-4345-441d-9bfa-82434f13a83e` | Major restructure |
| s29 HLD | `87020aa8-01f1-4256-92ee-c0a7ba86340c` | Includes DB design + flow diagrams |
| s29 LLD | `cbee7a69-5c7b-47b7-970f-68b405ecf13a` | |
| s35 HLD (Purchase Booking v2) | `2eaba388-8bef-4abe-85d5-63a82f0f454e` | Supplier payable v2 |
| s35 LLD | `70aa330a-b454-4f4b-b935-6c3208ac8834` | |
| Upcoming PRD (PO Automation via SOs) | `7e1d63fa-a424-4f17-ac44-845fb2cf19e5` | |

### Sales Orders
BE module: `apis/v1/sales/`
FE page: `apps/farmart-os/src/page/sales/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc (SO Approval) | `e3ffd6b5-645c-4314-acbc-c55241f03291` | |
| Product doc (SO Target) | `e67f234b-a363-49e0-991b-d3c9cfa2bb63` | |
| s14 PRD (SO Approval v1) | `cbb68223-aff2-456c-b5d9-496bc021bf78` | |
| s14 HLD | `8b74d80b-a8da-4b47-8145-a7094501cf5e` | |
| s14 LLD | `2a7c30d3-466d-4ccf-be92-ebceb52bf5ef` | |
| s14 LLD (Allocation phase 1) | `cbbc0661-db74-4f50-9355-45723672d1c6` | |
| s37 PRD (SO Approval v2) | `d2a26834-be9a-4232-b549-c4a5a1e1cfb5` | |
| s40 PRD (SO Approval v3) | `01b80fac-d994-408d-a321-a41a5bc78c9b` | |
| s40 HLD | `0bef0b63-e872-4145-a78e-ff772d5610b3` | |
| s40 LLD | `cf344e2c-b6c3-41f0-b8da-13befd48c6b9` | |

### Trade (Core Flow)
BE module: `apis/v1/trade/`
FE page: `apps/farmart-os/src/page/trade/`

| Layer | Doc ID | Notes |
|---|---|---|
| s02 HLD (Story 1) | `979cc8c4-357f-4d02-8592-152c9d4e4c92` | Unbundling Business |
| s02 LLD (Story 1) | `18dfbc5f-fa21-40ba-8898-5a31c3192093` | |
| s02 HLD (Story 2) | `1c6d32e1-d2ce-40b2-87cc-c67f2f4adf16` | |
| s02 LLD (Story 2) | `f088a926-22d0-4ee2-9da2-98bdd4b15c71` | |
| s02 HLD (Story 3) | `23842d0e-4f2a-46db-b079-7b9b8a429598` | |
| s02 LLD (Story 3) | `4d8ad999-42f4-41b6-832a-22053541a504` | |
| s15 HLD (Trade v4) | `1e8372e6-8f14-40b7-89e4-a20b32aed593` | |
| s15 LLD (FarmartOS/Pro/BE) | `bb8ed6e7-3d74-46db-ace2-684dd019c899` | |
| s15 LLD (farmart-app-backend) | `2833187e-ec8c-41a6-817a-55600846a9ab` | |
| s11 PRD (Dispatch Flow) | `e46fbb19-a8ea-4203-8757-7ce9a12e96a2` | |
| s11 HLD | `23174e8f-c104-46fa-a4f5-6337be318ac3` | |
| s11 LLD | `c6fa2b6b-9b51-40d1-9e51-2699bea4fd53` | |

### Supplier Saudas & Supply Visibility
BE module: `apis/v1/master_sample/`
FE page: `apps/farmart-os/src/page/procurement/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc (Supplier Saudas) | `5cdd4d4d-bfa9-4df6-8c6e-bc2186ddfdf5` | |
| Product doc (Supply Visibility) | `1c579f66-67d1-42de-8d8f-0dfbd7dab1b4` | |
| s07 PRD (View Layer for Saudas) | `471a374c-b5b8-4ad7-932b-85a4186e57d7` | |
| s07 HLD | `63a7a8bc-c1f9-4a6a-8f3d-f9dcf745e815` | |

### Buyer Prices
FE page: `apps/farmart-os/src/page/procurement/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `dc3cad54-e422-4e07-89dd-f439678fe7a5` | |

### Crop Creation
BE module: `apis/v1/crop/`

| Layer | Doc ID | Notes |
|---|---|---|
| s27 PRD | `ca69df0f-2639-426e-a765-7c26e0ffe450` | |
| s27 LLD | `4018e178-acaf-4144-9c61-d7f8e25ff5e3` | |

---

## Finance

### Invoicing (Invoice / CN / DN)
BE module: `apis/v1/po_so_invoicing/`, `apis/v1/auto_invoice/`, `apis/v1/e_invoicing/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `6187372f-41d4-48c6-8d6a-e9e9fc5abed2` | |
| s05 PRD | `89a4a99d-e155-4a19-a3dc-521b491270e1` | Invoice/CN/DN on OS |
| s05 HLD | `401848d0-556a-43eb-a0d6-427021775476` | |
| s05 LLD | `b1d9c713-5646-4684-8151-e07575c63f4d` | |
| s21 PRD (Auto Invoicing) | `58ac8956-e342-4646-be74-52db8efd1feb` | |
| s21 HLD | `ab6fe111-0d6a-487d-94ac-67be561d892d` | |
| s21 LLD (auto invoice) | `e15bfc86-ec11-49e1-9fed-15f3f3ea1234` | |
| s21 LLD (trade) | `ed65c801-c554-4fe1-a74a-040369a2c400` | |
| s38 HLD (Update Invoice) | `5631673b-5199-4bd1-a4fd-00ed7829fae8` | Move to CN/DN |
| s38 LLD | `12fef038-8397-4785-8e5f-98f7014d41f9` | |
| s39 PRD (Single Click CN) | `175f0aeb-785f-4c8d-939e-71dbbdc9f663` | |
| s39 HLD | `77e029c1-b217-422d-a5de-f7b2cdf30f71` | |
| s39 LLD | `99ee043c-ffdb-4969-81ab-ae8aa9f4d6b2` | |
| s44 HLD (Invoicing Fallback) | `0ec85315-bbfc-4a25-baf4-8721151b4732` | |

### Payments
BE module: `apis/v1/payment/`, `apis/v1/supplier_payable_management/`, `apis/v1/supplier_recovery/`, `apis/v1/farmart_bank/`
FE page: `apps/farmart-os/src/page/payments/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `2a3eaceb-fcbb-4c00-a3d4-41fafceb7c08` | |
| Engineering doc | `d4259261-02e0-4ebe-b659-1d832c6b437c` | |
| s04 PRD (Multiple Payments) | `5c6a8c6d-e05f-4b3f-a834-8e420b04a775` | |
| s04 HLD | `87f9b726-5d11-4993-af72-d7658a6a2afd` | |
| s18 PRD (API Based Payments) | `57bb2e7b-8bcc-475a-b0b6-8f5df46b5284` | |
| s18 HLD | `199b5d01-34d9-4faf-9108-aed8df63bd4a` | |
| s18 LLD | `e5afecc6-fe32-46ef-9aba-be8380ae0cbc` | |
| s19 PRD (Payment Prerequisites) | `ab93b10e-062c-44e0-9495-096186bb6c40` | |
| s19 LLD | `82a4bc19-e189-4898-bb3a-c43c9300426d` | |

### Buyer Deduction
BE module: `apis/v1/payment/` (deduction sub-flow)

| Layer | Doc ID | Notes |
|---|---|---|
| s33 PRD | `eb714678-45e8-4bdc-a38f-4cf591ad7fa1` | |
| s33 HLD | `c0a8206f-fc56-414b-b13a-0b6b5426d8f1` | |
| s33 LLD | `8810c62a-786b-48a3-9ba6-0b846a8eeef1` | |

### Buyer Payment Reconciliation
BE module: `apis/v1/buyer_payment_reconciliation/`

| Layer | Doc ID | Notes |
|---|---|---|
| s45 HLD | `06eafbc2-0c04-4c01-8ed3-e6e1027b9c77` | |
| s45 LLD | `cfa10d38-e3f4-46f1-965b-2626c90e8c80` | |
| s45 Research | `095c72cc-c6ae-4316-b615-a87e4a31cf3a` | Zoho sync receivables |

### Mandi Tax
BE module: `apis/v1/mandi_taxation/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `b1db79c6-41f6-43e3-8402-a5c8960b086c` | |

### Zoho Integration
BE module: `apis/v1/` (cross-cutting)

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `d46395e5-e952-462c-9512-376df68de883` | ZohoBooks integration |
| Engineering doc | `0986a9dc-9fed-4386-9806-c7cb6622042f` | |

---

## Logistics
BE module: `apis/v1/trip_tracking/`
FE page: `apps/farmart-os/src/page/logistic/`, `apps/farmart-os/src/page/logisticsV3/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc (Trip Tracking) | `04edd021-5d80-464a-950a-1f5d9d602fa8` | |
| Engineering doc | `3b4fb2e3-80b9-4576-a244-331fae9f63fb` | |
| s06 PRD (Auto Trip Creation) | `f08c3600-9060-4e3b-8947-caa4df442d64` | |
| s06 Tech doc (Auto Trip) | `0afb0f6d-4ef4-4901-ba00-8f7b6603ec2f` | |
| s06 PRD (Trip Management) | `ec0547be-ec32-4fd0-94da-4ed8e3f18c8e` | |
| s06 LLD (FMT Pro) | `8cb4d956-fdb4-45e8-bceb-025c40f2314e` | |
| s16 HLD (Trip Management v2) | `b022c100-7100-448a-9669-83a25a09f205` | |
| s16 LLD | `15693bab-fefb-4fa0-98c6-4705dde31c29` | |
| s10 PRD (Location Serviceability) | `2ee17902-d857-4356-8854-1235f4cb43c5` | |
| s10 HLD | `8c47b480-27a4-43a6-9071-0315cf393e17` | |
| s10 LLD | `86c7ee9c-b2ad-4c46-ac3e-c5ed38ab0661` | |

---

## Inventory & Warehouse
BE module: `apis/v1/consignment/`
FE page: `apps/farmart-os/src/page/inventory/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `877ce8b4-975d-4d1d-a951-40070eeb3dee` | Warehouse and Outbound |
| Engineering doc | `9e5961b6-37c8-48b0-80cd-b90723ad9700` | |
| s03 PRD (Inventory Mgmt) | `c33bb7fa-0052-4127-815d-2b98d981cb2a` | |
| s03 HLD (Inventory Mgmt) | `71d2ed87-bdc1-43c5-a5e0-78d27ae072d1` | |
| s03 PRD (Outbound phase 1) | `81ae81fd-1980-46af-8820-87c9e3cdb08a` | |
| s03 HLD (Outbound) | `156704af-b569-4833-afa7-05289f4acb64` | |
| s03 LLD (Outbound) | `c68808d4-f892-4d6c-b94f-d7bd299e98a8` | |
| s17 HLD (Warehouse v2) | `36ed65b5-c477-442f-b9c6-73f06472358e` | |
| s17 LLD | `48602e68-9a6e-462c-807c-dcc1cdfe2f3d` | |

---

## KYC & Onboarding

### Supplier KYC
BE module: `apis/v1/kyc/`

| Layer | Doc ID | Notes |
|---|---|---|
| s22 PRD (KYC v1) | `2cdfa161-1031-4be9-b264-3fcb5a4d6a07` | |
| s22 HLD | `2d241c8c-afd2-441b-8631-b927ab895e8b` | |
| s22 LLD | `629eb9c2-5d63-4d47-9aa8-a08aad7e1772` | |
| s22 Offline flow | `91690f45-e706-487c-a99b-6cc4a3aaffa0` | |
| s32 HLD (KYC v2) | `e5cc893f-5e1d-4f67-89a8-218c55e1be7f` | |
| s32 LLD | `2539e4b6-9d7c-4e5a-a2bb-0efe22774078` | |

### Buyer Onboarding
BE module: `apis/v1/buyer/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `6793fc7b-ddda-4777-8745-ee976ff1652f` | |
| Engineering doc | `30ff516f-f2b5-4bc5-b6bc-08e9032ccc83` | Buyer Linking |
| s41 PRD | `f56ba42b-7cc8-4c9a-9805-b00ee1ba8744` | |
| s41 HLD | `683f2928-ddb8-465c-8268-d7238d8d3185` | |
| s41 LLD | `1115cb2f-3f9c-462b-8565-03df1e9bd825` | |
| Upcoming PRD (Buyer Onboarding v2) | `2820a827-5522-4418-b59a-b6a2e7d5013c` | |

### Retailer / Supplier Profile
BE module: `apis/v1/retailer/`
> Note: "Retailer" in code = Supplier in business terms

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `28ab1ff6-5e91-4ef7-9c2e-b5294c9367c1` | |
| Engineering doc | `dc3a0aeb-d786-4cbb-9fdb-237a8ed0ab1b` | |

---

## Access Control & RBAC
BE module: `apis/v1/access_control/`
FE page: `apps/farmart-os/src/page/accessCreation/`

| Layer | Doc ID | Notes |
|---|---|---|
| Engineering doc | `a383e5bb-43c6-435e-849b-d7592cbf6800` | |
| RBAC Design | `236d6718-39f5-4f5e-9bb9-9f23d4388fc1` | |
| Role Level Audit | `871aa1ac-012a-4a10-8f20-43d46f918dcd` | |
| s24 RBAC doc | `6537f925-f5a5-45e0-8971-b4a0edb793ef` | RBAC in Access Creation |
| s24 LLD | `dad9343f-b0e5-452e-b211-0d019f34797e` | |
| s25 PRD (Row Level Security) | `a54c31a0-b742-47f8-b2b9-b764591060ca` | |
| s25 HLD | `b69f69c5-189e-4d98-a6f0-f2ad0667f1ef` | |
| s25 LLD | `98a2d797-7e56-4521-812d-0af21ab10280` | |

---

## Platform & Cross-Cutting

### Notifications
BE module: `apis/v1/notification/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `4fab0e69-a375-4afe-8718-9cb60ed1b2a5` | Notification Center |

### Dashboards
FE page: `apps/farmart-os/src/page/dashboard/`

| Layer | Doc ID | Notes |
|---|---|---|
| Product doc (PO Throughput) | `284b1bd4-880e-4373-9763-462dc9aa038d` | |
| s26 LLD (Dynamic Dashboard) | `de1fbb55-1208-48a3-b0b3-89f517faa99f` | |

### User Tracking
BE module: `apis/v1/user_tracking/`

| Layer | Doc ID | Notes |
|---|---|---|
| Engineering doc | `67a3125e-332f-495d-b98a-de4a0e3f9b00` | |
| Upcoming HLD | `c52c4a1e-b6c3-45c4-bc1e-ccaa9c0647c3` | |

### Change Logs
BE module: cross-cutting

| Layer | Doc ID | Notes |
|---|---|---|
| Engineering doc | `cd9d9ddf-8e89-4a34-8fa7-50f370464c12` | |

### Audit Log
| Layer | Doc ID | Notes |
|---|---|---|
| Upcoming PRD | `c6936f4b-0604-4898-b2b8-3846ff1a8c1a` | |

### Repayments
| Layer | Doc ID | Notes |
|---|---|---|
| Product doc | `b94289df-628a-41d1-9b4a-55b6e5881445` | |
| Engineering doc | `00d000e5-253c-4c1e-b598-37eebf4be089` | |
