import {
  type AdvanceStageInput,
  type BlockStageInput,
  type CompleteStageInput,
  type FailStageInput,
  type StartWorkflowInput,
  type WorkflowHistoryEvent,
  type WorkflowInstance,
  type WorkflowStage
} from "../contracts/workflow-instance.js";
import { StageStatus, WorkflowStatus } from "../contracts/workflow-status.js";
import { createWorkflowStages } from "../stages/stage-factory.js";
import {
  InMemoryWorkflowStateStore,
  type WorkflowStateStore
} from "../state/workflow-state-store.js";

export class WorkflowExecutionService {
  constructor(
    private readonly store: WorkflowStateStore = new InMemoryWorkflowStateStore()
  ) {}

  startWorkflow(input: StartWorkflowInput): WorkflowInstance {
    validateStartWorkflowInput(input);

    const workflowId = input.id ?? `${input.definition.id}:instance:1`;
    if (this.store.get(workflowId)) {
      throw new Error(`Workflow already exists: ${workflowId}`);
    }

    const createdAt = input.createdAt ?? new Date().toISOString();
    const workflow: WorkflowInstance = {
      id: workflowId,
      workflowType: input.workflowType,
      goal: input.goal,
      status: WorkflowStatus.PENDING,
      stages: createWorkflowStages(input),
      history: [],
      createdAt,
      updatedAt: createdAt
    };

    workflow.history.push(
      createWorkflowTransitionEvent({
        workflowId: workflow.id,
        type: "WORKFLOW_CREATED",
        toStatus: WorkflowStatus.PENDING,
        occurredAt: createdAt
      })
    );

    workflow.status = WorkflowStatus.RUNNING;
    workflow.updatedAt = createdAt;
    workflow.history.push(
      createWorkflowTransitionEvent({
        workflowId: workflow.id,
        type: "WORKFLOW_STARTED",
        fromStatus: WorkflowStatus.PENDING,
        toStatus: WorkflowStatus.RUNNING,
        occurredAt: createdAt
      })
    );

    return this.store.save(workflow);
  }

  advanceStage(input: AdvanceStageInput): WorkflowInstance {
    const workflow = this.requireActiveWorkflow(input.workflowId);
    const stage = input.stageId
      ? requireStage(workflow, input.stageId)
      : workflow.stages.find((candidate) => candidate.status === StageStatus.PENDING);

    if (!stage) {
      throw new Error(`No pending stage found: ${input.workflowId}`);
    }

    if (stage.status !== StageStatus.PENDING) {
      throw new Error(`Stage is not pending: ${stage.id}`);
    }

    assertPreviousStagesCompleted(workflow, stage);

    const occurredAt = input.occurredAt ?? new Date().toISOString();
    stage.status = StageStatus.RUNNING;
    stage.startedAt = occurredAt;
    workflow.status = WorkflowStatus.RUNNING;
    workflow.updatedAt = occurredAt;
    workflow.history.push(
      createStageTransitionEvent({
        workflowId: workflow.id,
        stageId: stage.id,
        type: "STAGE_STARTED",
        fromStatus: StageStatus.PENDING,
        toStatus: StageStatus.RUNNING,
        artifactIds: stage.artifactIds,
        occurredAt
      })
    );

    return this.store.save(workflow);
  }

  completeStage(input: CompleteStageInput): WorkflowInstance {
    const workflow = this.requireActiveWorkflow(input.workflowId);
    const stage = requireStage(workflow, input.stageId);

    if (stage.status !== StageStatus.RUNNING) {
      throw new Error(`Stage is not running: ${stage.id}`);
    }

    const occurredAt = input.occurredAt ?? new Date().toISOString();
    stage.status = StageStatus.COMPLETED;
    stage.completedAt = occurredAt;
    stage.artifactIds = [...new Set([...stage.artifactIds, ...(input.artifactIds ?? [])])];
    workflow.updatedAt = occurredAt;
    workflow.history.push(
      createStageTransitionEvent({
        workflowId: workflow.id,
        stageId: stage.id,
        type: "STAGE_COMPLETED",
        fromStatus: StageStatus.RUNNING,
        toStatus: StageStatus.COMPLETED,
        artifactIds: stage.artifactIds,
        occurredAt
      })
    );

    if (workflow.stages.every((candidate) => candidate.status === StageStatus.COMPLETED)) {
      workflow.status = WorkflowStatus.COMPLETED;
      workflow.history.push(
        createWorkflowTransitionEvent({
          workflowId: workflow.id,
          type: "WORKFLOW_COMPLETED",
          fromStatus: WorkflowStatus.RUNNING,
          toStatus: WorkflowStatus.COMPLETED,
          occurredAt
        })
      );
    }

    return this.store.save(workflow);
  }

  failStage(input: FailStageInput): WorkflowInstance {
    const workflow = this.requireActiveWorkflow(input.workflowId);
    const stage = requireStage(workflow, input.stageId);

    if (stage.status !== StageStatus.RUNNING) {
      throw new Error(`Stage is not running: ${stage.id}`);
    }

    const occurredAt = input.occurredAt ?? new Date().toISOString();
    stage.status = StageStatus.FAILED;
    stage.completedAt = occurredAt;
    stage.statusReason = input.reason;
    workflow.status = WorkflowStatus.FAILED;
    workflow.updatedAt = occurredAt;
    workflow.history.push(
      createStageTransitionEvent({
        workflowId: workflow.id,
        stageId: stage.id,
        type: "STAGE_FAILED",
        fromStatus: StageStatus.RUNNING,
        toStatus: StageStatus.FAILED,
        artifactIds: stage.artifactIds,
        reason: input.reason,
        occurredAt
      })
    );
    workflow.history.push(
      createWorkflowTransitionEvent({
        workflowId: workflow.id,
        type: "WORKFLOW_FAILED",
        fromStatus: WorkflowStatus.RUNNING,
        toStatus: WorkflowStatus.FAILED,
        reason: input.reason,
        occurredAt
      })
    );

    return this.store.save(workflow);
  }

