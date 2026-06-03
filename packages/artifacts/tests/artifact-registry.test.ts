import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ArtifactRegistry,
  ArtifactType,
  ArtifactValidationError,
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

describe("ArtifactRegistry", () => {
  it("registers and retrieves artifacts", async () => {
    const registry = new ArtifactRegistry();
    const artifact = buildArtifact();

    await registry.register(artifact);

    assert.deepEqual(await registry.retrieve(artifact.id), artifact);
  });

  it("rejects duplicate artifact ids", async () => {
    const registry = new ArtifactRegistry();
    const artifact = buildArtifact();

    await registry.register(artifact);

    await assert.rejects(
      () => registry.register(artifact),
      /Artifact already exists: artifact-1/
    );
  });

  it("updates artifacts without changing immutable fields", async () => {
    const registry = new ArtifactRegistry();
    const artifact = buildArtifact();

    await registry.register(artifact);
    const updated = await registry.update(
      artifact.id,
      {
        title: "Approved delivery workflow",
        status: "approved",
        version: 2,
        metadata: { approvedBy: "governance-agent" }
      },
      "reviewer-1"
    );

    assert.equal(updated.id, artifact.id);
    assert.equal(updated.createdAt, artifact.createdAt);
    assert.equal(updated.createdBy, artifact.createdBy);
    assert.equal(updated.title, "Approved delivery workflow");
    assert.equal(updated.status, "approved");
    assert.equal(updated.version, 2);
    assert.deepEqual(updated.metadata, { approvedBy: "governance-agent" });
  });

  it("lists artifacts", async () => {
    const registry = new ArtifactRegistry();

    await registry.register(buildArtifact({ id: "artifact-1" }));
    await registry.register(
      buildArtifact({
        id: "artifact-2",
        type: ArtifactType.PRD,
        title: "Artifact Engine PRD"
      })
    );

    const artifacts = await registry.list();

    assert.equal(artifacts.length, 2);
    assert.deepEqual(
      artifacts.map((artifact) => artifact.id),
      ["artifact-1", "artifact-2"]
    );
  });

  it("validates required artifact fields", async () => {
    const registry = new ArtifactRegistry();

    await assert.rejects(
      () => registry.register(buildArtifact({ title: "" })),
      ArtifactValidationError
    );
  });

  it("records registry events", async () => {
    const registry = new ArtifactRegistry();
    const artifact = buildArtifact();

    await registry.register(artifact);
    await registry.update(artifact.id, { status: "active" }, "user-2");

    const events = registry.listEvents();
    assert.equal(events.length, 2);
    assert.equal(events[0].type, "ArtifactCreated");
    assert.equal(events[1].type, "ArtifactUpdated");
    assert.equal(events[1].actorId, "user-2");
    assert.equal(events[1].payload.artifact.status, "active");
  });
});
