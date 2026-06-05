import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ExecutiveOrchestrator, WorkflowType } from "@apdos/orchestrator";
import {
  StageStatus,
  WorkflowExecutionService,
  WorkflowStatus,
  buildWorkflowDefinitionFromPlan
} from "@apdos/workflow-engine";
import {
  ApprovalService,
  ApprovalStatus,
  ApprovalType,
  WorkflowApprovalGate
} from "../src/index.js";

function startWorkflow() {
  const orchestrator = new ExecutiveOrchestrator();
  const plan = orchestrator.createWorkflowPlan({
    goal: "Build supplier payment approval workflow"
  });
  const workflowEngine = new WorkflowExecutionService();
  const workflow = workflowEngine.startWorkflow({
    id: "workflow-instance-1",
    workflowType: WorkflowType.FEATURE_DELIVERY_V1,
    goal: plan.goal,
    definition: buildWorkflowDefinitionFromPlan(plan),
    createdAt: "2026-06-03T00:00:00.000Z"
  });

  return { workflowEngine, workflow };
}

describe("ApprovalService", () => {
  it("creates approval requests", () => {
    const approvals = new ApprovalService();

    const approval = approvals.createApprovalRequest({
      id: "approval-1",
      workflowId: "workflow-1",
      stageId: "stage-1",
      approvalType: ApprovalType.ARCHITECTURE_APPROVAL,
      requestedBy: "architect-1",
      requestedAt: "2026-06-03T00:00:00.000Z",
      comments: "Architecture review required."
    });

    assert.equal(approval.id, "approval-1");
    assert.equal(approval.status, ApprovalStatus.PENDING);
    assert.equal(approval.requestedBy, "architect-1");
    assert.equal(approval.comments, "Architecture review required.");
  });

  it("approves approval requests", () => {
    const approvals = new ApprovalService();
    const approval = approvals.createApprovalRequest({
      id: "approval-1",
      workflowId: "workflow-1",
      stageId: "stage-1",
      approvalType: ApprovalType.IMPLEMENTATION_APPROVAL,
      requestedBy: "lead-1"
    });

    const approved = approvals.approve({
      approvalId: approval.id,
      actorId: "approver-1",
      occurredAt: "2026-06-03T00:01:00.000Z",
      comments: "Approved."
    });

    assert.equal(approved.status, ApprovalStatus.APPROVED);
    assert.equal(approved.approvedBy, "approver-1");
    assert.equal(approved.approvedAt, "2026-06-03T00:01:00.000Z");
    assert.equal(approved.comments, "Approved.");
  });

  it("rejects approval requests", () => {
    const approvals = new ApprovalService();
    const approval = approvals.createApprovalRequest({
      id: "approval-1",
      workflowId: "workflow-1",
      stageId: "stage-1",
      approvalType: ApprovalType.MERGE_APPROVAL,
      requestedBy: "lead-1"
    });

    const rejected = approvals.reject({
      approvalId: approval.id,
      actorId: "approver-1",
      occurredAt: "2026-06-03T00:02:00.000Z",
      comments: "Needs changes."
    });

    assert.equal(rejected.status, ApprovalStatus.REJECTED);
    assert.equal(rejected.approvedBy, "approver-1");
    assert.equal(rejected.approvedAt, "2026-06-03T00:02:00.000Z");
    assert.equal(rejected.comments, "Needs changes.");
  });

  it("rejects duplicate pending approvals for the same workflow stage and type", () => {
    const approvals = new ApprovalService();

    approvals.createApprovalRequest({
      workflowId: "workflow-1",
      stageId: "stage-1",
      approvalType: ApprovalType.PRODUCTION_APPROVAL,
      requestedBy: "release-1"
    });

    assert.throws(
      () =>
        approvals.createApprovalRequest({
          id: "approval-2",
          workflowId: "workflow-1",
          stageId: "stage-1",
          approvalType: ApprovalType.PRODUCTION_APPROVAL,
          requestedBy: "release-2"
        }),
      /Pending approval already exists/
    );
  });

  it("lists and retrieves approval requests", () => {
    const approvals = new ApprovalService();
    const approval = approvals.createApprovalRequest({
      id: "approval-1",
      workflowId: "workflow-1",
      stageId: "stage-1",
      approvalType: ApprovalType.ARCHITECTURE_APPROVAL,
      requestedBy: "architect-1"
    });

    assert.deepEqual(approvals.getApproval(approval.id), approval);
    assert.deepEqual(
      approvals.listApprovals().map((candidate) => candidate.id),
      ["approval-1"]
    );
  });
});

describe("WorkflowApprovalGate", () => {
  it("blocks protected workflow stages until approval is granted", () => {
    const approvals = new ApprovalService();
    const { workflowEngine, workflow } = startWorkflow();
    const protectedStage = workflow.stages[0];
    const gate = new WorkflowApprovalGate(
      approvals,
      workflowEngine,
      [
        {
          stageId: protectedStage.id,
          approvalType: ApprovalType.ARCHITECTURE_APPROVAL
        }
      ]
    );

    const blocked = gate.advanceProtectedStage({
      workflowId: workflow.id,
      stageId: protectedStage.id,
      requestedBy: "architect-1",
      occurredAt: "2026-06-03T00:03:00.000Z"
    });

    assert.equal(blocked.status, WorkflowStatus.BLOCKED);
    assert.equal(blocked.stages[0].status, StageStatus.BLOCKED);
    assert.equal(approvals.listApprovals().length, 1);
    assert.equal(
      approvals.listApprovals()[0].approvalType,
      ApprovalType.ARCHITECTURE_APPROVAL
    );
  });

  it("allows protected workflow stages when approval is granted", () => {
    const approvals = new ApprovalService();
    const { workflowEngine, workflow } = startWorkflow();
    const protectedStage = workflow.stages[0];
    const gate = new WorkflowApprovalGate(
      approvals,
      workflowEngine,
      [
        {
          stageId: protectedStage.id,
          approvalType: ApprovalType.ARCHITECTURE_APPROVAL
        }
      ]
    );

    const approval = approvals.createApprovalRequest({
      workflowId: workflow.id,
      stageId: protectedStage.id,
      approvalType: ApprovalType.ARCHITECTURE_APPROVAL,
      requestedBy: "architect-1"
    });
    approvals.approve({
      approvalId: approval.id,
      actorId: "principal-architect"
    });

    const advanced = gate.advanceProtectedStage({
      workflowId: workflow.id,
      stageId: protectedStage.id,
      requestedBy: "architect-1",
      occurredAt: "2026-06-03T00:04:00.000Z"
    });

    assert.equal(advanced.status, WorkflowStatus.RUNNING);
    assert.equal(advanced.stages[0].status, StageStatus.RUNNING);
  });
});
