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
  type GovernanceDecision,
  type GovernanceFindingEvidence,
  type GovernanceFindingSeverity,
  type GovernancePackageContents
} from "../contracts/governance-package.js";
import {
  type GovernanceRequest,
  validateGovernanceRequest
} from "../contracts/governance-request.js";

export interface GovernanceAgentServiceDependencies {
  artifacts?: ArtifactRegistry;
  context?: ContextRetrievalService;
  skillGovernance?: SkillGovernanceService;
  skillRuntime?: SkillRuntimeService;
  workflows?: WorkflowExecutionService;
}

export interface CreateGovernancePackageInput {
  request: GovernanceRequest;
  actorId?: string;
  createdAt?: string;
  stageId?: string;
  registerArtifacts?: boolean;
}

export interface GovernanceArtifactCreationResult {
  governancePackageArtifact: BaseArtifact;
  governanceFindingArtifacts: BaseArtifact[];
  skillResults: SkillResult[];
  generatedArtifacts: BaseArtifact[];
}

export class GovernanceAgentService {
  constructor(private readonly dependencies: GovernanceAgentServiceDependencies = {}) {}

  async createGovernancePackage(
    input: CreateGovernancePackageInput
  ): Promise<GovernanceArtifactCreationResult> {
    validateGovernanceRequest(input.request);

    const context = await this.loadGovernanceContext(input.request);
    const stageId = input.stageId ?? "governance";
    const actorId = input.actorId ?? "agent:governance";
    const governance = this.dependencies.skillGovernance ?? new SkillGovernanceService();
    const skills = governance.mapping.getSkillsForWorkflowStage(stageId);
    const executions = await new RuntimeSkillExecutor(this.requireSkillRuntime()).executeSkills({
      workflowId: input.request.workflowId,
      stageId,
      selectedAgent: actorId,
      skills,
      inputArtifacts: [
        context.prd,
        context.techSpec,
        context.implementationPlan,
        context.engineeringPackage,
        context.qaPackage
      ],
      requestedAt: input.createdAt
    });
    const generatedArtifacts = executions.flatMap((execution) => execution.result.artifacts);
    const sourceSkillIds = executions.map((execution) => execution.result.metadata.skillId);
    const normalizedArtifactIdsByRuntimeId = new Map<string, string>();
    const governanceFindingArtifacts = generatedArtifacts
      .filter((artifact) => artifact.type === ArtifactType.GOVERNANCE_FINDING)
      .map((artifact, index) => {
        const execution = executions.find(
          (candidate) => candidate.result.metadata.skillId === artifact.metadata.skillId
        );
        const normalized = normalizeGovernanceFinding({
          artifact,
          id: `${input.request.workflowId}:governance-finding:${index + 1}`,
          actorId,
          workflowId: input.request.workflowId,
          stageId,
          sourceSkillIds: [String(artifact.metadata.skillId)],
          governanceSeverity: highestGovernanceSeverity(
            execution?.result.findings.map(resolveGovernanceSeverity) ?? ["LOW"]
          ),
          normalizedArtifactIdsByRuntimeId
        });
        normalizedArtifactIdsByRuntimeId.set(artifact.id, normalized.id);
        return normalized;
      });

    if (governanceFindingArtifacts.length === 0) {
      throw new Error("Governance Agent skill execution did not produce GOVERNANCE_FINDING artifacts");
    }

    const contents = createGovernancePackageContents(
      executions.map((execution) => execution.result),
      context.qaPackage
    );
    const governancePackageArtifact = createGovernancePackageArtifact({
      workflowId: input.request.workflowId,
      actorId,
      createdAt: input.createdAt ?? governanceFindingArtifacts[0].createdAt,
      stageId,
      parentArtifacts: [
        context.prd,
        context.techSpec,
        context.implementationPlan,
        context.engineeringPackage,
        context.qaPackage,
        ...governanceFindingArtifacts
      ],
      sourceSkillIds,
      contents
    });

    if (input.registerArtifacts ?? true) {
      const artifacts = this.requireArtifacts();

      for (const artifact of governanceFindingArtifacts) {
        await artifacts.register(artifact);
      }
      await artifacts.register(governancePackageArtifact);
    }

    return {
      governancePackageArtifact,
      governanceFindingArtifacts,
      skillResults: executions.map((execution) => execution.result),
      generatedArtifacts
    };
  }

