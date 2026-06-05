import type { ArtifactRegistry, BaseArtifact } from "@apdos/artifacts";
import type { SkillGovernanceService, SkillGovernanceMetadata } from "@apdos/skill-governance";
import type { SkillDefinition } from "@apdos/skill-registry";
import type { SkillResult, SkillRuntimeService } from "@apdos/skill-runtime";
import type {
  WorkflowExecutionService,
  WorkflowInstance,
  WorkflowStage
} from "@apdos/workflow-engine";

export interface RuntimeOrchestratorDependencies {
  workflowExecutionService?: WorkflowExecutionService;
  skillGovernance?: SkillGovernanceService;
  skillRuntime?: SkillRuntimeService;
  artifactRegistry?: ArtifactRegistry;
}

export interface RuntimeHealthCheckResult {
  valid: boolean;
  governedSkillNames: string[];
  runtimeSkillNames: string[];
  missingSkillNames: string[];
  extraSkillNames: string[];
  dependencyIssues: string[];
  metadataIssues: string[];
  executableSkillNames: string[];
}

export interface RuntimeSkillRegistrySnapshot {
  governedSkills: SkillGovernanceMetadata[];
  runtimeSkills: SkillDefinition[];
}

export interface RuntimeStageResolution {
  workflow: WorkflowInstance;
  stage: WorkflowStage;
}

export interface RuntimeSkillExecution {
  skill: SkillGovernanceMetadata;
  result: SkillResult;
}

export interface ExecuteRuntimeStageInput {
  workflowId: string;
  stageId?: string;
  inputArtifacts: BaseArtifact[];
  requestedAt?: string;
}

export interface RuntimeExecutionResult {
  selectedAgent: string;
  executedSkills: RuntimeSkillExecution[];
  generatedArtifacts: BaseArtifact[];
  nextStage?: WorkflowStage;
}

export class RuntimeValidationError extends Error {
  constructor(
    message: string,
    readonly result?: RuntimeHealthCheckResult
  ) {
    super(message);
    this.name = "RuntimeValidationError";
  }
}

export class RuntimeExecutionError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "RuntimeExecutionError";
  }
}

export class WorkflowExecutionError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "WorkflowExecutionError";
  }
}
