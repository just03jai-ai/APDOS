import type { ArtifactType } from "@apdos/artifacts";
import type { AgentCapability } from "./agent-capability.js";

export type AgentStatus = "available" | "experimental" | "deprecated";

export interface AgentExecutionConstraints {
  maxConcurrentRuns?: number;
  requiresHumanApproval?: boolean;
  allowedWorkflowStages?: string[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  status: AgentStatus;
  capabilities: AgentCapability[];
  inputArtifacts: ArtifactType[];
  outputArtifacts: ArtifactType[];
  requiredSkills: string[];
  executionConstraints: AgentExecutionConstraints;
}
