import {
  ApprovalService,
  ApprovalType
} from "@apdos/approval-engine";
import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { ContextRetrievalService } from "@apdos/context-engine";
import {
  ValidatorRegistry,
  createBuiltInValidators,
  type ValidationResult
} from "@apdos/validation-engine";
import {
  WorkflowExecutionService,
  type WorkflowInstance
} from "@apdos/workflow-engine";
import {
  DELIVERY_STAGE_IDS,
  DELIVERY_WORKFLOW_DEFINITION,
  DELIVERY_WORKFLOW_TYPE
} from "../stages/delivery-stages.js";
import {
  createCodeChangeArtifact,
  createDiscoveryArtifact,
  createIdeaArtifact,
  createPrdArtifact,
  createReleasePackageArtifact,
  createTechSpecArtifact,
  createTestResultArtifact,
  type StageOutputInput
} from "../stages/mock-stage-outputs.js";
import type {
  DeliveryWorkflowRunInput,
  DeliveryWorkflowRunResult
} from "../services/delivery-workflow-result.js";

export interface DeliveryWorkflowServiceDependencies {
  artifacts?: ArtifactRegistry;
  workflows?: WorkflowExecutionService;
  approvals?: ApprovalService;
  validators?: ValidatorRegistry;
}

export class DeliveryWorkflowService {
  private readonly artifacts: ArtifactRegistry;
  private readonly workflows: WorkflowExecutionService;
  private readonly approvals: ApprovalService;
  private readonly validators: ValidatorRegistry;
  private readonly context: ContextRetrievalService;

  constructor(dependencies: DeliveryWorkflowServiceDependencies = {}) {
    this.artifacts = dependencies.artifacts ?? new ArtifactRegistry();
    this.workflows = dependencies.workflows ?? new WorkflowExecutionService();
    this.approvals = dependencies.approvals ?? new ApprovalService();
    this.validators = dependencies.validators ??
      new ValidatorRegistry(createBuiltInValidators());
    this.context = new ContextRetrievalService({
      artifacts: this.artifacts,
      workflows: this.workflows,
      approvals: this.approvals
    });
  }

  async run(input: DeliveryWorkflowRunInput): Promise<DeliveryWorkflowRunResult> {
    validateRunInput(input);

    const createdAt = input.createdAt ?? new Date().toISOString();
    const workflowId = input.workflowId ?? createWorkflowId(input.goal);
    const actorId = input.actorId ?? "delivery-workflow";
    const stageInput: StageOutputInput = {
      workflowId,
      goal: input.goal,
      actorId,
      createdAt
    };
    const artifacts: BaseArtifact[] = [];
    const validationResults: ValidationResult[] = [];
    const contextPackages: DeliveryWorkflowRunResult["contextPackages"] = [];

    this.workflows.startWorkflow({
      id: workflowId,
      workflowType: DELIVERY_WORKFLOW_TYPE,
      goal: input.goal,
      createdAt,
      definition: DELIVERY_WORKFLOW_DEFINITION
    });

    const idea = await this.runStage({
      workflowId,
      stageId: DELIVERY_STAGE_IDS.idea,
      artifact: createIdeaArtifact(stageInput),
      artifacts,
      contextPackages,
      contextArtifactIds: []
    });

    const discovery = await this.runStage({
      workflowId,
      stageId: DELIVERY_STAGE_IDS.discovery,
      artifact: createDiscoveryArtifact(stageInput, idea),
      artifacts,
      contextPackages,
      contextArtifactIds: [idea.id]
    });

    const prd = await this.runStage({
      workflowId,
      stageId: DELIVERY_STAGE_IDS.prd,
      artifact: createPrdArtifact(stageInput, idea, discovery),
      artifacts,
      contextPackages,
      contextArtifactIds: [discovery.id]
    });
    validationResults.push(this.validateRequiredArtifact(prd, artifacts));

    const techSpec = await this.runStage({
      workflowId,
      stageId: DELIVERY_STAGE_IDS.techSpec,
      artifact: createTechSpecArtifact(stageInput, prd),
      artifacts,
      contextPackages,
      contextArtifactIds: [prd.id]
    });

    const architectureApproval = this.approvals.createApprovalRequest({
      workflowId,
      stageId: DELIVERY_STAGE_IDS.techSpec,
      approvalType: ApprovalType.ARCHITECTURE_APPROVAL,
      requestedBy: actorId,
      requestedAt: createdAt,
      comments: "Deterministic architecture approval for delivery workflow V1."
    });
    this.approvals.approve({
      approvalId: architectureApproval.id,
      actorId,
      occurredAt: createdAt,
      comments: "Architecture approved by deterministic workflow gate."
    });
    validationResults.push(this.validateRequiredArtifact(techSpec, artifacts));

    await this.captureContext({
      workflowId,
      artifactIds: [techSpec.id],
      contextPackages
    });
    this.workflows.advanceStage({
      workflowId,
      stageId: DELIVERY_STAGE_IDS.validation,
      occurredAt: createdAt
    });
    const codeChange = await this.registerArtifact({
      artifact: createCodeChangeArtifact(stageInput, techSpec),
      artifacts
    });
    const testResult = await this.registerArtifact({
      artifact: createTestResultArtifact(stageInput, codeChange),
      artifacts
    });
    this.workflows.completeStage({
      workflowId,
      stageId: DELIVERY_STAGE_IDS.validation,
      artifactIds: [codeChange.id, testResult.id],
      occurredAt: createdAt
    });

    await this.captureContext({
      workflowId,
      artifactIds: [codeChange.id, testResult.id],
      contextPackages
    });

    await this.runApprovalStage({
      workflowId,
      actorId,
      artifactIds: [codeChange.id, testResult.id],
      contextPackages
    });

    const releasePackage = createReleasePackageArtifact(stageInput, codeChange, testResult);
    const releaseValidation = this.validateRequiredArtifact(
      releasePackage,
      [...artifacts, releasePackage]
    );
    validationResults.push(releaseValidation);
    assertValidValidationResult(releaseValidation);

    const registeredReleasePackage = await this.runStage({
      workflowId,
      stageId: DELIVERY_STAGE_IDS.releasePackage,
      artifact: releasePackage,
      artifacts,
      contextPackages,
      contextArtifactIds: [codeChange.id, testResult.id]
    });

    const workflow = this.requireWorkflow(workflowId);

    return {
      workflow,
      artifacts,
      releasePackage: registeredReleasePackage,
      approvals: this.approvals.listApprovals(),
      validationResults,
      contextPackages
    };
  }

