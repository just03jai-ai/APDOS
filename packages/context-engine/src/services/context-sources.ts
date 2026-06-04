import type { ApprovalRequest } from "@apdos/approval-engine";
import type { BaseArtifact } from "@apdos/artifacts";
import type { WorkflowInstance } from "@apdos/workflow-engine";
import type { GovernanceFinding } from "../contracts/context-package.js";

export interface ArtifactContextSource {
  retrieve(id: string): Promise<BaseArtifact | undefined>;
  list(): Promise<BaseArtifact[]>;
}

export interface WorkflowContextSource {
  getWorkflow(workflowId: string): WorkflowInstance | undefined;
}

export interface ApprovalContextSource {
  listApprovals(): ApprovalRequest[];
}

export interface GovernanceFindingSource {
  listFindings(): GovernanceFinding[];
}

export interface ContextSources {
  artifacts: ArtifactContextSource;
  workflows: WorkflowContextSource;
  approvals?: ApprovalContextSource;
  governanceFindings?: GovernanceFindingSource;
}
