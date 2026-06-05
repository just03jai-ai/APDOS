import type { ArtifactType } from "@apdos/artifacts";
import type {
  GoalIntake,
  RequiredAgent,
  RequiredArtifact,
  WorkflowDefinition,
  WorkflowPlan,
  WorkflowPlanStage
} from "../contracts/workflow-plan.js";
import { FEATURE_DELIVERY_V1_DEFINITION } from "../workflows/feature-delivery-v1.js";

export class DeterministicWorkflowPlanner {
  constructor(
    private readonly workflowDefinition: WorkflowDefinition =
      FEATURE_DELIVERY_V1_DEFINITION
  ) {}

  plan(input: GoalIntake): WorkflowPlan {
    const goal = normalizeGoal(input.goal);
    const workflowId = buildWorkflowId(goal);
    const stages = this.buildStages(workflowId);

    return {
      workflowId,
      workflowType: this.workflowDefinition.type,
      goal,
      stages,
      requiredArtifacts: this.buildRequiredArtifacts(stages),
      requiredAgents: this.buildRequiredAgents(stages)
    };
  }

  private buildStages(workflowId: string): WorkflowPlanStage[] {
    return this.workflowDefinition.stages.map((stage, index) => ({
      id: `${workflowId}:stage:${index + 1}`,
      name: stage.name,
      order: index + 1,
      artifactTypes: [...stage.artifactTypes],
      agentResponsibilities: [...stage.agentResponsibilities]
    }));
  }

  private buildRequiredArtifacts(stages: WorkflowPlanStage[]): RequiredArtifact[] {
    return stages.flatMap((stage) =>
      stage.artifactTypes.map((type) => ({
        stageId: stage.id,
        type,
        title: buildArtifactTitle(stage.name, type)
      }))
    );
  }

  private buildRequiredAgents(stages: WorkflowPlanStage[]): RequiredAgent[] {
    return stages.flatMap((stage) =>
      stage.agentResponsibilities.map((responsibility) => ({
        stageId: stage.id,
        responsibility
      }))
    );
  }
}

function normalizeGoal(goal: string): string {
  const normalized = goal.trim().replace(/\s+/g, " ");
  if (!normalized) {
    throw new Error("goal is required");
  }

  return normalized;
}

function buildWorkflowId(goal: string): string {
  return `workflow:${slugify(goal)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildArtifactTitle(stageName: string, artifactType: ArtifactType): string {
  return `${stageName} ${artifactType}`;
}
