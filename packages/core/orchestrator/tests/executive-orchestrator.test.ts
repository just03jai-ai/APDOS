import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ArtifactType } from "@apdos/artifacts";
import {
  AgentResponsibility,
  ExecutiveOrchestrator,
  WorkflowStageName,
  WorkflowType
} from "../src/index.js";

describe("ExecutiveOrchestrator", () => {
  it("converts a business goal into a complete deterministic workflow plan", () => {
    const orchestrator = new ExecutiveOrchestrator();

    const plan = orchestrator.createWorkflowPlan({
      goal: "Build supplier payment approval workflow"
    });

    assert.equal(
      plan.workflowId,
      "workflow:build-supplier-payment-approval-workflow"
    );
    assert.equal(plan.workflowType, WorkflowType.FEATURE_DELIVERY_V1);
    assert.equal(plan.goal, "Build supplier payment approval workflow");
    assert.deepEqual(
      plan.stages.map((stage) => stage.name),
      [
        WorkflowStageName.DISCOVERY,
        WorkflowStageName.PRD,
        WorkflowStageName.TECH_SPEC,
        WorkflowStageName.GOVERNANCE_REVIEW,
        WorkflowStageName.RELEASE_PACKAGE
      ]
    );
    assert.deepEqual(
      plan.stages.map((stage) => stage.order),
      [1, 2, 3, 4, 5]
    );
    assert.deepEqual(
      plan.requiredArtifacts.map((artifact) => artifact.type),
      [
        ArtifactType.DISCOVERY_REPORT,
        ArtifactType.PRD,
        ArtifactType.TECH_SPEC,
        ArtifactType.GOVERNANCE_FINDING,
        ArtifactType.RELEASE_PACKAGE
      ]
    );
    assert.deepEqual(
      plan.requiredAgents.map((agent) => agent.responsibility),
      [
        AgentResponsibility.DISCOVERY_ANALYSIS,
        AgentResponsibility.PRODUCT_REQUIREMENTS,
        AgentResponsibility.TECHNICAL_DESIGN,
        AgentResponsibility.GOVERNANCE_REVIEW,
        AgentResponsibility.RELEASE_PACKAGING
      ]
    );
  });

  it("normalizes goal whitespace while keeping output deterministic", () => {
    const orchestrator = new ExecutiveOrchestrator();

    const first = orchestrator.createWorkflowPlan({
      goal: "  Build   supplier payment approval workflow "
    });
    const second = orchestrator.createWorkflowPlan({
      goal: "Build supplier payment approval workflow"
    });

    assert.deepEqual(first, second);
  });

  it("rejects an empty goal", () => {
    const orchestrator = new ExecutiveOrchestrator();

    assert.throws(
      () => orchestrator.createWorkflowPlan({ goal: "   " }),
      /goal is required/
    );
  });
});
