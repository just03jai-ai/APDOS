import type { ArtifactRegistry, BaseArtifact } from "@apdos/artifacts";
import type { SkillGovernanceService, SkillGovernanceMetadata } from "@apdos/skill-governance";
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
