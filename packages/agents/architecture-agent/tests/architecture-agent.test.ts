import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ApprovalStatus,
  ApprovalType,
  type ApprovalRequest
} from "@apdos/approval-engine";
import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { ContextRetrievalService } from "@apdos/context-engine";
import {
  ValidatorRegistry,
  createBuiltInValidators
} from "@apdos/validation-engine";
import { SkillRuntimeService } from "@apdos/skill-runtime";
import { WorkflowExecutionService } from "@apdos/workflow-engine";
import {
  ArchitectureAgentService,
  type ArchitectureRequest
} from "../src/index.js";

const createdAt = "2026-01-01T00:00:00.000Z";

describe("ArchitectureAgentService", () => {
  it("generates technical specifications through governed Skill Runtime execution", async () => {
    const { service, request } = await createFixture("architecture-generation-1");

    const techSpec = await service.generateTechSpec({ request });

    assert.match(techSpec.architectureOverview, /tech-spec-writer/);
    assert.ok(techSpec.components.includes("Skill Runtime"));
    assert.ok(techSpec.interfaces.includes("SkillRuntime.executeSkill(request)"));
    assert.ok(techSpec.apiContracts.includes("SkillExecutionRequest"));
  });

  it("generates implementation plans through governed Skill Runtime execution", async () => {
    const { service, request } = await createFixture("architecture-plan-1");

    const plan = await service.generateImplementationPlan({ request });

    assert.deepEqual(plan.phases, [
      "Governed skill execution",
      "Artifact registration",
      "Validation"
    ]);
    assert.ok(plan.tasks.includes("Execute governed skills through Skill Runtime"));
  });

  it("creates and registers TECH_SPEC and IMPLEMENTATION_PLAN artifacts", async () => {
    const { service, request, artifacts } = await createFixture("architecture-artifact-1");

    const result = await service.createTechSpecArtifact({
      request,
      actorId: "architecture-agent-test",
      createdAt,
      stageId: "tech-spec"
    });

    assert.equal(result.techSpecArtifact.id, "architecture-artifact-1:tech-spec");
    assert.equal(result.techSpecArtifact.type, ArtifactType.TECH_SPEC);
    assert.deepEqual(result.techSpecArtifact.parentIds, ["architecture-artifact-1:prd"]);
    assert.equal(result.techSpecArtifact.metadata.sourceAgent, "agent:architecture");
    assert.deepEqual(result.skillResults.map((skillResult) => skillResult.metadata.skillName), [
      "tech-spec-writer",
      "implement-plan",
      "design-system"
    ]);
    assert.equal(result.implementationPlanArtifact.id, "architecture-artifact-1:implementation-plan");
    assert.equal(result.implementationPlanArtifact.type, ArtifactType.IMPLEMENTATION_PLAN);
    assert.deepEqual(result.implementationPlanArtifact.parentIds, [
      "architecture-artifact-1:prd",
      "architecture-artifact-1:tech-spec"
    ]);
    assert.equal(
      (await artifacts.retrieve("architecture-artifact-1:implementation-plan"))?.createdBy,
      "architecture-agent-test"
    );
  });

  it("produces TECH_SPEC artifacts accepted by the Validation Engine", async () => {
    const { service, request, artifacts } = await createFixture("architecture-validation-1");
    const validators = new ValidatorRegistry(createBuiltInValidators());
    const { techSpecArtifact } = await service.createTechSpecArtifact({
      request,
      createdAt
    });

    const validation = validators.validateArtifact(techSpecArtifact, {
      artifacts: await artifacts.list(),
      approvals: [createApproval("architecture-validation-1")]
    });

    assert.equal(validation.valid, true);
    assert.equal(validation.score, 100);
    assert.deepEqual(validation.findings, []);
  });

  it("rejects PRDs without required Idea and Discovery Report parents", async () => {
    const artifacts = new ArtifactRegistry();
    const workflows = new WorkflowExecutionService();
    workflows.startWorkflow({
      id: "architecture-missing-parent-1",
      workflowType: "DELIVERY_WORKFLOW_V1",
      goal: "Build supplier payment approval workflow",
      createdAt,
      definition: createWorkflowDefinition()
    });
    await artifacts.register(createPrdArtifact("architecture-missing-parent-1", []));
    const service = new ArchitectureAgentService({ artifacts, workflows });

    await assert.rejects(
      () => service.generateTechSpec({
        request: {
          workflowId: "architecture-missing-parent-1",
          prdArtifactId: "architecture-missing-parent-1:prd"
        }
      }),
      /IDEA parent not found/
    );
  });
});

