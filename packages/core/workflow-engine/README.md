# APDOS Workflow Execution Engine

The Workflow Execution Engine turns APDOS workflow definitions into trackable workflow instances.

APDOS can already plan workflows through the Executive Orchestrator. APDOS-005 adds runtime state management so a workflow can be created, started, advanced through stages, completed, failed, blocked, and inspected through full history.

## Workflow Lifecycle

A workflow instance starts from a workflow definition:

1. `startWorkflow()` creates the instance.
2. The instance is recorded as `PENDING`.
3. The service immediately transitions it to `RUNNING`.
4. Stages are advanced in definition order.
5. The workflow becomes `COMPLETED` when every stage is completed.
6. The workflow becomes `FAILED` when a running stage fails.
7. The workflow becomes `BLOCKED` when a running stage is blocked.

`COMPLETED`, `FAILED`, and `BLOCKED` are terminal states in APDOS-005. Once a workflow reaches one of these states, the execution service rejects further stage transitions.

Supported workflow statuses:

- `PENDING`
- `RUNNING`
- `COMPLETED`
- `FAILED`
- `BLOCKED`

## Stage Lifecycle

Each stage tracks:

- `id`
- `name`
- `status`
- `artifactIds`
- `startedAt`
- `completedAt`

Stages start as `PENDING`, transition to `RUNNING` through `advanceStage()`, and then move to `COMPLETED`, `FAILED`, or `BLOCKED`.

Stages can only be completed, failed, or blocked while they are `RUNNING`. Later stages cannot be advanced until every earlier stage has completed.

Supported stage statuses:

- `PENDING`
- `RUNNING`
- `COMPLETED`
- `FAILED`
- `BLOCKED`

## Execution Model

The execution service is deterministic and state-only:

- `startWorkflow()`
- `advanceStage()`
- `completeStage()`
- `failStage()`
- `blockStage()`
- `getWorkflow()`
- `listWorkflows()`

Stages reference artifact IDs so execution state can be connected back to the Artifact Engine. Every state transition writes a workflow history event.

Each history event records:

- workflow ID
- optional stage ID
- transition type
- previous status
- next status
- related artifact IDs
- optional reason
- transition timestamp

## BLOCKED Behavior

`BLOCKED` currently means the workflow has reached a terminal blocked state. This is intentional for APDOS-005 because there is no unblock or resume command yet.

Future APDOS versions can add a resume strategy by introducing explicit operations such as:

- `unblockStage()`
- `resumeWorkflow()`
- blocked reason resolution metadata
- transition policies that decide whether a blocked workflow can return to `RUNNING`

Until those APIs exist, blocked workflows are preserved for inspection and history review but cannot continue execution.

## Boundaries

This package intentionally does not implement:

- AI execution
- agent execution
- skill execution
- OpenAI
- Anthropic
- LangGraph
