import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { SkillRuntimeService } from "@apdos/skill-runtime";
import { WorkflowExecutionService } from "@apdos/workflow-engine";
import {
  ProductAgentService,
  validateProductRequest
} from "../src/index.js";

const createdAt = "2026-01-01T00:00:00.000Z";

describe("ProductAgentService", () => {
  it("validates product requests", () => {
    assert.doesNotThrow(() =>
      validateProductRequest({
        workflowId: "workflow-1",
        discoveryArtifactId: "workflow-1:discovery"
      })
    );

    assert.throws(
      () => validateProductRequest({ workflowId: " ", discoveryArtifactId: "workflow-1:discovery" }),
      /Product workflowId is required/
    );
  });

  it("creates PRD artifacts through governed Skill Runtime execution", async () => {
    const artifacts = new ArtifactRegistry();
    const workflows = new WorkflowExecutionService();
    workflows.startWorkflow({
      id: "product-agent-1",
      workflowType: "DELIVERY_WORKFLOW_V1",
      goal: "Build supplier payment approval workflow",
      createdAt,
      definition: {
        id: "delivery",
        stages: ["discovery", "prd"].map((stage) => ({ id: stage, name: stage }))
      }
    });
    await artifacts.register(createDiscoveryArtifact("product-agent-1"));
    const service = new ProductAgentService({
      artifacts,
      workflows,
      skillRuntime: new SkillRuntimeService()
    });

    const result = await service.createPrdArtifact({
      request: {
        workflowId: "product-agent-1",
        discoveryArtifactId: "product-agent-1:discovery"
      },
      createdAt
    });

    assert.equal(result.prdArtifact.type, ArtifactType.PRD);
    assert.deepEqual(result.skillResults.map((skillResult) => skillResult.metadata.skillName), ["prd-writer"]);
    assert.equal(result.prdArtifact.metadata.sourceAgent, "agent:product");
    assert.deepEqual(result.prdArtifact.parentIds, [
      "product-agent-1:idea",
      "product-agent-1:discovery"
    ]);
    assert.equal((await artifacts.retrieve("product-agent-1:prd"))?.type, ArtifactType.PRD);
  });
});

function createDiscoveryArtifact(workflowId: string): BaseArtifact {
  return {
    id: `${workflowId}:discovery`,
    type: ArtifactType.DISCOVERY_REPORT,
    title: "Discovery Report",
    description: "Discovery for supplier payment approval workflow.",
    parentIds: [`${workflowId}:idea`],
    createdBy: "test",
    createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId,
      stageId: "discovery"
    }
  };
}