  private async loadGovernanceContext(request: GovernanceRequest): Promise<{
    prd: BaseArtifact;
    techSpec: BaseArtifact;
    implementationPlan: BaseArtifact;
    engineeringPackage: BaseArtifact;
    qaPackage: BaseArtifact;
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
    const qaPackage = await requireArtifact(
      artifacts,
      request.qaPackageArtifactId,
      ArtifactType.QA_PACKAGE
    );

    await this.dependencies.context?.getWorkflowContext({
      workflowId: request.workflowId,
      artifactIds: [prd.id, techSpec.id, implementationPlan.id, engineeringPackage.id, qaPackage.id],
      agentId: "agent:governance",
      skillIds: (this.dependencies.skillGovernance ?? new SkillGovernanceService())
        .mapping.getSkillsForWorkflowStage("governance")
        .map((skill) => skill.skillId)
    });

    return { prd, techSpec, implementationPlan, engineeringPackage, qaPackage };
  }

  private requireArtifacts(): ArtifactRegistry {
    if (!this.dependencies.artifacts) {
      throw new Error("Governance Agent requires ArtifactRegistry integration");
    }
    return this.dependencies.artifacts;
  }

  private requireSkillRuntime(): SkillRuntimeService {
    if (!this.dependencies.skillRuntime) {
      throw new Error("Skill Runtime dependency is required for governed Governance Agent execution");
    }
    return this.dependencies.skillRuntime;
  }

