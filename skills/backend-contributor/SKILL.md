---
name: fmt-farmartos-backend-contributor
description: >
  Contribute safely to FarMart farmartos-backend. Use when writing, changing, testing,
  documenting, or reviewing Node.js code in the farmartos-backend repository, including
  naming conventions, service/DAL/controller structure, transaction management, error
  classes, logging strategy, migrations, RBAC/ABAC access control, security,
  Sequelize gotchas, and TDD.
---

# FarMart farmartos-backend Contributor

Official conventions + patterns derived from 30+ PR reviews (Jan–Apr 2026).
Apply before submitting a PR to avoid the most common review blockers.

## Table of Contents

- [Overview](#overview)
- [When to Use](#when-to-use)
- [Quick Start](#quick-start)
- [1. Naming Conventions](#1-naming-conventions)
- [2. Main Service Template](#2-main-service-template)
- [3. Common Services](#3-common-services)
- [4. DAL Services](#4-dal-services)
- [5. Transaction Consistency](#5-transaction-consistency)
- [6. Custom Error Classes](#6-custom-error-classes)
- [7. Logging Strategy](#7-logging-strategy)
- [8. Migrations & Seeders](#8-migrations--seeders)
- [9. Hardcoded Values & Config](#9-hardcoded-values--config)
- [10. Security](#10-security)
- [11. Access Control](#11-access-control)
- [12. Sequelize Gotchas](#12-sequelize-gotchas)
- [13. Service Architecture](#13-service-architecture)
- [14. Testing & TDD](#14-testing--tdd)
- [15. Linting Rules](#15-linting-rules)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Overview

This skill encodes the **official coding standards** for `FarMart-Engineering/farmartos-backend` — a Node.js/Express backend using Sequelize (MySQL), Mongoose (MongoDB), Jest, and FarMart's internal libraries (`capture_change_logs`, `capture_service_logs`, `chronolog`, custom error classes).

It covers:
- **Naming** — snake_case everywhere, JSDoc on all function params
- **Service architecture** — main service template, common services, transaction ownership pattern
- **DAL conventions** — explicit params, `use_write_replica`, `index.js` exporter, throw-don't-log
- **Error handling** — custom error classes (`BusinessError`, `ValidationError`, `NotFoundError`, `GatewayError`)
- **Logging** — three-tier strategy: change logs, service logs, auto-captured external API logs
- **Migrations & seeders** — symmetric up/down, `bulkInsert`/`bulkDelete`, model-migration constraint sync
- **Access control** — policy-based ACL, optional role gates, ABAC attributes, permission seeders
- **Security** — no `rejectUnauthorized: false`, proper input validation
- **Testing & TDD** — AAA pattern, 90% coverage threshold, Red-Green-Refactor

Guidelines are reinforced by patterns from 30+ PR reviews (Jan–Apr 2026).

---

## When to Use

Invoke this skill when:
- Writing a new service, DAL, controller, migration, or seeder in `farmartos-backend`
- Reviewing a PR or self-reviewing before pushing
- Debugging a production issue related to transactions, logging, or Sequelize behavior
- Onboarding to the farmartos-backend codebase

---

## Quick Start

### New endpoint checklist

When adding a new `POST`/`PATCH`/`PUT`/`DELETE` endpoint:

```
1. Route file       → snake_case, e.g. payment_routes.js
2. Controller       → extract req params, pass log_obj: req.change_logs to service
3. Service          → use Main Service Template (transaction + capture_change_logs in finally)
4. DAL              → throw on error, accept transaction + use_write_replica, scope to is_active: true
5. Access control   → add check_resource_control + endpoint/permission mappings unless public
6. Migration        → add if schema changes; sync model constraints with DB
7. Tests            → AAA pattern, mock DALs, 90% branch/line coverage
8. Lint             → npm run lint must pass with zero errors
```

### New service — minimal skeleton

```javascript
const sequelize = require('../../database/db_connection_initializer');
const { SERVICE_EXECUTION_STATUS } = require('../../enums/service_execution_status');
const { capture_change_logs } = require('../../common_services/capture_change_logs');
const error_log = require('../../middelware/error_log');
const { BusinessError, NotFoundError } = require('../../errors/custom_errors');

const create_something_service = async ({ entity_id, log_obj = {}, transaction = null }) => {
    let service_execution_status = SERVICE_EXECUTION_STATUS.SUCCESS;
    let service_error = '';
    let is_parent_transaction = true;
    let t = transaction;

    try {
        if (!t) { t = await sequelize.transaction(); is_parent_transaction = false; }

        // validate → fetch → transform → write (all with transaction: t)

        if (!is_parent_transaction) await t.commit();
        return { message: 'Created successfully', data: {} };
    } catch (ex) {
        if (!is_parent_transaction && t) await t.rollback();
        service_execution_status = SERVICE_EXECUTION_STATUS.FAILED;
        service_error = JSON.stringify(ex, Object.getOwnPropertyNames(ex));
        error_log(ex);
        throw ex;
    } finally {
        capture_change_logs({ entity_id, log_obj, service_error, service_execution_status });
    }
};

module.exports = { create_something_service };
```

### New DAL — minimal skeleton

```javascript
const fetch_something_by_id_dal = async ({ entity_id, transaction = null, use_write_replica = false }) => {
    if (!entity_id) throw new Error('entity_id is required');
    return something_model.findOne({
        where: { id: entity_id, is_active: true },
        transaction,
        useMaster: !use_write_replica
    });
};

module.exports = { fetch_something_by_id_dal };
```

---

## 1. Naming Conventions

All names must be **descriptive and meaningful**. Abbreviations are only acceptable for universally understood terms (`id`, `url`, `dal`).

### Files

| Artifact | Convention | Example |
|----------|-----------|---------|
| Route file | snake_case | `purchase_order_routes.js` |
| Controller | snake_case | `create_purchase_order_controller.js` |
| Service | snake_case | `auto_create_cn_for_po_service.js` |
| DAL | snake_case | `fetch_invoice_by_id_dal.js` |
| Enum | snake_case | `buyer_order_completion_request.js` |
| Migration | snake_case with timestamp | `20260423120000-add_auto_create_cn_to_buyer_details.js` |

### Variables & Parameters

Use **snake_case** for all variables, function parameters, and object keys.

```javascript
// ✅ Correct
let first_name = 'John';
let last_name = 'Doe';
const buyer_order_id = req.params.id;

// ❌ Wrong
let firstName = 'John';
let buyerOrderId = req.params.id;
```

### Objects — Add JSDoc comments for all properties

```javascript
/**
 * @param {Object} params
 * @param {number} params.po_id - Purchase order ID
 * @param {number} params.user_profile_id - Acting user's profile ID
 * @param {Object} [params.log_obj={}] - Change log object from middleware
 * @param {Object} [params.transaction=null] - Sequelize transaction
 */
const update_deduction_info_service = async ({ po_id, user_profile_id, log_obj = {}, transaction = null }) => { ... };
```

---

## 2. Main Service Template

Every **main service** (used for `POST`, `PATCH`, `PUT`, `DELETE` operations) must follow this structure.

**Rules:**
- Each function must not exceed **120 lines of code**
- Extract helpers to `./utilities/<service_name>_helper_function.js`
- All write services must accept `log_obj` and call `capture_change_logs` in `finally`
- Services return a resolved object `{ message, data }` on success and throw on error
- Always manage the transaction lifecycle with the `is_parent_transaction` pattern

```javascript
const sequelize = require('../../database/db_connection_initializer');
const { SERVICE_EXECUTION_STATUS } = require('../../enums/service_execution_status');
const { capture_change_logs } = require('../../common_services/capture_change_logs');
const { BusinessError } = require('../../errors/custom_errors');
const error_log = require('../../middelware/error_log');

/**
 * @param {Object} params
 * @param {number} params.buyer_order_id - The buyer order to process
 * @param {Object} [params.log_obj={}] - Change log object from req.change_logs
 * @param {Object} [params.transaction=null] - Optional parent transaction
 */
const service_name = async ({
    buyer_order_id,
    log_obj = {},
    transaction = null
}) => {
    let service_execution_status = SERVICE_EXECUTION_STATUS.SUCCESS;
    let service_error = '';
    let is_parent_transaction = true;
    let t = transaction;

    try {
        // If no transaction is provided, create one and own it
        if (!t) {
            t = await sequelize.transaction();
            is_parent_transaction = false;
        }

        // Business validations using custom error classes
        if (!buyer_order_id) throw new BusinessError('buyer_order_id is required');

        // DAL calls — always pass transaction
        const order = await fetch_buyer_order_dal({ buyer_order_id, transaction: t });
        if (!order) throw new NotFoundError(`Buyer order ${buyer_order_id} not found`);

        // ... business logic (extract helpers if > 80 LOC) ...
        const response = generate_response(order);

        // Commit only if this service owns the transaction
        if (!is_parent_transaction) await t.commit();

        return { message: 'Operation successful', data: response };
    } catch (ex) {
        // Rollback only if this service owns the transaction
        if (!is_parent_transaction && t) await t.rollback();

        service_execution_status = SERVICE_EXECUTION_STATUS.FAILED;
        service_error = JSON.stringify(ex, Object.getOwnPropertyNames(ex));
        error_log(ex);
        throw ex;
    } finally {
        capture_change_logs({
            entity_id: buyer_order_id,
            log_obj,
            service_error,
            service_execution_status
        });
    }
};

module.exports = { service_name };
```

### Controller wiring

```javascript
// ✅ Always pass req.change_logs as log_obj for data updation flows not in fetch apis
const result = await service_name({
    buyer_order_id: req.body.buyer_order_id,
    log_obj: req.change_logs
});
res.status(200).json(result);
```

---

## 3. Common Services

Common services are **reusable business logic utilities** that combine multiple DALs and contain business rules/validations. They are shared across modules.

### Conventions

- **snake_case** filenames and exported function names
- Export a **single function per file** (unless strongly related)
- Accept only **required params** — no generic `options` objects
- Always add **JSDoc comments** (purpose, params, return value)
- Error strategy: catch and return `null`/`false` for non-critical paths; throw for critical ones

### Template

```javascript
const error_log = require('../../middelware/error_log');
const round_off_to_two_decimal = require('../../apis/v1/utilities/round_off/round_off_to_two_decimal');
const purchase_crop_bill_component_enum = require('../../enums/market_linkage/enums/purchase_crop_bill_component_enum');
const { get_all_procurement_order_bill_component_detail } = require('../../data_abstraction_layer/procurement_order_bill_components/get_procurement_order_bill_component_detail');
const { get_po_and_order_delivery_details } = require('../../data_abstraction_layer/purchase_order/get_po_and_order_delivery_details');

/**
 * Calculates the payment sub-total for a purchase order
 * @param {Object} params
 * @param {number} params.po_id - Purchase order ID
 * @returns {Promise<number|null>} Sub-total amount, or null on error
 */
const get_payment_sub_total = async ({ po_id }) => {
    try {
        const purchase_order = await get_po_and_order_delivery_details({ po_id });
        const bill_components = await get_all_procurement_order_bill_component_detail({
            lot_id: purchase_order?.procurement_lot_id
        });

        const commodity_cost = round_off_to_two_decimal(
            (purchase_order.price ?? null) * (purchase_order.order_delivery_detail.net_weight / 100)
        );
        const retailer_commission = round_off_to_two_decimal(
            (bill_components.find(bc => bc.order_bill_component_id === purchase_crop_bill_component_enum.retailer_commission)?.amount ?? null)
            * (purchase_order.order_delivery_detail.net_weight / 100)
        );

        return round_off_to_two_decimal(commodity_cost + retailer_commission);
    } catch (err) {
        error_log(err);
        return null; // non-critical — caller handles null
    }
};

module.exports = { get_payment_sub_total };
```

### ❌ DON'T

- Don't deeply nest common service calls (keep it readable)
- Don't hide errors silently — either return a safe fallback OR throw
- Don't import more than is needed

---

## 4. DAL Services

DALs are the **only** place that directly accesses Sequelize/Mongoose models.

### General Conventions

- Every DAL accepts a `transaction` parameter (default: `null`)
- Every fetch DAL accepts a `use_write_replica` parameter (default: `false`) — pass `useMaster: !use_write_replica` to Sequelize
- Take **explicit params** for `where` clauses — never accept a generic `{ where: {} }` object
- **Do NOT use `error_log` inside DALs** — always throw and let the service handle it
- Validate required inputs at the top of the function

### Fetch DAL

```javascript
/**
 * Fetch a single trade sauda by ID
 * @param {Object} params
 * @param {number} params.trade_sauda_id
 * @param {Object} [params.transaction=null]
 * @param {boolean} [params.use_write_replica=false]
 * @returns {Promise<Object|null>}
 */
const fetch_trade_sauda_by_id = async ({ trade_sauda_id, transaction = null, use_write_replica = false }) => {
    if (!trade_sauda_id) throw new Error('trade_sauda_id is required');

    return trade_sauda.findOne({
        where: { id: trade_sauda_id, is_active: true },
        transaction,
        useMaster: !use_write_replica
    });
};
```

### Update DAL

```javascript
/**
 * Update status for margins
 * @param {Object} params
 * @param {string} params.status - New status
 * @param {number} [params.buyer_order_id] - Filter by buyer order
 * @param {number[]} [params.margin_ids] - Filter by margin IDs
 * @param {Object} [params.transaction=null]
 * @returns {Promise<number>} Number of updated rows
 */
const update_margins_status_dal = async ({ status, buyer_order_id = null, margin_ids = null, transaction = null }) => {
    const where_clause = { is_active: true };

    if (buyer_order_id) where_clause.buyer_order_id = buyer_order_id;
    if (margin_ids?.length) where_clause.id = { [Op.in]: margin_ids };

    if (!buyer_order_id && !margin_ids) {
        throw new ValidationError('At least one of buyer_order_id or margin_ids is required');
    }

    const result = await po_estimated_margins.update(
        { status },
        { where: where_clause, transaction }
    );

    return result[0]; // number of affected rows
};
```

### Insert DAL

```javascript
// ✅ Take individual params, not a generic data object
const insert_trade_sauda = async ({ buyer_id, crop_id, quantity, transaction = null }) => {
    return trade_sauda.create({ buyer_id, crop_id, quantity }, { transaction });
};
```

### Complex DAL

When a DAL does more than simple CRUD (multiple joins, transformations), give it a descriptive name:

```javascript
// ✅ Name reflects what it does, not just the model
const fetch_online_trade_saudas_with_address_and_buyer = async ({ ... }) => { ... };
```

### Common Exporter (`index.js`)

Every DAL folder **must** have an `index.js` that re-exports all DALs with comments:

```javascript
// data_abstraction_layer/sales_order/index.js
// This file exports all DAL services for the sales order domain

const { upsert_margins_dal, get_margins_dal, update_margins_status_dal } = require('./expected_margin_dal_service');
const so_details_common_dal = require('./so_details_common_dal');
const { fetch_buyer_order_rejection_reasons_dal } = require('./fetch_buyer_order_rejection_reasons_dal');
const { update_so_details_dal } = require('./update_so_details_dal');

module.exports = {
    upsert_margins_dal,          // upsert margins for a buyer order
    get_margins_dal,             // get all margins for a buyer order
    update_margins_status_dal,   // update status for margins
    so_details_common_dal,       // get full sales order details
    fetch_buyer_order_rejection_reasons_dal, // get rejection reasons
    update_so_details_dal        // update sales order details
};
```

### DAL — ✅ DO / ❌ DON'T summary

```javascript
// ✅ Filter in DB, not in JavaScript
const buyer = await buyer_detail.findOne({
    where: { id: buyer_id, auto_create_cn: true },
    transaction
});

// ❌ Don't filter in JS after fetching all
const buyers = await buyer_detail.findAll({ where: { id: buyer_id } });
const buyer = buyers.find(b => b.auto_create_cn); // wasteful

// ✅ Always scope writes to is_active: true
await buyer_groups.update({ kyc_cin_id }, { where: { id: group_id, is_active: true }, transaction });

// ✅ Non-mutating attributes array
query.attributes = [...new Set([...attributes, 'id'])];

// ✅ Consistent return type — always throw on error, never return mixed types
// ❌ Don't return { status: false } sometimes and an array other times
```

---

## 5. Transaction Consistency

The #1 PR review blocker — incorrect transaction propagation breaks atomicity and creates production bugs.

### ✅ DO

**Thread `transaction` through every DAL call in a service that owns or participates in a transaction.**

```javascript
// ✅ All DB calls in this service receive the same transaction
const invoice = await fetch_invoice_dal({ po_id, transaction: t });
await update_deduction_dal({ po_id, transaction: t });
await auto_create_cn_for_po_service({ po_id, transaction: t });
```

**Defer external side-effects to after commit using `transaction.afterCommit()`.**

```javascript
// ✅ Zoho call happens AFTER the DB row is committed — never before
t.afterCommit(async () => {
    await create_zoho_credit_note({ cn_id: cn.id });
});
await t.commit();
```

**Run recomputation services inside the same transaction or explicitly after commit.**

```javascript
// ✅ Recalc sees the same DB snapshot as the rest of the flow
await recalculate_invoice_reconciliation_service({ invoice_id, transaction: t });
```

### ❌ DON'T

```javascript
// ❌ DAL call missing transaction — reads stale/uncommitted data
const buyer = await buyer_detail.findOne({ where: { id: buyer_id } });
// ✅ CORRECT
const buyer = await buyer_detail.findOne({ where: { id: buyer_id }, transaction: t });

// ❌ Zoho called inside uncommitted transaction — external CN survives DB rollback
await create_zoho_credit_note({ cn_id });
await t.commit();

// ❌ Calling a service that doesn't propagate transaction without awareness
const result = await check_all_entities_submitted_service({ invoice_id });
// ✅ CORRECT — extend the service to accept and use transaction
const result = await check_all_entities_submitted_service({ invoice_id, transaction: t });
```

---

## 6. Custom Error Classes

Use custom error classes from `errors/custom_errors.js` to keep status codes consistent and control logging behavior.

### Error Classes

| Class | HTTP Status | Use When |
|-------|-------------|----------|
| `BusinessError` | 400 | A business rule is violated |
| `ValidationError` | 400 | Request data is invalid |
| `NotFoundError` | 404 | A resource is not found |
| `GatewayError` | 502 | An external dependency (API, DB) fails |
| `ServiceUnavailableError` | 503 | Service is temporarily unavailable |

### Logging Rule

- **Do NOT log** `BusinessError`, `ValidationError`, `NotFoundError` — they are expected
- **Always log** `GatewayError`, `ServiceUnavailableError`, and any unhandled error

### Usage

```javascript
const { BusinessError, ValidationError, NotFoundError, GatewayError } = require('../../errors/custom_errors');

// Business rule violation
if (order.status === 'DELIVERED') {
    throw new BusinessError('Order cannot be cancelled after delivery');
}

// Input validation
if (!email.includes('@')) {
    throw new ValidationError('Invalid email format');
}

// Resource not found
const user = await fetch_user_by_id_dal({ user_id });
if (!user) throw new NotFoundError(`User ${user_id} not found`);

// External API failure (log this one)
try {
    await axios.get(third_party_url);
} catch (err) {
    throw new GatewayError('Failed to fetch data from third-party API');
}
```

---

## 7. Logging Strategy

Three logging utilities — use the right one for each context.

### A. Change Logs — Entity-Level (`capture_change_logs`)

Use for **main entities modified by POST/PUT/PATCH/DELETE**. Captures entity ID, status, and error.

```javascript
const { capture_change_logs } = require('../../common_services/capture_change_logs');

// In the finally block of every write service
} finally {
    capture_change_logs({
        entity_id: buyer_order_id,
        service_execution_status, // SUCCESS or FAILED
        service_error,            // stringified error if any
        log_obj                   // passed in from req.change_logs
    });
}
```

### B. Service Logs — Non-Entity Flows (`capture_service_logs`)

Use for **standalone services** that don't map to a single entity: eWay bills, PDFs, payment gateway, cron jobs.

```javascript
const { capture_service_logs } = require('../../common_services/capture_service_logs');

} finally {
    capture_service_logs({
        service_name: 'generate_eway_bill_pdf_service',
        log_type,       // INFO or ERROR
        message,
        additional_info: {
            path: __filename,
            request_data,
            response_data,
            service_started_at
        },
        log_time: new Date(),
        service_execution_status
    });
}
```

> Reference implementation: `generate_eway_bill_pdf_service`

### C. External API Logs — Auto-captured via Wrappers

External calls through `get_request`, `post_request`, `put_request` utilities are **automatically logged** to `external_API_log`. Never add manual logging for external API calls.

```javascript
// ✅ Logs are captured automatically by the wrapper
const post_request_service = require('../../utilities/external_API_calls/post_request');
await post_request_service(api_url, payload, headers);

// ❌ Don't bypass the wrapper to call axios directly
await axios.post(api_url, payload, { headers }); // no auto-log
```

### Logging — ✅ DO / ❌ DON'T

```javascript
// ✅ Pass the Error object to error_log (not a string)
error_log(error);

// ❌ String is logged as "Unknown error" — message is lost
error_log('No recipient emails found');
// ✅ CORRECT
error_log(new Error('No recipient emails found'));

// ✅ Include contextual IDs in every error log
error_log({ message: 'Failed to send fraud alert', po_id, error });

// ✅ Do NOT log BusinessError/ValidationError/NotFoundError — they are expected
// ✅ DO log GatewayError and unhandled exceptions

// ✅ In migration down paths — only suppress expected errors
} catch (error) {
    if (!/does not exist|unknown column|no such column/i.test(error?.message || '')) {
        throw error;
    }
}
```

---

## 8. Migrations & Seeders

### ✅ DO

**Sync Sequelize model constraints with the DB migration.**

```javascript
// migration adds: allowNull: false → model must match
is_auto_created: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
}
```

**Add a migration whenever you add a new Sequelize model/table.**

```javascript
// ✅ New model batch_dn_docs → create migration
// migrations/20260423-create_batch_dn_docs.js
```

**Use `bulkInsert`/`bulkDelete` in seeders.**

```javascript
await queryInterface.bulkInsert('settings', [{ name: 'ALERT_USER_IDS', value: '104,105' }]);
await queryInterface.bulkDelete('settings', { name: 'ALERT_USER_IDS' }, {});
```

**Derive environment from `process.env.NODE_ENV` in seeders.**

```javascript
const ENV_VALUES = { production: '104,105,125', staging: '5026', development: '901' };
const env = process.env.NODE_ENV;
if (!ENV_VALUES[env]) throw new Error(`Unsupported env: ${env}`);
const value = ENV_VALUES[env];
```

**Make `up` and `down` symmetric — `down` only undoes what `up` created.**

### ❌ DON'T

```javascript
// ❌ Not valid Sequelize seeder API — throws at runtime
await queryInterface.insert('settings', { name: 'X', value: 'Y' });
// ✅ CORRECT
await queryInterface.bulkInsert('settings', [{ name: 'X', value: 'Y' }]);

// ❌ Requires manual edit before each run
const ENV = 'stage'; // CHANGE ME BEFORE RUNNING

// ❌ Silently swallows all rollback failures
} catch (_) { }
// ✅ Only suppress expected "column does not exist" cases
```

---

## 9. Hardcoded Values & Config

### ✅ DO

```javascript
// ✅ From DB settings table (cached)
const setting = await fetch_setting_by_name('EARLY_PAYMENT_ALERT_USER_IDS');
const user_ids = setting?.value?.split(',').map(Number) ?? [];

// ✅ From env var with sane fallback
const ALERT_USER_IDS = (process.env.ALERT_USER_IDS || '104,105,125')
    .split(',').map(Number).filter(Number.isFinite);

// ✅ Centralize shared constants — don't duplicate across files
// constants/payment_alert_config.js
exports.DEFAULT_ALERT_USER_IDS = [104, 105, 125];

// ✅ For frequently changing values — DB settings with caching
const threshold = await get_cached_setting('VEHICLE_FRAUD_WEIGHT_THRESHOLD');
```

### ❌ DON'T

```javascript
// ❌ Same array duplicated across two files — will drift
// early_payment_alert_email_service.js
const ALERT_USER_IDS = [104, 105, 125];
// margin_alert_data_service.js
const MARGIN_ALERT_USER_IDS = [104, 105, 125]; // identical, will diverge
```

---

## 10. Security

### ✅ DO

```javascript
// ✅ Default TLS verification — never set a custom httpsAgent for external services
const response = await axios.post(zoho_url, payload, { headers });

// ✅ Validate coordinate bounds in Joi
latitude: joi.number().min(-90).max(90).required(),
longitude: joi.number().min(-180).max(180).required(),

// ✅ Require ALL identifying params before querying
if (!master_merchant_id || !mobile_number) {
    return res.status(400).json({ message: 'Both master_merchant_id and mobile_number are required' });
}
```

### ❌ DON'T

```javascript
// ❌ MITM attack vector — never ship this
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
await axios.post(url, data, { httpsAgent });
```

---

## 11. Access Control

Backend authorization is the enforcement source of truth. Frontend ability checks
are UX only; never rely on hidden buttons, route guards, or client-side CASL to
protect data or mutations.

Before adding or changing a protected endpoint, read the repo docs and code path:

- `AGENTS.md` for current repo entry guidance when present
- `docs/golden-paths/shared/add-permissions.md`
- `middelware/check_resource_control.js`
- `middelware/validate_abac.js` when request attributes are restricted
- `middelware/authorized_routes.js` only when hard role-gating is needed
- `seeders/*access_control*` and `database/models_v2/access_control/*`
- `../farmartos-frontend` for matching CASL permission entity names

### Required Pattern

Most protected routes use policy-based ACL:

```javascript
const check_resource_control = require('../../../middelware/check_resource_control');
const validate_abac = require('../../../middelware/validate_abac');

router.patch(
    '/so/status',
    check_resource_control,
    validate_abac,
    create_change_log_object({ entity_type: ENTITY_TYPE.SO, log_type: LOG_TYPE.UPDATION }),
    joi_body_validator(so_status_update_schema),
    update_so_status_controller
);
```

`check_resource_control` looks up `endpoint_resources` by full versioned path and
HTTP method, loads endpoint permission mappings, attaches `req.user_permissions`,
and returns 403 when the caller has no matching allowed permission. If
attribute-level restrictions exist, it also attaches `req.incoming_attributes`
for `validate_abac`.

### When Adding An Endpoint

1. Decide if the route is public. Only true auth bypasses belong in
   `config/unauthorized_routes.json`; do not add product APIs there casually.
2. For protected routes, include `check_resource_control` in the route chain.
3. Add `validate_abac` after `check_resource_control` when permissions restrict
   allowed `query`, `body`, or `params` values.
4. Add or update access-control seed data for:
   - `permissions` (`entity`, `action`, `key`)
   - `endpoint_resources` (full versioned `path`, uppercase `method`)
   - `endpoint_permission_mappings` (`endpoint_id`, `permission_id`, optional `incoming_attributes`)
5. Keep permission entity/action/key naming aligned with the frontend ability
   contract in `../farmartos-frontend`.
6. Use `authorize([roles])` from `middelware/authorized_routes.js` only when the
   endpoint must be hard-restricted to roles in addition to policy ACL. Most
   endpoints should not add role gates.
7. If service logic branches on special permissions, pass `req.user_permissions`
   from the controller and use `common_services/access_control/check_user_permission.js`
   or the existing nearby pattern.

### Review Checklist

- [ ] Every non-public endpoint has backend authorization, not just frontend visibility.
- [ ] The endpoint path in `endpoint_resources` matches the mounted route path and version.
- [ ] Permission keys are stable and aligned with frontend ability entity names.
- [ ] A user without the permission gets 403.
- [ ] A user with the intended policy gets 200 or the expected business error.
- [ ] ABAC `incoming_attributes` cover restricted tabs/statuses/params where needed.
- [ ] New role IDs do not collide in `enums/user_profile/user_role.js`.
- [ ] Permission seeders have safe `up` and scoped `down` behavior.

---

## 12. Sequelize Gotchas

### ✅ DO

```javascript
// ✅ Timestamp fields in JS are camelCase (Sequelize maps to snake_case)
const days = get_days_in_month(buyer_order_details.createdAt);

// ✅ Alias when the API contract needs snake_case
attributes: ['id', ['createdAt', 'created_at']]

// ✅ as aliases must match the model association definition exactly
// model: credit_notes.belongsTo(user_profile, { as: 'creator' })
include: [{ model: user_profile, as: 'creator' }]

// ✅ Add timestamps: true to all Mongoose models
const schema = new mongoose.Schema({ ... }, { timestamps: true });
```

### ❌ DON'T

```javascript
// ❌ 'created_at' is not a direct Sequelize attribute — throws runtime error
attributes: ['id', 'created_at']
// ✅ CORRECT
attributes: ['id', 'createdAt']

// ❌ separate: true causes N+1 — one extra query per parent row
completion_request_include.separate = true;
// ✅ Use subquery join or batch fetch keyed by parent IDs

// ❌ Mutating the caller's attributes array
query.attributes.push('id');
// ✅ CORRECT
query.attributes = [...new Set([...attributes, 'id'])];
```

---

## 13. Service Architecture

### ✅ DO

```javascript
// ✅ Single call site — notify in service OR controller, never both
// po_dispatched_service.js
await send_po_status_update_on_sauda({ po_id });
// po_dispatch_controller.js — do NOT repeat this call

// ✅ Guard against empty arrays before services that require at least one element
if (!ALERT_USER_IDS.length) {
    error_log(new Error('No recipient user IDs configured for early payment alert'));
    return;
}
await get_user_profiles({ user_ids: ALERT_USER_IDS });

// ✅ Deterministic ordering — never rely on [0] of an unordered query
const buyer_groups = await fetch_buyer_groups_by_pan({ pan, order: [['created_at', 'ASC']] });
const group = buyer_groups[0];

// ✅ Round floats before monetary comparisons
const po_subtotal_rounded = Math.round(po_subtotal * 100) / 100;
const deductions_rounded = Math.round(deductions * 100) / 100;
if (po_subtotal_rounded === deductions_rounded) { ... }

// ✅ Wrap non-fatal side effects so they don't abort the core flow
try {
    await write_string(redis_key, JSON.stringify(cin_details));
} catch (redis_err) {
    error_log(redis_err);
}
```

### ❌ DON'T

```javascript
// ❌ Non-deterministic group selection
const group_id = buyer_group_with_same_pans?.[0]?.id;

// ❌ Misleading variable name — loads EARLY_PAYMENT setting into MARGIN variable
const MARGIN_CONTRACTION_ALERT_USER_IDS = await fetch_setting('EARLY_PAYMENT_ALERT_USER_IDS');

// ❌ Redis failure aborts the entire CIN verification flow
await write_string(redis_key, JSON.stringify(cin_details));
```

### ⚠️ CRITICAL: Unhandled Promise Rejections (Node 22)

**Node 22 crashes the process on any unhandled Promise rejection.** This caused a prod ECS container crash (May 2026). Never fire-and-forget an async call without `.catch()`.

```javascript
// ❌ Fire-and-forget — crashes the Node 22 process on rejection
some_async_side_effect(data);

// ✅ Always attach a .catch() for non-awaited async calls
some_async_side_effect(data).catch(error_log);

// ✅ Or wrap non-critical side effects with try/catch when awaited
try {
    await some_async_side_effect(data);
} catch (err) {
    error_log(err);
}
```

---

## 14. Testing & TDD

### Folder Structure

Tests and mocks live **inside the feature folder**, not at the root.

```
apis/
└── v1/
    └── purchase_order/
        ├── __mocks__/
        ├── __tests__/
        ├── controllers/
        ├── services/
        └── index.js
```

### Jest Configuration (`package.json`)

```json
"scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watchAll",
    "test:coverage": "jest --coverage"
},
"jest": {
    "collectCoverage": true,
    "collectCoverageFrom": [
        "apis/**/services/**/*.js",
        "!**/node_modules/**",
        "!**/__test__/**",
        "!**/__tests__/**"
    ],
    "coverageThreshold": {
        "./apis/**/services/**/*.js": {
            "branches": 90,
            "functions": 90,
            "lines": 90,
            "statements": 90
        }
    }
}
```

### Test Structure — AAA Pattern

```javascript
describe('auto_expire_trade_service', () => {
    it('returns expected output for valid input', async () => {
        // Arrange
        const input = { log_obj: {} };
        get_trade_prices.mockResolvedValueOnce([{ trade_id: 101 }]);
        update_trade_prices.mockResolvedValueOnce([1]);

        // Act
        const result = await auto_expire_trade_service(input);

        // Assert
        expect(result).toEqual(expect.objectContaining({ count: 1 }));
        expect(update_trade_prices).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.any(Object),
            update_obj: expect.any(Object)
        }));
    });
});
```

### Service Unit Test Rules (mandatory)

1. Use `.test.js` naming only for new tests.
2. Use one top-level `describe` per service function.
3. Use these suite buckets in order:
   - Happy flows
   - Failure cases
   - Edge cases
   - DB layer not available (if applicable)
   - Third-party failure cases (if applicable)
4. Enforce strict AAA comments (`// Arrange`, `// Act`, `// Assert`) in every test.
5. Cover every reachable branch:
   - `if / else if / else`
   - `switch` cases + default
   - guard clauses / early returns
6. Mock all collaborators (DAL, redis, external APIs, helpers, logging).
7. Do not perform real DB/network/filesystem/cache calls in unit tests.
8. For write services with transactions, assert `commit` and `rollback` behavior explicitly.
9. Add negative interaction assertions for short-circuit paths (`not.toHaveBeenCalled`).
10. Keep test inputs isolated per test; do not share mutable fixtures across cases.

### What to Test ✅ / What Not to Test ❌

**✅ Test:**
- Business logic (calculations, validations, rules)
- Service functions (individual units of work)
- Database interactions via mocks (test logic, not actual DB)
- API response formatting

**❌ Do NOT test:**
- Database insertions (no real DB in unit tests)
- Third-party libraries (assume they work)
- Configuration files
- Logs or console output

### TDD Cycle

1. **Red** — Write a failing test for the behavior you want
2. **Green** — Implement the minimal code to pass the test
3. **Refactor** — Improve code while keeping tests green

```javascript
// 1. Red — write failing test first
it('should calculate payment sub-total', async () => {
    fetch_po_details_dal.mockResolvedValue({ price: 100, net_weight: 5000 });
    const result = await get_payment_sub_total({ po_id: 1 });
    expect(result).toBe(5000);
});

// 2. Green — implement minimal code
const get_payment_sub_total = async ({ po_id }) => {
    const po = await fetch_po_details_dal({ po_id });
    return (po.price * po.net_weight) / 100;
};

// 3. Refactor — add rounding, error handling, etc.
```

### Testing — ✅ DO / ❌ DON'T

```javascript
// ✅ One jest.mock per module
jest.mock('../validate_invoice_not_paid_before_cancel_service', () => jest.fn());

// ✅ Cover all required buckets in order
describe('auto_expire_trade_service', () => {
    describe('Happy flows', () => {});
    describe('Failure cases', () => {});
    describe('Edge cases', () => {});
    describe('DB layer not available', () => {});
    describe('Third-party failure cases', () => {});
});

// ✅ Mock return type must match real function behavior
// save_media_stream_file_aws resolves (not rejects) to a string on failure
save_media_stream_file_aws.mockResolvedValue('S3 upload failed: bucket not found');

// ❌ Duplicate jest.mock — second overrides first silently
jest.mock('./validate_service', () => jest.fn().mockResolvedValue(true));
jest.mock('./validate_service', () => jest.fn().mockResolvedValue(false)); // ← bug

// ❌ mockRejectedValue when real impl resolves with error string
save_media_stream_file_aws.mockRejectedValue(new Error('upload failed')); // wrong

// ✅ beforeEach/afterEach for cleanup
beforeEach(() => jest.clearAllMocks());
```

---

## 15. Linting Rules

**This project uses [Biome](https://biomejs.dev/) — not ESLint or Prettier.** Linter compliance is not optional — PRs with lint errors will not be merged.

### Commands

```bash
pnpm lint           # Biome lint check
pnpm format         # Biome format (write)
pnpm check          # Biome lint + format check (use this before committing)
```

### Core Rules

- **Never suppress Biome rules** without a comment explaining why
- Fix all diagnostics — there are no "warnings" in Biome, only errors
- Never add an `.eslintrc` or Prettier config — Biome is the single source of truth

### ✅ DO

```javascript
// ✅ Fix the actual issue instead of suppressing the rule
const result = await some_async_function();

// ✅ If a suppression is truly unavoidable, explain why
// biome-ignore lint/suspicious/noExplicitAny: third-party SDK returns untyped payload
const payload: any = sdk.getPayload();
```

### ❌ DON'T

```javascript
// ❌ Blanket suppression with no explanation
// biome-ignore lint: no reason given

// ❌ Using npm/yarn instead of pnpm
npm run lint   // wrong
yarn lint      // wrong
```

### Pre-commit Check

Before pushing, always run:

```bash
pnpm check      # Biome lint + format
pnpm test       # confirm tests still pass
```

---

## References

- `generate_eway_bill_pdf_service` — canonical `capture_service_logs` pattern
- `apis/v1/ops_support/services/` — canonical `capture_change_logs` in `finally` pattern
- `common_services/auto_invoice/` — transaction propagation patterns
- `errors/custom_errors.js` — all custom error class definitions
- `seeders/development|staging|production/` — environment-specific seeder pattern
- `utilities/external_API_calls/` — wrapper utilities for auto-logging external calls

---

**Version**: 2.2.1
**Last Updated**: 2026-05-27
**Maintainer**: FarMart Backend Team

## Changelog

### v2.2.0 (2026-05-23)
- Fixed `db_connection_initializer` import — correct path + no destructuring (default export)
- Replaced Section 14 ESLint content with Biome (project uses Biome, not ESLint)
- Fixed all `npm run lint`/`npm test` references → `pnpm check`/`pnpm test`
- Added Node 22 unhandled rejection guardrail in Section 12 (prod ECS crash, May 2026)

### v2.2.1 (2026-05-27)
- Replaced generic testing folder examples with code-backed farmartos-backend paths
- Removed placeholder-style guidance and kept service-test examples concrete

### v2.2.0 (2026-05-27)
- Consolidated service unit-testing guidance from the deprecated standalone unit-test skill into this skill
- Added mandatory service unit-test rules: suite bucket order, full reachable-branch coverage, strict AAA comments, and mock coverage requirements
- Standardized new test guidance to `.test.js` naming with `__test__/` placement examples
- Updated Jest coverage ignore examples to include `__test__/`

### v2.1.0 (2026-04-23)
- Added Linting Rules section (never disable without reason, pre-commit checklist, common rules table)

### v2.0.0 (2026-04-23)
- Added Naming Conventions (snake_case for all artifacts, JSDoc for objects)
- Added Main Service Template (transaction lifecycle, 80 LOC limit, log_obj pattern)
- Added Common Services section (purpose, conventions, JSDoc template)
- Added DAL Services section (use_write_replica, explicit params, index.js exporter)
- Added Custom Error Classes (BusinessError, ValidationError, NotFoundError, GatewayError, ServiceUnavailableError)
- Expanded Logging Strategy (3 types: change logs, service logs, external API wrappers)
- Added TDD section (Red-Green-Refactor, jest config, 90% coverage threshold, AAA pattern)

### v1.0.0 (2026-04-23)
- Initial release derived from 30+ PR reviews (Jan–Apr 2026)
