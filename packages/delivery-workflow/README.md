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
Tech Spec
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
- Validation Engine to validate PRD, Tech Spec, and Release Package artifacts
- Approval Engine to require approvals before governed release output

## Execution Model

`DeliveryWorkflowService.run()` starts a workflow, creates deterministic stage outputs, calls the Discovery Agent for the discovery report, validates required artifacts, creates required approvals, and completes the workflow when the release package is created.

The package intentionally uses deterministic outputs. Discovery is handled by `@apdos/discovery-agent`; later stages are still deterministic V1 outputs. It does not implement LLM generation or AI reasoning.

## Stage Responsibilities

- Idea: captures the original business goal as an `IDEA` artifact.
- Discovery: calls `DiscoveryAgentService` to analyze the goal and create a `DISCOVERY_REPORT` from the idea.
- PRD: creates and validates a `PRD` with required product metadata.
- Tech Spec: creates a `TECH_SPEC`, grants deterministic architecture approval, and validates it.
- Validation: creates deterministic `CODE_CHANGE` and `TEST_RESULT` evidence.
- Approval: opens the approval stage, creates and grants production approval, then completes the stage.
- Release Package: validates and creates the governed `RELEASE_PACKAGE`.

## Integration Architecture

The delivery workflow composes APDOS systems directly:

- `WorkflowExecutionService` owns workflow and stage status transitions.
- `ArtifactRegistry` owns artifact creation and event recording.
- `ContextRetrievalService` retrieves workflow context before stage work.
- `DiscoveryAgentService` owns deterministic discovery analysis and report artifact creation.
- `ValidatorRegistry` validates PRD, Tech Spec, and Release Package artifacts.
- `ApprovalService` records architecture and production approval gates.

The service returns the completed workflow, artifacts, validation results, approvals, context packages, and traceability records.

## Artifacts Created

The V1 workflow creates:

- `IDEA`
- `DISCOVERY_REPORT`
- `PRD`
- `TECH_SPEC`
- `CODE_CHANGE`
- `TEST_RESULT`
- `RELEASE_PACKAGE`

The validation stage creates deterministic `CODE_CHANGE` and `TEST_RESULT` evidence so the release package can satisfy dependency validation.

## Governance

The workflow validates:

- PRD required fields and idea dependency
- Tech Spec required fields, PRD dependency, and architecture approval
- Release Package required fields, code/test dependencies, and production approval

The release package is created only after the production approval is granted.

The workflow does not put the workflow engine into terminal `BLOCKED` status because APDOS-005 currently treats `BLOCKED` as terminal. Instead, the approval stage stays running while the deterministic approval gate is created and granted, then the workflow progresses to release package creation.

## Traceability

Every generated artifact includes `parentIds`. The result includes `traceability.records`, which list each artifact's direct parents and ancestors. The release package traces back through code/test evidence, tech spec, PRD, discovery, and the original idea.

## Boundaries

This package does not implement:

- AI generation
- real Product Agent execution
- real Architecture Agent execution
- OpenAI
- Anthropic
