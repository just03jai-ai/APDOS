import type { ApprovalRequest } from "../contracts/approval-request.js";

export interface ApprovalStateStore {
  save(approval: ApprovalRequest): ApprovalRequest;
  get(approvalId: string): ApprovalRequest | undefined;
  list(): ApprovalRequest[];
}

export class InMemoryApprovalStateStore implements ApprovalStateStore {
  private approvals = new Map<string, ApprovalRequest>();

  save(approval: ApprovalRequest): ApprovalRequest {
    this.approvals.set(approval.id, cloneApprovalRequest(approval));
    return cloneApprovalRequest(approval);
  }

  get(approvalId: string): ApprovalRequest | undefined {
    const approval = this.approvals.get(approvalId);
    return approval ? cloneApprovalRequest(approval) : undefined;
  }

  list(): ApprovalRequest[] {
    return Array.from(this.approvals.values()).map(cloneApprovalRequest);
  }
}

export function cloneApprovalRequest(
  approval: ApprovalRequest
): ApprovalRequest {
  return { ...approval };
}
