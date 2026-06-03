# Artifact Lineage And Event Bus Review

## What Was Built

This milestone extended the Artifact Engine with lineage and event bus capabilities.

Artifact Lineage:

- `ArtifactLineageGraph`
- `linkParentToChild(parentId, childId)`
- `getParents()`
- `getChildren()`
- `getAncestors()`
- `getDescendants()`
- graph serialization through `toModel()`

Artifact Event Bus:

- `ArtifactCreated`
- `ArtifactUpdated`
- `ArtifactApproved`
- `ArtifactRejected`
- `ArtifactArchived`
- publisher interface
- subscriber interface
- in-memory event bus
- event history

Documentation was added for both architecture areas.

## Architecture

Lineage is implemented as an in-memory graph model over `BaseArtifact.parentIds`. It indexes relationships in both directions:

- parent to children
- child to parents

The event bus is implemented as a local in-memory publisher/subscriber system. It supports:

- global subscribers
- event-specific subscribers
- unsubscribe callbacks
- emitted event history

Both systems are foundation components. They do not implement orchestration, governance, durable delivery, or actual execution.

## Interfaces

Lineage interfaces:

- `ArtifactLineageGraph`
- `ArtifactLineageNode`
- `ArtifactLineageGraphModel`

Lineage methods:

- `addArtifact(artifact)`
- `linkParentToChild(parentId, childId)`
- `getParents(artifactId)`
- `getChildren(artifactId)`
- `getAncestors(artifactId)`
- `getDescendants(artifactId)`
- `toModel()`

Event interfaces:

- `ArtifactEvent`
- `ArtifactEventPayload`
- `ArtifactDomainEvent`
- `ArtifactEventPublisher`
- `ArtifactEventSubscriber`
- `ArtifactEventBus`

Event bus implementation:

- `InMemoryArtifactEventBus`

## Tests

Lineage tests cover:

- linking parent to child
- graph model generation
- parent, child, ancestor, and descendant traversal
- tracing a `RELEASE_PACKAGE` back to an originating `IDEA`
- compatibility helper functions

Event bus tests cover:

- emitting and consuming events
- event-specific subscription
- unsubscribe behavior
- in-memory event history

Registry tests were updated to assert new event contract names.

## Known Issues

- Lineage graph is in-memory only.
- `linkParentToChild` mutates graph state but does not persist artifact changes.
- No cycle detection exists.
- No durable event delivery exists.
- Event bus has no retry, dead-letter, or backpressure behavior.
- Registry records events internally but is not yet wired to publish through an injected bus.

## Next Steps

- Add cycle detection to lineage.
- Add persistence support for lineage relationships.
- Wire registry lifecycle changes to the event bus.
- Add durable event bus adapter.
- Add approval/rejection/archive registry operations that emit matching events.

