import type { GoalIntake, WorkflowPlan } from "../contracts/workflow-plan.js";
import { DeterministicWorkflowPlanner } from "../planner/deterministic-workflow-planner.js";

export class ExecutiveOrchestrator {
  constructor(
    private readonly planner: DeterministicWorkflowPlanner =
      new DeterministicWorkflowPlanner()
  ) {}

  createWorkflowPlan(input: GoalIntake): WorkflowPlan {
    return this.planner.plan(input);
  }
}
