import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ApprovalStatus,
  ApprovalType,
  type ApprovalRequest
} from "@apdos/approval-engine";
import { ArtifactType, type BaseArtifact } from "@apdos/artifacts";
import {
  RuleBasedArtifactValidator,
  ValidatorRegistry,
  createBuiltInValidators,
  createPrdValidator,
  createReleasePackageValidator,
  createRequiredFieldsRule,
  createTechSpecValidator
} from "../src/index.js";

describe("ValidatorRegistry", () => {
  it("registers and retrieves validators", () => {
    const registry = new ValidatorRegistry();
    const validator = createPrdValidator();

    registry.registerValidator(validator);

    assert.equal(registry.getValidator(ArtifactType.PRD), validator);
  });

  it("rejects duplicate validators", () => {
    const registry = new ValidatorRegistry([createPrdValidator()]);

    assert.throws(
      () => registry.registerValidator(createPrdValidator()),
      /Validator already registered: PRD/
    );
  });

  it("throws when validating an artifact without a validator", () => {
    const registry = new ValidatorRegistry();

    assert.throws(
      () => registry.validateArtifact(createArtifact({
        id: "idea-1",
        type: ArtifactType.IDEA
      })),
      /Validator not found for artifact type: IDEA/
    );
  });
});

describe("Built-in validators", () => {
  it("validates a complete PRD with required fields and IDEA dependency", () => {
    const idea = createArtifact({
      id: "idea-1",
      type: ArtifactType.IDEA
    });
    const prd = createArtifact({
      id: "prd-1",
      type: ArtifactType.PRD,
      parentIds: ["idea-1"],
      metadata: {
        problemStatement: "Suppliers need predictable approval.",
        successMetrics: "Approval cycle time drops by 30%."
      }
    });
    const registry = new ValidatorRegistry(createBuiltInValidators());

    const result = registry.validateArtifact(prd, {
      artifacts: [idea, prd]
    });

    assert.equal(result.valid, true);
    assert.equal(result.score, 100);
    assert.deepEqual(result.findings, []);
  });

  it("returns deterministic findings for missing required PRD data", () => {
    const prd = createArtifact({
      id: "prd-1",
      type: ArtifactType.PRD,
      title: "",
      description: "",
      metadata: {
        problemStatement: ""
      }
    });

    const result = createPrdValidator().validate(prd, {
      artifacts: [prd]
    });

    assert.equal(result.valid, false);
    assert.equal(result.score, 0);
    assert.deepEqual(
      result.findings.map((finding) => finding.ruleId),
      [
        "prd.required-fields",
        "prd.required-fields",
        "prd.required-fields",
        "prd.required-fields",
        "prd.dependencies"
      ]
    );
  });

  it("validates TECH_SPEC approval requirements", () => {
    const prd = createArtifact({
      id: "prd-1",
      type: ArtifactType.PRD
    });
    const techSpec = createArtifact({
      id: "tech-spec-1",
      type: ArtifactType.TECH_SPEC,
      parentIds: ["prd-1"],
      metadata: {
        workflowId: "workflow-1",
        stageId: "architecture",
        architecture: "Event-driven services.",
        interfaces: "REST API."
      }
    });
    const approval = createApproval({
      approvalType: ApprovalType.ARCHITECTURE_APPROVAL,
      status: ApprovalStatus.APPROVED
    });

    const result = createTechSpecValidator().validate(techSpec, {
      artifacts: [prd, techSpec],
      approvals: [approval]
    });

    assert.equal(result.valid, true);
    assert.equal(result.score, 100);
  });

  it("flags missing TECH_SPEC approval", () => {
    const prd = createArtifact({
      id: "prd-1",
      type: ArtifactType.PRD
    });
    const techSpec = createArtifact({
      id: "tech-spec-1",
      type: ArtifactType.TECH_SPEC,
      parentIds: ["prd-1"],
      metadata: {
        workflowId: "workflow-1",
        stageId: "architecture",
        architecture: "Event-driven services.",
        interfaces: "REST API."
      }
    });

    const result = createTechSpecValidator().validate(techSpec, {
      artifacts: [prd, techSpec],
      approvals: []
    });

    assert.equal(result.valid, false);
    assert.equal(result.score, 55);
    assert.deepEqual(result.findings, [
      {
        severity: "CRITICAL",
        message: "Artifact requires approved gate: ARCHITECTURE_APPROVAL.",
        ruleId: "tech-spec.architecture-approval"
      }
    ]);
  });

  it("validates RELEASE_PACKAGE dependencies and production approval", () => {
    const codeChange = createArtifact({
      id: "code-change-1",
      type: ArtifactType.CODE_CHANGE
    });
    const testResult = createArtifact({
      id: "test-result-1",
      type: ArtifactType.TEST_RESULT
    });
    const releasePackage = createArtifact({
      id: "release-package-1",
      type: ArtifactType.RELEASE_PACKAGE,
      parentIds: ["code-change-1", "test-result-1"],
      metadata: {
        workflowId: "workflow-1",
        stageId: "release",
        releaseVersion: "1.0.0",
        rollbackPlan: "Restore previous package."
      }
    });
    const approval = createApproval({
      approvalType: ApprovalType.PRODUCTION_APPROVAL,
      stageId: "release",
      status: ApprovalStatus.APPROVED
    });

    const result = createReleasePackageValidator().validate(releasePackage, {
      artifacts: [codeChange, testResult, releasePackage],
      approvals: [approval]
    });

    assert.equal(result.valid, true);
    assert.equal(result.score, 100);
  });

  it("rejects validating the wrong artifact type with a validator", () => {
    assert.throws(
      () => createPrdValidator().validate(createArtifact({
        id: "tech-spec-1",
        type: ArtifactType.TECH_SPEC
      })),
      /Validator PRD cannot validate artifact type: TECH_SPEC/
    );
  });

  it("supports custom rule-based validators", () => {
    const validator = new RuleBasedArtifactValidator(ArtifactType.TASK, [
      createRequiredFieldsRule({
        id: "task.required-fields",
        requiredMetadataFields: ["assignee"]
      })
    ]);
    const result = validator.validate(createArtifact({
      id: "task-1",
      type: ArtifactType.TASK,
      metadata: {}
    }));

    assert.equal(result.valid, false);
    assert.equal(result.findings[0].ruleId, "task.required-fields");
  });
});

function createArtifact(input: {
  id: string;
  type: ArtifactType;
  title?: string;
  description?: string;
  parentIds?: string[];
  metadata?: Record<string, unknown>;
}): BaseArtifact {
  return {
    id: input.id,
    type: input.type,
    title: input.title ?? input.id,
    description: input.description ?? `${input.id} description`,
    parentIds: input.parentIds ?? [],
    createdBy: "test-user",
    createdAt: "2026-01-01T00:00:00.000Z",
    version: 1,
    status: "active",
    metadata: input.metadata ?? {}
  };
}

function createApproval(input: {
  approvalType: ApprovalType;
  status: ApprovalStatus;
  stageId?: string;
}): ApprovalRequest {
  return {
    id: `approval:${input.approvalType}`,
    workflowId: "workflow-1",
    stageId: input.stageId ?? "architecture",
    approvalType: input.approvalType,
    status: input.status,
    requestedBy: "orchestrator",
    requestedAt: "2026-01-01T00:00:00.000Z",
    approvedBy: input.status === ApprovalStatus.APPROVED ? "approver" : undefined,
    approvedAt: input.status === ApprovalStatus.APPROVED
      ? "2026-01-01T01:00:00.000Z"
      : undefined
  };
}
