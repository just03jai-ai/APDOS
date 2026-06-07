import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApprovalService, ApprovalStatus, ApprovalType } from "@apdos/approval-engine";
import { ArtifactRegistry, ArtifactType } from "@apdos/artifacts";
import { GovernanceAgentService } from "@apdos/governance-agent";
import {
  DeterministicSkillExecutor,
  SkillRuntimeService,
  type SkillExecutor
} from "@apdos/skill-runtime";
import { WorkflowExecutionService, WorkflowStatus } from "@apdos/workflow-engine";
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
    assert.equal(result.workflow.stages.length, 11);
    assert.equal(result.workflow.stages.every((stage) => stage.status === "COMPLETED"), true);
    assert.equal(result.designPackage.type, ArtifactType.DESIGN_PACKAGE);
    assert.equal(result.designPackage.id, "workflow-delivery-1:design-package");
    assert.equal(result.engineeringPackage.type, ArtifactType.ENGINEERING_PACKAGE);
    assert.equal(result.engineeringPackage.id, "workflow-delivery-1:engineering-package");
    assert.equal(result.qaPackage.type, ArtifactType.QA_PACKAGE);
    assert.equal(result.qaPackage.id, "workflow-delivery-1:qa-package");
    assert.equal(result.governancePackage.type, ArtifactType.GOVERNANCE_PACKAGE);
    assert.equal(result.governancePackage.id, "workflow-delivery-1:governance-package");
    assert.equal(result.releasePackage.type, ArtifactType.RELEASE_PACKAGE);
    assert.equal(result.releasePackage.id, "workflow-delivery-1:release-package");
    assert.deepEqual(
      result.artifacts.map((artifact) => artifact.type),
      [
        ArtifactType.IDEA,
        ArtifactType.DISCOVERY_REPORT,
        ArtifactType.PRD,
        ArtifactType.DESIGN_PACKAGE,
        ArtifactType.TECH_SPEC,
        ArtifactType.IMPLEMENTATION_PLAN,
        ArtifactType.CODE_CHANGE,
        ArtifactType.CODE_CHANGE,
        ArtifactType.CODE_CHANGE,
        ArtifactType.CODE_CHANGE,
        ArtifactType.CODE_CHANGE,
        ArtifactType.ENGINEERING_PACKAGE,
        ArtifactType.TEST_RESULT,
        ArtifactType.QA_PACKAGE,
        ArtifactType.GOVERNANCE_FINDING,
        ArtifactType.GOVERNANCE_FINDING,
        ArtifactType.GOVERNANCE_FINDING,
        ArtifactType.GOVERNANCE_PACKAGE,
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
    assert.deepEqual(result.designPackage.metadata.sourceSkillIds, [
      "user-journey-designer@1.0",
      "user-flow-designer@1.0",
      "ia-designer@1.0",
      "wireframe-planner@1.0",
      "component-mapper@1.0",
      "prototype-planner@1.0"
    ]);
    assert.deepEqual(result.designPackage.parentIds, [
      "workflow-delivery-1:discovery",
      "workflow-delivery-1:prd"
    ]);
    assert.ok(Array.isArray(result.designPackage.metadata.personas));
    assert.ok(Array.isArray(result.designPackage.metadata.userJourneys));
    assert.ok(Array.isArray(result.designPackage.metadata.userFlows));
    assert.ok(Array.isArray(result.designPackage.metadata.informationArchitecture));
    assert.ok(Array.isArray(result.designPackage.metadata.screenInventory));
    assert.ok(Array.isArray(result.designPackage.metadata.wireframeBlueprints));
    assert.ok(Array.isArray(result.designPackage.metadata.componentInventory));
    assert.ok(Array.isArray(result.designPackage.metadata.stateDefinitions));
    assert.ok(Array.isArray(result.designPackage.metadata.navigationModel));
    assert.ok(Array.isArray(result.designPackage.metadata.prototypeBlueprint));
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
    assert.deepEqual(result.engineeringPackage.metadata.sourceSkillIds, [
      "backend-contributor@1.0",
      "frontend-contributor@1.0",
      "mono-web-contributor@1.0",
      "crons-contributor@1.0",
      "data-science-monorepo-contributor@1.0"
    ]);
    assert.ok(Array.isArray(result.engineeringPackage.metadata.backendTasks));
    assert.ok(Array.isArray(result.engineeringPackage.metadata.frontendTasks));
    assert.ok(Array.isArray(result.engineeringPackage.metadata.databaseTasks));
    assert.ok(Array.isArray(result.engineeringPackage.metadata.apiTasks));
    assert.ok(Array.isArray(result.engineeringPackage.metadata.migrationTasks));
    assert.ok(Array.isArray(result.engineeringPackage.metadata.cronTasks));
    assert.ok(Array.isArray(result.engineeringPackage.metadata.dependencies));
    assert.ok(Array.isArray(result.engineeringPackage.metadata.implementationOrder));
    assert.ok(Array.isArray(result.engineeringPackage.metadata.sprintPlan));
    assert.equal(result.engineeringPackage.metadata.storyPoints, 34);
    assert.ok(Array.isArray(result.engineeringPackage.metadata.risks));
    assert.deepEqual(result.qaPackage.metadata.sourceSkillIds, [
      "test-plan-writer@1.0"
    ]);
    assert.ok(Array.isArray(result.qaPackage.metadata.testCases));
    assert.ok(Array.isArray(result.qaPackage.metadata.regressionCoverage));
    assert.ok(Array.isArray(result.qaPackage.metadata.integrationTests));
    assert.ok(Array.isArray(result.qaPackage.metadata.acceptanceTests));
    assert.ok(Array.isArray(result.qaPackage.metadata.edgeCases));
    assert.ok(Array.isArray(result.qaPackage.metadata.negativeScenarios));
    assert.ok(Array.isArray(result.qaPackage.metadata.uatChecklist));
    assert.ok(Array.isArray(result.qaPackage.metadata.releaseValidationChecklist));
    assert.ok(Array.isArray(result.qaPackage.metadata.riskAreas));
    assert.deepEqual(result.governancePackage.metadata.sourceSkillIds, [
      "git-guardian@1.0",
      "conventions@1.0",
      "ai-data-analyst@1.0"
    ]);
    assert.equal(result.governancePackage.metadata.decision, "GO");
    assert.ok(Array.isArray(result.governancePackage.metadata.riskAssessment));
    assert.ok(Array.isArray(result.governancePackage.metadata.securityReview));
    assert.ok(Array.isArray(result.governancePackage.metadata.complianceReview));
    assert.ok(Array.isArray(result.governancePackage.metadata.approvalChecklist));
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

  it("fails Governance and prevents release when decision is NO_GO", async () => {
    const artifacts = new ArtifactRegistry();
    const workflows = new WorkflowExecutionService();
    const approvals = new ApprovalService();
    const governanceAgent = new GovernanceAgentService({
      artifacts,
      workflows,
      skillRuntime: new SkillRuntimeService({ executor: new EvidenceGovernanceExecutor("no-go") })
    });
    const service = new DeliveryWorkflowService({
      artifacts,
      workflows,
      approvals,
      governanceAgent
    });

    await assert.rejects(
      () =>
        service.run({
          workflowId: "workflow-no-go-1",
          goal: "Build supplier payment approval workflow",
          createdAt: "2026-01-01T00:00:00.000Z"
        }),
      /Governance decision blocked delivery workflow: NO_GO/
    );

    const workflow = workflows.getWorkflow("workflow-no-go-1");
    assert.equal(workflow?.status, WorkflowStatus.FAILED);
    assert.equal(
      workflow?.stages.find((stage) => stage.id === DELIVERY_STAGE_IDS.governance)?.status,
      "FAILED"
    );
    assert.deepEqual(
      approvals.listApprovals().map((approval) => approval.approvalType),
      [ApprovalType.ARCHITECTURE_APPROVAL]
    );
    assert.equal(
      (await artifacts.retrieve("workflow-no-go-1:release-package")),
      undefined
    );
  });

  it("requires explicit production approval for CONDITIONAL_GO", async () => {
    const artifacts = new ArtifactRegistry();
    const workflows = new WorkflowExecutionService();
    const approvals = new ApprovalService();
    const governanceAgent = new GovernanceAgentService({
      artifacts,
      workflows,
      skillRuntime: new SkillRuntimeService({
        executor: new EvidenceGovernanceExecutor("conditional")
      })
    });
    const service = new DeliveryWorkflowService({
      artifacts,
      workflows,
      approvals,
      governanceAgent
    });

    await assert.rejects(
      () =>
        service.run({
          workflowId: "workflow-conditional-go-1",
          goal: "Build supplier payment approval workflow",
          createdAt: "2026-01-01T00:00:00.000Z"
        }),
      /Governance decision blocked delivery workflow pending approval: CONDITIONAL_GO/
    );

    const workflow = workflows.getWorkflow("workflow-conditional-go-1");
    assert.equal(workflow?.status, WorkflowStatus.BLOCKED);
    assert.equal(
      workflow?.stages.find((stage) => stage.id === DELIVERY_STAGE_IDS.governance)?.status,
      "BLOCKED"
    );
    assert.equal(
      approvals.listApprovals().find(
        (approval) => approval.approvalType === ApprovalType.PRODUCTION_APPROVAL
      )?.status,
      ApprovalStatus.PENDING
    );
    assert.equal(await artifacts.retrieve("workflow-conditional-go-1:release-package"), undefined);
  });

  it("fails Governance when required governance inputs are unavailable", async () => {
    const workflows = new WorkflowExecutionService();
    const service = new DeliveryWorkflowService({
      workflows,
      governanceAgent: new GovernanceAgentService({
        artifacts: new ArtifactRegistry(),
        workflows,
        skillRuntime: new SkillRuntimeService()
      })
    });

    await assert.rejects(
      () =>
        service.run({
          workflowId: "workflow-missing-governance-input-1",
          goal: "Build supplier payment approval workflow",
          createdAt: "2026-01-01T00:00:00.000Z"
        }),
      /Governance artifact not found/
    );

    assert.equal(workflows.getWorkflow("workflow-missing-governance-input-1")?.status, WorkflowStatus.FAILED);
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
      "workflow-traceability-1:governance-package",
      "workflow-traceability-1:code-change:1",
      "workflow-traceability-1:qa-test-result:1"
    ]);
    assert.deepEqual(
      releaseTrace?.ancestorIds.sort(),
      [
        "workflow-traceability-1:code-change:1",
        "workflow-traceability-1:code-change:2",
        "workflow-traceability-1:code-change:3",
        "workflow-traceability-1:code-change:4",
        "workflow-traceability-1:code-change:5",
        "workflow-traceability-1:discovery",
        "workflow-traceability-1:engineering-package",
        "workflow-traceability-1:governance-finding:1",
        "workflow-traceability-1:governance-finding:2",
        "workflow-traceability-1:governance-finding:3",
        "workflow-traceability-1:governance-package",
        "workflow-traceability-1:idea",
        "workflow-traceability-1:implementation-plan",
        "workflow-traceability-1:prd",
        "workflow-traceability-1:qa-package",
        "workflow-traceability-1:qa-test-result:1",
        "workflow-traceability-1:tech-spec",
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

    assert.ok(result.contextPackages.length >= 8);
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
      11
    );
    assert.equal(
      result.workflow.history.filter((event) => event.type === "STAGE_COMPLETED").length,
      11
    );
    assert.equal(
      result.workflow.history.at(-1)?.type,
      "WORKFLOW_COMPLETED"
    );
    assert.deepEqual(
      result.workflow.stages.slice(1, 8).map((stage) => stage.id),
      [
        DELIVERY_STAGE_IDS.discovery,
        DELIVERY_STAGE_IDS.prd,
        DELIVERY_STAGE_IDS.design,
        DELIVERY_STAGE_IDS.techSpec,
        DELIVERY_STAGE_IDS.engineering,
        DELIVERY_STAGE_IDS.qa,
        DELIVERY_STAGE_IDS.governance
      ]
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

class EvidenceGovernanceExecutor implements SkillExecutor {
  constructor(private readonly mode: "conditional" | "no-go") {}

  async execute(
    skill: Parameters<SkillExecutor["execute"]>[0],
    request: Parameters<SkillExecutor["execute"]>[1]
  ): ReturnType<SkillExecutor["execute"]> {
    const result = await new DeterministicSkillExecutor().execute(skill, request);

    if (skill.name === "git-guardian" && this.mode === "no-go") {
      result.findings[0] = {
        ...result.findings[0],
        message: "Blocking governance evidence.",
        metadata: { blocking: true }
      };
    }

    if (skill.name === "ai-data-analyst" && this.mode === "conditional") {
      result.findings[0] = {
        ...result.findings[0],
        message: "Governance review required.",
        metadata: {
          requiresReview: true,
          openQuestion: "Confirm governance exception owner."
        }
      };
    }

    return result;
  }
}
