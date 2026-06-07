import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import {
  RuntimeArtifactGenerator,
  RuntimeExecutionError,
  RuntimeHealthService,
  RuntimeOrchestratorService,
  RuntimeSkillExecutor,
  filterArtifactsForSkill,
  RuntimeStageResolver,
  RuntimeValidationError
} from "../src/index.js";
import { SkillGovernanceService } from "@apdos/skill-governance";
import { SkillRuntimeService } from "@apdos/skill-runtime";
import {
  SkillRegistry,
  createSeededSkillRegistry,
  type SkillDefinition
} from "@apdos/skill-registry";
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

  it("propagates artifacts through a two-skill stage chain", async () => {
    const governance = new SkillGovernanceService();
    const executor = new RuntimeSkillExecutor(new SkillRuntimeService());
    const [techSpecWriter, implementPlan] = governance.mapping
      .getSkillsForWorkflowStage("tech-spec")
      .filter((skill) => ["tech-spec-writer", "implement-plan"].includes(skill.skillId));

    const executions = await executor.executeSkills({
      workflowId: "workflow:two-skill-chain",
      stageId: "tech-spec",
      selectedAgent: "agent:architecture",
      skills: [techSpecWriter, implementPlan],
      inputArtifacts: [createArtifact("artifact:prd", ArtifactType.PRD)],
      requestedAt: TEST_TIME
    });

    const techSpecArtifact = executions[0].result.artifacts[0];
    const implementationPlanArtifact = executions[1].result.artifacts[0];

    assert.equal(techSpecArtifact.type, ArtifactType.TECH_SPEC);
    assert.equal(implementationPlanArtifact.type, ArtifactType.IMPLEMENTATION_PLAN);
    assert.ok(implementationPlanArtifact.parentIds.includes(techSpecArtifact.id));
    assert.deepEqual(
      executions[1].result.metadata.inputArtifactIds,
      ["artifact:prd", techSpecArtifact.id]
    );
  });

  it("propagates artifacts through a three-skill stage chain", async () => {
    const governance = new SkillGovernanceService();
    const executor = new RuntimeSkillExecutor(new SkillRuntimeService());
    const skills = governance.mapping.getSkillsForWorkflowStage("tech-spec");

    const executions = await executor.executeSkills({
      workflowId: "workflow:three-skill-chain",
      stageId: "tech-spec",
      selectedAgent: "agent:architecture",
      skills,
      inputArtifacts: [createArtifact("artifact:prd", ArtifactType.PRD)],
      requestedAt: TEST_TIME
    });

    const techSpecArtifact = executions[0].result.artifacts[0];
    const implementationPlanArtifact = executions[1].result.artifacts[0];
    const designReviewArtifact = executions[2].result.artifacts[0];

    assert.deepEqual(
      executions.map((execution) => execution.skill.skillId),
      ["tech-spec-writer", "implement-plan", "design-system"]
    );
    assert.ok(designReviewArtifact.parentIds.includes(techSpecArtifact.id));
    assert.ok(!designReviewArtifact.parentIds.includes(implementationPlanArtifact.id));
    assert.deepEqual(
      executions[2].result.metadata.inputArtifactIds,
      ["artifact:prd", techSpecArtifact.id]
    );
  });

  it("filters a single artifact by skill contract", () => {
    const governance = new SkillGovernanceService();
    const [prdWriter] = governance.mapping.getSkillsForWorkflowStage("prd");

    const filtered = filterArtifactsForSkill(
      [
        createArtifact("artifact:discovery", ArtifactType.DISCOVERY_REPORT),
        createArtifact("artifact:task", ArtifactType.TASK)
      ],
      prdWriter
    );

    assert.deepEqual(filtered.map((artifact) => artifact.id), ["artifact:discovery"]);
  });

  it("filters multiple artifacts by skill contract", () => {
    const governance = new SkillGovernanceService();
    const implementPlan = governance.mapping.getSkill("implement-plan");

    assert.ok(implementPlan);

    const filtered = filterArtifactsForSkill(
      [
        createArtifact("artifact:prd", ArtifactType.PRD),
        createArtifact("artifact:tech-spec", ArtifactType.TECH_SPEC),
        createArtifact("artifact:task", ArtifactType.TASK)
      ],
      implementPlan
    );

    assert.deepEqual(
      filtered.map((artifact) => artifact.id),
      ["artifact:prd", "artifact:tech-spec"]
    );
  });

  it("rejects missing required input artifacts", () => {
    const governance = new SkillGovernanceService();
    const [prdWriter] = governance.mapping.getSkillsForWorkflowStage("prd");

    assert.throws(
      () => filterArtifactsForSkill([createArtifact("artifact:task", ArtifactType.TASK)], prdWriter),
      /Missing input artifacts for prd-writer: DISCOVERY_REPORT/
    );
  });

  it("rejects contract mismatches during execution", async () => {
    const governance = new SkillGovernanceService();
    const executor = new RuntimeSkillExecutor(new SkillRuntimeService());

    await assert.rejects(
      () =>
        executor.executeSkills({
          workflowId: "workflow:contract-mismatch",
          stageId: "prd",
          selectedAgent: "agent:product",
          skills: governance.mapping.getSkillsForWorkflowStage("prd"),
          inputArtifacts: [createArtifact("artifact:task", ArtifactType.TASK)],
          requestedAt: TEST_TIME
        }),
      (error) =>
        error instanceof RuntimeExecutionError &&
        error.cause instanceof RuntimeExecutionError &&
        /Missing input artifacts for prd-writer: DISCOVERY_REPORT/.test(error.cause.message)
    );
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

  it("fails a running stage when skill execution fails", async () => {
    const workflowExecutionService = createWorkflowExecutionService(["prd", "tech-spec"]);
    const workflow = workflowExecutionService.startWorkflow({
      id: "workflow:skill-failure",
      workflowType: "runtime-test",
      goal: "Build supplier payment approval workflow",
      definition: createDefinition(["prd", "tech-spec"]),
      createdAt: TEST_TIME
    });
    const service = new RuntimeOrchestratorService({
      workflowExecutionService,
      skillRuntime: new SkillRuntimeService({
        executor: {
          execute: async () => {
            throw new Error("simulated skill failure");
          }
        }
      })
    });

    await assert.rejects(
      () =>
        service.executeSkills({
          workflowId: workflow.id,
          inputArtifacts: [createArtifact("artifact:discovery", ArtifactType.DISCOVERY_REPORT)],
          requestedAt: TEST_TIME
        }),
      RuntimeExecutionError
    );

    const failedWorkflow = workflowExecutionService.getWorkflow(workflow.id);
    assert.equal(failedWorkflow?.stages[0].status, StageStatus.FAILED);
    assert.match(failedWorkflow?.stages[0].statusReason ?? "", /Skill execution failed: prd-writer/);
  });

  it("fails a running stage when artifact creation fails", async () => {
    const workflowExecutionService = createWorkflowExecutionService(["prd", "tech-spec"]);
    const workflow = workflowExecutionService.startWorkflow({
      id: "workflow:artifact-failure",
      workflowType: "runtime-test",
      goal: "Build supplier payment approval workflow",
      definition: createDefinition(["prd", "tech-spec"]),
      createdAt: TEST_TIME
    });
    const artifactRegistry = new ArtifactRegistry();
    await artifactRegistry.register({
      ...createArtifact("workflow:artifact-failure:prd-writer:1.0:prd", ArtifactType.PRD),
      parentIds: ["artifact:discovery"],
      createdBy: "agent:product"
    });
    const service = new RuntimeOrchestratorService({
      workflowExecutionService,
      artifactRegistry
    });

    await assert.rejects(
      () =>
        service.executeSkills({
          workflowId: workflow.id,
          inputArtifacts: [createArtifact("artifact:discovery", ArtifactType.DISCOVERY_REPORT)],
          requestedAt: TEST_TIME
        }),
      RuntimeExecutionError
    );

    const failedWorkflow = workflowExecutionService.getWorkflow(workflow.id);
    assert.equal(failedWorkflow?.stages[0].status, StageStatus.FAILED);
    assert.match(failedWorkflow?.stages[0].statusReason ?? "", /Artifact creation failed/);
  });
});

