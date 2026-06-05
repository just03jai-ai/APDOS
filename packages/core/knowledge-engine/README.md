# APDOS Knowledge Engine

The Knowledge Engine stores deterministic organizational knowledge for APDOS. It records entities, relationships, decisions, outcomes, and project history without vector databases, embeddings, or LLM retrieval.

## Knowledge Graph

Supported entity types:

- `Artifact`
- `Workflow`
- `Decision`
- `Approval`
- `Agent`
- `Skill`

Supported relationship types:

- `CREATED`
- `APPROVED`
- `GENERATED`
- `DEPENDS_ON`
- `REPLACED`
- `RELATED_TO`

The graph API supports:

- `addEntity()`
- `addRelationship()`
- `getEntity()`
- `getRelatedEntities()`

## Memory Service

The memory layer records decision history and observed outcomes:

- `recordDecision()`
- `recordOutcome()`
- `retrieveHistory()`

Decision records include:

- `id`
- `title`
- `rationale`
- `alternatives`
- `selectedOption`
- `createdAt`

## Retrieval

Retrieval is deterministic and text-based:

- `findSimilarArtifacts()` ranks artifact entities by shared query terms.
- `findSimilarDecisions()` ranks decisions by shared query terms.
- `getProjectHistory()` returns graph entities and decisions for a project.

This keeps behavior stable for tests and local development while preserving the API shape needed for future retrieval backends.

## Future Integration

Future vector or LLM-backed retrieval should be added behind the retrieval service boundary. The graph and memory contracts should remain stable so APDOS agents can continue to record and retrieve organizational knowledge without changing their call sites.
