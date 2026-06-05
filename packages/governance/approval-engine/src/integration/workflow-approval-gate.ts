import {
  type WorkflowExecutionService,
  type WorkflowInstance
} from "@apdos/workflow-engine";
import { ApprovalType } from "../contracts/approval-status.js";
import { ApprovalService } from "../services/approval-service.js";

export interface ProtectedStagePolicy {
  stageId: string;
  approvalType: ApprovalType;
}

export interface AdvanceProtectedStageInput {
  workflowId: string;
  stageId: string;
  occurredAt?: string;
  requestedBy: string;
}

export class WorkflowApprovalGate {
  constructor(
    private readonly approvals: ApprovalService,
    private readonly workflowEngine: WorkflowExecutionService,
    private readonly policies: readonly ProtectedStagePolicy[]
  ) {}

  advanceProtectedStage(input: AdvanceProtectedStageInput): WorkflowInstance {
    const policy = this.policies.find((candidate) => candidate.stageId === input.stageId);

    if (!policy) {
      return this.workflowEngine.advanceStage({
        workflowId: input.workflowId,
        stageId: input.stageId,
        occurredAt: input.occurredAt
      });
    }

    if (
      this.approvals.hasApprovedGate({
        workflowId: input.workflowId,
        stageId: input.stageId,
        approvalType: policy.approvalType
      })
    ) {
      return this.workflowEngine.advanceStage({
        workflowId: input.workflowId,
        stageId: input.stageId,
        occurredAt: input.occurredAt
      });
    }

    try {
      this.approvals.createApprovalRequest({
        workflowId: input.workflowId,
        stageId: input.stageId,
        approvalType: policy.approvalType,
        requestedBy: input.requestedBy,
        requestedAt: input.occurredAt,
        comments: "Workflow progression blocked pending human approval."
      });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("Pending approval already exists")) {
        throw error;
      }
    }

    this.workflowEngine.advanceStage({
      workflowId: input.workflowId,
      stageId: input.stageId,
      occurredAt: input.occurredAt
    });

    return this.workflowEngine.blockStage({
      workflowId: input.workflowId,
      stageId: input.stageId,
      reason: `Approval required: ${policy.approvalType}`,
      occurredAt: input.occurredAt
    });
  }
}
