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

  it("maps implementation skills to Engineering Agent", () => {
    const service = new SkillMappingService();

    const engineeringSkills = service.getSkillsForAgent("agent:engineering");

    assert.deepEqual(
      engineeringSkills.map((skill) => skill.skillId),
      [
        "backend-contributor",
        "frontend-contributor",
        "mono-web-contributor",
        "crons-contributor",
        "data-science-monorepo-contributor"
      ]
    );
  });

  it("maps design skills to Design Agent in execution order", () => {
    const service = new SkillMappingService();

    assert.deepEqual(
      service.getSkillsForAgent("agent:design").map((skill) => skill.skillId),
      [
        "user-journey-designer",
        "user-flow-designer",
        "ia-designer",
        "wireframe-planner",
        "component-mapper",
        "prototype-planner"
      ]
    );
  });

  it("maps QA skills to QA Agent", () => {
    const service = new SkillMappingService();

    const qaSkills = service.getSkillsForAgent("agent:qa");

    assert.deepEqual(
      qaSkills.map((skill) => skill.skillId),
      ["test-plan-writer"]
    );
  });

  it("maps governance skills to Governance Agent", () => {
    const service = new SkillMappingService();

    assert.deepEqual(
      service.getSkillsForAgent("agent:governance").map((skill) => skill.skillId),
      ["git-guardian", "conventions", "ai-data-analyst"]
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

    assert.equal(graph.nodes.length, 23);
    assert.ok(
      graph.edges.some(
        (edge) => edge.fromSkillId === "prototype-planner" && edge.toSkillId === "tech-spec-writer"
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

  it("recommends the Design Agent after product requirements", () => {
    const service = new SkillRecommendationService();
    const context = {
      availableArtifacts: [ArtifactType.PRD],
      completedSkills: ["repo-router", "knowledge", "codebase-research", "prd-writer"]
    };

    assert.equal(service.recommendNextAgent(context), "agent:design");
    assert.equal(service.recommendWorkflowStage(context), "design");
  });

  it("recommends the Engineering Agent when architecture outputs are available", () => {
    const service = new SkillRecommendationService();
    const context = {
      availableArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
      completedSkills: ["tech-spec-writer", "implement-plan", "design-system"]
    };

    assert.equal(service.recommendNextAgent(context), "agent:engineering");
    assert.equal(service.recommendWorkflowStage(context), "engineering");
  });

  it("recommends the Architecture Agent when design outputs are available", () => {
    const service = new SkillRecommendationService();
    const context = {
      availableArtifacts: [ArtifactType.PRD, ArtifactType.DESIGN_PACKAGE],
      completedSkills: [
        "repo-router",
        "knowledge",
        "codebase-research",
        "prd-writer",
        "user-journey-designer",
        "user-flow-designer",
        "ia-designer",
        "wireframe-planner",
        "component-mapper",
        "prototype-planner"
      ]
    };

    assert.equal(service.recommendNextAgent(context), "agent:architecture");
    assert.equal(service.recommendWorkflowStage(context), "tech-spec");
  });

  it("recommends the QA Agent when engineering package is available", () => {
    const service = new SkillRecommendationService();
    const context = {
      availableArtifacts: [
        ArtifactType.PRD,
        ArtifactType.TECH_SPEC,
        ArtifactType.IMPLEMENTATION_PLAN,
        ArtifactType.ENGINEERING_PACKAGE
      ],
      completedSkills: [
        "backend-contributor",
        "frontend-contributor",
        "mono-web-contributor",
        "crons-contributor",
        "data-science-monorepo-contributor"
      ]
    };

    assert.equal(service.recommendNextAgent(context), "agent:qa");
    assert.equal(service.recommendWorkflowStage(context), "qa");
  });

  it("recommends the Governance Agent when QA package is available", () => {
    const service = new SkillRecommendationService();
    const context = {
      availableArtifacts: [ArtifactType.QA_PACKAGE],
      completedSkills: ["test-plan-writer"]
    };

    assert.equal(service.recommendNextAgent(context), "agent:governance");
    assert.equal(service.recommendWorkflowStage(context), "governance");
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

    assert.equal(service.mapping.listSkills().length, 23);
    assert.equal(service.graph.validateDependencies().valid, true);
    assert.equal(
      service.recommendations.recommendNextSkill({
        availableArtifacts: [ArtifactType.IDEA]
      })?.skillId,
      "repo-router"
    );
  });
});