  blockStage(input: BlockStageInput): WorkflowInstance {
    const workflow = this.requireActiveWorkflow(input.workflowId);
    const stage = requireStage(workflow, input.stageId);

    if (stage.status !== StageStatus.RUNNING) {
      throw new Error(`Stage is not running: ${stage.id}`);
    }

    const occurredAt = input.occurredAt ?? new Date().toISOString();
    stage.status = StageStatus.BLOCKED;
    stage.statusReason = input.reason;
    workflow.status = WorkflowStatus.BLOCKED;
    workflow.updatedAt = occurredAt;
    workflow.history.push(
      createStageTransitionEvent({
        workflowId: workflow.id,
        stageId: stage.id,
        type: "STAGE_BLOCKED",
        fromStatus: StageStatus.RUNNING,
        toStatus: StageStatus.BLOCKED,
        artifactIds: stage.artifactIds,
        reason: input.reason,
        occurredAt
      })
    );
    workflow.history.push(
      createWorkflowTransitionEvent({
        workflowId: workflow.id,
        type: "WORKFLOW_BLOCKED",
        fromStatus: WorkflowStatus.RUNNING,
        toStatus: WorkflowStatus.BLOCKED,
        reason: input.reason,
        occurredAt
      })
    );

    return this.store.save(workflow);
  }

  getWorkflow(workflowId: string): WorkflowInstance | undefined {
    return this.store.get(workflowId);
  }

  listWorkflows(): WorkflowInstance[] {
    return this.store.list();
  }

  private requireActiveWorkflow(workflowId: string): WorkflowInstance {
    const workflow = this.store.get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    assertWorkflowIsActive(workflow);

    return workflow;
  }
}

function assertWorkflowIsActive(workflow: WorkflowInstance): void {
  if (
    workflow.status === WorkflowStatus.COMPLETED ||
    workflow.status === WorkflowStatus.FAILED ||
    workflow.status === WorkflowStatus.BLOCKED
  ) {
    throw new Error(`Workflow is not active: ${workflow.id}`);
  }
}

function validateStartWorkflowInput(input: StartWorkflowInput): void {
  if (!input.goal.trim()) {
    throw new Error("Workflow goal is required");
  }

  if (!input.workflowType.trim()) {
    throw new Error("Workflow type is required");
  }

  if (!input.definition.stages.length) {
    throw new Error("Workflow definition must include at least one stage");
  }
}

function requireStage(
  workflow: WorkflowInstance,
  stageId: string
): WorkflowStage {
  const stage = workflow.stages.find((candidate) => candidate.id === stageId);

  if (!stage) {
    throw new Error(`Workflow stage not found: ${stageId}`);
  }

  return stage;
}

function assertPreviousStagesCompleted(
  workflow: WorkflowInstance,
  stage: WorkflowStage
): void {
  const targetIndex = workflow.stages.findIndex((candidate) => candidate.id === stage.id);
  const incompleteStage = workflow.stages
    .slice(0, targetIndex)
    .find((candidate) => candidate.status !== StageStatus.COMPLETED);

  if (incompleteStage) {
    throw new Error(`Previous stage is not completed: ${incompleteStage.id}`);
  }
}

function createWorkflowTransitionEvent(input: {
  workflowId: string;
  type: Extract<
    WorkflowHistoryEvent["type"],
    | "WORKFLOW_CREATED"
    | "WORKFLOW_STARTED"
    | "WORKFLOW_COMPLETED"
    | "WORKFLOW_FAILED"
    | "WORKFLOW_BLOCKED"
  >;
  fromStatus?: WorkflowStatus;
  toStatus: WorkflowStatus;
  artifactIds?: string[];
  reason?: string;
  occurredAt: string;
}): WorkflowHistoryEvent {
  return buildHistoryEvent(input);
}

function createStageTransitionEvent(input: {
  workflowId: string;
  stageId: string;
  type: Extract<
    WorkflowHistoryEvent["type"],
    "STAGE_STARTED" | "STAGE_COMPLETED" | "STAGE_FAILED" | "STAGE_BLOCKED"
  >;
  fromStatus?: StageStatus;
  toStatus: StageStatus;
  artifactIds?: string[];
  reason?: string;
  occurredAt: string;
}): WorkflowHistoryEvent {
  return buildHistoryEvent(input);
}

function buildHistoryEvent(input: {
  workflowId: string;
  stageId?: string;
  type: WorkflowHistoryEvent["type"];
  fromStatus?: WorkflowHistoryEvent["fromStatus"];
  toStatus: WorkflowHistoryEvent["toStatus"];
  artifactIds?: string[];
  reason?: string;
  occurredAt: string;
}): WorkflowHistoryEvent {
  return {
    id: `${input.workflowId}:history:${input.occurredAt}:${input.type}:${input.stageId ?? "workflow"}`,
    workflowId: input.workflowId,
    stageId: input.stageId,
    type: input.type,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    artifactIds: [...(input.artifactIds ?? [])],
    reason: input.reason,
    occurredAt: input.occurredAt
  };
}
