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
import type { ArchitectureRequest } from "../contracts/architecture-request.js";
import type { ImplementationPlanContract } from "../contracts/implementation-plan.js";
import type { TechnicalSpecificationContract } from "../contracts/technical-specification.js";
import {
  validateArchitectureRequest
} from "../generation/deterministic-architecture-generation.js";

export interface ArchitectureAgentServiceDependencies {
  artifacts?: ArtifactRegistry;
  context?: ContextRetrievalService;
  skillGovernance?: SkillGovernanceService;
  skillRuntime?: SkillRuntimeService;
  workflows?: WorkflowExecutionService;
}

export interface GenerateTechSpecInput {
  request: ArchitectureRequest;
}

export interface GenerateImplementationPlanInput {
  request: ArchitectureRequest;
}

export interface CreateTechSpecArtifactInput {
  request: ArchitectureRequest;
  actorId?: string;
  createdAt?: string;
  stageId?: string;
  registerArtifacts?: boolean;
}

export interface ArchitectureArtifactCreationResult {
  techSpec: TechnicalSpecificationContract;
  implementationPlan: ImplementationPlanContract;
  techSpecArtifact: BaseArtifact;
  implementationPlanArtifact: BaseArtifact;
  skillResults: SkillResult[];
  generatedArtifacts: BaseArtifact[];
}

export class ArchitectureAgentService {
  constructor(
    private readonly dependencies: ArchitectureAgentServiceDependencies = {}
  ) {}

  async generateTechSpec(
    input: GenerateTechSpecInput
  ): Promise<TechnicalSpecificationContract> {
    validateArchitectureRequest(input.request);

    const result = await this.executeArchitectureSkills(input.request);

    return createTechSpecContract(
      requireArtifactType(result.generatedArtifacts, ArtifactType.TECH_SPEC)
    );
  }

  async generateImplementationPlan(
    input: GenerateImplementationPlanInput
  ): Promise<ImplementationPlanContract> {
    validateArchitectureRequest(input.request);

    const result = await this.executeArchitectureSkills(input.request);

    return createImplementationPlanContract(
      requireArtifactType(result.generatedArtifacts, ArtifactType.IMPLEMENTATION_PLAN)
    );
  }

  async createTechSpecArtifact(
    input: CreateTechSpecArtifactInput
  ): Promise<ArchitectureArtifactCreationResult> {
    validateArchitectureRequest(input.request);

    const result = await this.executeArchitectureSkills(input.request, {
      requestedAt: input.createdAt,
      stageId: input.stageId ?? "tech-spec",
      actorId: input.actorId ?? "agent:architecture"
    });
    const actorId = input.actorId ?? "architecture-agent";
    const techSpecArtifact = normalizeRuntimeArtifact({
      artifact: requireArtifactType(result.generatedArtifacts, ArtifactType.TECH_SPEC),
      id: `${input.request.workflowId}:tech-spec`,
      actorId,
      workflowId: input.request.workflowId,
      stageId: input.stageId ?? "tech-spec",
      metadata: {
        architecture: `Skill-powered architecture for ${input.request.prdArtifactId}.`,
        architectureOverview: `Skill-powered architecture for ${input.request.prdArtifactId}.`,
        interfaces: ["SkillRuntime.executeSkill(request)"],
        apiContracts: ["SkillExecutionRequest", "SkillResult"],
        sourceSkillIds: result.skillResults.map((skillResult) => skillResult.metadata.skillId)
      }
    });
    const implementationPlanArtifact = normalizeRuntimeArtifact({
      artifact: requireArtifactType(result.generatedArtifacts, ArtifactType.IMPLEMENTATION_PLAN),
      id: `${input.request.workflowId}:implementation-plan`,
      actorId,
      workflowId: input.request.workflowId,
      stageId: input.stageId ?? "tech-spec",
      metadata: {
        phases: ["Governed skill execution", "Artifact registration", "Validation"],
        milestones: ["Architecture skills executed through Skill Runtime."],
        tasks: ["Execute governed skills through Skill Runtime", "Preserve artifact lineage"],
        dependencies: [techSpecArtifact.id],
        sourceSkillIds: result.skillResults.map((skillResult) => skillResult.metadata.skillId)
      }
    });
    implementationPlanArtifact.parentIds = implementationPlanArtifact.parentIds.map((parentId) =>
      parentId === techSpecArtifact.metadata.originalRuntimeArtifactId
        ? techSpecArtifact.id
        : parentId
    );
    const techSpec = createTechSpecContract(techSpecArtifact);
    const implementationPlan = createImplementationPlanContract(implementationPlanArtifact);

    if (input.registerArtifacts ?? true) {
      const artifacts = this.requireArtifacts();
      await artifacts.register(techSpecArtifact);
      await artifacts.register(implementationPlanArtifact);
    }

    return {
      techSpec,
      implementationPlan,
      techSpecArtifact,
      implementationPlanArtifact,
      skillResults: result.skillResults,
      generatedArtifacts: result.generatedArtifacts
    };
  }

