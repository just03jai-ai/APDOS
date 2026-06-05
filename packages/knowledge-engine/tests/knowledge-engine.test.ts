import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  KnowledgeEngineService,
  KnowledgeGraph,
  MemoryService,
  type DecisionRecord,
  type KnowledgeEntity
} from "../src/index.js";

describe("KnowledgeGraph", () => {
  it("adds and retrieves entities", () => {
    const graph = new KnowledgeGraph();
    const entity = createArtifactEntity();

    graph.addEntity(entity);

    assert.deepEqual(graph.getEntity(entity.id), entity);
  });

  it("adds relationships and retrieves related entities", () => {
    const graph = new KnowledgeGraph();
    const workflow = createWorkflowEntity();
    const artifact = createArtifactEntity();
    const agent = createAgentEntity();

    graph.addEntity(workflow);
    graph.addEntity(artifact);
    graph.addEntity(agent);
    graph.addRelationship({
      id: "rel:workflow-generated-artifact",
      type: "GENERATED",
      fromEntityId: workflow.id,
      toEntityId: artifact.id,
      createdAt: "2026-01-01T00:00:00.000Z",
      metadata: {
        stageId: "Discovery"
      }
    });
    graph.addRelationship({
      id: "rel:agent-created-artifact",
      type: "CREATED",
      fromEntityId: agent.id,
      toEntityId: artifact.id,
      createdAt: "2026-01-01T00:01:00.000Z",
      metadata: {}
    });

    const incoming = graph.getRelatedEntities(artifact.id, {
      direction: "incoming",
      relationshipTypes: ["GENERATED"]
    });

    assert.equal(incoming.length, 1);
    assert.equal(incoming[0].entity.id, workflow.id);
    assert.equal(incoming[0].relationship.type, "GENERATED");
    assert.equal(incoming[0].direction, "incoming");
  });

  it("rejects relationships with missing entities", () => {
    const graph = new KnowledgeGraph();
    graph.addEntity(createArtifactEntity());

    assert.throws(
      () =>
        graph.addRelationship({
          id: "rel:missing",
          type: "DEPENDS_ON",
          fromEntityId: "artifact:prd",
          toEntityId: "artifact:missing",
          createdAt: "2026-01-01T00:00:00.000Z",
          metadata: {}
        }),
      /Relationship target entity not found: artifact:missing/
    );
  });
});

describe("MemoryService", () => {
  it("records decisions and outcomes", () => {
    const memory = new MemoryService();
    const decision = createDecision();

    memory.recordDecision(decision);
    memory.recordOutcome({
      id: "outcome:architecture-pattern",
      decisionId: decision.id,
      title: "Architecture pattern reduced review churn",
      description: "The selected modular service approach kept later changes scoped.",
      createdAt: "2026-01-02T00:00:00.000Z",
      status: "successful",
      metadata: {
        releaseId: "release-1"
      }
    });

    const history = memory.retrieveHistory({ projectId: "project-1" });

    assert.deepEqual(history.decisions.map((item) => item.id), [decision.id]);
    assert.deepEqual(history.outcomes.map((item) => item.decisionId), [decision.id]);
  });

  it("filters history by workflow and decision", () => {
    const memory = new MemoryService();
    const first = createDecision();
    const second = createDecision({
      id: "decision:approval-model",
      title: "Use threshold approvals",
      workflowId: "workflow-2"
    });

    memory.recordDecision(first);
    memory.recordDecision(second);

    assert.deepEqual(
      memory.retrieveHistory({ workflowId: "workflow-2" }).decisions.map((item) => item.id),
      [second.id]
    );
    assert.deepEqual(
      memory.retrieveHistory({ decisionId: first.id }).decisions.map((item) => item.id),
      [first.id]
    );
  });
});

