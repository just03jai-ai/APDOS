import type { WorkflowInstance } from "../contracts/workflow-instance.js";

export interface WorkflowStateStore {
  save(workflow: WorkflowInstance): WorkflowInstance;
  get(workflowId: string): WorkflowInstance | undefined;
  list(): WorkflowInstance[];
}

export class InMemoryWorkflowStateStore implements WorkflowStateStore {
  private workflows = new Map<string, WorkflowInstance>();

  save(workflow: WorkflowInstance): WorkflowInstance {
    this.workflows.set(workflow.id, cloneWorkflowInstance(workflow));
    return cloneWorkflowInstance(workflow);
  }

  get(workflowId: string): WorkflowInstance | undefined {
    const workflow = this.workflows.get(workflowId);
    return workflow ? cloneWorkflowInstance(workflow) : undefined;
  }

  list(): WorkflowInstance[] {
    return Array.from(this.workflows.values()).map(cloneWorkflowInstance);
  }
}

export function cloneWorkflowInstance(
  workflow: WorkflowInstance
): WorkflowInstance {
  return {
    ...workflow,
    stages: workflow.stages.map((stage) => ({
      ...stage,
      artifactIds: [...stage.artifactIds]
    })),
    history: workflow.history.map((event) => ({
      ...event,
      artifactIds: [...event.artifactIds]
    }))
  };
}
