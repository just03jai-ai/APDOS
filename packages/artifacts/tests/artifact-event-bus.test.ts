import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ArtifactEventType,
  ArtifactType,
  InMemoryArtifactEventBus,
  type ArtifactEvent,
  type BaseArtifact
} from "../src/index.js";

function buildArtifact(overrides: Partial<BaseArtifact> = {}): BaseArtifact {
  return {
    id: "artifact-1",
    type: ArtifactType.IDEA,
    title: "New delivery workflow",
    description: "Initial idea for an APDOS delivery workflow.",
    parentIds: [],
    createdBy: "user-1",
    createdAt: "2026-06-03T00:00:00.000Z",
    version: 1,
    status: "draft",
    metadata: {},
    ...overrides
  };
}

describe("InMemoryArtifactEventBus", () => {
  it("emits and consumes artifact events", async () => {
    const bus = new InMemoryArtifactEventBus();
    const consumed: ArtifactEvent[] = [];

    bus.subscribe({
      handle(event) {
        consumed.push(event);
      }
    });

    const artifact = buildArtifact();
    const emitted = await bus.publish({
      artifactId: artifact.id,
      type: ArtifactEventType.ARTIFACT_CREATED,
      actorId: artifact.createdBy,
      payload: { artifact }
    });

    assert.equal(emitted.type, ArtifactEventType.ARTIFACT_CREATED);
    assert.equal(consumed.length, 1);
    assert.equal(consumed[0].artifactId, artifact.id);
    assert.equal(consumed[0].payload.artifact.title, artifact.title);
  });

  it("notifies event-specific subscribers only for matching event types", async () => {
    const bus = new InMemoryArtifactEventBus();
    const approvedEvents: ArtifactEvent[] = [];

    bus.subscribeTo(ArtifactEventType.ARTIFACT_APPROVED, {
      handle(event) {
        approvedEvents.push(event);
      }
    });

    const artifact = buildArtifact({ status: "approved" });

    await bus.publish({
      artifactId: artifact.id,
      type: ArtifactEventType.ARTIFACT_UPDATED,
      actorId: "reviewer-1",
      payload: { artifact }
    });

    await bus.publish({
      artifactId: artifact.id,
      type: ArtifactEventType.ARTIFACT_APPROVED,
      actorId: "reviewer-1",
      payload: { artifact }
    });

    assert.equal(approvedEvents.length, 1);
    assert.equal(approvedEvents[0].type, ArtifactEventType.ARTIFACT_APPROVED);
  });

  it("supports unsubscribe", async () => {
    const bus = new InMemoryArtifactEventBus();
    let consumedCount = 0;
    const artifact = buildArtifact();

    const unsubscribe = bus.subscribe({
      handle() {
        consumedCount += 1;
      }
    });

    await bus.publish({
      artifactId: artifact.id,
      type: ArtifactEventType.ARTIFACT_CREATED,
      actorId: artifact.createdBy,
      payload: { artifact }
    });

    unsubscribe();

    await bus.publish({
      artifactId: artifact.id,
      type: ArtifactEventType.ARTIFACT_ARCHIVED,
      actorId: "governance-agent",
      payload: {
        artifact: buildArtifact({ status: "archived" }),
        reason: "Superseded by a newer release package."
      }
    });

    assert.equal(consumedCount, 1);
  });

  it("stores published event history", async () => {
    const bus = new InMemoryArtifactEventBus();
    const artifact = buildArtifact();

    await bus.publish({
      artifactId: artifact.id,
      type: ArtifactEventType.ARTIFACT_CREATED,
      actorId: artifact.createdBy,
      payload: { artifact }
    });

    await bus.publish({
      artifactId: artifact.id,
      type: ArtifactEventType.ARTIFACT_REJECTED,
      actorId: "reviewer-1",
      payload: {
        artifact: buildArtifact({ status: "rejected" }),
        reason: "Missing discovery evidence."
      }
    });

    const history = bus.listEvents();

    assert.equal(history.length, 2);
    assert.deepEqual(
      history.map((event) => event.type),
      [
        ArtifactEventType.ARTIFACT_CREATED,
        ArtifactEventType.ARTIFACT_REJECTED
      ]
    );
  });
});
