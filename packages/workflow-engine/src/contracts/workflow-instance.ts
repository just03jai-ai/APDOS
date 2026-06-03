import { StageStatus, WorkflowStatus } from "./workflow-status.js";

export interface WorkflowStage {
  id: string;
  name: string;
  status: StageStatus;
  artifactIds: string[];
  startedAt?: string;
  completedAt?: string;
  statusReason?: string;
}

export interface WorkflowHistoryEvent {
  id: string;
  workflowId: string;
  stageId?: string;
  type:
    | "WORKFLOW_CREATED"
    | "WORKFLOW_STARTED"
    | "STAGE_STARTED"
    | "STAGE_COMPLETED"
    | "STAGE_FAILED"
    | "STAGE_BLOCKED"
    | "WORKFLOW_COMPLETED"
    | "WORKFLOW_FAILED"
    | "WORKFLOW_BLOCKED";
  fromStatus?: WorkflowStatus | StageStatus;
  toStatus: WorkflowStatus | StageStatus;
  artifactIds: string[];
  reason?: string;
  occurredAt: string;
}

export interface WorkflowInstance {
  id: string;
  workflowType: string;
  goal: string;
  status: WorkflowStatus;
  stages: WorkflowStage[];
  history: WorkflowHistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface StartWorkflowInput {
  id?: string;
  workflowType: string;
  goal: string;
  definition: {
    id: string;
    stages: Array<{
      id: string;
      name: string;
    }>;
  };
  createdAt?: string;
  artifactIdsByStageId?: Record<string, string[]>;
}

export interface AdvanceStageInput {
  workflowId: string;
  stageId?: string;
  occurredAt?: string;
}

export interface CompleteStageInput {
  workflowId: string;
  stageId: string;
  artifactIds?: string[];
  occurredAt?: string;
}

export interface FailStageInput {
  workflowId: string;
  stageId: string;
  reason: string;
  occurredAt?: string;
}

export interface BlockStageInput {
  workflowId: string;
  stageId: string;
  reason: string;
  occurredAt?: string;
}
