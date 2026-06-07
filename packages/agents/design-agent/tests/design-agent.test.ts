import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { ContextRetrievalService } from "@apdos/context-engine";
import { SkillRuntimeService } from "@apdos/skill-runtime";
import { WorkflowExecutionService } from "@apdos/workflow-engine";
import {
  DesignAgentService,
  validateDesignRequest
} from "../src/index.js";

const createdAt = "2026-01-01T00:00:00.000Z";

describe("DesignAgentService", () => {
  it("validates design requests", () => {
    assert.doesNotThrow(() =>
      validateDesignRequest({
        workflowId: "workflow-1",
        discoveryArtifactId: "workflow-1:discovery",
        prdArtifactId: "workflow-1:prd",
        techSpecArtifactId: "workflow-1:tech-spec"
      })
    );

    assert.throws(
      () =>
        validateDesignRequest({
          workflowId: " ",
          discoveryArtifactId: "workflow-1:discovery",
          prdArtifactId: "workflow-1:prd"
        }),
      /Design workflowId is required/
    );
  });

  it("creates DESIGN_PACKAGE through governed Skill Runtime execution", async () => {
    const { service, artifacts } = await createFixture("design-agent-1");

    const result = await service.createDesignPackage({
      request: {
        workflowId: "design-agent-1",
        discoveryArtifactId: "design-agent-1:discovery-report",
        prdArtifactId: "design-agent-1:prd",
        techSpecArtifactId: "design-agent-1:tech-spec"
      },
      createdAt
    });

    assert.deepEqual(result.skillResults.map((result) => result.metadata.skillName), [
      "user-journey-designer",
      "user-flow-designer",
      "ia-designer",
      "wireframe-planner",
      "component-mapper",
      "prototype-planner"
    ]);
    assert.equal(result.designPackageArtifact.type, ArtifactType.DESIGN_PACKAGE);
    assert.equal(result.designPackageArtifact.metadata.sourceAgent, "agent:design");
    assert.deepEqual(result.designPackageArtifact.parentIds, [
      "design-agent-1:discovery-report",
      "design-agent-1:prd",
      "design-agent-1:tech-spec"
    ]);
    assert.ok(result.generatedArtifacts.every((artifact) => artifact.type === ArtifactType.DESIGN_PACKAGE));
    assert.ok(
      result.generatedArtifacts[1].parentIds.includes(result.generatedArtifacts[0].id)
    );
    assert.ok(
      result.generatedArtifacts.at(-1)?.parentIds.includes(result.generatedArtifacts[4].id)
    );
    assert.deepEqual(result.designPackageArtifact.metadata.sourceSkillIds, [
      "user-journey-designer@1.0",
      "user-flow-designer@1.0",
      "ia-designer@1.0",
      "wireframe-planner@1.0",
      "component-mapper@1.0",
      "prototype-planner@1.0"
    ]);

    for (const field of [
      "personas",
      "userJourneys",
      "userFlows",
      "informationArchitecture",
      "screenInventory",
      "wireframeBlueprints",
      "componentInventory",
      "stateDefinitions",
      "navigationModel",
      "prototypeBlueprint"
    ]) {
      assert.ok(Array.isArray(result.designPackageArtifact.metadata[field]));
    }

    assert.equal(
      (await artifacts.retrieve("design-agent-1:design-package"))?.type,
      ArtifactType.DESIGN_PACKAGE
    );
  });

  it("supports Design-before-Architecture workflow execution without a Tech Spec", async () => {
    const { service } = await createFixture("design-agent-before-architecture");

    const result = await service.createDesignPackage({
      request: {
        workflowId: "design-agent-before-architecture",
        discoveryArtifactId: "design-agent-before-architecture:discovery-report",
        prdArtifactId: "design-agent-before-architecture:prd"
      },
      createdAt
    });

    assert.deepEqual(result.designPackageArtifact.parentIds, [
      "design-agent-before-architecture:discovery-report",
      "design-agent-before-architecture:prd"
    ]);
  });

  it("rejects missing design context artifacts", async () => {
    const service = new DesignAgentService({
      artifacts: new ArtifactRegistry(),
      skillRuntime: new SkillRuntimeService()
    });

    await assert.rejects(
      () =>
        service.createDesignPackage({
          request: {
            workflowId: "missing-design-context",
            discoveryArtifactId: "missing-design-context:discovery",
            prdArtifactId: "missing-design-context:prd"
          }
        }),
      /Design artifact not found/
    );
  });
});

async function createFixture(workflowId: string): Promise<{
  artifacts: ArtifactRegistry;
  service: DesignAgentService;
}> {
  const artifacts = new ArtifactRegistry();
  const workflows = new WorkflowExecutionService();
  workflows.startWorkflow({
    id: workflowId,
    workflowType: "DELIVERY_WORKFLOW_V1",
    goal: "Build supplier payment approval workflow",
    createdAt,
    definition: {
      id: "delivery-workflow-v1",
      stages: ["discovery", "prd", "design", "tech-spec"].map((stage) => ({
        id: stage,
        name: stage
      }))
    }
  });

  await artifacts.register(createArtifact(workflowId, ArtifactType.DISCOVERY_REPORT, []));
  await artifacts.register(createArtifact(workflowId, ArtifactType.PRD, [`${workflowId}:discovery-report`]));
  await artifacts.register(createArtifact(workflowId, ArtifactType.TECH_SPEC, [`${workflowId}:prd`]));

  return {
    artifacts,
    service: new DesignAgentService({
      artifacts,
      workflows,
      context: new ContextRetrievalService({ artifacts, workflows }),
      skillRuntime: new SkillRuntimeService()
    })
  };
}

function createArtifact(
  workflowId: string,
  type: ArtifactType,
  parentIds: string[]
): BaseArtifact {
  const suffix = type.toLowerCase().replace(/_/g, "-");

  return {
    id: `${workflowId}:${suffix}`,
    type,
    title: `${type} artifact`,
    description: `${type} for supplier payment approval workflow.`,
    parentIds,
    createdBy: "test",
    createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId,
      stageId: suffix
    }
  };
}
