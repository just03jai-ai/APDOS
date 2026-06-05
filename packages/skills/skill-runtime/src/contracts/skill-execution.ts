import type { BaseArtifact } from "@apdos/artifacts";

export interface SkillExecutionContext {
  workflowId?: string;
  agentId: string;
  stageId?: string;
  requestedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface SkillExecutionRequest {
  skillId: string;
  version: string;
  inputArtifacts: BaseArtifact[];
  context: SkillExecutionContext;
}

export interface SkillFinding {
  id: string;
  severity: "info" | "warning" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface SkillResultMetadata {
  executionId: string;
  skillId: string;
  skillName: string;
  version: string;
  agentId: string;
  startedAt: string;
  completedAt: string;
  status: "succeeded";
  deterministic: boolean;
  inputArtifactIds: string[];
}

export interface SkillResult {
  artifacts: BaseArtifact[];
  findings: SkillFinding[];
  metadata: SkillResultMetadata;
}
