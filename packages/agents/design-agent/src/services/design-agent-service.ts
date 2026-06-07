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
import type { DesignPackageContents } from "../contracts/design-package.js";
import {
  type DesignRequest,
  validateDesignRequest
} from "../contracts/design-request.js";

export interface DesignAgentServiceDependencies {
  artifacts?: ArtifactRegistry;
  context?: ContextRetrievalService;
  skillGovernance?: SkillGovernanceService;
  skillRuntime?: SkillRuntimeService;
  workflows?: WorkflowExecutionService;
}

export interface CreateDesignPackageInput {
  request: DesignRequest;
  actorId?: string;
  createdAt?: string;
  stageId?: string;
  registerArtifact?: boolean;
}

export interface DesignArtifactCreationResult {
  designPackageArtifact: BaseArtifact;
  skillResults: SkillResult[];
  generatedArtifacts: BaseArtifact[];
}

export class DesignAgentService {
  constructor(private readonly dependencies: DesignAgentServiceDependencies = {}) {}

  async createDesignPackage(input: CreateDesignPackageInput): Promise<DesignArtifactCreationResult> {
    validateDesignRequest(input.request);

    const context = await this.loadDesignContext(input.request);
    const stageId = input.stageId ?? "design";
    const actorId = input.actorId ?? "agent:design";
    const skillGovernance = this.dependencies.skillGovernance ?? new SkillGovernanceService();
    const skills = skillGovernance.mapping.getSkillsForWorkflowStage(stageId);
    const inputArtifacts = [
      context.discovery,
      context.prd,
      ...(context.techSpec ? [context.techSpec] : [])
    ];
    const executions = await new RuntimeSkillExecutor(this.requireSkillRuntime()).executeSkills({
      workflowId: input.request.workflowId,
      stageId,
      selectedAgent: actorId,
      skills,
      inputArtifacts,
      requestedAt: input.createdAt
    });
    const generatedArtifacts = executions.flatMap((execution) => execution.result.artifacts);

    if (generatedArtifacts.every((artifact) => artifact.type !== ArtifactType.DESIGN_PACKAGE)) {
      throw new Error("Design Agent skill execution did not produce DESIGN_PACKAGE artifacts");
    }

    const designPackageArtifact = createDesignPackageArtifact({
      workflowId: input.request.workflowId,
      actorId,
      createdAt: input.createdAt ?? generatedArtifacts[0].createdAt,
      stageId,
      inputArtifacts,
      sourceSkillIds: executions.map((execution) => execution.result.metadata.skillId)
    });

    if (input.registerArtifact ?? true) {
      await this.requireArtifacts().register(designPackageArtifact);
    }

    return {
      designPackageArtifact,
      skillResults: executions.map((execution) => execution.result),
      generatedArtifacts
    };
  }

  private async loadDesignContext(request: DesignRequest): Promise<{
    discovery: BaseArtifact;
    prd: BaseArtifact;
    techSpec?: BaseArtifact;
  }> {
    const artifacts = this.requireArtifacts();
    this.assertWorkflowExists(request.workflowId);

    const discovery = await requireArtifact(
      artifacts,
      request.discoveryArtifactId,
      ArtifactType.DISCOVERY_REPORT
    );
    const prd = await requireArtifact(artifacts, request.prdArtifactId, ArtifactType.PRD);
    const techSpec = request.techSpecArtifactId
      ? await requireArtifact(artifacts, request.techSpecArtifactId, ArtifactType.TECH_SPEC)
      : undefined;
    const artifactIds = [discovery.id, prd.id, ...(techSpec ? [techSpec.id] : [])];

    await this.dependencies.context?.getWorkflowContext({
      workflowId: request.workflowId,
      artifactIds,
      agentId: "design-agent",
      skillIds: (this.dependencies.skillGovernance ?? new SkillGovernanceService())
        .mapping.getSkillsForWorkflowStage("design")
        .map((skill) => skill.skillId)
    });

    return { discovery, prd, techSpec };
  }

  private requireArtifacts(): ArtifactRegistry {
    if (!this.dependencies.artifacts) {
      throw new Error("Design Agent requires ArtifactRegistry integration");
    }

    return this.dependencies.artifacts;
  }

  private requireSkillRuntime(): SkillRuntimeService {
    if (!this.dependencies.skillRuntime) {
      throw new Error("Skill Runtime dependency is required for governed Design Agent execution");
    }

    return this.dependencies.skillRuntime;
  }

  private assertWorkflowExists(workflowId: string): void {
    if (!this.dependencies.workflows) {
      return;
    }

    const workflow: WorkflowInstance | undefined = this.dependencies.workflows.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found for design request: ${workflowId}`);
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
    throw new Error(`Design artifact not found: ${artifactId}`);
  }

  if (artifact.type !== artifactType) {
    throw new Error(`Design Agent requires ${artifactType} input: ${artifactId}`);
  }

  return artifact;
}

function createDesignPackageArtifact(input: {
  workflowId: string;
  actorId: string;
  createdAt: string;
  stageId: string;
  inputArtifacts: BaseArtifact[];
  sourceSkillIds: string[];
}): BaseArtifact {
  const contents: DesignPackageContents = {
    personas: [
      "Supplier operations user submitting payment requests.",
      "Finance approver reviewing payment risk and evidence."
    ],
    userJourneys: [
      "Submit supplier payment request and track approval.",
      "Review payment request, resolve exceptions, and approve or reject."
    ],
    userFlows: [
      "Create request -> validate details -> submit -> approval decision -> completion.",
      "Open approval queue -> inspect evidence -> decide -> notify requester."
    ],
    informationArchitecture: [
      "Payment requests",
      "Approval queue",
      "Supplier records",
      "Audit history"
    ],
    screenInventory: [
      "Payment request list",
      "Payment request form",
      "Approval detail",
      "Decision confirmation",
      "Audit timeline"
    ],
    wireframeBlueprints: [
      "Dense request table with status, supplier, amount, and owner.",
      "Two-column approval detail with evidence and decision actions."
    ],
    componentInventory: [
      "Request table",
      "Status badge",
      "Approval actions",
      "Evidence panel",
      "Audit timeline"
    ],
    stateDefinitions: [
      "draft",
      "submitted",
      "pending approval",
      "approved",
      "rejected",
      "failed"
    ],
    navigationModel: [
      "Work queue -> request detail -> supplier detail",
      "Request detail -> approval history -> audit event"
    ],
    prototypeBlueprint: [
      "Prototype the requester submission path.",
      "Prototype the approver decision path.",
      "Validate empty, loading, error, and completed states."
    ]
  };

  return {
    id: `${input.workflowId}:design-package`,
    type: ArtifactType.DESIGN_PACKAGE,
    title: "Design Package",
    description: "Prototype-ready design package produced through governed design skill execution.",
    parentIds: input.inputArtifacts.map((artifact) => artifact.id),
    createdBy: input.actorId,
    createdAt: input.createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId: input.workflowId,
      stageId: input.stageId,
      sourceAgent: "agent:design",
      sourceSkillIds: input.sourceSkillIds,
      packageType: "design",
      ...contents
    }
  };
}
