import { ArtifactType } from "@apdos/artifacts";
import type { SkillTemplate } from "../contracts/skill-definition.js";

export const prdTemplate: SkillTemplate = {
  id: "template:prd",
  name: "PRD",
  description: "Product requirements document template.",
  artifactType: ArtifactType.PRD
};

export const techSpecTemplate: SkillTemplate = {
  id: "template:tech-spec",
  name: "Tech Spec",
  description: "Technical specification template.",
  artifactType: ArtifactType.TECH_SPEC
};

export const testPlanTemplate: SkillTemplate = {
  id: "template:test-plan",
  name: "Test Plan",
  description: "Implementation test plan template.",
  artifactType: ArtifactType.TEST_RESULT
};

export const governanceTemplate: SkillTemplate = {
  id: "template:governance-finding",
  name: "Governance Finding",
  description: "Governance finding template.",
  artifactType: ArtifactType.GOVERNANCE_FINDING
};

export const releaseTemplate: SkillTemplate = {
  id: "template:release-package",
  name: "Release Package",
  description: "Release package template.",
  artifactType: ArtifactType.RELEASE_PACKAGE
};