  private assertWorkflowExists(workflowId: string): void {
    if (!this.dependencies.workflows) {
      return;
    }
    const workflow: WorkflowInstance | undefined = this.dependencies.workflows.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found for governance request: ${workflowId}`);
    }
  }
}

export function generateGovernanceDecision(input: {
  blockers: string[];
  openQuestions: string[];
  qualityFindings: string[];
}): GovernanceDecision {
  if (input.blockers.length > 0) {
    return "NO_GO";
  }
  if (input.openQuestions.length > 0 || input.qualityFindings.length > 0) {
    return "CONDITIONAL_GO";
  }
  return "GO";
}

function createGovernancePackageContents(
  results: SkillResult[],
  qaPackage: BaseArtifact
): GovernancePackageContents {
  const findings = results.flatMap((result) =>
    result.findings.map((finding) => ({
      ...finding,
      skillId: result.metadata.skillId,
      skillName: result.metadata.skillName,
      governanceSeverity: resolveGovernanceSeverity(finding)
    }))
  );
  const qaFailed = qaPackage.metadata.passed === false || qaPackage.metadata.status === "failed";
  const evidence: GovernanceFindingEvidence[] = findings.map((finding) => ({
    message: finding.message,
    severity: finding.governanceSeverity,
    skillId: finding.skillId
  }));
  if (qaFailed) {
    evidence.push({
      message: "QA package reports failed validation.",
      severity: "CRITICAL",
      skillId: "qa-package"
    });
  }
  const blockers = evidence
    .filter((finding) => finding.severity === "CRITICAL")
    .map((finding) => finding.message);
  const qualityFindings = findings
    .filter((finding) => finding.governanceSeverity === "MEDIUM" || finding.governanceSeverity === "HIGH")
    .map((finding) => finding.message);
  const openQuestions = findings.flatMap((finding) => {
    const openQuestion = finding.metadata?.openQuestion;
    return typeof openQuestion === "string" && openQuestion.trim() ? [openQuestion] : [];
  });

  return {
    riskAssessment: blockers.length > 0 ? blockers : ["No blocking governance risks identified."],
    securityReview: messagesForSkill(findings, "git-guardian"),
    complianceReview: messagesForSkill(findings, "conventions"),
    dependencyRisks: messagesForSkill(findings, "ai-data-analyst"),
    architectureConcerns: qualityFindings,
    qualityFindings,
    openQuestions,
    approvalChecklist: [
      "Architecture approval recorded",
      "QA evidence reviewed",
      "Governance findings acknowledged"
    ],
    recommendations:
      blockers.length > 0
        ? ["Resolve all blocking governance findings before release."]
        : openQuestions.length > 0 || qualityFindings.length > 0
          ? ["Resolve review findings or obtain explicit approval before release."]
          : ["Proceed through the standard production approval gate."],
    decision: generateGovernanceDecision({ blockers, openQuestions, qualityFindings }),
    findings: evidence
  };
}

export function resolveGovernanceSeverity(finding: {
  severity: "info" | "warning" | "error";
  metadata?: Record<string, unknown>;
}): GovernanceFindingSeverity {
  const explicitSeverity = finding.metadata?.governanceSeverity;
  if (
    explicitSeverity === "LOW" ||
    explicitSeverity === "MEDIUM" ||
    explicitSeverity === "HIGH" ||
    explicitSeverity === "CRITICAL"
  ) {
    return explicitSeverity;
  }
  if (
    finding.metadata?.blocking === true ||
    finding.metadata?.outcome === "failed" ||
    (finding.severity === "error" && finding.metadata?.deterministic !== true)
  ) {
    return "CRITICAL";
  }
  if (finding.metadata?.requiresReview === true) {
    return "MEDIUM";
  }
  if (finding.severity === "warning" && finding.metadata?.deterministic !== true) {
    return "MEDIUM";
  }
  return "LOW";
}

function messagesForSkill(
  findings: Array<{ message: string; skillName: string }>,
  skillName: string
): string[] {
  return findings.filter((finding) => finding.skillName === skillName).map((finding) => finding.message);
}

async function requireArtifact(
  artifacts: ArtifactRegistry,
  artifactId: string,
  artifactType: ArtifactType
): Promise<BaseArtifact> {
  const artifact = await artifacts.retrieve(artifactId);
  if (!artifact) {
    throw new Error(`Governance artifact not found: ${artifactId}`);
  }
  if (artifact.type !== artifactType) {
    throw new Error(`Governance Agent requires ${artifactType} input: ${artifactId}`);
  }
  return artifact;
}

function normalizeGovernanceFinding(input: {
  artifact: BaseArtifact;
  id: string;
  actorId: string;
  workflowId: string;
  stageId: string;
  sourceSkillIds: string[];
  governanceSeverity: GovernanceFindingSeverity;
  normalizedArtifactIdsByRuntimeId: Map<string, string>;
}): BaseArtifact {
  return {
    ...input.artifact,
    id: input.id,
    parentIds: input.artifact.parentIds.map(
      (parentId) => input.normalizedArtifactIdsByRuntimeId.get(parentId) ?? parentId
    ),
    createdBy: input.actorId,
    status: "active",
    metadata: {
      ...input.artifact.metadata,
      originalRuntimeArtifactId: input.artifact.id,
      workflowId: input.workflowId,
      stageId: input.stageId,
      sourceAgent: "agent:governance",
      sourceSkillIds: input.sourceSkillIds,
      governanceSeverity: input.governanceSeverity
    }
  };
}

function highestGovernanceSeverity(
  severities: GovernanceFindingSeverity[]
): GovernanceFindingSeverity {
  const rank: Record<GovernanceFindingSeverity, number> = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3
  };

  return severities.reduce(
    (highest, severity) => rank[severity] > rank[highest] ? severity : highest,
    "LOW"
  );
}

function createGovernancePackageArtifact(input: {
  workflowId: string;
  actorId: string;
  createdAt: string;
  stageId: string;
  parentArtifacts: BaseArtifact[];
  sourceSkillIds: string[];
  contents: GovernancePackageContents;
}): BaseArtifact {
  return {
    id: `${input.workflowId}:governance-package`,
    type: ArtifactType.GOVERNANCE_PACKAGE,
    title: "Governance Package",
    description: "Approval-ready governance package produced by governed governance skills.",
    parentIds: input.parentArtifacts.map((artifact) => artifact.id),
    createdBy: input.actorId,
    createdAt: input.createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId: input.workflowId,
      stageId: input.stageId,
      sourceAgent: "agent:governance",
      sourceSkillIds: input.sourceSkillIds,
      packageType: "governance",
      ...input.contents
    }
  };
}