async function createFixture(workflowId: string): Promise<{
  artifacts: ArtifactRegistry;
  workflows: WorkflowExecutionService;
  service: ArchitectureAgentService;
  request: ArchitectureRequest;
}> {
  const artifacts = new ArtifactRegistry();
  const workflows = new WorkflowExecutionService();
  workflows.startWorkflow({
    id: workflowId,
    workflowType: "DELIVERY_WORKFLOW_V1",
    goal: "Build supplier payment approval workflow",
    createdAt,
    definition: createWorkflowDefinition()
  });

  const idea = await artifacts.register(createIdeaArtifact(workflowId));
  const discovery = await artifacts.register(createDiscoveryArtifact(workflowId, idea.id));
  const prd = await artifacts.register(createPrdArtifact(workflowId, [idea.id, discovery.id]));
  workflows.advanceStage({ workflowId, stageId: "idea", occurredAt: createdAt });
  workflows.completeStage({ workflowId, stageId: "idea", artifactIds: [idea.id], occurredAt: createdAt });
  workflows.advanceStage({ workflowId, stageId: "discovery", occurredAt: createdAt });
  workflows.completeStage({
    workflowId,
    stageId: "discovery",
    artifactIds: [discovery.id],
    occurredAt: createdAt
  });
  workflows.advanceStage({ workflowId, stageId: "prd", occurredAt: createdAt });
  workflows.completeStage({ workflowId, stageId: "prd", artifactIds: [prd.id], occurredAt: createdAt });

  const context = new ContextRetrievalService({
    artifacts,
    workflows
  });
  const service = new ArchitectureAgentService({
    artifacts,
    workflows,
    context,
    skillRuntime: new SkillRuntimeService()
  });

  return {
    artifacts,
    workflows,
    service,
    request: {
      workflowId,
      prdArtifactId: prd.id
    }
  };
}

function createWorkflowDefinition() {
  return {
    id: "delivery-workflow-v1",
    name: "Delivery Workflow V1",
    description: "Architecture Agent test workflow.",
    stages: [
      {
        id: "idea",
        name: "Idea",
        description: "Capture idea.",
        artifactTypes: [ArtifactType.IDEA]
      },
      {
        id: "discovery",
        name: "Discovery",
        description: "Create discovery report.",
        artifactTypes: [ArtifactType.DISCOVERY_REPORT]
      },
      {
        id: "prd",
        name: "PRD",
        description: "Create PRD.",
        artifactTypes: [ArtifactType.PRD]
      },
      {
        id: "tech-spec",
        name: "Tech Spec",
        description: "Create architecture artifacts.",
        artifactTypes: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN]
      }
    ]
  };
}

function createIdeaArtifact(workflowId: string): BaseArtifact {
  return {
    id: `${workflowId}:idea`,
    type: ArtifactType.IDEA,
    title: "Idea: Build supplier payment approval workflow",
    description: "Initial business goal captured for APDOS delivery.",
    parentIds: [],
    createdBy: "test",
    createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId,
      stageId: "idea",
      goal: "Build supplier payment approval workflow"
    }
  };
}

function createDiscoveryArtifact(workflowId: string, ideaId: string): BaseArtifact {
  return {
    id: `${workflowId}:discovery`,
    type: ArtifactType.DISCOVERY_REPORT,
    title: "Discovery Report",
    description: "Discovery for supplier payment approval workflow.",
    parentIds: [ideaId],
    createdBy: "test",
    createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId,
      stageId: "discovery",
      report: {
        affectedSystems: [
          "artifact-engine",
          "workflow-engine",
          "payment-operations"
        ],
        dependencies: [
          "artifact lineage",
          "workflow stage history",
          "payment approval policy"
        ],
        risks: [
          "Payment policy errors can create financial or compliance exposure."
        ]
      }
    }
  };
}

function createPrdArtifact(workflowId: string, parentIds: string[]): BaseArtifact {
  return {
    id: `${workflowId}:prd`,
    type: ArtifactType.PRD,
    title: "Product Requirements Document",
    description: "PRD for supplier payment approval workflow.",
    parentIds,
    createdBy: "test",
    createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId,
      stageId: "prd",
      problemStatement: "Supplier payments need governed approvals.",
      businessObjective: "Reduce supplier payment approval cycle time.",
      scope: ["Supplier payment approval workflow"],
      acceptanceCriteria: ["Approval routing is traceable."],
      successMetrics: ["Approval cycle time drops by 30%."],
      dependencies: ["payment approval policy"],
      risks: ["Payment policy errors can create financial or compliance exposure."]
    }
  };
}

function createApproval(workflowId: string): ApprovalRequest {
  return {
    id: `${workflowId}:architecture-approval`,
    workflowId,
    stageId: "tech-spec",
    approvalType: ApprovalType.ARCHITECTURE_APPROVAL,
    status: ApprovalStatus.APPROVED,
    requestedBy: "test",
    requestedAt: createdAt,
    approvedBy: "test",
    approvedAt: createdAt
  };
}
