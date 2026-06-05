import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { ContextRetrievalService } from "@apdos/context-engine";
import { RuntimeSkillExecutor } from "@apdos/runtime-orchestrator";
import { SkillGovernanceService } from "@apdos/skill-governance";
import { SkillRuntimeService, type SkillResult } from "@apdos/skill-runtime";
import {
  WorkflowExecutionService,
  type WorkflowInstance
} from "@apdos/workflow-engine";
import {
  type QaRequest,
  validateQaRequest
} from "../contracts/qa-request.js";

export interface QaAgentServiceDependencies {
  artifacts?: ArtifactRegistry;
  context?: ContextRetrievalService;
  skillGovernance?: SkillGovernanceService;
  skillRuntime?: SkillRuntimeService;
  workflows?: WorkflowExecutionService;
}

export interface CreateQaPackageInput {
  request: QaRequest;
  actorId?: string;
  createdAt?: string;
  stageId?: string;
  registerArtifacts?: boolean;
}

export interface QaArtifactCreationResult {
  qaPackageArtifact: BaseArtifact;
  testResultArtifacts: BaseArtifact[];
  governanceFindingArtifacts: BaseArtifact[];
  skillResults: SkillResult[];
  generatedArtifacts: BaseArtifact[];
}

export class QaAgentService {
  constructor(private readonly dependencies: QaAgentServiceDependencies = {}) {}

  async createQaPackage(input: CreateQaPackageInput): Promise<QaArtifactCreationResult> {
    validateQaRequest(input.request);

    const context = await this.loadQaContext(input.request);
    const stageId = input.stageId ?? "qa";
    const actorId = input.actorId ?? "agent:qa";
    const skillGovernance = this.dependencies.skillGovernance ?? new SkillGovernanceService();
    const skills = skillGovernance.mapping.getSkillsForWorkflowStage(stageId);
    const executor = new RuntimeSkillExecutor(this.requireSkillRuntime());
    const executions = await executor.executeSkills({
      workflowId: input.request.workflowId,
      stageId,
      selectedAgent: actorId,
      skills,
      inputArtifacts: [
        context.prd,
        context.techSpec,
        context.implementationPlan,
        context.engineeringPackage
      ],
      requestedAt: input.createdAt
    });
    const generatedArtifacts = executions.flatMap((execution) => execution.result.artifacts);
    const testResultArtifacts = generatedArtifacts
      .filter((artifact) => artifact.type === ArtifactType.TEST_RESULT)
      .map((artifact, index) =>
        normalizeQaStageArtifact({
          artifact,
          id: `${input.request.workflowId}:qa-test-result:${index + 1}`,
          actorId,
          workflowId: input.request.workflowId,
          stageId,
          sourceSkillIds: executions.map((execution) => execution.result.metadata.skillId)
        })
      );
    const normalizedArtifactIdsByRuntimeId = new Map(
      testResultArtifacts.map((artifact) => [
        String(artifact.metadata.originalRuntimeArtifactId),
        artifact.id
      ])
    );
    const governanceFindingArtifacts = generatedArtifacts
      .filter((artifact) => artifact.type === ArtifactType.GOVERNANCE_FINDING)
      .map((artifact, index) =>
        normalizeQaStageArtifact({
          artifact,
          id: `${input.request.workflowId}:qa-finding:${index + 1}`,
          actorId,
          workflowId: input.request.workflowId,
          stageId,
          sourceSkillIds: executions.map((execution) => execution.result.metadata.skillId),
          normalizedArtifactIdsByRuntimeId
        })
      );

    if (testResultArtifacts.length === 0) {
      throw new Error("QA Agent skill execution did not produce TEST_RESULT artifacts");
    }

    const qaPackageArtifact = createQaPackageArtifact({
      workflowId: input.request.workflowId,
      actorId,
      createdAt: input.createdAt ?? testResultArtifacts[0].createdAt,
      stageId,
      parentArtifacts: [
        context.prd,
        context.techSpec,
        context.implementationPlan,
        context.engineeringPackage,
        ...testResultArtifacts,
        ...governanceFindingArtifacts
      ],
      sourceSkillIds: executions.map((execution) => execution.result.metadata.skillId)
    });

    if (input.registerArtifacts ?? true) {
      const artifacts = this.requireArtifacts();

      for (const artifact of [...testResultArtifacts, ...governanceFindingArtifacts]) {
        await artifacts.register(artifact);
      }

      await artifacts.register(qaPackageArtifact);
    }

    return {
      qaPackageArtifact,
      testResultArtifacts,
      governanceFindingArtifacts,
      skillResults: executions.map((execution) => execution.result),
      generatedArtifacts
    };
  }

