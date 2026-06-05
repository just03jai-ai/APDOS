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
  QaAgentService,
  validateQaRequest
} from "../src/index.js";

const createdAt = "2026-01-01T00:00:00.000Z";

describe("QaAgentService", () => {
  it("validates QA requests", () => {
    assert.doesNotThrow(() =>
      validateQaRequest({
        workflowId: "workflow-1",
        prdArtifactId: "workflow-1:prd",
        techSpecArtifactId: "workflow-1:tech-spec",
        implementationPlanArtifactId: "workflow-1:implementation-plan",
        engineeringPackageArtifactId: "workflow-1:engineering-package"
      })
    );

    assert.throws(
      () =>
        validateQaRequest({
          workflowId: " ",
          prdArtifactId: "workflow-1:prd",
          techSpecArtifactId: "workflow-1:tech-spec",
          implementationPlanArtifactId: "workflow-1:implementation-plan",
          engineeringPackageArtifactId: "workflow-1:engineering-package"
        }),
      /QA workflowId is required/
    );
  });

  it("creates QA_PACKAGE artifacts through governed Skill Runtime execution", async () => {
    const { service, artifacts } = await createFixture("qa-agent-1");

    const result = await service.createQaPackage({
      request: {
        workflowId: "qa-agent-1",
        prdArtifactId: "qa-agent-1:prd",
        techSpecArtifactId: "qa-agent-1:tech-spec",
        implementationPlanArtifactId: "qa-agent-1:implementation-plan",
        engineeringPackageArtifactId: "qa-agent-1:engineering-package"
      },
      createdAt
    });

    assert.deepEqual(result.skillResults.map((skillResult) => skillResult.metadata.skillName), [
      "test-plan-writer",
      "ai-data-analyst"
    ]);
    assert.equal(result.testResultArtifacts.length, 1);
    assert.equal(result.governanceFindingArtifacts.length, 1);
    assert.equal(result.qaPackageArtifact.type, ArtifactType.QA_PACKAGE);
    assert.equal(result.qaPackageArtifact.id, "qa-agent-1:qa-package");
    assert.ok(result.qaPackageArtifact.parentIds.includes("qa-agent-1:engineering-package"));
    assert.ok(result.qaPackageArtifact.parentIds.includes("qa-agent-1:qa-test-result:1"));
    assert.ok(result.qaPackageArtifact.parentIds.includes("qa-agent-1:qa-finding:1"));
    assert.equal(result.qaPackageArtifact.metadata.sourceAgent, "agent:qa");
    assert.ok(Array.isArray(result.qaPackageArtifact.metadata.testCases));
    assert.ok(Array.isArray(result.qaPackageArtifact.metadata.regressionCoverage));
    assert.ok(Array.isArray(result.qaPackageArtifact.metadata.integrationTests));
    assert.ok(Array.isArray(result.qaPackageArtifact.metadata.acceptanceTests));
    assert.ok(Array.isArray(result.qaPackageArtifact.metadata.edgeCases));
    assert.ok(Array.isArray(result.qaPackageArtifact.metadata.negativeScenarios));
    assert.ok(Array.isArray(result.qaPackageArtifact.metadata.uatChecklist));
    assert.ok(Array.isArray(result.qaPackageArtifact.metadata.releaseValidationChecklist));
    assert.ok(Array.isArray(result.qaPackageArtifact.metadata.riskAreas));
    assert.equal((await artifacts.retrieve("qa-agent-1:qa-package"))?.type, ArtifactType.QA_PACKAGE);
  });

  it("rejects missing QA context artifacts", async () => {
    const artifacts = new ArtifactRegistry();
    const service = new QaAgentService({
      artifacts,
      skillRuntime: new SkillRuntimeService()
    });

    await assert.rejects(
      () =>
        service.createQaPackage({
          request: {
            workflowId: "missing-context",
            prdArtifactId: "missing-context:prd",
            techSpecArtifactId: "missing-context:tech-spec",
            implementationPlanArtifactId: "missing-context:implementation-plan",
            engineeringPackageArtifactId: "missing-context:engineering-package"
          }
        }),
      /QA artifact not found/
    );
  });
});

async function createFixture(workflowId: string): Promise<{
  artifacts: ArtifactRegistry;
  service: QaAgentService;
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
      stages: ["prd", "tech-spec", "engineering", "qa"].map((stage) => ({
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
  await artifacts.register(
    createArtifact(workflowId, ArtifactType.ENGINEERING_PACKAGE, [
      `${workflowId}:tech-spec`,
      `${workflowId}:implementation-plan`
    ])
  );

  const service = new QaAgentService({
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
