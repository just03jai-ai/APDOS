import {
  ApprovalService,
  ApprovalType
} from "@apdos/approval-engine";
import { ArchitectureAgentService } from "@apdos/architecture-agent";
import {
  ArtifactLineageGraph,
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { ContextRetrievalService } from "@apdos/context-engine";
import { DiscoveryAgentService } from "@apdos/discovery-agent";
import { EngineeringAgentService } from "@apdos/engineering-agent";
import { GovernanceAgentService } from "@apdos/governance-agent";
import type { GovernanceDecision } from "@apdos/governance-agent";
import { ProductAgentService } from "@apdos/product-agent";
import { QaAgentService } from "@apdos/qa-agent";
import { SkillRuntimeService } from "@apdos/skill-runtime";
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
  createIdeaArtifact,
  createReleasePackageArtifact,
  type StageOutputInput
} from "../stages/mock-stage-outputs.js";
import type {
  DeliveryWorkflowRunInput,
  DeliveryWorkflowRunResult,
  DeliveryWorkflowTraceability
} from "../services/delivery-workflow-result.js";

export interface DeliveryWorkflowServiceDependencies {
  artifacts?: ArtifactRegistry;
  workflows?: WorkflowExecutionService;
  approvals?: ApprovalService;
  architectureAgent?: ArchitectureAgentService;
  discoveryAgent?: DiscoveryAgentService;
  engineeringAgent?: EngineeringAgentService;
  governanceAgent?: GovernanceAgentService;
  productAgent?: ProductAgentService;
  qaAgent?: QaAgentService;
  validators?: ValidatorRegistry;
}

export class DeliveryWorkflowService {
  private readonly artifacts: ArtifactRegistry;
  private readonly workflows: WorkflowExecutionService;
  private readonly approvals: ApprovalService;
  private readonly architectureAgent: ArchitectureAgentService;
  private readonly discoveryAgent: DiscoveryAgentService;
  private readonly engineeringAgent: EngineeringAgentService;
  private readonly governanceAgent: GovernanceAgentService;
  private readonly productAgent: ProductAgentService;
  private readonly qaAgent: QaAgentService;
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
    const skillRuntime = new SkillRuntimeService();
    this.discoveryAgent = dependencies.discoveryAgent ??
      new DiscoveryAgentService({
        artifacts: this.artifacts,
        context: this.context,
        workflows: this.workflows,
        skillRuntime
      });
    this.productAgent = dependencies.productAgent ??
      new ProductAgentService({
        artifacts: this.artifacts,
        context: this.context,
        workflows: this.workflows,
        skillRuntime
      });
    this.architectureAgent = dependencies.architectureAgent ??
      new ArchitectureAgentService({
        artifacts: this.artifacts,
        context: this.context,
        workflows: this.workflows,
        skillRuntime
      });
    this.engineeringAgent = dependencies.engineeringAgent ??
      new EngineeringAgentService({
        artifacts: this.artifacts,
        context: this.context,
        workflows: this.workflows,
        skillRuntime
      });
    this.governanceAgent = dependencies.governanceAgent ??
      new GovernanceAgentService({
        artifacts: this.artifacts,
        context: this.context,
        workflows: this.workflows,
        skillRuntime
      });
    this.qaAgent = dependencies.qaAgent ??
      new QaAgentService({
        artifacts: this.artifacts,
        context: this.context,
        workflows: this.workflows,
        skillRuntime
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

    const discovery = await this.runDiscoveryStage({
      workflowId,
      goal: input.goal,
      actorId,
      createdAt,
      idea,
      artifacts,
      contextPackages
    });

    const prd = await this.runProductStage({
      workflowId,
      actorId,
      createdAt,
      discovery,
      artifacts,
      contextPackages
    });
    validationResults.push(this.validateRequiredArtifact(prd, artifacts));

    const { techSpec, implementationPlan } = await this.runArchitectureStage({
      workflowId,
      actorId,
      createdAt,
      prd,
      artifacts,
      contextPackages
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

    const { engineeringPackage, codeChanges } = await this.runEngineeringStage({
      workflowId,
      actorId,
      createdAt,
      prd,
      techSpec,
      implementationPlan,
      artifacts,
      contextPackages
    });
    const codeChange = codeChanges[0];

    const { qaPackage, testResults, governanceFindings } = await this.runQaStage({
      workflowId,
      actorId,
      createdAt,
      prd,
      techSpec,
      implementationPlan,
      engineeringPackage,
      artifacts,
      contextPackages
    });
    const testResult = testResults[0];

    const { governancePackage, governanceFindings: governanceStageFindings } =
      await this.runGovernanceStage({
        workflowId,
        actorId,
        createdAt,
        prd,
        techSpec,
        implementationPlan,
        engineeringPackage,
        qaPackage,
        artifacts,
        contextPackages
      });
    const governanceDecision = requireGovernanceDecision(governancePackage);

    await this.captureContext({
      workflowId,
      artifactIds: [
        governancePackage.id,
        ...testResults.map((artifact) => artifact.id),
        ...governanceFindings.map((artifact) => artifact.id),
        ...governanceStageFindings.map((artifact) => artifact.id)
      ],
      contextPackages
    });
    this.workflows.advanceStage({
      workflowId,
      stageId: DELIVERY_STAGE_IDS.validation,
      occurredAt: createdAt
    });
    this.workflows.completeStage({
      workflowId,
      stageId: DELIVERY_STAGE_IDS.validation,
      artifactIds: [governancePackage.id, testResult.id],
      occurredAt: createdAt
    });

    await this.captureContext({
      workflowId,
      artifactIds: [governancePackage.id, testResult.id],
      contextPackages
    });

    await this.runApprovalStage({
      workflowId,
      actorId,
      artifactIds: [governancePackage.id, testResult.id],
      governanceDecision,
      contextPackages
    });

    const releasePackage = createReleasePackageArtifact(
      stageInput,
      codeChange,
      testResult,
      governancePackage
    );
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
      engineeringPackage,
      qaPackage,
      governancePackage,
      releasePackage: registeredReleasePackage,
      approvals: this.approvals.listApprovals(),
      validationResults,
      contextPackages,
      traceability: createTraceability(registeredReleasePackage, artifacts)
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

  private async runDiscoveryStage(input: {
    workflowId: string;
    goal: string;
    actorId: string;
    createdAt: string;
    idea: BaseArtifact;
    artifacts: BaseArtifact[];
    contextPackages: DeliveryWorkflowRunResult["contextPackages"];
  }): Promise<BaseArtifact> {
    await this.captureContext({
      workflowId: input.workflowId,
      artifactIds: [input.idea.id],
      contextPackages: input.contextPackages
    });

    this.workflows.advanceStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.discovery,
      occurredAt: input.createdAt
    });

    const { artifact } = await this.discoveryAgent.generateDiscoveryReport({
      request: {
        goal: input.goal,
        workflowId: input.workflowId,
        contextIds: [input.idea.id]
      },
      parentArtifactIds: [input.idea.id],
      actorId: input.actorId,
      createdAt: input.createdAt,
      stageId: DELIVERY_STAGE_IDS.discovery
    });
    input.artifacts.push(artifact);

    this.workflows.completeStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.discovery,
      artifactIds: [artifact.id],
      occurredAt: input.createdAt
    });

    return artifact;
  }

