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
  DiscoveryAgentService,
  validateDiscoveryRequest
} from "../src/index.js";

describe("DiscoveryAgentService", () => {
  it("validates discovery requests", () => {
    assert.doesNotThrow(() =>
      validateDiscoveryRequest({
        goal: "Build supplier payment approval workflow",
        workflowId: "workflow-1",
        contextIds: ["idea-1"]
      })
    );

    assert.throws(
      () => validateDiscoveryRequest({
        goal: " ",
        workflowId: "workflow-1",
        contextIds: []
      }),
      /Discovery goal is required/
    );
    assert.throws(
      () => validateDiscoveryRequest({
        goal: "Build supplier payment approval workflow",
        workflowId: " ",
        contextIds: []
      }),
      /Discovery workflowId is required/
    );
  });

  it("generates deterministic discovery reports", () => {
    const service = new DiscoveryAgentService();

    const report = service.analyzeGoal({
      goal: "Build supplier payment approval workflow",
      workflowId: "workflow-1",
      contextIds: ["idea-1"]
    });

    assert.match(report.problemSummary, /supplier payment approval workflow/);
    assert.deepEqual(report.affectedSystems, [
      "artifact-engine",
      "workflow-engine",
      "validation-engine",
      "approval-engine",
      "supplier-management",
      "payment-operations",
      "governance-controls"
    ]);
    assert.ok(report.repositories.includes("payment-services"));
    assert.ok(report.dependencies.includes("payment approval policy"));
    assert.ok(report.risks.includes("Payment policy errors can create financial or compliance exposure."));
    assert.ok(report.openQuestions.includes("Which supplier payment thresholds require additional approval?"));
  });

  it("creates DISCOVERY_REPORT artifacts", async () => {
    const service = new DiscoveryAgentService();

    const result = await service.generateDiscoveryReport({
      request: {
        goal: "Build supplier payment approval workflow",
        workflowId: "workflow-1",
        contextIds: ["workflow-1:idea"]
      },
      parentArtifactIds: ["workflow-1:idea"],
      actorId: "tester",
      createdAt: "2026-01-01T00:00:00.000Z",
      registerArtifact: false
    });

    assert.equal(result.artifact.id, "workflow-1:discovery");
    assert.equal(result.artifact.type, ArtifactType.DISCOVERY_REPORT);
    assert.deepEqual(result.artifact.parentIds, ["workflow-1:idea"]);
    assert.equal(result.artifact.createdBy, "tester");
    assert.deepEqual(result.artifact.metadata.contextIds, ["workflow-1:idea"]);
    assert.equal(
      (result.artifact.metadata.report as { problemSummary: string }).problemSummary,
      result.report.problemSummary
    );
    assert.deepEqual(result.skillResults, []);
  });

  it("requests skill execution through the Skill Runtime", async () => {
    const service = new DiscoveryAgentService({
      skillRuntime: new SkillRuntimeService()
    });

    const result = await service.executeSkill({
      skillId: "knowledge",
      version: "1.0",
      inputArtifacts: [createIdeaArtifact()],
      context: {
        workflowId: "workflow-1",
        requestedAt: "2026-01-01T00:00:00.000Z"
      }
    });

    assert.equal(result.metadata.skillId, "knowledge@1.0");
    assert.equal(result.metadata.agentId, "discovery-agent");
    assert.equal(result.artifacts[0].type, ArtifactType.TASK);
    assert.deepEqual(result.artifacts[0].parentIds, ["workflow-1:idea"]);
  });

  it("integrates with Artifact, Context, and Workflow engines", async () => {
    const artifacts = new ArtifactRegistry();
    const workflows = new WorkflowExecutionService();
    workflows.startWorkflow({
      id: "workflow-1",
      workflowType: "discovery-test",
      goal: "Build supplier payment approval workflow",
      createdAt: "2026-01-01T00:00:00.000Z",
      definition: {
        id: "discovery-test",
        stages: [
          {
            id: "idea",
            name: "Idea"
          },
          {
            id: "discovery",
            name: "Discovery"
          }
        ]
      }
    });
    await artifacts.register(createIdeaArtifact());
    const context = new ContextRetrievalService({
      artifacts,
      workflows
    });
    const service = new DiscoveryAgentService({
      artifacts,
      context,
      workflows
    });

    const result = await service.generateDiscoveryReport({
      request: {
        goal: "Build supplier payment approval workflow",
        workflowId: "workflow-1",
        contextIds: ["workflow-1:idea"]
      },
      actorId: "tester",
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    const stored = await artifacts.retrieve(result.artifact.id);

    assert.equal(stored?.type, ArtifactType.DISCOVERY_REPORT);
    assert.deepEqual(stored?.parentIds, ["workflow-1:idea"]);
    assert.deepEqual(result.skillResults, []);
  });
});

function createIdeaArtifact(): BaseArtifact {
  return {
    id: "workflow-1:idea",
    type: ArtifactType.IDEA,
    title: "Idea",
    description: "Build supplier payment approval workflow",
    parentIds: [],
    createdBy: "tester",
    createdAt: "2026-01-01T00:00:00.000Z",
    version: 1,
    status: "active",
    metadata: {
      workflowId: "workflow-1",
      stageId: "idea"
    }
  };
}
