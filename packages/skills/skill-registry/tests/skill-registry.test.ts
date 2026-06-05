import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ArtifactType } from "@apdos/artifacts";
import {
  SkillRegistry,
  createSeededSkillRegistry,
  prdTemplate,
  type SkillDefinition
} from "../src/index.js";

function buildSkill(overrides: Partial<SkillDefinition> = {}): SkillDefinition {
  return {
    id: "test-skill@1.0",
    name: "test-skill",
    description: "Test skill definition.",
    version: "1.0",
    dependencies: [],
    category: "research",
    status: "available",
    inputArtifacts: [ArtifactType.IDEA],
    outputArtifacts: [ArtifactType.DISCOVERY_REPORT],
    templates: [prdTemplate],
    rules: [
      {
        id: "rule:test",
        description: "Test rule.",
        severity: "error"
      }
    ],
    constraints: {
      requiresHumanApproval: false,
      maxInputArtifacts: 2,
      allowedWorkflowStages: ["Discovery"]
    },
    ...overrides
  };
}

describe("SkillRegistry", () => {
  it("registers skills", () => {
    const registry = new SkillRegistry();
    const skill = buildSkill();

    registry.registerSkill(skill);

    assert.equal(registry.listSkills().length, 1);
    assert.equal(registry.listSkills()[0].id, skill.id);
  });

  it("rejects duplicate skill ids", () => {
    const registry = new SkillRegistry();
    const skill = buildSkill();

    registry.registerSkill(skill);

    assert.throws(
      () => registry.registerSkill(skill),
      /Skill already exists: test-skill@1.0/
    );
  });

  it("looks up and unregisters skills", () => {
    const registry = new SkillRegistry();
    const skill = buildSkill();

    registry.registerSkill(skill);

    assert.deepEqual(registry.getSkill(skill.id), skill);
    assert.equal(registry.unregisterSkill(skill.id), true);
    assert.equal(registry.getSkill(skill.id), undefined);
  });

  it("filters skills by category", () => {
    const registry = createSeededSkillRegistry();

    const skills = registry.findSkillsByCategory("product");

    assert.deepEqual(
      skills.map((skill) => skill.id),
      ["prd-writer@1.0", "prd-writer@2.0"]
    );
  });

  it("filters skills by input artifact", () => {
    const registry = createSeededSkillRegistry();

    const skills = registry.findSkillsByInputArtifact(ArtifactType.PRD);

    assert.deepEqual(
      skills.map((skill) => skill.name),
      [
        "tech-spec-writer",
        "implement-plan",
        "design-system",
        "frontend-contributor"
      ]
    );
  });

  it("filters skills by output artifact", () => {
    const registry = createSeededSkillRegistry();

    const skills = registry.findSkillsByOutputArtifact(ArtifactType.PRD);

    assert.deepEqual(
      skills.map((skill) => skill.id),
      ["prd-writer@1.0", "prd-writer@2.0"]
    );
  });

  it("supports skill version history", () => {
    const registry = createSeededSkillRegistry();

    assert.deepEqual(
      registry.listSkillVersions("prd-writer").map((skill) => skill.id),
      ["prd-writer@1.0", "prd-writer@2.0"]
    );
    assert.equal(
      registry.getSkillVersion("prd-writer", "2.0")?.description,
      "Writes a PRD from discovery context with stronger governance-ready scope controls."
    );
  });

  it("seeds the initial APDOS skill definitions", () => {
    const registry = createSeededSkillRegistry();

    assert.deepEqual(
      registry.listSkills().map((skill) => skill.name),
      [
        "repo-router",
        "knowledge",
        "codebase-research",
        "prd-writer",
        "prd-writer",
        "tech-spec-writer",
        "implement-plan",
        "design-system",
        "backend-contributor",
        "frontend-contributor",
        "mono-web-contributor",
        "crons-contributor",
        "data-science-monorepo-contributor",
        "ai-data-analyst",
        "test-plan-writer",
        "git-guardian",
        "conventions",
        "chronolog-logging"
      ]
    );
  });
});
