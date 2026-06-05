import type { WorkflowPlan } from "@apdos/orchestrator";
import type { WorkflowDefinition } from "../contracts/workflow-definition.js";

export function buildWorkflowDefinitionFromPlan(
  plan: WorkflowPlan
): WorkflowDefinition {
  return {
    id: plan.workflowId,
    name: String(plan.workflowType),
    description: `Workflow definition for ${plan.goal}`,
    stages: plan.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      description: `${stage.name} stage`,
      artifactTypes: [...stage.artifactTypes]
    }))
  };
}
