# APDOS Context Engine

The Context Engine selects the smallest relevant package of workflow information for APDOS agents and skills. Agents should not receive the whole platform state; they should receive the artifacts, workflow history, approvals, governance findings, and metadata needed for the current task.

## Why It Exists

APDOS is artifact-centric. As the platform grows, workflows will contain many artifacts, approvals, findings, and history events. Passing all of that to every agent would make execution noisy, expensive, and harder to govern.

The Context Engine is the retrieval boundary between platform state and agent work.

## Retrieval Strategy

`ContextRetrievalService` supports:

- `getWorkflowContext()`
- `getArtifactContext()`
- `getAgentContext()`

The service accepts existing APDOS sources:

- artifact registry
- workflow execution service
- approval service
- governance finding source

It does not own execution and does not mutate workflow, artifact, or approval state.

## Ranking Strategy

Artifacts are ranked deterministically:

1. Direct artifacts requested by the caller
2. Parent artifacts linked to the direct artifacts
3. Artifacts referenced by workflow history
4. Governance findings related to the workflow or included artifacts

Governance findings are ordered by severity first, then creation time.

## Context Limits

The service supports configurable limits:

- `maxArtifacts`
- `maxWorkflowHistoryEvents`
- `maxApprovals`
- `maxGovernanceFindings`

Omitted artifact IDs are recorded in package metadata so callers can see when context was trimmed.

## Future Vector Search

This implementation intentionally avoids embeddings and vector databases. Future retrieval can add vector search as another source before ranking:

1. Resolve deterministic context from workflow and artifact relationships.
2. Query vector indexes for semantically related artifacts or findings.
3. Merge candidates.
4. Rank deterministic references above semantic matches.
5. Apply context limits.

That keeps platform-critical context predictable while allowing semantic expansion later.

## Boundaries

This package does not implement:

- AI execution
- agent execution
- skill execution
- embeddings
- vector databases
- OpenAI
- Anthropic
