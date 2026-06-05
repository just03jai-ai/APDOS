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
  type EngineeringRequest,
  validateEngineeringRequest
} from "../contracts/engineering-request.js";

export interface EngineeringAgentServiceDependencies {
  artifacts?: ArtifactRegistry;
  context?: ContextRetrievalService;
  skillGovernance?: SkillGovernanceService;
  skillRuntime?: SkillRuntimeService;
  workflows?: WorkflowExecutionService;
}

export interface CreateCodeChangeArtifactsInput {
  request: EngineeringRequest;
  actorId?: string;
  createdAt?: string;
  stageId?: string;
  registerArtifacts?: boolean;
}

export interface EngineeringArtifactCreationResult {
  codeChangeArtifacts: BaseArtifact[];
  engineeringPackageArtifact: BaseArtifact;
  skillResults: SkillResult[];
  generatedArtifacts: BaseArtifact[];
}

export class EngineeringAgentService {
  constructor(private readonly dependencies: EngineeringAgentServiceDependencies = {}) {}

  async createCodeChangeArtifacts(
    input: CreateCodeChangeArtifactsInput
  ): Promise<EngineeringArtifactCreationResult> {
    validateEngineeringRequest(input.request);

    const context = await this.loadEngineeringContext(input.request);
    const stageId = input.stageId ?? "engineering";
    const actorId = input.actorId ?? "agent:engineering";
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
        context.implementationPlan
      ],
      requestedAt: input.createdAt
    });
    const generatedArtifacts = executions.flatMap((execution) => execution.result.artifacts);
    const codeChangeArtifacts = generatedArtifacts
      .filter((artifact) => artifact.type === ArtifactType.CODE_CHANGE)
      .map((artifact, index) =>
        normalizeCodeChangeArtifact({
          artifact,
          index,
          actorId,
          workflowId: input.request.workflowId,
          stageId,
          sourceSkillIds: executions.map((execution) => execution.result.metadata.skillId)
        })
      );

    if (codeChangeArtifacts.length === 0) {
      throw new Error("Engineering Agent skill execution did not produce CODE_CHANGE artifacts");
    }

    const engineeringPackageArtifact = createEngineeringPackageArtifact({
      workflowId: input.request.workflowId,
      actorId,
      createdAt: input.createdAt ?? codeChangeArtifacts[0].createdAt,
      stageId,
      codeChangeArtifacts,
      sourceSkillIds: executions.map((execution) => execution.result.metadata.skillId)
    });

    if (input.registerArtifacts ?? true) {
      const artifacts = this.requireArtifacts();

      for (const artifact of codeChangeArtifacts) {
        await artifacts.register(artifact);
      }

      await artifacts.register(engineeringPackageArtifact);
    }

    return {
      codeChangeArtifacts,
      engineeringPackageArtifact,
      skillResults: executions.map((execution) => execution.result),
      generatedArtifacts
    };
  }

  private async loadEngineeringContext(request: EngineeringRequest): Promise<{
    prd: BaseArtifact;
    techSpec: BaseArtifact;
    implementationPlan: BaseArtifact;
    workflowContext?: Awaited<ReturnType<ContextRetrievalService["getWorkflowContext"]>>;
  }> {
    const artifacts = this.requireArtifacts();
    this.assertWorkflowExists(request.workflowId);

    const prd = await requireArtifact(
      artifacts,
      request.prdArtifactId,
      ArtifactType.PRD
    );
    const techSpec = await requireArtifact(
      artifacts,
      request.techSpecArtifactId,
      ArtifactType.TECH_SPEC
    );
    const implementationPlan = await requireArtifact(
      artifacts,
      request.implementationPlanArtifactId,
      ArtifactType.IMPLEMENTATION_PLAN
    );
    const workflowContext = await this.dependencies.context?.getWorkflowContext({
      workflowId: request.workflowId,
      artifactIds: [prd.id, techSpec.id, implementationPlan.id],
      agentId: "engineering-agent",
      skillIds: (this.dependencies.skillGovernance ?? new SkillGovernanceService())
        .mapping.getSkillsForWorkflowStage("engineering")
        .map((skill) => skill.skillId)
    });

    return {
      prd,
      techSpec,
      implementationPlan,
      workflowContext
    };
  }

  private requireArtifacts(): ArtifactRegistry {
    if (!this.dependencies.artifacts) {
      throw new Error("Engineering Agent requires ArtifactRegistry integration");
    }

    return this.dependencies.artifacts;
  }

  private requireSkillRuntime(): SkillRuntimeService {
    if (!this.dependencies.skillRuntime) {
      throw new Error("Skill Runtime dependency is required for governed Engineering Agent execution");
    }

    return this.dependencies.skillRuntime;
  }

  private assertWorkflowExists(workflowId: string): void {
    if (!this.dependencies.workflows) {
      return;
    }

    const workflow: WorkflowInstance | undefined = this.dependencies.workflows.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found for engineering request: ${workflowId}`);
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
    throw new Error(`Engineering artifact not found: ${artifactId}`);
  }

  if (artifact.type !== artifactType) {
    throw new Error(`Engineering Agent requires ${artifactType} input: ${artifactId}`);
  }

  return artifact;
}

function normalizeCodeChangeArtifact(input: {
  artifact: BaseArtifact;
  index: number;
  actorId: string;
  workflowId: string;
  stageId: string;
  sourceSkillIds: string[];
}): BaseArtifact {
  return {
    ...input.artifact,
    id: `${input.workflowId}:code-change:${input.index + 1}`,
    createdBy: input.actorId,
    status: "active",
    metadata: {
      ...input.artifact.metadata,
      originalRuntimeArtifactId: input.artifact.id,
      workflowId: input.workflowId,
      stageId: input.stageId,
      sourceAgent: "agent:engineering",
      sourceSkillIds: input.sourceSkillIds,
      implementationSummary: input.artifact.description
    }
  };
}

function createEngineeringPackageArtifact(input: {
  workflowId: string;
  actorId: string;
  createdAt: string;
  stageId: string;
  codeChangeArtifacts: BaseArtifact[];
  sourceSkillIds: string[];
}): BaseArtifact {
  return {
    id: `${input.workflowId}:engineering-package`,
    type: ArtifactType.ENGINEERING_PACKAGE,
    title: "Engineering Package",
    description: "Aggregated engineering implementation package produced by governed implementation skills.",
    parentIds: input.codeChangeArtifacts.map((artifact) => artifact.id),
    createdBy: input.actorId,
    createdAt: input.createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId: input.workflowId,
      stageId: input.stageId,
      sourceAgent: "agent:engineering",
      sourceSkillIds: input.sourceSkillIds,
      codeChangeArtifactIds: input.codeChangeArtifacts.map((artifact) => artifact.id),
      packageType: "engineering",
      backendTasks: [
        "Implement service contracts from the technical specification.",
        "Add persistence and domain logic required by the implementation plan."
      ],
      frontendTasks: [
        "Build user-facing workflow screens from PRD acceptance criteria.",
        "Connect UI states to implementation-stage API contracts."
      ],
      databaseTasks: [
        "Add schema changes required by implementation artifacts.",
        "Preserve auditability for workflow and approval state."
      ],
      apiTasks: [
        "Expose workflow operations needed by the delivery package.",
        "Validate request and response contracts against the tech spec."
      ],
      migrationTasks: [
        "Prepare reversible data migrations.",
        "Document rollout and rollback sequencing."
      ],
      cronTasks: [
        "Schedule background jobs identified by implementation contributors.",
        "Add monitoring hooks for scheduled execution."
      ],
      dependencies: input.codeChangeArtifacts.map((artifact) => artifact.id),
      implementationOrder: [
        "database",
        "api",
        "backend",
        "frontend",
        "cron",
        "validation"
      ],
      sprintPlan: [
        "Sprint 1: backend, database, and API foundation.",
        "Sprint 2: frontend workflows, cron automation, and validation."
      ],
      storyPoints: 34,
      risks: [
        "Contributor outputs are deterministic mock artifacts until real execution is integrated.",
        "Engineering package scope depends on completeness of TECH_SPEC and IMPLEMENTATION_PLAN inputs."
      ]
    }
  };
}
