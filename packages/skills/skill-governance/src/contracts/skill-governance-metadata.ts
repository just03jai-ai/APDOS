import type { ArtifactType } from "@apdos/artifacts";

export type SkillId = string;
export type AgentId = string;
export type WorkflowStageId = string;

export interface SkillGovernanceMetadata {
  skillId: SkillId;
  ownerAgent: AgentId;
  workflowStage: WorkflowStageId;
  inputArtifacts: ArtifactType[];
  outputArtifacts: ArtifactType[];
  dependencies: SkillId[];
  executionOrder: number;
  enabled: boolean;
}

export interface SkillRecommendationContext {
  agentId?: AgentId;
  workflowStage?: WorkflowStageId;
  availableArtifacts?: ArtifactType[];
  completedSkills?: SkillId[];
}

export interface SkillDependencyIssue {
  skillId: SkillId;
  dependency: SkillId;
  reason: "missing" | "disabled" | "cycle";
}

export interface SkillDependencyValidationResult {
  valid: boolean;
  issues: SkillDependencyIssue[];
}

export interface SkillGraphNode {
  skillId: SkillId;
  ownerAgent: AgentId;
  workflowStage: WorkflowStageId;
  executionOrder: number;
  enabled: boolean;
}

export interface SkillGraphEdge {
  fromSkillId: SkillId;
  toSkillId: SkillId;
}

export interface SkillDependencyGraph {
  nodes: SkillGraphNode[];
  edges: SkillGraphEdge[];
}
