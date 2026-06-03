# APDOS Approval Engine

The Approval Engine adds human-controlled approval gates to APDOS workflows.

APDOS can plan and execute workflows, but protected stages must not progress without explicit human approval. This package stores approval requests and provides a workflow integration layer that blocks protected stages until the required approval is granted.

## Approval Lifecycle

An approval request starts as `PENDING`.

It can then become:

- `APPROVED`
- `REJECTED`
- `EXPIRED`

Supported approval types:

- `ARCHITECTURE_APPROVAL`
- `IMPLEMENTATION_APPROVAL`
- `MERGE_APPROVAL`
- `PRODUCTION_APPROVAL`

The current APDOS-006 service supports creating, approving, rejecting, retrieving, and listing approvals. Expiration is modeled as a status for future scheduling or policy logic; no timer or background expiration process is implemented.

## Workflow Interaction

`WorkflowApprovalGate` sits between callers and the Workflow Engine for protected stages.

If a stage is not protected, it delegates directly to `advanceStage()`.

If a stage is protected:

1. It checks for an approved matching approval request.
2. If approved, it advances the workflow stage.
3. If not approved, it creates a pending approval request when needed.
4. It blocks the workflow through `blockStage()`.

Blocked workflows are terminal in APDOS-005, so this integration is intentionally conservative: a blocked workflow preserves state and history for human review rather than progressing uncontrolled.

## Governance Model

The Approval Engine records who requested approval, when it was requested, who approved or rejected it, when it was resolved, and any comments.

This package does not decide user identity, permissions, or notification routing. Those belong to future governance, identity, and messaging layers.

## Boundaries

This package intentionally does not implement:

- user management
- authentication
- notifications
- AI execution
- agent execution
- skill execution
