# Artifact Lineage Architecture

## Purpose

Artifact lineage connects APDOS work products into a traceable delivery chain. The initial lineage model lives in `packages/core/artifacts/src/lineage` and is intentionally limited to artifact relationships, graph traversal, and graph serialization. It does not orchestrate agents, workflows, approvals, or execution.

## Model

Each `BaseArtifact` can reference one or more parents through `parentIds`. The lineage graph indexes those relationships in both directions:

- parent to children
- child to parents

This supports the canonical APDOS delivery chain:

```text
Idea
  -> Discovery Report
  -> PRD
  -> Tech Spec
  -> Release Package
```

## API

`ArtifactLineageGraph` provides:

- `linkParentToChild(parentId, childId)`
- `getParents(artifactId)`
- `getChildren(artifactId)`
- `getAncestors(artifactId)`
- `getDescendants(artifactId)`
- `toModel()`

Existing helper functions remain available for callers that want stateless traversal over an artifact array:

- `getParents(artifactId, artifacts)`
- `getChildren(artifactId, artifacts)`
- `getAncestors(artifactId, artifacts)`
- `getAncestorIds(artifactId, artifacts)`
- `getDescendants(artifactId, artifacts)`
- `getDescendantIds(artifactId, artifacts)`

## Success Criteria

A `RELEASE_PACKAGE` can trace back to its originating `IDEA` by calling:

```ts
const graph = new ArtifactLineageGraph(artifacts);
const originatingIdea = graph
  .getAncestors("release-package-id")
  .find((artifact) => artifact.type === ArtifactType.IDEA);
```

## Boundaries

The lineage graph is an in-memory domain model. It validates relationship existence inside the graph, but it does not persist changes, run workflows, or enforce governance. Persistence should happen through the Artifact Engine registry or a future storage adapter.

