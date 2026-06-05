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
  type ProductRequest,
  validateProductRequest
} from "../contracts/product-request.js";

export interface ProductAgentServiceDependencies {
  artifacts?: ArtifactRegistry;
  context?: ContextRetrievalService;
  skillGovernance?: SkillGovernanceService;
  skillRuntime?: SkillRuntimeService;
  workflows?: WorkflowExecutionService;
}

export interface CreatePrdArtifactInput {
  request: ProductRequest;
  actorId?: string;
  createdAt?: string;
  stageId?: string;
  registerArtifact?: boolean;
}

export interface ProductArtifactCreationResult {
  prdArtifact: BaseArtifact;
  skillResults: SkillResult[];
  generatedArtifacts: BaseArtifact[];
}

export class ProductAgentService {
  constructor(private readonly dependencies: ProductAgentServiceDependencies = {}) {}

  async createPrdArtifact(input: CreatePrdArtifactInput): Promise<ProductArtifactCreationResult> {
    validateProductRequest(input.request);
    const discoveryArtifact = await this.resolveDiscoveryArtifact(input.request);
    await this.loadProductContext(input.request, discoveryArtifact);
    this.assertWorkflowExists(input.request.workflowId);

    const skillGovernance = this.dependencies.skillGovernance ?? new SkillGovernanceService();
    const skills = skillGovernance.mapping.getSkillsForWorkflowStage(input.stageId ?? "prd");
    const executor = new RuntimeSkillExecutor(this.requireSkillRuntime());
    const executions = await executor.executeSkills({
      workflowId: input.request.workflowId,
      stageId: input.stageId ?? "prd",
      selectedAgent: input.actorId ?? "agent:product",
      skills,
      inputArtifacts: [discoveryArtifact],
      requestedAt: input.createdAt
    });
    const generatedArtifacts = executions.flatMap((execution) => execution.result.artifacts);
    const runtimePrd = generatedArtifacts.find((artifact) => artifact.type === ArtifactType.PRD);

    if (!runtimePrd) {
      throw new Error("Product Agent skill execution did not produce PRD artifact");
    }

    const prdArtifact: BaseArtifact = {
      ...runtimePrd,
      id: `${input.request.workflowId}:prd`,
      parentIds: uniqueStrings([...discoveryArtifact.parentIds, discoveryArtifact.id]),
      createdBy: input.actorId ?? "product-agent",
      status: "active",
      metadata: {
        ...runtimePrd.metadata,
        workflowId: input.request.workflowId,
        stageId: input.stageId ?? "prd",
        sourceAgent: "agent:product",
        sourceSkillIds: executions.map((execution) => execution.result.metadata.skillId),
        problemStatement: runtimePrd.description,
        successMetrics: ["PRD generated through governed skill execution."]
      }
    };

    if (input.registerArtifact ?? true) {
      await this.dependencies.artifacts?.register(prdArtifact);
    }

    return {
      prdArtifact,
      skillResults: executions.map((execution) => execution.result),
      generatedArtifacts
    };
  }

  private async resolveDiscoveryArtifact(request: ProductRequest): Promise<BaseArtifact> {
    const artifact = await this.dependencies.artifacts?.retrieve(request.discoveryArtifactId);

    if (!artifact) {
      throw new Error(`Discovery artifact not found: ${request.discoveryArtifactId}`);
    }

    if (artifact.type !== ArtifactType.DISCOVERY_REPORT) {
      throw new Error(`Product Agent requires DISCOVERY_REPORT input: ${request.discoveryArtifactId}`);
    }

    return artifact;
  }

  private async loadProductContext(request: ProductRequest, discoveryArtifact: BaseArtifact): Promise<void> {
    await this.dependencies.context?.getWorkflowContext({
      workflowId: request.workflowId,
      artifactIds: [discoveryArtifact.id],
      agentId: "product-agent",
      skillIds: (this.dependencies.skillGovernance ?? new SkillGovernanceService())
        .mapping.getSkillsForWorkflowStage("prd")
        .map((skill) => skill.skillId)
    });
  }

  private requireSkillRuntime(): SkillRuntimeService {
    if (!this.dependencies.skillRuntime) {
      throw new Error("Skill Runtime dependency is required for governed Product Agent execution");
    }

    return this.dependencies.skillRuntime;
  }

  private assertWorkflowExists(workflowId: string): void {
    if (!this.dependencies.workflows) {
      return;
    }

    const workflow: WorkflowInstance | undefined = this.dependencies.workflows.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found for product request: ${workflowId}`);
    }
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}