  private async runStage(input: {
    workflowId: string;
    stageId: string;
    artifact: BaseArtifact;
    artifacts: BaseArtifact[];
    contextPackages: DeliveryWorkflowRunResult["contextPackages"];
    contextArtifactIds: string[];
  }): Promise<BaseArtifact> {
    await this.captureContext({
      workflowId: input.workflowId,
      artifactIds: input.contextArtifactIds,
      contextPackages: input.contextPackages
    });

    this.workflows.advanceStage({
      workflowId: input.workflowId,
      stageId: input.stageId,
      occurredAt: input.artifact.createdAt
    });

    const artifact = await this.artifacts.register(input.artifact);
    input.artifacts.push(artifact);

    this.workflows.completeStage({
      workflowId: input.workflowId,
      stageId: input.stageId,
      artifactIds: [artifact.id],
      occurredAt: input.artifact.createdAt
    });

    return artifact;
  }

  private async registerArtifact(input: {
    artifact: BaseArtifact;
    artifacts: BaseArtifact[];
  }): Promise<BaseArtifact> {
    const artifact = await this.artifacts.register(input.artifact);
    input.artifacts.push(artifact);
    return artifact;
  }

  private async runApprovalStage(input: {
    workflowId: string;
    actorId: string;
    artifactIds: string[];
    contextPackages: DeliveryWorkflowRunResult["contextPackages"];
  }): Promise<void> {
    await this.captureContext({
      workflowId: input.workflowId,
      artifactIds: input.artifactIds,
      contextPackages: input.contextPackages
    });

    this.workflows.advanceStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.approval
    });

    const productionApproval = this.approvals.createApprovalRequest({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.releasePackage,
      approvalType: ApprovalType.PRODUCTION_APPROVAL,
      requestedBy: input.actorId,
      comments: "Release package creation requires production approval."
    });

    this.approvals.approve({
      approvalId: productionApproval.id,
      actorId: input.actorId,
      comments: "Production release approved for deterministic workflow V1."
    });

    this.workflows.completeStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.approval,
      artifactIds: input.artifactIds
    });
  }

  private validateRequiredArtifact(
    artifact: BaseArtifact,
    artifacts: BaseArtifact[]
  ): ValidationResult {
    const result = this.validators.validateArtifact(artifact, {
      artifacts,
      approvals: this.approvals.listApprovals()
    });
    assertValidValidationResult(result);
    return result;
  }

  private async captureContext(input: {
    workflowId: string;
    artifactIds: string[];
    contextPackages: DeliveryWorkflowRunResult["contextPackages"];
  }): Promise<void> {
    input.contextPackages.push(
      await this.context.getWorkflowContext({
        workflowId: input.workflowId,
        artifactIds: input.artifactIds,
        agentId: "delivery-workflow-v1",
        skillIds: ["repo-router", "prd-writer", "tech-spec-writer", "release"]
      })
    );
  }

  private requireWorkflow(workflowId: string): WorkflowInstance {
    const workflow = this.workflows.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return workflow;
  }
}

function validateRunInput(input: DeliveryWorkflowRunInput): void {
  if (!input.goal.trim()) {
    throw new Error("Delivery workflow goal is required");
  }
}

function createWorkflowId(goal: string): string {
  return `delivery:${goal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "workflow"}`;
}

function assertValidValidationResult(result: ValidationResult): void {
  if (!result.valid) {
    throw new Error(
      `Artifact validation failed for ${result.artifactId}: ${result.findings
        .map((finding) => `${finding.ruleId}=${finding.message}`)
        .join("; ")}`
    );
  }
}
