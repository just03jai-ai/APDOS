import { ArtifactType, type BaseArtifact } from "@apdos/artifacts";
import type { ContextPackage } from "@apdos/context-engine";
import type { ArchitectureRequest } from "../contracts/architecture-request.js";
import type { ImplementationPlanContract } from "../contracts/implementation-plan.js";
import type { TechnicalSpecificationContract } from "../contracts/technical-specification.js";

export interface ArchitectureGenerationContext {
  idea: BaseArtifact;
  discoveryReport: BaseArtifact;
  prd: BaseArtifact;
  workflowContext?: ContextPackage;
}

interface PrdMetadata {
  problemStatement?: string;
  businessObjective?: string;
  scope?: string[];
  acceptanceCriteria?: string[];
  successMetrics?: string[] | string;
  dependencies?: string[];
  risks?: string[];
}

interface DiscoveryReportMetadata {
  affectedSystems?: string[];
  dependencies?: string[];
  risks?: string[];
}

export function validateArchitectureRequest(request: ArchitectureRequest): void {
  if (!request.workflowId.trim()) {
    throw new Error("Architecture request workflowId is required");
  }

  if (!request.prdArtifactId.trim()) {
    throw new Error("Architecture request prdArtifactId is required");
  }
}

export function generateTechSpecWithDeterministicRules(
  request: ArchitectureRequest,
  context: ArchitectureGenerationContext
): TechnicalSpecificationContract {
  validateArchitectureRequest(request);
  validateSourceArtifacts(request, context);

  const goal = resolveGoal(context.idea);
  const prd = resolvePrdMetadata(context.prd);
  const discovery = resolveDiscoveryMetadata(context.discoveryReport);
  const systems = discovery.affectedSystems ?? ["artifact-engine", "workflow-engine"];
  const dependencies = uniqueStrings([
    ...(prd.dependencies ?? []),
    ...(discovery.dependencies ?? []),
    "ArtifactRegistry",
    "WorkflowExecutionService",
    "ContextRetrievalService",
    "ValidatorRegistry",
    "ApprovalService"
  ]);

  return {
    architectureOverview:
      `Implement ${goal} as a governed APDOS delivery flow that converts product requirements into traceable artifacts, validation evidence, and approval-gated release output.`,
    components: [
      "ArchitectureAgentService for deterministic technical specification generation.",
      "ArtifactRegistry for TECH_SPEC and IMPLEMENTATION_PLAN persistence.",
      "ContextRetrievalService for Idea, Discovery Report, PRD, and workflow context loading.",
      "WorkflowExecutionService for stage transition evidence.",
      "ValidatorRegistry for required TECH_SPEC governance checks.",
      ...systems.map((system) => `System adapter boundary for ${system}.`)
    ],
    interfaces: [
      "ArchitectureAgentService.generateTechSpec(request)",
      "ArchitectureAgentService.generateImplementationPlan(request)",
      "ArchitectureAgentService.createTechSpecArtifact(request)",
      "ArtifactRegistry.register(TECH_SPEC)",
      "ArtifactRegistry.register(IMPLEMENTATION_PLAN)"
    ],
    apiContracts: [
      "ArchitectureRequest { workflowId, prdArtifactId }",
      "TechnicalSpecificationContract { architectureOverview, components, interfaces, apiContracts, dataModel, dependencies, risks, assumptions }",
      "ImplementationPlanContract { phases, milestones, tasks, dependencies }"
    ],
    dataModel: [
      "TECH_SPEC parentIds include the PRD artifact id.",
      "IMPLEMENTATION_PLAN parentIds include the TECH_SPEC artifact id.",
      "TECH_SPEC metadata stores architectureOverview, components, interfaces, apiContracts, dataModel, dependencies, risks, and assumptions.",
      "IMPLEMENTATION_PLAN metadata stores phases, milestones, tasks, and dependencies."
    ],
    dependencies,
    risks: uniqueStrings([
      ...(prd.risks ?? []),
      ...(discovery.risks ?? []),
      "Technical design may drift from validated product requirements.",
      "Implementation tasks may omit required validation or approval evidence."
    ]),
    assumptions: [
      "The PRD has already passed validation before architecture generation.",
      "The workflow context includes the Idea and Discovery Report ancestors.",
      `The architecture was generated with ${context.workflowContext?.workflowHistory.length ?? 0} workflow history event(s).`
    ]
  };
}

