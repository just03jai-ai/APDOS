import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApprovalService, ApprovalType } from "@apdos/approval-engine";
import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { WorkflowExecutionService } from "@apdos/workflow-engine";
import {
  ContextRetrievalService,
  type ContextRequest,
  type GovernanceFinding,
  type GovernanceFindingSource
} from "../src/index.js";

describe("ContextRetrievalService", () => {
  it("retrieves workflow context with direct, parent, and workflow-history artifacts", async () => {
    const fixture = await createFixture();
    const service = new ContextRetrievalService({
      artifacts: fixture.artifacts,
      workflows: fixture.workflows,
      approvals: fixture.approvals,
      governanceFindings: fixture.governanceFindings
    });

    const context = await service.getWorkflowContext(fixture.request);

    assert.deepEqual(
      context.artifacts.map((artifact) => artifact.id),
      ["prd-1", "idea-1", "tech-spec-1"]
    );
    assert.equal(context.workflowHistory.length, 4);
    assert.equal(context.approvals.length, 1);
    assert.equal(context.governanceFindings.length, 2);
    assert.deepEqual(context.metadata.includedArtifactIds, [
      "prd-1",
      "idea-1",
      "tech-spec-1"
    ]);
  });

  it("retrieves artifact context for requested artifacts and their parents", async () => {
    const fixture = await createFixture();
    const service = new ContextRetrievalService({
      artifacts: fixture.artifacts,
      workflows: fixture.workflows
    });

    const context = await service.getArtifactContext(fixture.request);

    assert.deepEqual(
      context.artifacts.map((artifact) => artifact.id),
      ["prd-1", "idea-1"]
    );
    assert.equal(context.workflowHistory.length, 2);
  });

  it("applies configurable context size limits", async () => {
    const fixture = await createFixture();
    const service = new ContextRetrievalService(
      {
        artifacts: fixture.artifacts,
        workflows: fixture.workflows,
        approvals: fixture.approvals,
        governanceFindings: fixture.governanceFindings
      },
      {
        maxArtifacts: 2,
        maxWorkflowHistoryEvents: 2,
        maxApprovals: 1,
        maxGovernanceFindings: 1
      }
    );

    const context = await service.getWorkflowContext(fixture.request);

    assert.deepEqual(
      context.artifacts.map((artifact) => artifact.id),
      ["prd-1", "idea-1"]
    );
    assert.deepEqual(context.metadata.omittedArtifactIds, ["tech-spec-1"]);
    assert.equal(context.workflowHistory.length, 2);
    assert.equal(context.approvals.length, 1);
    assert.equal(context.governanceFindings.length, 1);
  });

  it("prioritizes governance findings by severity", async () => {
    const fixture = await createFixture();
    const service = new ContextRetrievalService({
      artifacts: fixture.artifacts,
      workflows: fixture.workflows,
      governanceFindings: fixture.governanceFindings
    });

    const context = await service.getWorkflowContext(fixture.request);

    assert.deepEqual(
      context.governanceFindings.map((finding) => finding.id),
      ["finding-critical", "finding-medium"]
    );
  });

  it("includes agent and skill metadata for agent context", async () => {
    const fixture = await createFixture();
    const service = new ContextRetrievalService({
      artifacts: fixture.artifacts,
      workflows: fixture.workflows
    });

    const context = await service.getAgentContext(fixture.request);

    assert.equal(context.metadata.agentId, "architecture-agent");
    assert.deepEqual(context.metadata.skillIds, ["tech-spec-writer"]);
  });

  it("validates required workflow and agent context fields", async () => {
    const fixture = await createFixture();
    const service = new ContextRetrievalService({
      artifacts: fixture.artifacts,
      workflows: fixture.workflows
    });

    await assert.rejects(
      () => service.getWorkflowContext({ ...fixture.request, workflowId: " " }),
      /workflowId is required/
    );
    await assert.rejects(
      () => service.getAgentContext({ ...fixture.request, agentId: " " }),
      /agentId is required/
    );
    await assert.rejects(
      () => service.getAgentContext({ ...fixture.request, skillIds: [] }),
      /At least one skillId is required/
    );
  });

  it("returns cloned context packages", async () => {
    const fixture = await createFixture();
    const service = new ContextRetrievalService({
      artifacts: fixture.artifacts,
      workflows: fixture.workflows
    });

    const context = await service.getWorkflowContext(fixture.request);
    context.artifacts[0].title = "Mutated";
    context.workflowHistory[0].artifactIds.push("mutated-artifact");

    const nextContext = await service.getWorkflowContext(fixture.request);

    assert.equal(nextContext.artifacts[0].title, "Supplier Payment PRD");
    assert.deepEqual(nextContext.workflowHistory[0].artifactIds, []);
  });
});

