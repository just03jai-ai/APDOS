# fmt-farmartos-backend-contributor

Repository-specific contributor skill for `FarMart-Engineering/farmartos-backend`, derived from team conventions and 30+ PR reviews (Jan–Apr 2026).

## Installation

```bash
npx skills add FarMart-Engineering/skills@fmt-farmartos-backend-contributor
```

Or locally during development:

```bash
npx skills add file:./fmt-farmartos-backend-contributor
```

## What This Skill Provides

- **Naming Conventions** — snake_case for all files, variables, params; JSDoc on function signatures
- **Main Service Template** — transaction lifecycle, 80 LOC limit, `log_obj`/`capture_change_logs` in `finally`
- **Common Services** — single function per file, JSDoc, explicit params, error strategy
- **DAL Conventions** — `transaction` + `use_write_replica` params, throw-don't-log, `index.js` exporter
- **Transaction Consistency** — thread `transaction` to all DALs, `afterCommit()` for external side effects
- **Custom Error Classes** — `BusinessError`, `ValidationError`, `NotFoundError`, `GatewayError`
- **Logging Strategy** — `capture_change_logs` (entities), `capture_service_logs` (standalone), auto-logs (external API wrappers)
- **Migrations & Seeders** — symmetric up/down, `bulkInsert`/`bulkDelete`, model-migration constraint sync
- **Security** — no `rejectUnauthorized: false`, coordinate bounds validation, required-param guards
- **Sequelize Gotchas** — `createdAt` vs `created_at`, no `separate: true` on lists, `as` alias matching
- **Testing & TDD** — AAA pattern, 90% coverage threshold, Red-Green-Refactor, jest config
- **Linting** — never disable rules without justification, pre-commit checklist

## When to Use

- Writing any new service, DAL, controller, migration, or seeder in `farmartos-backend`
- Self-reviewing a PR before pushing
- Onboarding to the farmartos-backend codebase
- Debugging production issues related to transactions, logging, or Sequelize

## Quick Example

```javascript
// Main service — the canonical pattern
const create_payment_service = async ({ payment_id, log_obj = {}, transaction = null }) => {
    let service_execution_status = SERVICE_EXECUTION_STATUS.SUCCESS;
    let service_error = '';
    let is_parent_transaction = true;
    let t = transaction;

    try {
        if (!t) { t = await sequelize.transaction(); is_parent_transaction = false; }

        // All DAL calls get transaction: t
        const payment = await fetch_payment_dal({ payment_id, transaction: t });
        if (!payment) throw new NotFoundError(`Payment ${payment_id} not found`);

        if (!is_parent_transaction) await t.commit();
        return { message: 'Success', data: payment };
    } catch (ex) {
        if (!is_parent_transaction && t) await t.rollback();
        service_execution_status = SERVICE_EXECUTION_STATUS.FAILED;
        service_error = JSON.stringify(ex, Object.getOwnPropertyNames(ex));
        error_log(ex);
        throw ex;
    } finally {
        capture_change_logs({ entity_id: payment_id, log_obj, service_error, service_execution_status });
    }
};
```

## Documentation

- **Full Skill**: [SKILL.md](SKILL.md)
- **Contributing Guide**: [CONTRIBUTING.md](../CONTRIBUTING.md)
- **FarMart Backend Repo**: `git@github.com:FarMart-Engineering/farmartos-backend.git`

## Maintainer

FarMart Backend Team — engineering@farmart.co

## License

ISC
