import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ArtifactLineageGraph,
  ArtifactType,
  getAncestorIds,
  getAncestors,
  getChildren,
  getDescendantIds,
  getDescendants,
  getParents,
  type BaseArtifact
} from "../src/index.js";

function buildArtifact(overrides: Partial<BaseArtifact> = {}): BaseArtifact {
  return {
    id: "artifact-1",
    type: ArtifactType.IDEA,
    title: "Artifact",
    description: "Artifact used for lineage testing.",
    parentIds: [],
    createdBy: "user-1",
    createdAt: "2026-06-03T00:00:00.000Z",
    version: 1,
    status: "draft",
    metadata: {},
    ...overrides
  };
}

function buildDeliveryLineage(): BaseArtifact[] {
  return [
    buildArtifact({
      id: "idea-1",
      type: ArtifactType.IDEA,
      title: "AI Product Delivery Operating System"
    }),
    buildArtifact({
      id: "discovery-1",
      type: ArtifactType.DISCOVERY_REPORT,
      title: "Discovery Report",
      parentIds: ["idea-1"]
    }),
    buildArtifact({
      id: "prd-1",
      type: ArtifactType.PRD,
      title: "PRD",
      parentIds: ["discovery-1"]
    }),
    buildArtifact({
      id: "tech-spec-1",
      type: ArtifactType.TECH_SPEC,
      title: "Technical Specification",
      parentIds: ["prd-1"]
    }),
    buildArtifact({
      id: "release-1",
      type: ArtifactType.RELEASE_PACKAGE,
      title: "Release Package",
      parentIds: ["tech-spec-1"]
    })
  ];
}

describe("ArtifactLineageGraph", () => {
  it("links a parent artifact to a child artifact", () => {
    const idea = buildArtifact({ id: "idea-1" });
    const discovery = buildArtifact({
      id: "discovery-1",
      type: ArtifactType.DISCOVERY_REPORT,
      title: "Discovery Report"
    });
    const graph = new ArtifactLineageGraph([idea, discovery]);

    graph.linkParentToChild(idea.id, discovery.id);

    assert.deepEqual(
      graph.getParents(discovery.id).map((artifact) => artifact.id),
      [idea.id]
    );
    assert.deepEqual(
      graph.getChildren(idea.id).map((artifact) => artifact.id),
      [discovery.id]
    );
  });

  it("builds a lineage graph model", () => {
    const graph = new ArtifactLineageGraph(buildDeliveryLineage());

    const model = graph.toModel();
    const ideaNode = model.nodes.find((node) => node.artifact.id === "idea-1");
    const releaseNode = model.nodes.find(
      (node) => node.artifact.id === "release-1"
    );

    assert.equal(model.nodes.length, 5);
    assert.deepEqual(ideaNode?.childIds, ["discovery-1"]);
    assert.deepEqual(releaseNode?.parentIds, ["tech-spec-1"]);
    assert.deepEqual(releaseNode?.childIds, []);
  });

  it("gets parents, children, ancestors, and descendants", () => {
    const artifacts = buildDeliveryLineage();
    const graph = new ArtifactLineageGraph(artifacts);

    assert.deepEqual(
      graph.getParents("prd-1").map((artifact) => artifact.id),
      ["discovery-1"]
    );
    assert.deepEqual(
      graph.getChildren("prd-1").map((artifact) => artifact.id),
      ["tech-spec-1"]
    );
    assert.deepEqual(
      graph.getAncestors("release-1").map((artifact) => artifact.id),
      ["tech-spec-1", "prd-1", "discovery-1", "idea-1"]
    );
    assert.deepEqual(
      graph.getDescendants("idea-1").map((artifact) => artifact.id),
      ["discovery-1", "prd-1", "tech-spec-1", "release-1"]
    );
  });

  it("traces a release package back to its originating idea", () => {
    const graph = new ArtifactLineageGraph(buildDeliveryLineage());

    const originatingIdea = graph
      .getAncestors("release-1")
      .find((artifact) => artifact.type === ArtifactType.IDEA);

    assert.equal(originatingIdea?.id, "idea-1");
    assert.equal(originatingIdea?.title, "AI Product Delivery Operating System");
  });

  it("keeps helper functions available for existing callers", () => {
    const artifacts = buildDeliveryLineage();

    assert.deepEqual(
      getParents("release-1", artifacts).map((artifact) => artifact.id),
      ["tech-spec-1"]
    );
    assert.deepEqual(
      getChildren("idea-1", artifacts).map((artifact) => artifact.id),
      ["discovery-1"]
    );
    assert.deepEqual(getAncestorIds("release-1", artifacts), [
      "tech-spec-1",
      "prd-1",
      "discovery-1",
      "idea-1"
    ]);
    assert.deepEqual(
      getAncestors("release-1", artifacts).map((artifact) => artifact.id),
      ["tech-spec-1", "prd-1", "discovery-1", "idea-1"]
    );
    assert.deepEqual(getDescendantIds("idea-1", artifacts), [
      "discovery-1",
      "prd-1",
      "tech-spec-1",
      "release-1"
    ]);
    assert.deepEqual(
      getDescendants("idea-1", artifacts).map((artifact) => artifact.id),
      ["discovery-1", "prd-1", "tech-spec-1", "release-1"]
    );
  });
});