describe("KnowledgeEngineService", () => {
  it("persists and retrieves organizational knowledge", () => {
    const service = new KnowledgeEngineService();
    const artifact = createArtifactEntity();
    const skill = createSkillEntity();

    service.addEntity(artifact);
    service.addEntity(skill);
    service.addRelationship({
      id: "rel:skill-generated-artifact",
      type: "GENERATED",
      fromEntityId: skill.id,
      toEntityId: artifact.id,
      createdAt: "2026-01-01T00:00:00.000Z",
      metadata: {
        deterministic: true
      }
    });

    const related = service.getRelatedEntities(skill.id, { direction: "outgoing" });

    assert.equal(service.getEntity(artifact.id)?.title, "Supplier payment PRD");
    assert.equal(related.length, 1);
    assert.equal(related[0].entity.id, artifact.id);
  });

  it("finds similar artifacts and decisions deterministically", () => {
    const service = new KnowledgeEngineService();
    const artifact = createArtifactEntity({
      id: "artifact:payment-prd",
      title: "Supplier payment approval PRD",
      description: "Payment approval thresholds and governance controls.",
      metadata: {
        projectId: "project-1",
        workflowId: "workflow-1"
      }
    });
    const unrelated = createArtifactEntity({
      id: "artifact:release-plan",
      title: "Release packaging plan",
      description: "Deployment and release readiness.",
      metadata: {
        projectId: "project-2"
      }
    });
    const decision = createDecision({
      title: "Use threshold approval workflow",
      rationale: "Payment changes require explicit governance controls.",
      selectedOption: "Threshold approval workflow"
    });

    service.addEntity(artifact);
    service.addEntity(unrelated);
    service.recordDecision(decision);

    const artifacts = service.findSimilarArtifacts("payment approval controls");
    const decisions = service.findSimilarDecisions("approval governance");

    assert.equal(artifacts[0].item.id, artifact.id);
    assert.ok(artifacts[0].score > 0);
    assert.deepEqual(decisions.map((result) => result.item.id), [decision.id]);
  });

  it("gets project history from graph entities and memory", () => {
    const service = new KnowledgeEngineService();
    const artifact = createArtifactEntity();
    const workflow = createWorkflowEntity();
    const decision = createDecision();

    service.addEntity(artifact);
    service.addEntity(workflow);
    service.recordDecision(decision);

    const history = service.getProjectHistory("project-1");

    assert.deepEqual(
      history.entities.map((entity) => entity.id),
      [workflow.id, artifact.id]
    );
    assert.deepEqual(history.decisions.map((item) => item.id), [decision.id]);
  });
});

function createArtifactEntity(
  overrides: Partial<KnowledgeEntity> = {}
): KnowledgeEntity {
  return {
    id: "artifact:prd",
    type: "Artifact",
    title: "Supplier payment PRD",
    description: "PRD for supplier payment approval workflow.",
    createdAt: "2026-01-01T00:02:00.000Z",
    ...overrides,
    metadata: {
      projectId: "project-1",
      workflowId: "workflow-1",
      artifactType: "PRD",
      ...(overrides.metadata ?? {})
    }
  };
}

function createWorkflowEntity(): KnowledgeEntity {
  return {
    id: "workflow:delivery",
    type: "Workflow",
    title: "Supplier payment delivery workflow",
    description: "Feature delivery workflow for supplier payments.",
    createdAt: "2026-01-01T00:00:00.000Z",
    metadata: {
      projectId: "project-1",
      workflowId: "workflow-1"
    }
  };
}

function createAgentEntity(): KnowledgeEntity {
  return {
    id: "agent:discovery",
    type: "Agent",
    title: "Discovery Agent",
    createdAt: "2026-01-01T00:00:00.000Z",
    metadata: {
      agentId: "discovery-agent"
    }
  };
}

function createSkillEntity(): KnowledgeEntity {
  return {
    id: "skill:prd-writer@2.0",
    type: "Skill",
    title: "PRD Writer 2.0",
    createdAt: "2026-01-01T00:00:00.000Z",
    metadata: {
      skillId: "prd-writer@2.0",
      category: "product"
    }
  };
}

function createDecision(overrides: Partial<DecisionRecord> = {}): DecisionRecord {
  return {
    id: "decision:architecture-pattern",
    title: "Use modular service architecture",
    rationale: "The workflow needs isolated ownership and traceable service boundaries.",
    selectedOption: "Modular service architecture",
    createdAt: "2026-01-01T00:00:00.000Z",
    projectId: "project-1",
    workflowId: "workflow-1",
    artifactIds: ["artifact:prd"],
    ...overrides,
    alternatives: overrides.alternatives ?? [
      "Single package",
      "External workflow platform"
    ],
    metadata: {
      owner: "architecture-agent",
      ...(overrides.metadata ?? {})
    }
  };
}
