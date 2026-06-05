import { StageStatus } from "../contracts/workflow-status.js";
import type {
  StartWorkflowInput,
  WorkflowStage
} from "../contracts/workflow-instance.js";

export function createWorkflowStages(input: StartWorkflowInput): WorkflowStage[] {
  return input.definition.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    status: StageStatus.PENDING,
    artifactIds: [...(input.artifactIdsByStageId?.[stage.id] ?? [])]
  }));
}
