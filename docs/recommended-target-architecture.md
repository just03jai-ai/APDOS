# APDOS-001 Platform Audit: Recommended Target Architecture

Date: 2026-06-03

## Architecture Goal

APDOS should be structured as an agentic platform with explicit boundaries between agents, workflows, artifacts, governance, execution, and persistence. The current repository is empty, so this target structure is a recommended baseline for future development rather than a refactor plan.

## Proposed Repository Structure

```text
APDOS/
  README.md
  docs/
    architecture.md
    governance.md
    workflows.md
    artifacts.md
  src/
    agents/
    workflows/
    artifacts/
    governance/
    execution/
    persistence/
    shared/
  tests/
    agents/
    workflows/
    artifacts/
    governance/
    execution/
    persistence/
  config/
  scripts/
```

## Target Modules

### Finding: `src/agents`

- location: Proposed `src/agents`.
- purpose: Holds agent definitions, manifests, capability declarations, and agent-specific orchestration adapters.
- dependencies: `src/workflows`, `src/governance`, `src/execution`, `src/artifacts`, `src/shared`.
- risks: Agents may duplicate responsibilities if the registry is weak or if agents call execution tools directly.
- recommendation: Implement an agent registry and require every agent to declare purpose, inputs, outputs, dependencies, permissions, and prohibited responsibilities.

### Finding: `src/workflows`

- location: Proposed `src/workflows`.
- purpose: Holds workflow definitions, lifecycle state machines, orchestration logic, and workflow contracts.
- dependencies: `src/agents`, `src/governance`, `src/execution`, `src/artifacts`, `src/persistence`.
- risks: Workflows can become procedural scripts if schemas and lifecycle states are not enforced.
- recommendation: Use typed workflow definitions with explicit states, transitions, approval gates, retry policy, expected artifacts, and completion criteria.

### Finding: `src/artifacts`

- location: Proposed `src/artifacts`.
- purpose: Defines artifact types, metadata, lifecycle states, validation, ownership, and retention rules.
- dependencies: `src/persistence`, `src/governance`, `src/shared`.
- risks: Artifact behavior may spread across workflows and storage code without a central model.
- recommendation: Create a canonical artifact schema and lifecycle service. Require artifact references in workflow outputs and audit events.

### Finding: `src/governance`

- location: Proposed `src/governance`.
- purpose: Centralizes policies, approval gates, risk classification, permission evaluation, compliance rules, and audit decisions.
- dependencies: `src/artifacts`, `src/persistence`, `src/shared`.
- risks: Governance can become advisory instead of enforceable if execution does not depend on it.
- recommendation: Make governance checks mandatory before side-effecting execution and high-risk workflow transitions.

### Finding: `src/execution`

- location: Proposed `src/execution`.
- purpose: Provides command execution, tool adapters, runtime context, failure handling, retries, and evidence emission.
- dependencies: `src/governance`, `src/artifacts`, `src/persistence`, `src/shared`.
- risks: Direct tool access from agents or workflows can bypass policy and observability.
- recommendation: Expose a narrow execution API. Record every side-effecting action as an auditable event linked to workflow and artifact IDs.

### Finding: `src/persistence`

- location: Proposed `src/persistence`.
- purpose: Stores workflow state, artifacts, run history, governance decisions, configuration, and audit logs.
- dependencies: `src/shared`.
- risks: Choosing a database before defining domain contracts can lock APDOS into the wrong persistence model.
- recommendation: Start with repository interfaces and a local file or SQLite adapter. Add production adapters after the domain model stabilizes.

### Finding: `src/shared`

- location: Proposed `src/shared`.
- purpose: Holds shared types, identifiers, errors, time utilities, validation helpers, and cross-module primitives.
- dependencies: None beyond standard runtime libraries.
- risks: Shared modules can become a dumping ground for business logic.
- recommendation: Keep `shared` limited to low-level primitives. Domain behavior should remain in the owning module.

### Finding: `tests`

- location: Proposed `tests`.
- purpose: Validates contracts and behavior for agents, workflows, artifacts, governance, execution, and persistence.
- dependencies: Runtime test framework and module interfaces.
- risks: Without tests, governance and execution bugs may appear only during live workflows.
- recommendation: Add contract tests for every module boundary and integration tests for complete workflow runs.

### Finding: `docs`

- location: Proposed `docs`.
- purpose: Documents platform concepts, architecture, workflow lifecycle, governance model, and artifact lifecycle.
- dependencies: Source module contracts and accepted architecture decisions.
- risks: Documentation can drift if not tied to module contracts and tests.
- recommendation: Keep documentation concise and update it with every architecture decision or module contract change.

### Finding: `config`

- location: Proposed `config`.
- purpose: Holds environment-specific configuration, policy settings, and runtime defaults.
- dependencies: `src/governance`, `src/execution`, `src/persistence`.
- risks: Configuration may expose secrets or bypass policy if unmanaged.
- recommendation: Separate checked-in defaults from secrets. Validate configuration at startup.

### Finding: `scripts`

- location: Proposed `scripts`.
- purpose: Provides repository maintenance commands, audit helpers, local setup, and developer automation.
- dependencies: Project runtime and package manager.
- risks: Scripts can bypass platform interfaces if they perform production-like operations directly.
- recommendation: Keep scripts for development and maintenance only. Route platform behavior through source modules.

## Recommended Layering

### Finding: Domain Boundaries Should Be Enforced

- location: Proposed `src`.
- purpose: Layering prevents agents, workflows, governance, execution, and persistence from becoming mutually coupled.
- dependencies: Module interfaces and tests.
- risks: Circular dependencies will make APDOS difficult to evolve.
- recommendation: Use this dependency direction:
  - agents depend on workflow contracts and execution requests.
  - workflows coordinate agents, governance, execution, artifacts, and persistence.
  - execution depends on governance approval and emits artifacts/evidence.
  - governance reads policy and persistence but does not perform execution.
  - persistence stores domain records and should not contain business logic.

## Recommended First Implementation Milestones

### Finding: Platform Foundation Should Precede Feature Work

- location: Proposed repository root and `src`.
- purpose: A stable foundation reduces rework when adding agents and workflows.
- dependencies: Chosen runtime, package manager, test framework, and target module layout.
- risks: Starting with feature agents before platform contracts may create duplicated behavior and weak governance.
- recommendation: Implement in this order:
  - repository initialization and documentation.
  - shared identifiers and schemas.
  - artifact model.
  - governance policy model.
  - persistence interfaces and local adapter.
  - execution interface.
  - workflow runner.
  - initial agent registry and baseline agents.

