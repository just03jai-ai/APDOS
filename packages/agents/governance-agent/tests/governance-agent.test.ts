import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { ContextRetrievalService } from "@apdos/context-engine";
import {
  DeterministicSkillExecutor,
  SkillRuntimeService,
  type SkillExecutor
} from "@apdos/skill-runtime";
import { WorkflowExecutionService } from "@apdos/workflow-engine";
import {
  GovernanceAgentService,
  generateGovernanceDecision,
  resolveGovernanceSeverity,
  validateGovernanceRequest
} from "../src/index.js";

const createdAt = "2026-01-01T00:00:00.000Z";

describe("GovernanceAgentService", () => {
  it("validates governance requests", () => {
    assert.doesNotThrow(() => validateGovernanceRequest(createRequest("governance-1")));
    assert.throws(
      () => validateGovernanceRequest({ ...createRequest("governance-1"), qaPackageArtifactId: " " }),
      /Governance artifact IDs are required/
    );
  });

  it("creates GOVERNANCE_PACKAGE through governed Runtime Skill Executor execution", async () => {
    const { service, artifacts } = await createFixture("governance-1");
    const result = await service.createGovernancePackage({
      request: createRequest("governance-1"),
      createdAt
    });

    assert.deepEqual(result.skillResults.map((result) => result.metadata.skillName), [
      "git-guardian",
      "conventions",
      "ai-data-analyst"
    ]);
    assert.equal(result.governanceFindingArtifacts.length, 3);
    assert.equal(result.governancePackageArtifact.type, ArtifactType.GOVERNANCE_PACKAGE);
    assert.equal(result.governancePackageArtifact.metadata.sourceAgent, "agent:governance");
    assert.deepEqual(result.governancePackageArtifact.metadata.sourceSkillIds, [
      "git-guardian@1.0",
      "conventions@1.0",
      "ai-data-analyst@1.0"
    ]);
    assert.equal(result.governancePackageArtifact.metadata.decision, "GO");
    for (const key of [
      "riskAssessment",
      "securityReview",
      "complianceReview",
      "dependencyRisks",
      "architectureConcerns",
      "qualityFindings",
      "openQuestions",
      "approvalChecklist",
      "recommendations"
    ]) {
      assert.ok(Array.isArray(result.governancePackageArtifact.metadata[key]));
    }
    assert.ok(result.governancePackageArtifact.parentIds.includes("governance-1:qa-package"));
    assert.deepEqual(result.governanceFindingArtifacts[1].parentIds, [
      "governance-1:tech-spec",
      "governance-1:governance-finding:1"
    ]);
    assert.ok(
      result.governanceFindingArtifacts[2].parentIds.includes("governance-1:governance-finding:2")
    );
    assert.deepEqual(result.governanceFindingArtifacts.map((artifact) => artifact.metadata.sourceSkillIds), [
      ["git-guardian@1.0"],
      ["conventions@1.0"],
      ["ai-data-analyst@1.0"]
    ]);
    assert.equal(
      (await artifacts.retrieve("governance-1:governance-package"))?.type,
      ArtifactType.GOVERNANCE_PACKAGE
    );
  });

  it("generates GO, CONDITIONAL_GO, and NO_GO decisions", () => {
    assert.equal(generateGovernanceDecision({ blockers: [], openQuestions: [], qualityFindings: [] }), "GO");
    assert.equal(
      generateGovernanceDecision({ blockers: [], openQuestions: ["owner?"], qualityFindings: [] }),
      "CONDITIONAL_GO"
    );
    assert.equal(
      generateGovernanceDecision({ blockers: ["security issue"], openQuestions: [], qualityFindings: [] }),
      "NO_GO"
    );
  });

  it("supports LOW, MEDIUM, HIGH, and CRITICAL finding severities", () => {
    assert.equal(resolveGovernanceSeverity({ severity: "info" }), "LOW");
    assert.equal(
      resolveGovernanceSeverity({ severity: "warning", metadata: { requiresReview: true } }),
      "MEDIUM"
    );
    assert.equal(
      resolveGovernanceSeverity({ severity: "warning", metadata: { governanceSeverity: "HIGH" } }),
      "HIGH"
    );
    assert.equal(
      resolveGovernanceSeverity({ severity: "error", metadata: { blocking: true } }),
      "CRITICAL"
    );
  });

  it("generates CONDITIONAL_GO from runtime review evidence", async () => {
    const { service } = await createFixture(
      "governance-conditional",
      new EvidenceSkillExecutor("conditional")
    );
    const result = await service.createGovernancePackage({
      request: createRequest("governance-conditional"),
      createdAt
    });

    assert.equal(result.governancePackageArtifact.metadata.decision, "CONDITIONAL_GO");
    assert.deepEqual(result.governancePackageArtifact.metadata.openQuestions, [
      "Confirm governance exception owner."
    ]);
  });

  it("generates NO_GO from runtime blocking evidence", async () => {
    const { service } = await createFixture("governance-no-go", new EvidenceSkillExecutor("no-go"));
    const result = await service.createGovernancePackage({
      request: createRequest("governance-no-go"),
      createdAt
    });

    assert.equal(result.governancePackageArtifact.metadata.decision, "NO_GO");
    assert.deepEqual(result.governancePackageArtifact.metadata.riskAssessment, [
      "Blocking governance evidence."
    ]);
  });

  it("generates NO_GO when QA package reports failed validation", async () => {
    const { service, artifacts } = await createFixture("governance-failed-qa");
    await artifacts.update(
      "governance-failed-qa:qa-package",
      { metadata: { workflowId: "governance-failed-qa", passed: false } },
      "test"
    );

    const result = await service.createGovernancePackage({
      request: createRequest("governance-failed-qa"),
      createdAt
    });

    assert.equal(result.governancePackageArtifact.metadata.decision, "NO_GO");
    assert.ok(
      (result.governancePackageArtifact.metadata.findings as Array<{ severity: string }>)
        .some((finding) => finding.severity === "CRITICAL")
    );
  });

  it("rejects missing governance context artifacts", async () => {
    const service = new GovernanceAgentService({
      artifacts: new ArtifactRegistry(),
      skillRuntime: new SkillRuntimeService()
    });
    await assert.rejects(
      () => service.createGovernancePackage({ request: createRequest("missing") }),
      /Governance artifact not found/
    );
  });
});