export function generateImplementationPlanWithDeterministicRules(
  request: ArchitectureRequest,
  context: ArchitectureGenerationContext
): ImplementationPlanContract {
  validateArchitectureRequest(request);
  validateSourceArtifacts(request, context);

  const prd = resolvePrdMetadata(context.prd);
  const dependencies = uniqueStrings([
    ...(prd.dependencies ?? []),
    "Validated PRD",
    "Architecture approval",
    "Validation evidence"
  ]);

  return {
    phases: [
      "Architecture setup",
      "Service implementation",
      "Workflow integration",
      "Validation and release evidence"
    ],
    milestones: [
      "TECH_SPEC artifact generated and registered.",
      "IMPLEMENTATION_PLAN artifact generated and registered.",
      "Delivery Workflow V1 tech-spec stage completes with architecture artifacts.",
      "TECH_SPEC validation passes before validation stage progression."
    ],
    tasks: [
      "Load PRD, Idea, Discovery Report, and workflow context.",
      "Generate deterministic technical specification.",
      "Generate deterministic implementation plan.",
      "Register TECH_SPEC and IMPLEMENTATION_PLAN artifacts with lineage.",
      "Validate TECH_SPEC with Validation Engine.",
      "Use architecture artifacts as parents for downstream implementation evidence."
    ],
    dependencies
  };
}

function validateSourceArtifacts(
  request: ArchitectureRequest,
  context: ArchitectureGenerationContext
): void {
  if (context.prd.id !== request.prdArtifactId) {
    throw new Error("Architecture request prdArtifactId does not match loaded PRD artifact");
  }

  if (context.prd.type !== ArtifactType.PRD) {
    throw new Error(`Architecture Agent expected PRD artifact, received ${context.prd.type}`);
  }

  if (context.idea.type !== ArtifactType.IDEA) {
    throw new Error(`Architecture Agent expected IDEA artifact, received ${context.idea.type}`);
  }

  if (context.discoveryReport.type !== ArtifactType.DISCOVERY_REPORT) {
    throw new Error(
      `Architecture Agent expected DISCOVERY_REPORT artifact, received ${context.discoveryReport.type}`
    );
  }
}

function resolveGoal(idea: BaseArtifact): string {
  const goal = idea.metadata.goal;

  return typeof goal === "string" && goal.trim()
    ? goal.trim().replace(/\s+/g, " ")
    : idea.title;
}

function resolvePrdMetadata(prd: BaseArtifact): PrdMetadata {
  return {
    problemStatement: stringValue(prd.metadata.problemStatement),
    businessObjective: stringValue(prd.metadata.businessObjective),
    scope: stringArrayValue(prd.metadata.scope),
    acceptanceCriteria: stringArrayValue(prd.metadata.acceptanceCriteria),
    successMetrics: stringArrayOrStringValue(prd.metadata.successMetrics),
    dependencies: stringArrayValue(prd.metadata.dependencies),
    risks: stringArrayValue(prd.metadata.risks)
  };
}

function resolveDiscoveryMetadata(discoveryReport: BaseArtifact): DiscoveryReportMetadata {
  const report = discoveryReport.metadata.report;

  if (!isRecord(report)) {
    return {};
  }

  return {
    affectedSystems: stringArrayValue(report.affectedSystems),
    dependencies: stringArrayValue(report.dependencies),
    risks: stringArrayValue(report.risks)
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function stringArrayValue(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? [...value]
    : undefined;
}

function stringArrayOrStringValue(value: unknown): string[] | string | undefined {
  return typeof value === "string" ? value : stringArrayValue(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim())));
}
