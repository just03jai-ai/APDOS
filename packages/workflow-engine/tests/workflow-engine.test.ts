import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ArtifactType } from "@apdos/artifacts";
import { ExecutiveOrchestrator, WorkflowType } from "@apdos/orchestrator";
import {
  InMemoryWorkflowStateStore,
  StageStatus,
  WorkflowExecutionService,
  WorkflowStatus,
  buildWorkflowDefinitionFromPlan,
  type WorkflowDefinition
} from "../src/index.js";

function buildDefinition(): WorkflowDefinition {
  const orchestrator = new ExecutiveOrchestrator();
  const plan = orchestrator.createWorkflowPlan({
    goal: "Build supplier payment approval workflow"
  });

  return buildWorkflowDefinitionFromPlan(plan);
}

function startWorkflow(service = new WorkflowExecutionService()) {
  return service.startWorkflow({
    id: "workflow-instance-1",
    workflowType: WorkflowType.FEATURE_DELIVERY_V1,
    goal: "Build supplier payment approval workflow",
    definition: buildDefinition(),
    createdAt: "2026-06-03T00:00:00.000Z",
    artifactIdsByStageId: {
      "workflow:build-supplier-payment-approval-workflow:stage:1": ["artifact:idea:1"]
    }
  });
}

function completeFirstStage(service: WorkflowExecutionService) {
  const workflow = startWorkflow(service);
  const firstStage = workflow.stages[0];

  service.advanceStage({
    workflowId: workflow.id,
    stageId: firstStage.id
  });

  return service.completeStage({
    workflowId: workflow.id,
    stageId: firstStage.id
  });
}

function assertHistoryEventShape(event: {
  id: string;
  workflowId: string;
  type: string;
  toStatus: string;
  artifactIds: string[];
  occurredAt: string;
}) {
  assert.equal(typeof event.id, "string");
  assert.equal(event.id.length > 0, true);
  assert.equal(typeof event.workflowId, "string");
  assert.equal(event.workflowId.length > 0, true);
  assert.equal(typeof event.type, "string");
  assert.equal(event.type.length > 0, true);
  assert.equal(typeof event.toStatus, "string");
  assert.equal(event.toStatus.length > 0, true);
  assert.equal(Array.isArray(event.artifactIds), true);
  assert.equal(typeof event.occurredAt, "string");
  assert.equal(event.occurredAt.length > 0, true);
}

