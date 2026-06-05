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
  EngineeringAgentService,
  validateEngineeringRequest
} from "../src/index.js";

const createdAt = "2026-01-01T00:00:00.000Z";

describe("EngineeringAgentService", () => {
  it("validates engineering requests", () => {
    assert.doesNotThrow(() =>
      validateEngineeringRequest({
        workflowId: "workflow-1",
        prdArtifactId: "workflow-1:prd",
        techSpecArtifactId: "workflow-1:tech-spec",
        implementationPlanArtifactId: "workflow-1:implementation-plan"
      })
    );

    assert.throws(
      () =>
        validateEngineeringRequest({
          workflowId: " ",
          prdArtifactId: "workflow-1:prd",
          techSpecArtifactId: "workflow-1:tech-spec",
          implementationPlanArtifactId: "workflow-1:implementation-plan"
        }),
      /Engineering workflowId is required/
    );
  });

  it("creates CODE_CHANGE artifacts through governed Skill Runtime execution", async () => {
    const { service, artifacts } = await createFixture("engineering-agent-1");

    const result = await service.createCodeChangeArtifacts({
      request: {
        workflowId: "engineering-agent-1",
        prdArtifactId: "engineering-agent-1:prd",
        techSpecArtifactId: "engineering-agent-1:tech-spec",
        implementationPlanArtifactId: "engineering-agent-1:implementation-plan"
      },
      createdAt
    });

    assert.deepEqual(result.skillResults.map((skillResult) => skillResult.metadata.skillName), [
      "backend-contributor",
      "frontend-contributor",
      "mono-web-contributor",
      "crons-contributor",
      "data-science-monorepo-contributor"
    ]);
    assert.equal(result.codeChangeArtifacts.length, 5);
    assert.equal(result.engineeringPackageArtifact.type, ArtifactType.ENGINEERING_PACKAGE);
    assert.equal(result.engineeringPackageArtifact.id, "engineering-agent-1:engineering-package");
    assert.deepEqual(
      result.engineeringPackageArtifact.parentIds,
      result.codeChangeArtifacts.map((artifact) => artifact.id)
    );
    assert.deepEqual(result.engineeringPackageArtifact.metadata.implementationOrder, [
      "database",
      "api",
      "backend",
      "frontend",
      "cron",
      "validation"
    ]);
    assert.equal(result.engineeringPackageArtifact.metadata.storyPoints, 34);
    assert.ok(Array.isArray(result.engineeringPackageArtifact.metadata.backendTasks));
    assert.ok(Array.isArray(result.engineeringPackageArtifact.metadata.frontendTasks));
    assert.ok(Array.isArray(result.engineeringPackageArtifact.metadata.databaseTasks));
    assert.ok(Array.isArray(result.engineeringPackageArtifact.metadata.apiTasks));
    assert.ok(Array.isArray(result.engineeringPackageArtifact.metadata.migrationTasks));
    assert.ok(Array.isArray(result.engineeringPackageArtifact.metadata.cronTasks));
    assert.ok(Array.isArray(result.engineeringPackageArtifact.metadata.dependencies));
    assert.ok(Array.isArray(result.engineeringPackageArtifact.metadata.sprintPlan));
    assert.ok(Array.isArray(result.engineeringPackageArtifact.metadata.risks));
    assert.ok(result.codeChangeArtifacts.every((artifact) => artifact.type === ArtifactType.CODE_CHANGE));
    assert.ok(result.codeChangeArtifacts.every((artifact) => artifact.metadata.sourceAgent === "agent:engineering"));
    assert.deepEqual(result.codeChangeArtifacts[0].parentIds, [
      "engineering-agent-1:tech-spec",
      "engineering-agent-1:implementation-plan"
    ]);
    assert.deepEqual(result.codeChangeArtifacts[1].parentIds, [
      "engineering-agent-1:prd",
      "engineering-agent-1:tech-spec",
      "engineering-agent-1:implementation-plan"
    ]);
    assert.equal((await artifacts.retrieve("engineering-agent-1:code-change:1"))?.type, ArtifactType.CODE_CHANGE);
    assert.equal(
      (await artifacts.retrieve("engineering-agent-1:engineering-package"))?.type,
      ArtifactType.ENGINEERING_PACKAGE
    );
  });

  it("rejects missing implementation context artifacts", async () => {
    const artifacts = new ArtifactRegistry();
    const service = new EngineeringAgentService({
      artifacts,
      skillRuntime: new SkillRuntimeService()
    });

    await assert.rejects(
      () =>
        service.createCodeChangeArtifacts({
          request: {
            workflowId: "missing-context",
            prdArtifactId: "missing-context:prd",
            techSpecArtifactId: "missing-context:tech-spec",
            implementationPlanArtifactId: "missing-context:implementation-plan"
          }
        }),
      /Engineering artifact not found/
    );
  });
});

async function createFixture(workflowId: string): Promise<{
  artifacts: ArtifactRegistry;
  service: EngineeringAgentService;
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
      stages: ["prd", "tech-spec", "engineering"].map((stage) => ({
        id: stage,
        name: stage
      }))
    }
  });

  await artifacts.register(createArtifact(workflowId, ArtifactType.PRD, []));
  await artifacts.register(createArtifact(workflowId, ArtifactType.TECH_SPEC, [`${workflowId}:prd`]));
  await artifacts.register(
    createArtifact(workflowId, ArtifactType.IMPLEMENTATION_PLAN, [
      `${workflowId}:prd`,
      `${workflowId}:tech-spec`
    ])
  );

  const service = new EngineeringAgentService({
    artifacts,
    workflows,
    context: new ContextRetrievalService({ artifacts, workflows }),
    skillRuntime: new SkillRuntimeService()
  });

  return {
    artifacts,
    service
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
