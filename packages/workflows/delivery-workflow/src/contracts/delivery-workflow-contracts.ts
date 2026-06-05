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

export interface ArtifactTraceabilityRecord {
  artifactId: string;
  parentIds: string[];
  ancestorIds: string[];
}

export interface DeliveryWorkflowTraceability {
  releasePackageId: string;
  records: ArtifactTraceabilityRecord[];
}

export interface DeliveryWorkflowRunResult {
  workflow: WorkflowInstance;
  artifacts: BaseArtifact[];
  engineeringPackage: BaseArtifact;
  releasePackage: BaseArtifact;
  approvals: ApprovalRequest[];
  validationResults: ValidationResult[];
  contextPackages: ContextPackage[];
  traceability: DeliveryWorkflowTraceability;
}
