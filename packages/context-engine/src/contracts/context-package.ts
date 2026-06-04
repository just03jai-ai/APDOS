import type { ApprovalRequest } from "@apdos/approval-engine";
import type { BaseArtifact } from "@apdos/artifacts";
import type { WorkflowHistoryEvent } from "@apdos/workflow-engine";

export interface GovernanceFinding {
  id: string;
  workflowId?: string;
  artifactId?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ContextPackageMetadata {
  workflowId: string;
  agentId: string;
  skillIds: string[];
  requestedArtifactIds: string[];
  includedArtifactIds: string[];
  omittedArtifactIds: string[];
  limits: ContextSizeLimits;
}

export interface ContextSizeLimits {
  maxArtifacts: number;
  maxWorkflowHistoryEvents: number;
  maxApprovals: number;
  maxGovernanceFindings: number;
}

export interface ContextPackage {
  artifacts: BaseArtifact[];
  workflowHistory: WorkflowHistoryEvent[];
  approvals: ApprovalRequest[];
  governanceFindings: GovernanceFinding[];
  metadata: ContextPackageMetadata;
}