describe("WorkflowExecutionService", () => {
  it("creates and starts a workflow instance", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);

    assert.equal(workflow.id, "workflow-instance-1");
    assert.equal(workflow.workflowType, WorkflowType.FEATURE_DELIVERY_V1);
    assert.equal(workflow.goal, "Build supplier payment approval workflow");
    assert.equal(workflow.status, WorkflowStatus.RUNNING);
    assert.equal(workflow.createdAt, "2026-06-03T00:00:00.000Z");
    assert.equal(workflow.updatedAt, "2026-06-03T00:00:00.000Z");
    assert.deepEqual(
      workflow.stages.map((stage) => stage.status),
      [
        StageStatus.PENDING,
        StageStatus.PENDING,
        StageStatus.PENDING,
        StageStatus.PENDING,
        StageStatus.PENDING
      ]
    );
    assert.deepEqual(workflow.stages[0].artifactIds, ["artifact:idea:1"]);
    assert.deepEqual(
      workflow.history.map((event) => event.type),
      ["WORKFLOW_CREATED", "WORKFLOW_STARTED"]
    );
  });

  it("validates workflow start input", () => {
    const service = new WorkflowExecutionService();
    const definition = buildDefinition();

    assert.throws(
      () =>
        service.startWorkflow({
          workflowType: WorkflowType.FEATURE_DELIVERY_V1,
          goal: "   ",
          definition
        }),
      /Workflow goal is required/
    );
    assert.throws(
      () =>
        service.startWorkflow({
          workflowType: "   ",
          goal: "Build supplier payment approval workflow",
          definition
        }),
      /Workflow type is required/
    );
    assert.throws(
      () =>
        service.startWorkflow({
          workflowType: WorkflowType.FEATURE_DELIVERY_V1,
          goal: "Build supplier payment approval workflow",
          definition: { id: "empty-workflow", stages: [] }
        }),
      /Workflow definition must include at least one stage/
    );
  });

  it("rejects duplicate workflow ids", () => {
    const service = new WorkflowExecutionService();

    startWorkflow(service);

    assert.throws(
      () => startWorkflow(service),
      /Workflow already exists: workflow-instance-1/
    );
  });

  it("progresses stages in order", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);
    const stage = workflow.stages[0];

    const advanced = service.advanceStage({
      workflowId: workflow.id,
      stageId: stage.id,
      occurredAt: "2026-06-03T00:01:00.000Z"
    });

    assert.equal(advanced.stages[0].status, StageStatus.RUNNING);
    assert.equal(advanced.stages[0].startedAt, "2026-06-03T00:01:00.000Z");

    const completed = service.completeStage({
      workflowId: workflow.id,
      stageId: stage.id,
      artifactIds: ["artifact:discovery-report:1"],
      occurredAt: "2026-06-03T00:02:00.000Z"
    });

    assert.equal(completed.stages[0].status, StageStatus.COMPLETED);
    assert.deepEqual(completed.stages[0].artifactIds, [
      "artifact:idea:1",
      "artifact:discovery-report:1"
    ]);
  });

  it("rejects advancing a later stage before earlier stages complete", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);

    assert.throws(
      () =>
        service.advanceStage({
          workflowId: workflow.id,
          stageId: workflow.stages[1].id
        }),
      /Previous stage is not completed/
    );
  });

  it("rejects invalid stage transitions", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);
    const firstStage = workflow.stages[0];

    assert.throws(
      () =>
        service.completeStage({
          workflowId: workflow.id,
          stageId: firstStage.id
        }),
      /Stage is not running/
    );
    assert.throws(
      () =>
        service.failStage({
          workflowId: workflow.id,
          stageId: firstStage.id,
          reason: "Cannot fail pending stage"
        }),
      /Stage is not running/
    );
    assert.throws(
      () =>
        service.blockStage({
          workflowId: workflow.id,
          stageId: firstStage.id,
          reason: "Cannot block pending stage"
        }),
      /Stage is not running/
    );

    service.advanceStage({
      workflowId: workflow.id,
      stageId: firstStage.id
    });
    service.completeStage({
      workflowId: workflow.id,
      stageId: firstStage.id
    });

    assert.throws(
      () =>
        service.advanceStage({
          workflowId: workflow.id,
          stageId: firstStage.id
        }),
      /Stage is not pending/
    );
  });

  it("completes a workflow when all stages complete", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);
    let currentWorkflow = workflow;

    for (const stage of workflow.stages) {
      currentWorkflow = service.advanceStage({
        workflowId: workflow.id,
        stageId: stage.id
      });
      currentWorkflow = service.completeStage({
        workflowId: workflow.id,
        stageId: stage.id,
        artifactIds: [`artifact:${stage.id}`]
      });
    }

    assert.equal(currentWorkflow.status, WorkflowStatus.COMPLETED);
    assert.equal(
      currentWorkflow.stages.every((stage) => stage.status === StageStatus.COMPLETED),
      true
    );
    assert.equal(
      currentWorkflow.history.at(-1)?.type,
      "WORKFLOW_COMPLETED"
    );
    for (const event of currentWorkflow.history) {
      assertHistoryEventShape(event);
    }
  });

  it("rejects transitions after a workflow is completed", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);
    let currentWorkflow = workflow;

    for (const stage of workflow.stages) {
      service.advanceStage({
        workflowId: workflow.id,
        stageId: stage.id
      });
      currentWorkflow = service.completeStage({
        workflowId: workflow.id,
        stageId: stage.id
      });
    }

    assert.equal(currentWorkflow.status, WorkflowStatus.COMPLETED);
    assert.throws(
      () =>
        service.advanceStage({
          workflowId: workflow.id
        }),
      /Workflow is not active/
    );
  });

  it("fails a workflow when a running stage fails", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);
    const stage = workflow.stages[0];

    service.advanceStage({
      workflowId: workflow.id,
      stageId: stage.id
    });
    const failed = service.failStage({
      workflowId: workflow.id,
      stageId: stage.id,
      reason: "Discovery report rejected",
      occurredAt: "2026-06-03T00:03:00.000Z"
    });

    assert.equal(failed.status, WorkflowStatus.FAILED);
    assert.equal(failed.stages[0].status, StageStatus.FAILED);
    assert.equal(failed.stages[0].statusReason, "Discovery report rejected");
    assert.deepEqual(
      failed.history.map((event) => event.type).slice(-2),
      ["STAGE_FAILED", "WORKFLOW_FAILED"]
    );
  });

  it("rejects transitions after a workflow is failed", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);
    const stage = workflow.stages[0];

    service.advanceStage({
      workflowId: workflow.id,
      stageId: stage.id
    });
    service.failStage({
      workflowId: workflow.id,
      stageId: stage.id,
      reason: "Discovery report rejected"
    });

    assert.throws(
      () =>
        service.advanceStage({
          workflowId: workflow.id
        }),
      /Workflow is not active/
    );
  });

  it("blocks a workflow when a running stage is blocked", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);
    const stage = workflow.stages[0];

    service.advanceStage({
      workflowId: workflow.id,
      stageId: stage.id
    });
    const blocked = service.blockStage({
      workflowId: workflow.id,
      stageId: stage.id,
      reason: "Waiting for governance input",
      occurredAt: "2026-06-03T00:04:00.000Z"
    });

    assert.equal(blocked.status, WorkflowStatus.BLOCKED);
    assert.equal(blocked.stages[0].status, StageStatus.BLOCKED);
    assert.equal(blocked.stages[0].statusReason, "Waiting for governance input");
    assert.deepEqual(
      blocked.history.map((event) => event.type).slice(-2),
      ["STAGE_BLOCKED", "WORKFLOW_BLOCKED"]
    );
  });

  it("rejects transitions after a workflow is blocked", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);
    const stage = workflow.stages[0];

    service.advanceStage({
      workflowId: workflow.id,
      stageId: stage.id
    });
    service.blockStage({
      workflowId: workflow.id,
      stageId: stage.id,
      reason: "Waiting for governance input"
    });

    assert.throws(
      () =>
        service.advanceStage({
          workflowId: workflow.id
        }),
      /Workflow is not active/
    );
  });

  it("records complete workflow history event shape", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);
    const firstStage = workflow.stages[0];

    const advanced = service.advanceStage({
      workflowId: workflow.id,
      stageId: firstStage.id,
      occurredAt: "2026-06-03T00:01:00.000Z"
    });
    const completed = service.completeStage({
      workflowId: workflow.id,
      stageId: firstStage.id,
      artifactIds: ["artifact:discovery-report:1"],
      occurredAt: "2026-06-03T00:02:00.000Z"
    });

    assert.deepEqual(advanced.history[2], {
      id: "workflow-instance-1:history:2026-06-03T00:01:00.000Z:STAGE_STARTED:workflow:build-supplier-payment-approval-workflow:stage:1",
      workflowId: workflow.id,
      stageId: firstStage.id,
      type: "STAGE_STARTED",
      fromStatus: StageStatus.PENDING,
      toStatus: StageStatus.RUNNING,
      artifactIds: ["artifact:idea:1"],
      reason: undefined,
      occurredAt: "2026-06-03T00:01:00.000Z"
    });
    assert.deepEqual(completed.history[3], {
      id: "workflow-instance-1:history:2026-06-03T00:02:00.000Z:STAGE_COMPLETED:workflow:build-supplier-payment-approval-workflow:stage:1",
      workflowId: workflow.id,
      stageId: firstStage.id,
      type: "STAGE_COMPLETED",
      fromStatus: StageStatus.RUNNING,
      toStatus: StageStatus.COMPLETED,
      artifactIds: ["artifact:idea:1", "artifact:discovery-report:1"],
      reason: undefined,
      occurredAt: "2026-06-03T00:02:00.000Z"
    });
  });

  it("records failure and blocked reasons in history", () => {
    const failureService = new WorkflowExecutionService();
    const failedWorkflow = startWorkflow(failureService);
    const failedStage = failedWorkflow.stages[0];

    failureService.advanceStage({
      workflowId: failedWorkflow.id,
      stageId: failedStage.id
    });
    const failed = failureService.failStage({
      workflowId: failedWorkflow.id,
      stageId: failedStage.id,
      reason: "Discovery report rejected",
      occurredAt: "2026-06-03T00:03:00.000Z"
    });

    assert.equal(failed.history.at(-2)?.reason, "Discovery report rejected");
    assert.equal(failed.history.at(-2)?.stageId, failedStage.id);
    assert.equal(failed.history.at(-2)?.toStatus, StageStatus.FAILED);
    assert.equal(failed.history.at(-1)?.reason, "Discovery report rejected");
    assert.equal(failed.history.at(-1)?.toStatus, WorkflowStatus.FAILED);

    const blockService = new WorkflowExecutionService();
    const blockedWorkflow = startWorkflow(blockService);
    const blockedStage = blockedWorkflow.stages[0];

    blockService.advanceStage({
      workflowId: blockedWorkflow.id,
      stageId: blockedStage.id
    });
    const blocked = blockService.blockStage({
      workflowId: blockedWorkflow.id,
      stageId: blockedStage.id,
      reason: "Waiting for governance input",
      occurredAt: "2026-06-03T00:04:00.000Z"
    });

    assert.equal(blocked.history.at(-2)?.reason, "Waiting for governance input");
    assert.equal(blocked.history.at(-2)?.stageId, blockedStage.id);
    assert.equal(blocked.history.at(-2)?.toStatus, StageStatus.BLOCKED);
    assert.equal(blocked.history.at(-1)?.reason, "Waiting for governance input");
    assert.equal(blocked.history.at(-1)?.toStatus, WorkflowStatus.BLOCKED);
  });

  it("advances the next pending stage when no stage id is supplied", () => {
    const service = new WorkflowExecutionService();
    const workflow = completeFirstStage(service);

    const advanced = service.advanceStage({
      workflowId: workflow.id
    });

    assert.equal(advanced.stages[1].status, StageStatus.RUNNING);
  });

  it("deduplicates artifact ids when completing stages", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);
    const firstStage = workflow.stages[0];

    service.advanceStage({
      workflowId: workflow.id,
      stageId: firstStage.id
    });
    const completed = service.completeStage({
      workflowId: workflow.id,
      stageId: firstStage.id,
      artifactIds: ["artifact:idea:1", "artifact:discovery-report:1"]
    });

    assert.deepEqual(completed.stages[0].artifactIds, [
      "artifact:idea:1",
      "artifact:discovery-report:1"
    ]);
  });

  it("lists and retrieves workflows", () => {
    const service = new WorkflowExecutionService();
    const workflow = startWorkflow(service);

    assert.deepEqual(service.getWorkflow(workflow.id), workflow);
    assert.deepEqual(
      service.listWorkflows().map((candidate) => candidate.id),
      [workflow.id]
    );
  });

  it("returns cloned workflow instances from the state store", () => {
    const store = new InMemoryWorkflowStateStore();
    const service = new WorkflowExecutionService(store);
    const workflow = startWorkflow(service);

    workflow.goal = "Mutated goal";
    workflow.stages[0].artifactIds.push("artifact:mutated");
    workflow.history[0].artifactIds.push("artifact:mutated-history");

    const retrieved = service.getWorkflow("workflow-instance-1");

    assert.equal(retrieved?.goal, "Build supplier payment approval workflow");
    assert.deepEqual(retrieved?.stages[0].artifactIds, ["artifact:idea:1"]);
    assert.deepEqual(retrieved?.history[0].artifactIds, []);

    retrieved!.stages[0].artifactIds.push("artifact:retrieved-mutation");

    assert.deepEqual(
      service.getWorkflow("workflow-instance-1")?.stages[0].artifactIds,
      ["artifact:idea:1"]
    );
  });

  it("keeps workflow definitions connected to artifact types", () => {
    const definition = buildDefinition();

    assert.deepEqual(
      definition.stages.map((stage) => stage.artifactTypes[0]),
      [
        ArtifactType.DISCOVERY_REPORT,
        ArtifactType.PRD,
        ArtifactType.TECH_SPEC,
        ArtifactType.GOVERNANCE_FINDING,
        ArtifactType.RELEASE_PACKAGE
      ]
    );
  });
});
