import { ArtifactType } from "@apdos/artifacts";
import type { SkillGovernanceMetadata } from "./skill-governance-metadata.js";

export const DEFAULT_SKILL_GOVERNANCE_METADATA: SkillGovernanceMetadata[] = [
  {
    skillId: "repo-router",
    version: "1.0",
    ownerAgent: "agent:discovery",
    workflowStage: "idea",
    inputArtifacts: [ArtifactType.IDEA],
    outputArtifacts: [ArtifactType.TASK],
    dependencies: [],
    executionOrder: 10,
    enabled: true
  },
  {
    skillId: "knowledge",
    version: "1.0",
    ownerAgent: "agent:discovery",
    workflowStage: "discovery",
    inputArtifacts: [ArtifactType.IDEA],
    outputArtifacts: [ArtifactType.TASK],
    dependencies: ["repo-router"],
    executionOrder: 20,
    enabled: true
  },
  {
    skillId: "codebase-research",
    version: "1.0",
    ownerAgent: "agent:discovery",
    workflowStage: "discovery",
    inputArtifacts: [ArtifactType.IDEA, ArtifactType.TASK],
    outputArtifacts: [ArtifactType.DISCOVERY_REPORT],
    dependencies: ["repo-router", "knowledge"],
    executionOrder: 30,
    enabled: true
  },
  {
    skillId: "prd-writer",
    version: "1.0",
    ownerAgent: "agent:product",
    workflowStage: "prd",
    inputArtifacts: [ArtifactType.DISCOVERY_REPORT],
    outputArtifacts: [ArtifactType.PRD],
    dependencies: ["codebase-research"],
    executionOrder: 40,
    enabled: true
  },
  {
    skillId: "tech-spec-writer",
    version: "1.0",
    ownerAgent: "agent:architecture",
    workflowStage: "tech-spec",
    inputArtifacts: [ArtifactType.PRD],
    outputArtifacts: [ArtifactType.TECH_SPEC],
    dependencies: ["prd-writer"],
    executionOrder: 50,
    enabled: true
  },
  {
    skillId: "implement-plan",
    version: "1.0",
    ownerAgent: "agent:architecture",
    workflowStage: "tech-spec",
    inputArtifacts: [ArtifactType.PRD, ArtifactType.TECH_SPEC],
    outputArtifacts: [ArtifactType.IMPLEMENTATION_PLAN],
    dependencies: ["tech-spec-writer"],
    executionOrder: 60,
    enabled: true
  },
  {
    skillId: "design-system",
    version: "1.0",
    ownerAgent: "agent:architecture",
    workflowStage: "tech-spec",
    inputArtifacts: [ArtifactType.PRD, ArtifactType.TECH_SPEC],
    outputArtifacts: [ArtifactType.IMPLEMENTATION_PLAN],
    dependencies: ["tech-spec-writer"],
    executionOrder: 65,
    enabled: true
  },
  {
    skillId: "backend-contributor",
    version: "1.0",
    ownerAgent: "agent:engineering",
    workflowStage: "engineering",
    inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
    outputArtifacts: [ArtifactType.CODE_CHANGE],
    dependencies: ["implement-plan"],
    executionOrder: 70,
    enabled: true
  },
  {
    skillId: "frontend-contributor",
    version: "1.0",
    ownerAgent: "agent:engineering",
    workflowStage: "engineering",
    inputArtifacts: [ArtifactType.PRD, ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
    outputArtifacts: [ArtifactType.CODE_CHANGE],
    dependencies: ["implement-plan", "design-system"],
    executionOrder: 75,
    enabled: true
  },
  {
    skillId: "mono-web-contributor",
    version: "1.0",
    ownerAgent: "agent:engineering",
    workflowStage: "engineering",
    inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
    outputArtifacts: [ArtifactType.CODE_CHANGE],
    dependencies: ["implement-plan"],
    executionOrder: 80,
    enabled: true
  },
  {
    skillId: "crons-contributor",
    version: "1.0",
    ownerAgent: "agent:engineering",
    workflowStage: "engineering",
    inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
    outputArtifacts: [ArtifactType.CODE_CHANGE],
    dependencies: ["implement-plan"],
    executionOrder: 85,
    enabled: true
  },
  {
    skillId: "data-science-monorepo-contributor",
    version: "1.0",
    ownerAgent: "agent:engineering",
    workflowStage: "engineering",
    inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
    outputArtifacts: [ArtifactType.CODE_CHANGE],
    dependencies: ["implement-plan"],
    executionOrder: 90,
    enabled: true
  },
  {
    skillId: "test-plan-writer",
    version: "1.0",
    ownerAgent: "agent:qa",
    workflowStage: "qa",
    inputArtifacts: [
      ArtifactType.PRD,
      ArtifactType.TECH_SPEC,
      ArtifactType.IMPLEMENTATION_PLAN,
      ArtifactType.ENGINEERING_PACKAGE
    ],
    outputArtifacts: [ArtifactType.TEST_RESULT],
    dependencies: ["backend-contributor"],
    executionOrder: 100,
    enabled: true
  },
  {
    skillId: "ai-data-analyst",
    version: "1.0",
    ownerAgent: "agent:qa",
    workflowStage: "qa",
    inputArtifacts: [ArtifactType.ENGINEERING_PACKAGE, ArtifactType.TEST_RESULT],
    outputArtifacts: [ArtifactType.GOVERNANCE_FINDING],
    dependencies: ["test-plan-writer"],
    executionOrder: 110,
    enabled: true
  },
  {
    skillId: "git-guardian",
    version: "1.0",
    ownerAgent: "agent:governance",
    workflowStage: "approval",
    inputArtifacts: [ArtifactType.CODE_CHANGE, ArtifactType.TEST_RESULT],
    outputArtifacts: [ArtifactType.GOVERNANCE_FINDING],
    dependencies: ["test-plan-writer"],
    executionOrder: 120,
    enabled: true
  },
  {
    skillId: "conventions",
    version: "1.0",
    ownerAgent: "agent:governance",
    workflowStage: "approval",
    inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.CODE_CHANGE],
    outputArtifacts: [ArtifactType.GOVERNANCE_FINDING],
    dependencies: ["git-guardian"],
    executionOrder: 130,
    enabled: true
  },
  {
    skillId: "chronolog-logging",
    version: "1.0",
    ownerAgent: "agent:release",
    workflowStage: "release-package",
    inputArtifacts: [ArtifactType.GOVERNANCE_FINDING, ArtifactType.CODE_CHANGE, ArtifactType.TEST_RESULT],
    outputArtifacts: [ArtifactType.RELEASE_PACKAGE],
    dependencies: ["git-guardian", "conventions"],
    executionOrder: 140,
    enabled: true
  }
];
