# Artifact Event Bus Architecture

## Purpose

The Artifact Event Bus allows APDOS Artifact Engine events to be emitted and consumed without coupling artifact producers to artifact consumers. It is part of `packages/artifacts/src/events`.

## Event Contracts

The initial event contracts are:

- `ArtifactCreated`
- `ArtifactUpdated`
- `ArtifactApproved`
- `ArtifactRejected`
- `ArtifactArchived`

Every event includes:

- `id`
- `artifactId`
- `type`
- `occurredAt`
- `actorId`
- `payload`

The payload includes the current artifact and can optionally include a previous artifact, changed fields, or a reason.

## Publisher And Subscriber

`ArtifactEventPublisher` emits events.

`ArtifactEventSubscriber` consumes events through:

```ts
handle(event: ArtifactEvent): void | Promise<void>;
```

`ArtifactEventBus` combines publishing, subscribing, and event history.

## In-Memory Implementation

`InMemoryArtifactEventBus` supports:

- publishing artifact events
- global subscribers for all events
- event-specific subscribers
- unsubscribe callbacks
- in-memory event history

This implementation is intentionally non-durable. Future persistent or broker-backed implementations should satisfy the same interfaces.

## Boundary

The event bus emits and delivers artifact events. It does not implement orchestration, workflow routing, retries, governance decisions, or external message delivery.