function createRequest(workflowId: string) {
  return {
    workflowId,
    prdArtifactId: `${workflowId}:prd`,
    techSpecArtifactId: `${workflowId}:tech-spec`,
    implementationPlanArtifactId: `${workflowId}:implementation-plan`,
    engineeringPackageArtifactId: `${workflowId}:engineering-package`,
    qaPackageArtifactId: `${workflowId}:qa-package`
  };
}

async function createFixture(workflowId: string, executor?: SkillExecutor): Promise<{
  artifacts: ArtifactRegistry;
  service: GovernanceAgentService;
}> {
  const artifacts = new ArtifactRegistry();
  const workflows = new WorkflowExecutionService();
  workflows.startWorkflow({
    id: workflowId,
    workflowType: "DELIVERY_WORKFLOW_V1",
    goal: "Build supplier payment approval workflow",
    createdAt,
    definition: {
      id: "delivery-workflow-v1",
      stages: ["prd", "tech-spec", "engineering", "qa", "governance"].map((stage) => ({
        id: stage,
        name: stage
      }))
    }
  });

  await artifacts.register(createArtifact(workflowId, ArtifactType.PRD, []));
  await artifacts.register(createArtifact(workflowId, ArtifactType.TECH_SPEC, [`${workflowId}:prd`]));
  await artifacts.register(
    createArtifact(workflowId, ArtifactType.IMPLEMENTATION_PLAN, [
      `${workflowId}:prd`,
      `${workflowId}:tech-spec`
    ])
  );
  await artifacts.register(
    createArtifact(workflowId, ArtifactType.ENGINEERING_PACKAGE, [
      `${workflowId}:tech-spec`,
      `${workflowId}:implementation-plan`
    ])
  );
  await artifacts.register(
    createArtifact(workflowId, ArtifactType.QA_PACKAGE, [`${workflowId}:engineering-package`])
  );

  return {
    artifacts,
    service: new GovernanceAgentService({
      artifacts,
      workflows,
      context: new ContextRetrievalService({ artifacts, workflows }),
      skillRuntime: new SkillRuntimeService({ executor })
    })
  };
}

class EvidenceSkillExecutor implements SkillExecutor {
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

function createArtifact(workflowId: string, type: ArtifactType, parentIds: string[]): BaseArtifact {
  const suffix = type.toLowerCase().replace(/_/g, "-");
  return {
    id: `${workflowId}:${suffix}`,
    type,
    title: `${type} artifact`,
    description: `${type} for supplier payment approval workflow.`,
    parentIds,
    createdBy: "test",
    createdAt,
    version: 1,
    status: "active",
    metadata: { workflowId, stageId: suffix }
  };
}
