import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { ContextRetrievalService } from "@apdos/context-engine";
import {
  WorkflowExecutionService,
  type WorkflowInstance
} from "@apdos/workflow-engine";
import type { ArchitectureRequest } from "../contracts/architecture-request.js";
import type { ImplementationPlanContract } from "../contracts/implementation-plan.js";
import type { TechnicalSpecificationContract } from "../contracts/technical-specification.js";
import {
  generateImplementationPlanWithDeterministicRules,
  generateTechSpecWithDeterministicRules,
  validateArchitectureRequest
} from "../generation/deterministic-architecture-generation.js";
import {
  createImplementationPlanArtifact,
  createTechSpecArtifact as buildTechSpecArtifact
} from "../reports/architecture-artifacts.js";

export interface ArchitectureAgentServiceDependencies {
  artifacts?: ArtifactRegistry;
  context?: ContextRetrievalService;
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
}

export class ArchitectureAgentService {
  constructor(
    private readonly dependencies: ArchitectureAgentServiceDependencies = {}
  ) {}

  async generateTechSpec(
    input: GenerateTechSpecInput
  ): Promise<TechnicalSpecificationContract> {
    validateArchitectureRequest(input.request);

    const context = await this.loadArchitectureContext(input.request);

    return generateTechSpecWithDeterministicRules(input.request, context);
  }

  async generateImplementationPlan(
    input: GenerateImplementationPlanInput
  ): Promise<ImplementationPlanContract> {
    validateArchitectureRequest(input.request);

    const context = await this.loadArchitectureContext(input.request);

    return generateImplementationPlanWithDeterministicRules(input.request, context);
  }

  async createTechSpecArtifact(
    input: CreateTechSpecArtifactInput
  ): Promise<ArchitectureArtifactCreationResult> {
    const context = await this.loadArchitectureContext(input.request);
    const techSpec = generateTechSpecWithDeterministicRules(input.request, context);
    const implementationPlan =
      generateImplementationPlanWithDeterministicRules(input.request, context);
    const actorId = input.actorId ?? "architecture-agent";
    const techSpecArtifact = buildTechSpecArtifact({
      request: input.request,
      techSpec,
      actorId,
      createdAt: input.createdAt,
      stageId: input.stageId
    });
    const implementationPlanArtifact = createImplementationPlanArtifact({
      request: input.request,
      techSpecArtifactId: techSpecArtifact.id,
      implementationPlan,
      actorId,
      createdAt: input.createdAt,
      stageId: input.stageId
    });

    if (input.registerArtifacts ?? true) {
      const artifacts = this.requireArtifacts();
      await artifacts.register(techSpecArtifact);
      await artifacts.register(implementationPlanArtifact);
    }

    return {
      techSpec,
      implementationPlan,
      techSpecArtifact,
      implementationPlanArtifact
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
      skillIds: ["technical-specification", "implementation-planning"]
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
