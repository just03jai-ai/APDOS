# APDOS Delivery Workflow V1

Delivery Workflow V1 is the first end-to-end APDOS workflow. It transforms a business goal into a governed release package by composing the existing APDOS engines.

## Workflow

```text
Idea
↓
Discovery
↓
PRD
↓
Design
↓
Tech Spec
↓
Engineering
↓
QA
↓
Governance
↓
Validation
↓
Approval
↓
Release Package
```

## Systems Connected

The workflow uses:

- Artifact Engine to create artifacts at every stage
- Workflow Engine to track stage transitions
- Context Engine to retrieve relevant context between stages
- Discovery Agent to generate the `DISCOVERY_REPORT` artifact
- Product Agent to generate the `PRD` artifact
- Design Agent to generate the `DESIGN_PACKAGE` artifact
- Architecture Agent to generate `TECH_SPEC` and `IMPLEMENTATION_PLAN` artifacts
- Engineering Agent to generate `CODE_CHANGE` and `ENGINEERING_PACKAGE` artifacts
- QA Agent to generate `TEST_RESULT` and `QA_PACKAGE` artifacts
- Governance Agent to generate `GOVERNANCE_FINDING` and `GOVERNANCE_PACKAGE` artifacts
- Validation Engine to validate PRD, Tech Spec, and Release Package artifacts
- Approval Engine to require approvals before governed release output

## Execution Model

`DeliveryWorkflowService.run()` starts a workflow, captures the idea, calls the Discovery Agent, Product Agent, Design Agent, Architecture Agent, Engineering Agent, QA Agent, and Governance Agent, validates required artifacts, creates required approvals, and completes the workflow when the release package is created.

The package intentionally uses deterministic Skill Runtime execution. Discovery is handled by `@apdos/discovery-agent`; product requirements are handled by `@apdos/product-agent`; design packaging is handled by `@apdos/design-agent`; architecture is handled by `@apdos/architecture-agent`; engineering packaging is handled by `@apdos/engineering-agent`; QA packaging is handled by `@apdos/qa-agent`; governance packaging is handled by `@apdos/governance-agent`. It does not implement LLM generation or AI reasoning.

## Stage Responsibilities

- Idea: captures the original business goal as an `IDEA` artifact.
- Discovery: calls `DiscoveryAgentService` to analyze the goal and create a `DISCOVERY_REPORT` from the idea.
- PRD: calls `ProductAgentService` to create and validate a `PRD` with required product metadata.
- Design: calls `DesignAgentService` to execute governed design skills and create a prototype-ready `DESIGN_PACKAGE`.
- Tech Spec: calls `ArchitectureAgentService` to create `TECH_SPEC` and `IMPLEMENTATION_PLAN` artifacts, grants deterministic architecture approval, and validates the Tech Spec.
- Engineering: calls `EngineeringAgentService` to execute governed engineering skills and create `CODE_CHANGE` plus `ENGINEERING_PACKAGE` artifacts.
- QA: calls `QaAgentService` to execute governed QA skills and create `TEST_RESULT` and `QA_PACKAGE` artifacts.
- Governance: calls `GovernanceAgentService` to execute governed governance skills and create `GOVERNANCE_FINDING` plus `GOVERNANCE_PACKAGE` artifacts.
- Validation: verifies QA evidence is present before approval and release packaging.
- Approval: opens the approval stage, creates and grants production approval, then completes the stage.
- Release Package: validates and creates the governed `RELEASE_PACKAGE`.

## Integration Architecture

The delivery workflow composes APDOS systems directly:

- `WorkflowExecutionService` owns workflow and stage status transitions.
- `ArtifactRegistry` owns artifact creation and event recording.
- `ContextRetrievalService` retrieves workflow context before stage work.
- `DiscoveryAgentService` owns deterministic discovery analysis and report artifact creation.
- `ProductAgentService` owns PRD artifact creation.
- `DesignAgentService` owns prototype-ready design package creation through governed design skills.
- `ArchitectureAgentService` owns technical specification and implementation plan artifact creation.
- `EngineeringAgentService` owns engineering package creation from governed implementation skills.
- `QaAgentService` owns QA package creation from governed QA skills.
- `GovernanceAgentService` owns approval-ready governance package creation from governed governance skills.
- `ValidatorRegistry` validates PRD, Tech Spec, and Release Package artifacts.
- `ApprovalService` records architecture and production approval gates.

The service returns the completed workflow, artifacts, validation results, approvals, context packages, and traceability records.

## Artifacts Created

The V1 workflow creates:

- `IDEA`
- `DISCOVERY_REPORT`
- `PRD`
- `DESIGN_PACKAGE`
- `TECH_SPEC`
- `IMPLEMENTATION_PLAN`
- `CODE_CHANGE`
- `ENGINEERING_PACKAGE`
- `TEST_RESULT`
- `GOVERNANCE_FINDING`
- `QA_PACKAGE`
- `GOVERNANCE_PACKAGE`
- `RELEASE_PACKAGE`

The engineering stage creates governed `CODE_CHANGE` and `ENGINEERING_PACKAGE` artifacts. The QA stage creates governed `TEST_RESULT` and `QA_PACKAGE` artifacts. The Governance stage creates governed `GOVERNANCE_FINDING` and `GOVERNANCE_PACKAGE` artifacts for approval and release.

## Governance

The workflow validates:

- PRD required fields and idea dependency
- Tech Spec required fields, PRD dependency, and architecture approval
- Release Package required fields, code/test dependencies, and production approval

The release package is created only after the production approval is granted.

Governance decisions control workflow progression:

- `GO` proceeds to the standard production approval gate.
- `CONDITIONAL_GO` blocks the Governance stage and creates a pending production approval.
- `NO_GO` fails the Governance stage and prevents approval and release package creation.

The workflow does not put the workflow engine into terminal `BLOCKED` status because APDOS-005 currently treats `BLOCKED` as terminal. Instead, the approval stage stays running while the deterministic approval gate is created and granted, then the workflow progresses to release package creation.

## Traceability

Every generated artifact includes `parentIds`. The result includes `traceability.records`, which list each artifact's direct parents and ancestors. The release package traces back through the governance package, QA package, engineering package, code/test evidence, tech spec, PRD, discovery, and the original idea.

## Boundaries

This package does not implement:

- AI generation
- OpenAI
- Anthropic
