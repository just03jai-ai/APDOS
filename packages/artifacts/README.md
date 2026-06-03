# APDOS Artifact Engine

The Artifact Engine is the foundation package for APDOS artifact management. It defines the core artifact model, supported artifact types, validation, registry operations, lineage helpers, storage boundaries, and registry events.

This package intentionally does not implement orchestration. Workflows, agents, approvals, and execution runners should depend on this package later, but they should not live inside it.

## Structure

```text
packages/artifacts/
  src/
    schemas/    Artifact validation and schema rules
    registry/   Artifact registry service
    lineage/    Parent/child traversal helpers
    storage/    Persistence interface and in-memory adapter
    events/     Artifact registry event types
    types/      Artifact enums and interfaces
  tests/        Unit tests
```

## Artifact Types

The `ArtifactType` enum currently supports:

- `IDEA`
- `DISCOVERY_REPORT`
- `PRD`
- `TECH_SPEC`
- `IMPLEMENTATION_PLAN`
- `TASK`
- `CODE_CHANGE`
- `TEST_RESULT`
- `GOVERNANCE_FINDING`
- `RELEASE_PACKAGE`

## Base Artifact

Every artifact implements `BaseArtifact`:

```ts
interface BaseArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  description: string;
  parentIds: string[];
  createdBy: string;
  createdAt: string;
  version: number;
  status: ArtifactStatus;
  metadata: Record<string, unknown>;
}
```

## Registry Service

`ArtifactRegistry` provides the initial artifact management API:

- `register(artifact)` validates and stores a new artifact.
- `retrieve(id)` returns an artifact by id.
- `update(id, updates, actorId)` updates mutable artifact fields.
- `list()` returns all artifacts.
- `listEvents()` returns registry events emitted by registration and updates.

The registry depends on the `ArtifactStorage` interface. The package includes `InMemoryArtifactStorage` for local use and tests. Production persistence should be added as a storage adapter without changing registry callers.

## Lineage

Artifacts can point to parents through `parentIds`. The lineage helpers support basic graph traversal:

- `getChildren(artifactId, artifacts)`
- `getAncestorIds(artifactId, artifacts)`
- `getDescendantIds(artifactId, artifacts)`

## Testing

Run package tests from `packages/artifacts`:

```bash
npm test
```

The test command compiles TypeScript and then runs Node's built-in test runner against the compiled tests.