  private async loadQaContext(request: QaRequest): Promise<{
    prd: BaseArtifact;
    techSpec: BaseArtifact;
    implementationPlan: BaseArtifact;
    engineeringPackage: BaseArtifact;
    workflowContext?: Awaited<ReturnType<ContextRetrievalService["getWorkflowContext"]>>;
  }> {
    const artifacts = this.requireArtifacts();
    this.assertWorkflowExists(request.workflowId);

    const prd = await requireArtifact(artifacts, request.prdArtifactId, ArtifactType.PRD);
    const techSpec = await requireArtifact(artifacts, request.techSpecArtifactId, ArtifactType.TECH_SPEC);
    const implementationPlan = await requireArtifact(
      artifacts,
      request.implementationPlanArtifactId,
      ArtifactType.IMPLEMENTATION_PLAN
    );
    const engineeringPackage = await requireArtifact(
      artifacts,
      request.engineeringPackageArtifactId,
      ArtifactType.ENGINEERING_PACKAGE
    );
    const workflowContext = await this.dependencies.context?.getWorkflowContext({
      workflowId: request.workflowId,
      artifactIds: [prd.id, techSpec.id, implementationPlan.id, engineeringPackage.id],
      agentId: "qa-agent",
      skillIds: (this.dependencies.skillGovernance ?? new SkillGovernanceService())
        .mapping.getSkillsForWorkflowStage("qa")
        .map((skill) => skill.skillId)
    });

    return {
      prd,
      techSpec,
      implementationPlan,
      engineeringPackage,
      workflowContext
    };
  }

  private requireArtifacts(): ArtifactRegistry {
    if (!this.dependencies.artifacts) {
      throw new Error("QA Agent requires ArtifactRegistry integration");
    }

    return this.dependencies.artifacts;
  }

  private requireSkillRuntime(): SkillRuntimeService {
    if (!this.dependencies.skillRuntime) {
      throw new Error("Skill Runtime dependency is required for governed QA Agent execution");
    }

    return this.dependencies.skillRuntime;
  }

  private assertWorkflowExists(workflowId: string): void {
    if (!this.dependencies.workflows) {
      return;
    }

    const workflow: WorkflowInstance | undefined = this.dependencies.workflows.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found for QA request: ${workflowId}`);
    }
  }
}

async function requireArtifact(
  artifacts: ArtifactRegistry,
  artifactId: string,
  artifactType: ArtifactType
): Promise<BaseArtifact> {
  const artifact = await artifacts.retrieve(artifactId);

  if (!artifact) {
    throw new Error(`QA artifact not found: ${artifactId}`);
  }

  if (artifact.type !== artifactType) {
    throw new Error(`QA Agent requires ${artifactType} input: ${artifactId}`);
  }

  return artifact;
}

function normalizeQaStageArtifact(input: {
  artifact: BaseArtifact;
  id: string;
  actorId: string;
  workflowId: string;
  stageId: string;
  sourceSkillIds: string[];
  normalizedArtifactIdsByRuntimeId?: Map<string, string>;
}): BaseArtifact {
  return {
    ...input.artifact,
    id: input.id,
    parentIds: input.artifact.parentIds.map((parentId) =>
      input.normalizedArtifactIdsByRuntimeId?.get(parentId) ?? parentId
    ),
    createdBy: input.actorId,
    status: "active",
    metadata: {
      ...input.artifact.metadata,
      originalRuntimeArtifactId: input.artifact.id,
      workflowId: input.workflowId,
      stageId: input.stageId,
      sourceAgent: "agent:qa",
      sourceSkillIds: input.sourceSkillIds,
      qaSummary: input.artifact.description
    }
  };
}

function createQaPackageArtifact(input: {
  workflowId: string;
  actorId: string;
  createdAt: string;
  stageId: string;
  parentArtifacts: BaseArtifact[];
  sourceSkillIds: string[];
}): BaseArtifact {
  return {
    id: `${input.workflowId}:qa-package`,
    type: ArtifactType.QA_PACKAGE,
    title: "QA Package",
    description: "Validation-ready QA package produced by governed QA skills.",
    parentIds: input.parentArtifacts.map((artifact) => artifact.id),
    createdBy: input.actorId,
    createdAt: input.createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId: input.workflowId,
      stageId: input.stageId,
      sourceAgent: "agent:qa",
      sourceSkillIds: input.sourceSkillIds,
      packageType: "qa",
      testPlan: "Validate critical delivery paths described by PRD, TECH_SPEC, and ENGINEERING_PACKAGE.",
      testCases: [
        "Verify happy-path workflow execution.",
        "Verify approval and validation handoffs.",
        "Verify artifact lineage and package completeness."
      ],
      regressionCoverage: [
        "Workflow stage transitions",
        "Artifact registration",
        "Skill Runtime execution metadata"
      ],
      integrationTests: [
        "Delivery workflow end-to-end execution",
        "Artifact Registry integration",
        "Skill Governance to Skill Runtime execution"
      ],
      acceptanceTests: [
        "QA package is produced from architecture and engineering artifacts.",
        "Release validation can consume QA evidence."
      ],
      edgeCases: [
        "Missing engineering package",
        "Incomplete implementation plan",
        "Skill execution emits no test evidence"
      ],
      negativeScenarios: [
        "Reject invalid artifact types",
        "Reject missing workflow context",
        "Reject QA execution without Skill Runtime"
      ],
      uatChecklist: [
        "Business acceptance criteria reviewed",
        "Critical path verified",
        "Approval handoff validated"
      ],
      releaseValidationChecklist: [
        "Test evidence generated",
        "Governance findings reviewed",
        "Release package dependencies present"
      ],
      riskAreas: [
        "Deterministic QA output until real execution is integrated",
        "Coverage depends on completeness of engineering package inputs"
      ]
    }
  };
}
