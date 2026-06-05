import type { WorkflowExecutionService, WorkflowInstance, WorkflowStage } from "@apdos/workflow-engine";
import { StageStatus } from "@apdos/workflow-engine";
import type { RuntimeStageResolution } from "../contracts/runtime-orchestration.js";

export class RuntimeStageResolver {
  constructor(private readonly workflowExecutionService: WorkflowExecutionService) {}

  resolveWorkflowStage(workflowId: string, stageId?: string): RuntimeStageResolution {
    const workflow = this.requireWorkflow(workflowId);
    const stage = stageId
      ? workflow.stages.find((candidate) => candidate.id === stageId)
      : workflow.stages.find((candidate) => candidate.status === StageStatus.RUNNING) ??
        workflow.stages.find((candidate) => candidate.status === StageStatus.PENDING);

    if (!stage) {
      throw new Error(`Workflow stage not found: ${workflowId}${stageId ? `/${stageId}` : ""}`);
    }

    return { workflow, stage };
  }

  resolveNextStage(workflow: WorkflowInstance, currentStageId: string): WorkflowStage | undefined {
    const currentStageIndex = workflow.stages.findIndex((stage) => stage.id === currentStageId);

    if (currentStageIndex === -1) {
      throw new Error(`Workflow stage not found: ${workflow.id}/${currentStageId}`);
    }

    return workflow.stages.slice(currentStageIndex + 1).find((stage) => stage.status === StageStatus.PENDING);
  }

  private requireWorkflow(workflowId: string): WorkflowInstance {
    const workflow = this.workflowExecutionService.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return workflow;
  }
}
