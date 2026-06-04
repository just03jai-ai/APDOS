import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApprovalStatus, ApprovalType } from "@apdos/approval-engine";
import { ArtifactType } from "@apdos/artifacts";
import { WorkflowStatus } from "@apdos/workflow-engine";
import {
  DELIVERY_STAGE_IDS,
  DeliveryWorkflowService
} from "../src/index.js";

describe("DeliveryWorkflowService", () => {
  it("completes the APDOS delivery workflow and produces a release package", async () => {
    const service = new DeliveryWorkflowService();

    const result = await service.run({
      workflowId: "workflow-delivery-1",
      goal: "Build supplier payment approval workflow",
      actorId: "apdos-test",
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    assert.equal(result.workflow.status, WorkflowStatus.COMPLETED);
    assert.equal(result.workflow.stages.length, 7);
    assert.equal(result.workflow.stages.every((stage) => stage.status === "COMPLETED"), true);
    assert.equal(result.releasePackage.type, ArtifactType.RELEASE_PACKAGE);
    assert.equal(result.releasePackage.id, "workflow-delivery-1:release-package");
    assert.deepEqual(
      result.artifacts.map((artifact) => artifact.type),
      [
        ArtifactType.IDEA,
        ArtifactType.DISCOVERY_REPORT,
        ArtifactType.PRD,
        ArtifactType.TECH_SPEC,
        ArtifactType.CODE_CHANGE,
        ArtifactType.TEST_RESULT,
        ArtifactType.RELEASE_PACKAGE
      ]
    );
  });

  it("validates PRD, TECH_SPEC, and RELEASE_PACKAGE before completion", async () => {
    const service = new DeliveryWorkflowService();

    const result = await service.run({
      workflowId: "workflow-validation-1",
      goal: "Build supplier payment approval workflow",
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    assert.deepEqual(
      result.validationResults.map((validationResult) => validationResult.artifactType),
      [ArtifactType.PRD, ArtifactType.TECH_SPEC, ArtifactType.RELEASE_PACKAGE]
    );
    assert.equal(result.validationResults.every((validationResult) => validationResult.valid), true);
    assert.equal(result.validationResults.every((validationResult) => validationResult.score === 100), true);
  });

  it("requires architecture and production approvals", async () => {
    const service = new DeliveryWorkflowService();

    const result = await service.run({
      workflowId: "workflow-approval-1",
      goal: "Build supplier payment approval workflow",
      actorId: "apdos-test",
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    assert.deepEqual(
      result.approvals.map((approval) => approval.approvalType),
      [ApprovalType.ARCHITECTURE_APPROVAL, ApprovalType.PRODUCTION_APPROVAL]
    );
    assert.equal(result.approvals.every((approval) => approval.status === ApprovalStatus.APPROVED), true);
    assert.deepEqual(
      result.approvals.map((approval) => approval.stageId),
      [DELIVERY_STAGE_IDS.techSpec, DELIVERY_STAGE_IDS.releasePackage]
    );
  });

  it("retrieves context between stages", async () => {
    const service = new DeliveryWorkflowService();

    const result = await service.run({
      workflowId: "workflow-context-1",
      goal: "Build supplier payment approval workflow",
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    assert.ok(result.contextPackages.length >= 7);
    assert.equal(
      result.contextPackages.every(
        (contextPackage) => contextPackage.metadata.workflowId === "workflow-context-1"
      ),
      true
    );
    assert.ok(
      result.contextPackages.some((contextPackage) =>
        contextPackage.metadata.includedArtifactIds.includes("workflow-context-1:prd")
      )
    );
  });

  it("tracks workflow transitions for every stage", async () => {
    const service = new DeliveryWorkflowService();

    const result = await service.run({
      workflowId: "workflow-history-1",
      goal: "Build supplier payment approval workflow",
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    assert.equal(
      result.workflow.history.filter((event) => event.type === "STAGE_STARTED").length,
      7
    );
    assert.equal(
      result.workflow.history.filter((event) => event.type === "STAGE_COMPLETED").length,
      7
    );
    assert.equal(
      result.workflow.history.at(-1)?.type,
      "WORKFLOW_COMPLETED"
    );
  });

  it("rejects blank goals", async () => {
    const service = new DeliveryWorkflowService();

    await assert.rejects(
      () => service.run({
        goal: " "
      }),
      /Delivery workflow goal is required/
    );
  });
});
