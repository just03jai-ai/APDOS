# APDOS Executive Orchestrator

The Executive Orchestrator converts a business goal into a deterministic workflow plan. APDOS is artifact-centric, so the plan describes the required stages, artifacts, agent responsibilities, and execution order before any agent execution occurs.

This package does not implement AI reasoning, workflow execution, or actual agent invocation.

## Structure

```text
packages/core/orchestrator/
  src/
    planner/     Deterministic workflow planner
    workflows/   Workflow definitions
    contracts/   Public plan contracts
    services/    Executive orchestrator service
    index.ts     Package exports
  tests/         Unit tests
```

## Supported Workflow

`FEATURE_DELIVERY_V1`

Stages:

1. `Discovery`
2. `PRD`
3. `TechSpec`
4. `GovernanceReview`
5. `ReleasePackage`

## Usage

```ts
import { ExecutiveOrchestrator } from "@apdos/orchestrator";

const orchestrator = new ExecutiveOrchestrator();
const plan = orchestrator.createWorkflowPlan({
  goal: "Build supplier payment approval workflow"
});
```

The plan contains:

- `workflowId`
- `stages`
- `requiredArtifacts`
- `requiredAgents`
- execution order through stage `order`

## Boundary

The orchestrator only plans. It does not create artifacts, run agents, enforce governance, or execute workflows. Those responsibilities belong to future APDOS packages and services.
