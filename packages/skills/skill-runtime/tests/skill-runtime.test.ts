import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ArtifactType, type BaseArtifact } from "@apdos/artifacts";
import { createSeededSkillRegistry } from "@apdos/skill-registry";
import {
  SkillLoader,
  SkillRuntimeService,
  SkillVersionResolver
} from "../src/index.js";

describe("SkillRuntimeService", () => {
  it("loads skill definitions from the Skill Registry", () => {
    const registry = createSeededSkillRegistry();
    const loader = new SkillLoader(registry);

    const skill = loader.loadSkill("prd-writer", "2.0");

    assert.equal(skill.id, "prd-writer@2.0");
    assert.equal(skill.name, "prd-writer");
    assert.equal(skill.version, "2.0");
  });

  it("resolves exact skill-name@version references", () => {
    const registry = createSeededSkillRegistry();
    const resolver = new SkillVersionResolver(registry);

    assert.equal(
      resolver.resolveVersion("prd-writer@1.0").skill.id,
      "prd-writer@1.0"
    );
    assert.equal(
      resolver.resolveVersion("prd-writer@2.0").skill.id,
      "prd-writer@2.0"
    );
  });

  it("rejects unknown versions", () => {
    const service = new SkillRuntimeService();

    assert.throws(
      () => service.resolveVersion("prd-writer@3.0"),
      /Skill version not found: prd-writer@3.0/
    );
  });

  it("executes skills with deterministic lifecycle metadata", async () => {
    const service = new SkillRuntimeService();
    const result = await service.executeSkill({
      skillId: "prd-writer",
      version: "2.0",
      inputArtifacts: [createDiscoveryArtifact()],
      context: {
        workflowId: "workflow-1",
        agentId: "product-agent",
        stageId: "PRD",
        requestedAt: "2026-01-01T00:00:00.000Z"
      }
    });

    assert.equal(result.metadata.skillId, "prd-writer@2.0");
    assert.equal(result.metadata.version, "2.0");
    assert.equal(result.metadata.agentId, "product-agent");
    assert.equal(result.metadata.status, "succeeded");
    assert.equal(result.metadata.deterministic, true);
    assert.deepEqual(result.metadata.inputArtifactIds, ["workflow-1:discovery"]);
    assert.equal(result.artifacts.length, 1);
    assert.equal(result.artifacts[0].type, ArtifactType.PRD);
    assert.equal(result.artifacts[0].createdBy, "product-agent");
    assert.deepEqual(result.artifacts[0].parentIds, ["workflow-1:discovery"]);
    assert.ok(result.findings.some((finding) => finding.id === "rule:prd-non-goals-required"));
  });

  it("enforces skill input artifact limits", async () => {
    const service = new SkillRuntimeService();
    const artifacts = Array.from({ length: 6 }, (_, index) =>
      createDiscoveryArtifact(`workflow-1:discovery-${index}`)
    );

    await assert.rejects(
      () =>
        service.executeSkill({
          skillId: "prd-writer",
          version: "2.0",
          inputArtifacts: artifacts,
          context: {
            workflowId: "workflow-1",
            agentId: "product-agent"
          }
        }),
      /Skill input artifact limit exceeded for prd-writer@2.0: 6\/5/
    );
  });
});

function createDiscoveryArtifact(id = "workflow-1:discovery"): BaseArtifact {
  return {
    id,
    type: ArtifactType.DISCOVERY_REPORT,
    title: "Discovery",
    description: "Discovery report",
    parentIds: ["workflow-1:idea"],
    createdBy: "discovery-agent",
    createdAt: "2026-01-01T00:00:00.000Z",
    version: 1,
    status: "active",
    metadata: {
      workflowId: "workflow-1"
    }
  };
}
