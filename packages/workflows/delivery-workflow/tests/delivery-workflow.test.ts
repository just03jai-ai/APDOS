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
        ArtifactType.IMPLEMENTATION_PLAN,
        ArtifactType.CODE_CHANGE,
        ArtifactType.TEST_RESULT,
        ArtifactType.RELEASE_PACKAGE
      ]
    );
    const discovery = result.artifacts.find(
      (artifact) => artifact.type === ArtifactType.DISCOVERY_REPORT
    );

    assert.equal(
      (discovery?.metadata.report as { affectedSystems: string[] }).affectedSystems.includes(
        "skill-runtime"
      ),
      true
    );
    assert.deepEqual(discovery?.metadata.sourceSkillIds, [
      "repo-router@1.0",
      "knowledge@1.0",
      "codebase-research@1.0"
    ]);
    const prd = result.artifacts.find((artifact) => artifact.type === ArtifactType.PRD);
    assert.deepEqual(prd?.metadata.sourceSkillIds, ["prd-writer@1.0"]);
    const techSpec = result.artifacts.find((artifact) => artifact.type === ArtifactType.TECH_SPEC);
    const implementationPlan = result.artifacts.find(
      (artifact) => artifact.type === ArtifactType.IMPLEMENTATION_PLAN
    );

    assert.equal(techSpec?.createdBy, "apdos-test");
    assert.deepEqual(techSpec?.parentIds, ["workflow-delivery-1:prd"]);
    assert.deepEqual(techSpec?.metadata.sourceSkillIds, [
      "tech-spec-writer@1.0",
      "implement-plan@1.0",
      "design-system@1.0"
    ]);
    assert.equal(typeof techSpec?.metadata.architectureOverview, "string");
    assert.ok(Array.isArray(techSpec?.metadata.apiContracts));
    assert.equal(implementationPlan?.createdBy, "apdos-test");
    assert.deepEqual(implementationPlan?.parentIds, [
      "workflow-delivery-1:prd",
      "workflow-delivery-1:tech-spec"
    ]);
    assert.ok(Array.isArray(implementationPlan?.metadata.tasks));
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

    const approvalStageStartedIndex = result.workflow.history.findIndex(
      (event) => event.stageId === DELIVERY_STAGE_IDS.approval && event.type === "STAGE_STARTED"
    );
    const approvalStageCompletedIndex = result.workflow.history.findIndex(
      (event) => event.stageId === DELIVERY_STAGE_IDS.approval && event.type === "STAGE_COMPLETED"
    );

    assert.ok(approvalStageStartedIndex > -1);
    assert.ok(approvalStageCompletedIndex > approvalStageStartedIndex);
  });

  it("maintains complete artifact traceability for the release package", async () => {
    const service = new DeliveryWorkflowService();

    const result = await service.run({
      workflowId: "workflow-traceability-1",
      goal: "Build supplier payment approval workflow",
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    const releaseTrace = result.traceability.records.find(
      (record) => record.artifactId === "workflow-traceability-1:release-package"
    );

    assert.equal(result.traceability.releasePackageId, "workflow-traceability-1:release-package");
    assert.deepEqual(releaseTrace?.parentIds, [
      "workflow-traceability-1:code-change",
      "workflow-traceability-1:test-result"
    ]);
    assert.deepEqual(
      releaseTrace?.ancestorIds.sort(),
      [
        "workflow-traceability-1:code-change",
        "workflow-traceability-1:discovery",
        "workflow-traceability-1:idea",
        "workflow-traceability-1:implementation-plan",
        "workflow-traceability-1:prd",
        "workflow-traceability-1:tech-spec",
        "workflow-traceability-1:test-result"
      ].sort()
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
    assert.ok(
      result.contextPackages.some((contextPackage) =>
        contextPackage.metadata.includedArtifactIds.includes(
          "workflow-context-1:implementation-plan"
        )
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
