import {
  type ApprovalRequest,
  type CreateApprovalRequestInput,
  type ResolveApprovalInput
} from "../contracts/approval-request.js";
import {
  ApprovalStatus,
  ApprovalType
} from "../contracts/approval-status.js";
import {
  InMemoryApprovalStateStore,
  type ApprovalStateStore
} from "../state/approval-state-store.js";

export class ApprovalService {
  constructor(
    private readonly store: ApprovalStateStore = new InMemoryApprovalStateStore()
  ) {}

  createApprovalRequest(input: CreateApprovalRequestInput): ApprovalRequest {
    validateCreateApprovalInput(input);

    const approvalId = input.id ?? buildApprovalId(input);
    if (this.store.get(approvalId)) {
      throw new Error(`Approval already exists: ${approvalId}`);
    }

    const duplicate = this.store.list().find(
      (approval) =>
        approval.workflowId === input.workflowId &&
        approval.stageId === input.stageId &&
        approval.approvalType === input.approvalType &&
        approval.status === ApprovalStatus.PENDING
    );

    if (duplicate) {
      throw new Error(
        `Pending approval already exists for workflow stage: ${input.workflowId}:${input.stageId}:${input.approvalType}`
      );
    }

    return this.store.save({
      id: approvalId,
      workflowId: input.workflowId,
      stageId: input.stageId,
      approvalType: input.approvalType,
      status: ApprovalStatus.PENDING,
      requestedBy: input.requestedBy,
      requestedAt: input.requestedAt ?? new Date().toISOString(),
      comments: input.comments
    });
  }

  approve(input: ResolveApprovalInput): ApprovalRequest {
    const approval = this.requirePendingApproval(input.approvalId);
    approval.status = ApprovalStatus.APPROVED;
    approval.approvedBy = input.actorId;
    approval.approvedAt = input.occurredAt ?? new Date().toISOString();
    approval.comments = input.comments ?? approval.comments;

    return this.store.save(approval);
  }

  reject(input: ResolveApprovalInput): ApprovalRequest {
    const approval = this.requirePendingApproval(input.approvalId);
    approval.status = ApprovalStatus.REJECTED;
    approval.approvedBy = input.actorId;
    approval.approvedAt = input.occurredAt ?? new Date().toISOString();
    approval.comments = input.comments ?? approval.comments;

    return this.store.save(approval);
  }

  getApproval(approvalId: string): ApprovalRequest | undefined {
    return this.store.get(approvalId);
  }

  listApprovals(): ApprovalRequest[] {
    return this.store.list();
  }

  hasApprovedGate(input: {
    workflowId: string;
    stageId: string;
    approvalType: ApprovalType;
  }): boolean {
    return this.store.list().some(
      (approval) =>
        approval.workflowId === input.workflowId &&
        approval.stageId === input.stageId &&
        approval.approvalType === input.approvalType &&
        approval.status === ApprovalStatus.APPROVED
    );
  }

  private requirePendingApproval(approvalId: string): ApprovalRequest {
    const approval = this.store.get(approvalId);

    if (!approval) {
      throw new Error(`Approval not found: ${approvalId}`);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error(`Approval is not pending: ${approvalId}`);
    }

    return approval;
  }
}

function validateCreateApprovalInput(input: CreateApprovalRequestInput): void {
  if (!input.workflowId.trim()) {
    throw new Error("workflowId is required");
  }

  if (!input.stageId.trim()) {
    throw new Error("stageId is required");
  }

  if (!input.requestedBy.trim()) {
    throw new Error("requestedBy is required");
  }
}

function buildApprovalId(input: CreateApprovalRequestInput): string {
  return [
    "approval",
    input.workflowId,
    input.stageId,
    input.approvalType
  ].join(":");
}

export { ApprovalStatus, ApprovalType };
