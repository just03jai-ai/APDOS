import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ArtifactType } from "@apdos/artifacts";
import {
  DEFAULT_SKILL_GOVERNANCE_METADATA,
  SkillDependencyGraphService,
  SkillGovernanceService,
  SkillMappingService,
  SkillRecommendationService,
  type SkillGovernanceMetadata
} from "../src/index.js";

describe("SkillMappingService", () => {
  it("maps skills to owner agents in execution order", () => {
    const service = new SkillMappingService();

    const discoverySkills = service.getSkillsForAgent("agent:discovery");

    assert.deepEqual(
      discoverySkills.map((skill) => skill.skillId),
      ["repo-router", "knowledge", "codebase-research"]
    );
  });

  it("maps skills to workflow stages", () => {
    const service = new SkillMappingService();

    const techSpecSkills = service.getSkillsForWorkflowStage("tech-spec");

    assert.deepEqual(
      techSpecSkills.map((skill) => skill.skillId),
      ["tech-spec-writer", "implement-plan", "design-system"]
    );
  });

  it("returns skill dependencies as metadata", () => {
    const service = new SkillMappingService();

    const dependencies = service.getSkillDependencies("frontend-contributor");

    assert.deepEqual(
      dependencies.map((skill) => skill.skillId),
      ["implement-plan", "design-system"]
    );
  });
});

describe("SkillDependencyGraphService", () => {
  it("builds a deterministic skill graph", () => {
    const service = new SkillDependencyGraphService();

    const graph = service.buildSkillGraph();

    assert.equal(graph.nodes.length, 17);
    assert.ok(
      graph.edges.some(
        (edge) => edge.fromSkillId === "prd-writer" && edge.toSkillId === "tech-spec-writer"
      )
    );
  });

  it("validates default dependencies", () => {
    const service = new SkillDependencyGraphService();

    const result = service.validateDependencies();

    assert.equal(result.valid, true);
    assert.deepEqual(result.issues, []);
  });

  it("reports missing and disabled dependencies", () => {
    const metadata: SkillGovernanceMetadata[] = [
      {
        ...DEFAULT_SKILL_GOVERNANCE_METADATA[0],
        skillId: "root",
        dependencies: []
      },
      {
        ...DEFAULT_SKILL_GOVERNANCE_METADATA[1],
        skillId: "disabled-dependency",
        dependencies: [],
        enabled: false
      },
      {
        ...DEFAULT_SKILL_GOVERNANCE_METADATA[2],
        skillId: "dependent",
        dependencies: ["missing-dependency", "disabled-dependency"]
      }
    ];

    const result = new SkillDependencyGraphService(metadata).validateDependencies();

    assert.equal(result.valid, false);
    assert.deepEqual(result.issues, [
      {
        skillId: "dependent",
        dependency: "missing-dependency",
        reason: "missing"
      },
      {
        skillId: "dependent",
        dependency: "disabled-dependency",
        reason: "disabled"
      }
    ]);
  });

  it("reports dependency cycles", () => {
    const metadata: SkillGovernanceMetadata[] = [
      {
        ...DEFAULT_SKILL_GOVERNANCE_METADATA[0],
        skillId: "first",
        dependencies: ["second"]
      },
      {
        ...DEFAULT_SKILL_GOVERNANCE_METADATA[1],
        skillId: "second",
        dependencies: ["first"]
      }
    ];

    const result = new SkillDependencyGraphService(metadata).validateDependencies();

    assert.equal(result.valid, false);
    assert.deepEqual(
      result.issues.filter((issue) => issue.reason === "cycle").map((issue) => issue.skillId),
      ["first", "second"]
    );
  });
});

describe("SkillRecommendationService", () => {
  it("recommends the next skill for a workflow stage", () => {
    const service = new SkillRecommendationService();

    const recommendation = service.recommendNextSkill({
      workflowStage: "prd",
      availableArtifacts: [ArtifactType.DISCOVERY_REPORT],
      completedSkills: ["repo-router", "knowledge", "codebase-research"]
    });

    assert.equal(recommendation?.skillId, "prd-writer");
  });

  it("recommends the next agent and workflow stage from available artifacts", () => {
    const service = new SkillRecommendationService();
    const context = {
      availableArtifacts: [ArtifactType.PRD],
      completedSkills: ["repo-router", "knowledge", "codebase-research", "prd-writer"]
    };

    assert.equal(service.recommendNextAgent(context), "agent:architecture");
    assert.equal(service.recommendWorkflowStage(context), "tech-spec");
  });

  it("does not recommend skills with incomplete dependencies", () => {
    const service = new SkillRecommendationService();

    const recommendation = service.recommendNextSkill({
      workflowStage: "tech-spec",
      availableArtifacts: [ArtifactType.PRD],
      completedSkills: []
    });

    assert.equal(recommendation, undefined);
  });
});

describe("SkillGovernanceService", () => {
  it("exposes mapping, graph, and recommendation services together", () => {
    const service = new SkillGovernanceService();

    assert.equal(service.mapping.listSkills().length, 17);
    assert.equal(service.graph.validateDependencies().valid, true);
    assert.equal(
      service.recommendations.recommendNextSkill({
        availableArtifacts: [ArtifactType.IDEA]
      })?.skillId,
      "repo-router"
    );
  });
});