  private async runProductStage(input: {
    workflowId: string;
    actorId: string;
    createdAt: string;
    discovery: BaseArtifact;
    artifacts: BaseArtifact[];
    contextPackages: DeliveryWorkflowRunResult["contextPackages"];
  }): Promise<BaseArtifact> {
    await this.captureContext({
      workflowId: input.workflowId,
      artifactIds: [input.discovery.id],
      contextPackages: input.contextPackages
    });

    this.workflows.advanceStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.prd,
      occurredAt: input.createdAt
    });

    const { prdArtifact } = await this.productAgent.createPrdArtifact({
      request: {
        workflowId: input.workflowId,
        discoveryArtifactId: input.discovery.id
      },
      actorId: input.actorId,
      createdAt: input.createdAt,
      stageId: DELIVERY_STAGE_IDS.prd
    });
    input.artifacts.push(prdArtifact);

    this.workflows.completeStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.prd,
      artifactIds: [prdArtifact.id],
      occurredAt: input.createdAt
    });

    return prdArtifact;
  }

  private async runArchitectureStage(input: {
    workflowId: string;
    actorId: string;
    createdAt: string;
    prd: BaseArtifact;
    artifacts: BaseArtifact[];
    contextPackages: DeliveryWorkflowRunResult["contextPackages"];
  }): Promise<{
    techSpec: BaseArtifact;
    implementationPlan: BaseArtifact;
  }> {
    await this.captureContext({
      workflowId: input.workflowId,
      artifactIds: [input.prd.id],
      contextPackages: input.contextPackages
    });

    this.workflows.advanceStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.techSpec,
      occurredAt: input.createdAt
    });

    const { techSpecArtifact, implementationPlanArtifact } =
      await this.architectureAgent.createTechSpecArtifact({
        request: {
          workflowId: input.workflowId,
          prdArtifactId: input.prd.id
        },
        actorId: input.actorId,
        createdAt: input.createdAt,
        stageId: DELIVERY_STAGE_IDS.techSpec
      });
    input.artifacts.push(techSpecArtifact, implementationPlanArtifact);

    this.workflows.completeStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.techSpec,
      artifactIds: [techSpecArtifact.id, implementationPlanArtifact.id],
      occurredAt: input.createdAt
    });

    return {
      techSpec: techSpecArtifact,
      implementationPlan: implementationPlanArtifact
    };
  }

  private async runEngineeringStage(input: {
    workflowId: string;
    actorId: string;
    createdAt: string;
    prd: BaseArtifact;
    techSpec: BaseArtifact;
    implementationPlan: BaseArtifact;
    artifacts: BaseArtifact[];
    contextPackages: DeliveryWorkflowRunResult["contextPackages"];
  }): Promise<{
    engineeringPackage: BaseArtifact;
    codeChanges: BaseArtifact[];
  }> {
    await this.captureContext({
      workflowId: input.workflowId,
      artifactIds: [input.prd.id, input.techSpec.id, input.implementationPlan.id],
      contextPackages: input.contextPackages
    });

    this.workflows.advanceStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.engineering,
      occurredAt: input.createdAt
    });

    const { codeChangeArtifacts, engineeringPackageArtifact } =
      await this.engineeringAgent.createCodeChangeArtifacts({
        request: {
          workflowId: input.workflowId,
          prdArtifactId: input.prd.id,
          techSpecArtifactId: input.techSpec.id,
          implementationPlanArtifactId: input.implementationPlan.id
        },
        actorId: input.actorId,
        createdAt: input.createdAt,
        stageId: DELIVERY_STAGE_IDS.engineering
      });
    input.artifacts.push(...codeChangeArtifacts, engineeringPackageArtifact);

    this.workflows.completeStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.engineering,
      artifactIds: [
        ...codeChangeArtifacts.map((artifact) => artifact.id),
        engineeringPackageArtifact.id
      ],
      occurredAt: input.createdAt
    });

    return {
      engineeringPackage: engineeringPackageArtifact,
      codeChanges: codeChangeArtifacts
    };
  }

  private async runQaStage(input: {
    workflowId: string;
    actorId: string;
    createdAt: string;
    prd: BaseArtifact;
    techSpec: BaseArtifact;
    implementationPlan: BaseArtifact;
    engineeringPackage: BaseArtifact;
    artifacts: BaseArtifact[];
    contextPackages: DeliveryWorkflowRunResult["contextPackages"];
  }): Promise<{
    qaPackage: BaseArtifact;
    testResults: BaseArtifact[];
    governanceFindings: BaseArtifact[];
  }> {
    await this.captureContext({
      workflowId: input.workflowId,
      artifactIds: [
        input.prd.id,
        input.techSpec.id,
        input.implementationPlan.id,
        input.engineeringPackage.id
      ],
      contextPackages: input.contextPackages
    });

    this.workflows.advanceStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.qa,
      occurredAt: input.createdAt
    });

    const {
      qaPackageArtifact,
      testResultArtifacts,
      governanceFindingArtifacts
    } = await this.qaAgent.createQaPackage({
      request: {
        workflowId: input.workflowId,
        prdArtifactId: input.prd.id,
        techSpecArtifactId: input.techSpec.id,
        implementationPlanArtifactId: input.implementationPlan.id,
        engineeringPackageArtifactId: input.engineeringPackage.id
      },
      actorId: input.actorId,
      createdAt: input.createdAt,
      stageId: DELIVERY_STAGE_IDS.qa
    });
    input.artifacts.push(
      ...testResultArtifacts,
      ...governanceFindingArtifacts,
      qaPackageArtifact
    );

    this.workflows.completeStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.qa,
      artifactIds: [
        ...testResultArtifacts.map((artifact) => artifact.id),
        ...governanceFindingArtifacts.map((artifact) => artifact.id),
        qaPackageArtifact.id
      ],
      occurredAt: input.createdAt
    });

    return {
      qaPackage: qaPackageArtifact,
      testResults: testResultArtifacts,
      governanceFindings: governanceFindingArtifacts
    };
  }

  private async runGovernanceStage(input: {
    workflowId: string;
    actorId: string;
    createdAt: string;
    prd: BaseArtifact;
    techSpec: BaseArtifact;
    implementationPlan: BaseArtifact;
    engineeringPackage: BaseArtifact;
    qaPackage: BaseArtifact;
    artifacts: BaseArtifact[];
    contextPackages: DeliveryWorkflowRunResult["contextPackages"];
  }): Promise<{
    governancePackage: BaseArtifact;
    governanceFindings: BaseArtifact[];
  }> {
    await this.captureContext({
      workflowId: input.workflowId,
      artifactIds: [
        input.prd.id,
        input.techSpec.id,
        input.implementationPlan.id,
        input.engineeringPackage.id,
        input.qaPackage.id
      ],
      contextPackages: input.contextPackages
    });

    this.workflows.advanceStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.governance,
      occurredAt: input.createdAt
    });

    let governancePackageArtifact: BaseArtifact;
    let governanceFindingArtifacts: BaseArtifact[];

    try {
      const result = await this.governanceAgent.createGovernancePackage({
        request: {
          workflowId: input.workflowId,
          prdArtifactId: input.prd.id,
          techSpecArtifactId: input.techSpec.id,
          implementationPlanArtifactId: input.implementationPlan.id,
          engineeringPackageArtifactId: input.engineeringPackage.id,
          qaPackageArtifactId: input.qaPackage.id
        },
        actorId: input.actorId,
        createdAt: input.createdAt,
        stageId: DELIVERY_STAGE_IDS.governance
      });
      governancePackageArtifact = result.governancePackageArtifact;
      governanceFindingArtifacts = result.governanceFindingArtifacts;
    } catch (error) {
      this.workflows.failStage({
        workflowId: input.workflowId,
        stageId: DELIVERY_STAGE_IDS.governance,
        reason: error instanceof Error ? error.message : "Governance execution failed",
        occurredAt: input.createdAt
      });
      throw error;
    }
    input.artifacts.push(...governanceFindingArtifacts, governancePackageArtifact);

    const decision = requireGovernanceDecision(governancePackageArtifact);
    if (decision === "NO_GO") {
      this.workflows.failStage({
        workflowId: input.workflowId,
        stageId: DELIVERY_STAGE_IDS.governance,
        reason: "Governance decision is NO_GO",
        occurredAt: input.createdAt
      });
      throw new Error("Governance decision blocked delivery workflow: NO_GO");
    }
    if (decision === "CONDITIONAL_GO") {
      this.approvals.createApprovalRequest({
        workflowId: input.workflowId,
        stageId: DELIVERY_STAGE_IDS.governance,
        approvalType: ApprovalType.PRODUCTION_APPROVAL,
        requestedBy: input.actorId,
        requestedAt: input.createdAt,
        comments: "Conditional governance decision requires explicit approval before workflow progression."
      });
      this.workflows.blockStage({
        workflowId: input.workflowId,
        stageId: DELIVERY_STAGE_IDS.governance,
        reason: "Governance decision is CONDITIONAL_GO and requires approval",
        occurredAt: input.createdAt
      });
      throw new Error("Governance decision blocked delivery workflow pending approval: CONDITIONAL_GO");
    }

    this.workflows.completeStage({
      workflowId: input.workflowId,
      stageId: DELIVERY_STAGE_IDS.governance,
      artifactIds: [
        ...governanceFindingArtifacts.map((artifact) => artifact.id),
        governancePackageArtifact.id
      ],
      occurredAt: input.createdAt
    });

    return {
      governancePackage: governancePackageArtifact,
      governanceFindings: governanceFindingArtifacts
    };
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
    governanceDecision: GovernanceDecision;
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
      comments:
        input.governanceDecision === "CONDITIONAL_GO"
          ? "Conditional governance decision requires explicit production approval."
          : "Release package creation requires production approval."
    });

    this.approvals.approve({
      approvalId: productionApproval.id,
      actorId: input.actorId,
      comments: `Production release approved after governance decision: ${input.governanceDecision}.`
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
        skillIds: [
          "repo-router",
          "prd-writer",
          "tech-spec-writer",
          "backend-contributor",
          "frontend-contributor",
          "test-plan-writer",
          "git-guardian",
          "conventions",
          "ai-data-analyst",
          "release"
        ]
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

function requireGovernanceDecision(artifact: BaseArtifact): GovernanceDecision {
  const decision = artifact.metadata.decision;

  if (decision !== "GO" && decision !== "CONDITIONAL_GO" && decision !== "NO_GO") {
    throw new Error(`Invalid governance decision on artifact: ${artifact.id}`);
  }

  return decision;
}

function createTraceability(
  releasePackage: BaseArtifact,
  artifacts: BaseArtifact[]
): DeliveryWorkflowTraceability {
  const lineage = new ArtifactLineageGraph(artifacts);

  return {
    releasePackageId: releasePackage.id,
    records: artifacts.map((artifact) => ({
      artifactId: artifact.id,
      parentIds: [...artifact.parentIds],
      ancestorIds: lineage.getAncestors(artifact.id).map((ancestor) => ancestor.id)
    }))
  };
}