async function createFixture(): Promise<{
  artifacts: ArtifactRegistry;
  workflows: WorkflowExecutionService;
  approvals: ApprovalService;
  governanceFindings: GovernanceFindingSource;
  request: ContextRequest;
}> {
  const artifacts = new ArtifactRegistry();
  await artifacts.register(createArtifact({
    id: "idea-1",
    type: ArtifactType.IDEA,
    title: "Supplier Payment Idea",
    parentIds: [],
    createdAt: "2026-01-01T00:00:00.000Z"
  }));
  await artifacts.register(createArtifact({
    id: "prd-1",
    type: ArtifactType.PRD,
    title: "Supplier Payment PRD",
    parentIds: ["idea-1"],
    createdAt: "2026-01-02T00:00:00.000Z"
  }));
  await artifacts.register(createArtifact({
    id: "tech-spec-1",
    type: ArtifactType.TECH_SPEC,
    title: "Supplier Payment Tech Spec",
    parentIds: ["prd-1"],
    createdAt: "2026-01-03T00:00:00.000Z"
  }));
  await artifacts.register(createArtifact({
    id: "unrelated-1",
    type: ArtifactType.RELEASE_PACKAGE,
    title: "Unrelated Release",
    parentIds: [],
    createdAt: "2026-01-04T00:00:00.000Z"
  }));

  const workflows = new WorkflowExecutionService();
  workflows.startWorkflow({
    id: "workflow-1",
    workflowType: "supplier-payment",
    goal: "Build supplier payment approval workflow",
    createdAt: "2026-01-05T00:00:00.000Z",
    definition: {
      id: "supplier-payment",
      stages: [
        {
          id: "discovery",
          name: "Discovery"
        },
        {
          id: "architecture",
          name: "Architecture"
        }
      ]
    },
    artifactIdsByStageId: {
      discovery: ["prd-1"],
      architecture: ["tech-spec-1"]
    }
  });
  workflows.advanceStage({
    workflowId: "workflow-1",
    stageId: "discovery",
    occurredAt: "2026-01-05T01:00:00.000Z"
  });
  workflows.completeStage({
    workflowId: "workflow-1",
    stageId: "discovery",
    artifactIds: ["prd-1"],
    occurredAt: "2026-01-05T02:00:00.000Z"
  });

  const approvals = new ApprovalService();
  approvals.createApprovalRequest({
    workflowId: "workflow-1",
    stageId: "architecture",
    approvalType: ApprovalType.ARCHITECTURE_APPROVAL,
    requestedBy: "orchestrator",
    requestedAt: "2026-01-05T03:00:00.000Z"
  });

  const governanceFindings = createGovernanceFindingSource([
    {
      id: "finding-medium",
      workflowId: "workflow-1",
      artifactId: "prd-1",
      severity: "MEDIUM",
      title: "Missing acceptance criteria",
      description: "The PRD needs clearer acceptance criteria.",
      createdAt: "2026-01-05T04:00:00.000Z"
    },
    {
      id: "finding-critical",
      workflowId: "workflow-1",
      artifactId: "tech-spec-1",
      severity: "CRITICAL",
      title: "Architecture approval required",
      description: "The protected architecture stage needs approval.",
      createdAt: "2026-01-05T05:00:00.000Z"
    },
    {
      id: "finding-unrelated",
      workflowId: "workflow-2",
      artifactId: "unrelated-1",
      severity: "CRITICAL",
      title: "Unrelated",
      description: "This finding belongs to another workflow.",
      createdAt: "2026-01-05T06:00:00.000Z"
    }
  ]);

  return {
    artifacts,
    workflows,
    approvals,
    governanceFindings,
    request: {
      workflowId: "workflow-1",
      artifactIds: ["prd-1"],
      agentId: "architecture-agent",
      skillIds: ["tech-spec-writer"]
    }
  };
}

function createArtifact(input: {
  id: string;
  type: ArtifactType;
  title: string;
  parentIds: string[];
  createdAt: string;
}): BaseArtifact {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    description: input.title,
    parentIds: input.parentIds,
    createdBy: "test-user",
    createdAt: input.createdAt,
    version: 1,
    status: "active",
    metadata: {}
  };
}

function createGovernanceFindingSource(
  findings: GovernanceFinding[]
): GovernanceFindingSource {
  return {
    listFindings: () => findings.map((finding) => ({ ...finding }))
  };
}
