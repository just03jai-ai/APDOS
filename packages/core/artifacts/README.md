# APDOS Artifact Engine

The Artifact Engine is the foundation package for APDOS artifact management. It defines the core artifact model, supported artifact types, validation, registry operations, lineage helpers, storage boundaries, and registry events.

This package intentionally does not implement orchestration. Workflows, agents, approvals, and execution runners should depend on this package later, but they should not live inside it.

## Structure

```text
packages/core/artifacts/
  src/
    schemas/    Artifact validation and schema rules
    registry/   Artifact registry service
    lineage/    Parent/child traversal helpers
    storage/    Persistence interface and in-memory adapter
    events/     Artifact event contracts and in-memory event bus
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
- `ENGINEERING_PACKAGE`
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

## Event Bus

The Artifact Engine defines these event contracts:

- `ArtifactCreated`
- `ArtifactUpdated`
- `ArtifactApproved`
- `ArtifactRejected`
- `ArtifactArchived`

`InMemoryArtifactEventBus` provides the first publisher/subscriber implementation:

- `publish(event)` emits an artifact event.
- `subscribe(subscriber)` receives all artifact events.
- `subscribeTo(eventType, subscriber)` receives only a specific event type.
- `listEvents()` returns emitted event history.

Subscribers implement:

```ts
interface ArtifactEventSubscriber {
  handle(event: ArtifactEvent): void | Promise<void>;
}
```

The in-memory bus is intended for local execution, tests, and future orchestration integration. It does not perform workflow routing or durable delivery.

## Lineage

Artifacts can point to parents through `parentIds`. The lineage helpers support basic graph traversal:

- `ArtifactLineageGraph`
- `linkParentToChild(parentId, childId)`
- `getParents(artifactId)`
- `getChildren(artifactId, artifacts)`
- `getAncestors(artifactId)`
- `getAncestorIds(artifactId, artifacts)`
- `getDescendants(artifactId)`
- `getDescendantIds(artifactId, artifacts)`

The graph model is directional from parent to child:

```text
Idea
  -> Discovery Report
  -> PRD
  -> Tech Spec
  -> Release Package
```

This allows a `RELEASE_PACKAGE` artifact to trace its ancestors back to the originating `IDEA`. The graph is built from artifact `parentIds` and can also be updated in memory with `linkParentToChild` when a new relationship is created.

`ArtifactLineageGraph.toModel()` returns a serializable model containing each artifact node with its `parentIds` and `childIds`. Storage and orchestration remain outside the lineage graph; callers are responsible for persisting updated artifacts through the registry or storage adapter.

## Testing

Run package tests from `packages/core/artifacts`:

```bash
npm test
```

The test command compiles TypeScript and then runs Node's built-in test runner against the compiled tests.
