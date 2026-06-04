import type { ApprovalRequest } from "@apdos/approval-engine";
import type { BaseArtifact } from "@apdos/artifacts";
import type { ContextPackage } from "@apdos/context-engine";
import type { ValidationResult } from "@apdos/validation-engine";
import type { WorkflowInstance } from "@apdos/workflow-engine";

export interface DeliveryWorkflowRunInput {
  goal: string;
  workflowId?: string;
  actorId?: string;
  createdAt?: string;
}

export interface DeliveryWorkflowRunResult {
  workflow: WorkflowInstance;
  artifacts: BaseArtifact[];
  releasePackage: BaseArtifact;
  approvals: ApprovalRequest[];
  validationResults: ValidationResult[];
  contextPackages: ContextPackage[];
}
