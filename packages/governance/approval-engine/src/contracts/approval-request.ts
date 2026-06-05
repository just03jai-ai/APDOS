import {
  ApprovalStatus,
  ApprovalType
} from "./approval-status.js";

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  stageId: string;
  approvalType: ApprovalType;
  status: ApprovalStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

export interface CreateApprovalRequestInput {
  id?: string;
  workflowId: string;
  stageId: string;
  approvalType: ApprovalType;
  requestedBy: string;
  requestedAt?: string;
  comments?: string;
}

export interface ResolveApprovalInput {
  approvalId: string;
  actorId: string;
  occurredAt?: string;
  comments?: string;
}