  private async executeArchitectureSkills(
    request: ArchitectureRequest,
    options: { requestedAt?: string; stageId?: string; actorId?: string } = {}
  ): Promise<{ skillResults: SkillResult[]; generatedArtifacts: BaseArtifact[] }> {
    const context = await this.loadArchitectureContext(request);
    const skillRuntime = this.requireSkillRuntime();
    const skillGovernance = this.dependencies.skillGovernance ?? new SkillGovernanceService();
    const skills = skillGovernance.mapping.getSkillsForWorkflowStage(options.stageId ?? "tech-spec");
    const executor = new RuntimeSkillExecutor(skillRuntime);
    const executions = await executor.executeSkills({
      workflowId: request.workflowId,
      stageId: options.stageId ?? "tech-spec",
      selectedAgent: options.actorId ?? "agent:architecture",
      skills,
      inputArtifacts: [context.prd],
      requestedAt: options.requestedAt
    });

    return {
      skillResults: executions.map((execution) => execution.result),
      generatedArtifacts: executions.flatMap((execution) => execution.result.artifacts)
    };
  }

  private async loadArchitectureContext(request: ArchitectureRequest): Promise<{
    idea: BaseArtifact;
    discoveryReport: BaseArtifact;
    prd: BaseArtifact;
    workflowContext?: Awaited<ReturnType<ContextRetrievalService["getWorkflowContext"]>>;
  }> {
    const artifacts = this.requireArtifacts();
    this.assertWorkflowExists(request.workflowId);

    const prd = await artifacts.retrieve(request.prdArtifactId);

    if (!prd) {
      throw new Error(`PRD artifact not found: ${request.prdArtifactId}`);
    }

    const allArtifacts = await artifacts.list();
    const idea = resolveParentArtifact(prd, allArtifacts, ArtifactType.IDEA);
    const discoveryReport = resolveParentArtifact(
      prd,
      allArtifacts,
      ArtifactType.DISCOVERY_REPORT
    );

    const workflowContext = await this.dependencies.context?.getWorkflowContext({
      workflowId: request.workflowId,
      artifactIds: [idea.id, discoveryReport.id, prd.id],
      agentId: "architecture-agent",
      skillIds: (this.dependencies.skillGovernance ?? new SkillGovernanceService())
        .mapping.getSkillsForWorkflowStage("tech-spec")
        .map((skill) => skill.skillId)
    });

    return {
      idea,
      discoveryReport,
      prd,
      workflowContext
    };
  }

  private requireArtifacts(): ArtifactRegistry {
    if (!this.dependencies.artifacts) {
      throw new Error("Architecture Agent requires ArtifactRegistry integration");
    }

    return this.dependencies.artifacts;
  }

  private requireSkillRuntime(): SkillRuntimeService {
    if (!this.dependencies.skillRuntime) {
      throw new Error("Skill Runtime dependency is required for governed Architecture Agent execution");
    }

    return this.dependencies.skillRuntime;
  }

  private assertWorkflowExists(workflowId: string): void {
    if (!this.dependencies.workflows) {
      return;
    }

    const workflow: WorkflowInstance | undefined =
      this.dependencies.workflows.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found for architecture request: ${workflowId}`);
    }
  }
}

function requireArtifactType(artifacts: BaseArtifact[], type: ArtifactType): BaseArtifact {
  const artifact = artifacts.find((candidate) => candidate.type === type);

  if (!artifact) {
    throw new Error(`Skill execution did not produce required artifact type: ${type}`);
  }

  return artifact;
}

function normalizeRuntimeArtifact(input: {
  artifact: BaseArtifact;
  id: string;
  actorId: string;
  workflowId: string;
  stageId: string;
  metadata: Record<string, unknown>;
}): BaseArtifact {
  return {
    ...input.artifact,
    id: input.id,
    createdBy: input.actorId,
    status: "active",
    metadata: {
      ...input.artifact.metadata,
      ...input.metadata,
      originalRuntimeArtifactId: input.artifact.id,
      workflowId: input.workflowId,
      stageId: input.stageId,
      sourceAgent: "agent:architecture"
    }
  };
}

function createTechSpecContract(artifact: BaseArtifact): TechnicalSpecificationContract {
  return {
    architectureOverview: String(
      artifact.metadata.architectureOverview ??
        artifact.metadata.architecture ??
        artifact.description
    ),
    components: ["Skill Runtime", "Skill Governance", "Artifact Registry"],
    interfaces: Array.isArray(artifact.metadata.interfaces)
      ? artifact.metadata.interfaces.map(String)
      : ["SkillRuntime.executeSkill(request)"],
    apiContracts: ["SkillExecutionRequest", "SkillResult"],
    dataModel: ["BaseArtifact", "SkillGovernanceMetadata"],
    dependencies: ["Skill Governance metadata", "Skill Runtime registry"],
    risks: ["Runtime skill metadata must remain compatible with governance metadata."],
    assumptions: ["Governed skills are loaded before agent execution."]
  };
}

function createImplementationPlanContract(artifact: BaseArtifact): ImplementationPlanContract {
  return {
    phases: ["Governed skill execution", "Artifact registration", "Validation"],
    milestones: [`Generated ${artifact.type} from ${artifact.metadata.skillId ?? "runtime skill"}.`],
    tasks: ["Execute governed skills through Skill Runtime", "Preserve artifact lineage"],
    dependencies: artifact.parentIds
  };
}

function resolveParentArtifact(
  artifact: BaseArtifact,
  artifacts: BaseArtifact[],
  type: ArtifactType
): BaseArtifact {
  const parent = artifacts.find(
    (candidate) => artifact.parentIds.includes(candidate.id) && candidate.type === type
  );

  if (!parent) {
    throw new Error(`${type} parent not found for artifact: ${artifact.id}`);
  }

  return parent;
}
