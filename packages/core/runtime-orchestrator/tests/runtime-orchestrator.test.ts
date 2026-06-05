import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import {
  RuntimeArtifactGenerator,
  RuntimeOrchestratorService,
  RuntimeSkillExecutor,
  RuntimeStageResolver
} from "../src/index.js";
import { SkillGovernanceService } from "@apdos/skill-governance";
import { SkillRuntimeService } from "@apdos/skill-runtime";
import { StageStatus, WorkflowExecutionService } from "@apdos/workflow-engine";

const TEST_TIME = "2026-06-05T00:00:00.000Z";

describe("RuntimeStageResolver", () => {
  it("resolves the current pending workflow stage", () => {
    const workflowExecutionService = createWorkflowExecutionService(["prd", "tech-spec"]);
    const workflow = workflowExecutionService.startWorkflow({
      id: "workflow:stage-resolution",
      workflowType: "runtime-test",
      goal: "Build supplier payment approval workflow",
      definition: createDefinition(["prd", "tech-spec"]),
      createdAt: TEST_TIME
    });
    const resolver = new RuntimeStageResolver(workflowExecutionService);

    const resolution = resolver.resolveWorkflowStage(workflow.id);

    assert.equal(resolution.stage.id, "prd");
    assert.equal(resolution.stage.status, StageStatus.PENDING);
  });

  it("resolves the next pending stage after the current stage", () => {
    const workflowExecutionService = createWorkflowExecutionService(["prd", "tech-spec"]);
    const workflow = workflowExecutionService.startWorkflow({
      id: "workflow:next-stage",
      workflowType: "runtime-test",
      goal: "Build supplier payment approval workflow",
      definition: createDefinition(["prd", "tech-spec"]),
      createdAt: TEST_TIME
    });
    const resolver = new RuntimeStageResolver(workflowExecutionService);

    const nextStage = resolver.resolveNextStage(workflow, "prd");

    assert.equal(nextStage?.id, "tech-spec");
  });
});

describe("RuntimeOrchestratorService resolution", () => {
  it("resolves agents through Skill Governance", () => {
    const service = new RuntimeOrchestratorService({
      workflowExecutionService: createWorkflowExecutionService(["prd"])
    });

    assert.equal(service.resolveAgentForStage("prd"), "agent:product");
    assert.equal(service.resolveAgentForStage("tech-spec"), "agent:architecture");
  });

  it("resolves skills through Skill Governance", () => {
    const service = new RuntimeOrchestratorService({
      workflowExecutionService: createWorkflowExecutionService(["tech-spec"])
    });

    assert.deepEqual(
      service.resolveSkillsForStage("tech-spec").map((skill) => skill.skillId),
      ["tech-spec-writer", "implement-plan", "design-system"]
    );
  });
});

describe("RuntimeSkillExecutor", () => {
  it("executes governed skills through Skill Runtime", async () => {
    const governance = new SkillGovernanceService();
    const executor = new RuntimeSkillExecutor(new SkillRuntimeService());
    const [prdWriter] = governance.mapping.getSkillsForWorkflowStage("prd");

    const executions = await executor.executeSkills({
      workflowId: "workflow:skill-execution",
      stageId: "prd",
      selectedAgent: "agent:product",
      skills: [prdWriter],
      inputArtifacts: [createArtifact("artifact:discovery", ArtifactType.DISCOVERY_REPORT)],
      requestedAt: TEST_TIME
    });

    assert.equal(executions.length, 1);
    assert.equal(executions[0].skill.skillId, "prd-writer");
    assert.equal(executions[0].result.metadata.agentId, "agent:product");
    assert.equal(executions[0].result.artifacts[0].type, ArtifactType.PRD);
  });
});

describe("RuntimeArtifactGenerator", () => {
  it("creates artifacts from execution results and registers them when a registry is supplied", async () => {
    const governance = new SkillGovernanceService();
    const executor = new RuntimeSkillExecutor(new SkillRuntimeService());
    const executions = await executor.executeSkills({
      workflowId: "workflow:artifact-generation",
      stageId: "prd",
      selectedAgent: "agent:product",
      skills: governance.mapping.getSkillsForWorkflowStage("prd"),
      inputArtifacts: [createArtifact("artifact:discovery", ArtifactType.DISCOVERY_REPORT)],
      requestedAt: TEST_TIME
    });
    const artifactRegistry = new ArtifactRegistry();
    const generator = new RuntimeArtifactGenerator(artifactRegistry);

    const artifacts = await generator.createArtifactsFromExecution(executions);

    assert.equal(artifacts.length, 1);
    assert.equal(artifacts[0].type, ArtifactType.PRD);
    assert.equal((await artifactRegistry.list()).length, 1);
  });
});

describe("RuntimeOrchestratorService", () => {
  it("orchestrates stage execution across Workflow Engine, Skill Governance, and Skill Runtime", async () => {
    const workflowExecutionService = createWorkflowExecutionService(["prd", "tech-spec"]);
    const workflow = workflowExecutionService.startWorkflow({
      id: "workflow:orchestration",
      workflowType: "runtime-test",
      goal: "Build supplier payment approval workflow",
      definition: createDefinition(["prd", "tech-spec"]),
      createdAt: TEST_TIME
    });
    const artifactRegistry = new ArtifactRegistry();
    const service = new RuntimeOrchestratorService({
      workflowExecutionService,
      artifactRegistry
    });

    const result = await service.executeSkills({
      workflowId: workflow.id,
      inputArtifacts: [createArtifact("artifact:discovery", ArtifactType.DISCOVERY_REPORT)],
      requestedAt: TEST_TIME
    });

    assert.equal(result.selectedAgent, "agent:product");
    assert.deepEqual(result.executedSkills.map((execution) => execution.skill.skillId), ["prd-writer"]);
    assert.deepEqual(result.generatedArtifacts.map((artifact) => artifact.type), [ArtifactType.PRD]);
    assert.equal(result.nextStage?.id, "tech-spec");

    const completedWorkflow = workflowExecutionService.getWorkflow(workflow.id);
    assert.equal(completedWorkflow?.stages[0].status, StageStatus.COMPLETED);
    assert.equal(completedWorkflow?.stages[0].artifactIds.length, 1);
    assert.equal((await artifactRegistry.list()).length, 1);
  });
});

function createWorkflowExecutionService(_stageIds: string[]): WorkflowExecutionService {
  return new WorkflowExecutionService();
}

function createDefinition(stageIds: string[]) {
  return {
    id: "runtime-test-definition",
    stages: stageIds.map((stageId) => ({
      id: stageId,
      name: stageId
    }))
  };
}

function createArtifact(id: string, type: ArtifactType): BaseArtifact {
  return {
    id,
    type,
    title: `${type} artifact`,
    description: `Test ${type} artifact.`,
    parentIds: [],
    createdBy: "test",
    createdAt: TEST_TIME,
    version: 1,
    status: "draft",
    metadata: {}
  };
}
