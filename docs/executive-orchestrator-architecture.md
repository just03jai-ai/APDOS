# Executive Orchestrator Architecture

## Purpose

The Executive Orchestrator turns a business goal into an executable workflow plan. It is the first APDOS planning layer above the Artifact Engine.

## Input

```json
{
  "goal": "Build supplier payment approval workflow"
}
```

## Output

The orchestrator returns a deterministic `WorkflowPlan`:

- `workflowId`
- `workflowType`
- `goal`
- `stages`
- `requiredArtifacts`
- `requiredAgents`

## Workflow Definition

The initial supported workflow is `FEATURE_DELIVERY_V1`.

Execution order:

1. `Discovery`
2. `PRD`
3. `TechSpec`
4. `GovernanceReview`
5. `ReleasePackage`

## Artifact Planning

Stages map to artifact types:

- `Discovery` -> `DISCOVERY_REPORT`
- `PRD` -> `PRD`
- `TechSpec` -> `TECH_SPEC`
- `GovernanceReview` -> `GOVERNANCE_FINDING`
- `ReleasePackage` -> `RELEASE_PACKAGE`

## Agent Planning

Stages map to agent responsibilities:

- `Discovery` -> `DiscoveryAnalysis`
- `PRD` -> `ProductRequirements`
- `TechSpec` -> `TechnicalDesign`
- `GovernanceReview` -> `GovernanceReview`
- `ReleasePackage` -> `ReleasePackaging`

## Boundaries

The orchestrator does not implement AI reasoning or actual agent execution. It only produces the plan that future execution, governance, and artifact services can consume.