describe("RuntimeHealthService", () => {
  it("validates successful runtime synchronization", () => {
    const service = new RuntimeHealthService(
      new SkillGovernanceService(),
      new SkillRuntimeService()
    );

    const result = service.validate();

    assert.equal(result.valid, true);
    assert.equal(result.governedSkillNames.length, 23);
    assert.equal(result.runtimeSkillNames.length, 23);
    assert.deepEqual(result.missingSkillNames, []);
    assert.deepEqual(result.extraSkillNames, []);
    assert.deepEqual(result.metadataIssues, []);
  });

  it("reports missing governed runtime skills", () => {
    const registry = createSeededSkillRegistry();
    registry.unregisterSkill("prd-writer@1.0");
    registry.unregisterSkill("prd-writer@2.0");
    const service = new RuntimeHealthService(
      new SkillGovernanceService(),
      new SkillRuntimeService({ registry })
    );

    assert.throws(
      () => service.validate(),
      (error) =>
        error instanceof RuntimeValidationError &&
        error.result?.missingSkillNames.includes("prd-writer") === true
    );
  });

  it("reports extra runtime skills not governed by Skill Governance", () => {
    const registry = createSeededSkillRegistry();
    registry.registerSkill(buildExtraSkill());
    const service = new RuntimeHealthService(
      new SkillGovernanceService(),
      new SkillRuntimeService({ registry })
    );

    assert.throws(
      () => service.validate(),
      (error) =>
        error instanceof RuntimeValidationError &&
        error.result?.extraSkillNames.includes("extra-skill") === true
    );
  });

  it("reports governance and runtime metadata mismatches", () => {
    const registry = createSeededSkillRegistry();
    registry.unregisterSkill("prd-writer@1.0");
    registry.registerSkill({
      ...buildPrdWriterMismatch(),
      inputArtifacts: [ArtifactType.IDEA]
    });
    const service = new RuntimeHealthService(
      new SkillGovernanceService(),
      new SkillRuntimeService({ registry })
    );

    assert.throws(
      () => service.validate(),
      (error) =>
        error instanceof RuntimeValidationError &&
        error.result?.metadataIssues.some((issue) =>
          issue.includes("prd-writer@1.0:inputArtifacts")
        ) === true
    );
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

function buildExtraSkill(): SkillDefinition {
  return {
    id: "extra-skill@1.0",
    name: "extra-skill",
    description: "Extra skill not governed by Skill Governance.",
    version: "1.0",
    category: "research",
    status: "available",
    inputArtifacts: [ArtifactType.IDEA],
    outputArtifacts: [ArtifactType.TASK],
    templates: [],
    rules: [],
    constraints: {
      requiresHumanApproval: false,
      maxInputArtifacts: 2
    }
  };
}

function buildPrdWriterMismatch(): SkillDefinition {
  return {
    id: "prd-writer@1.0",
    name: "prd-writer",
    description: "Mismatched PRD writer.",
    version: "1.0",
    dependencies: ["codebase-research"],
    category: "product",
    status: "available",
    inputArtifacts: [ArtifactType.IDEA],
    outputArtifacts: [ArtifactType.PRD],
    templates: [],
    rules: [],
    constraints: {
      requiresHumanApproval: false,
      maxInputArtifacts: 5
    }
  };
}
