import { ArtifactType } from "@apdos/artifacts";
import type { SkillDefinition } from "../contracts/skill-definition.js";
import {
  governanceTemplate,
  prdTemplate,
  releaseTemplate,
  techSpecTemplate,
  testPlanTemplate
} from "../templates/skill-templates.js";

export const repoRouterSkill: SkillDefinition = {
  id: "repo-router@1.0",
  name: "repo-router",
  description: "Routes work to the relevant repository area based on artifact context.",
  version: "1.0",
  dependencies: [],
  category: "routing",
  status: "available",
  inputArtifacts: [ArtifactType.IDEA],
  outputArtifacts: [ArtifactType.TASK],
  templates: [],
  rules: [
    {
      id: "rule:repo-router-target-required",
      description: "Routing output must identify a target package or repository area.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: false,
    maxInputArtifacts: 5,
    allowedWorkflowStages: ["Discovery", "PRD", "TechSpec"]
  }
};

export const codebaseResearchSkill: SkillDefinition = {
  id: "codebase-research@1.0",
  name: "codebase-research",
  description: "Researches existing code and records implementation context.",
  version: "1.0",
  dependencies: ["repo-router", "knowledge"],
  category: "research",
  status: "available",
  inputArtifacts: [ArtifactType.IDEA, ArtifactType.TASK],
  outputArtifacts: [ArtifactType.DISCOVERY_REPORT],
  templates: [],
  rules: [
    {
      id: "rule:codebase-research-evidence-required",
      description: "Research output must cite relevant files, packages, or prior artifacts.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: false,
    maxInputArtifacts: 5,
    allowedWorkflowStages: ["TechSpec"]
  }
};

export const knowledgeSkill: SkillDefinition = {
  id: "knowledge@1.0",
  name: "knowledge",
  description: "Retrieves platform knowledge needed to transform artifacts safely.",
  version: "1.0",
  dependencies: ["repo-router"],
  category: "knowledge",
  status: "available",
  inputArtifacts: [ArtifactType.IDEA],
  outputArtifacts: [ArtifactType.TASK],
  templates: [],
  rules: [
    {
      id: "rule:knowledge-source-required",
      description: "Knowledge output must identify the source of reused platform context.",
      severity: "warning"
    }
  ],
  constraints: {
    requiresHumanApproval: false,
    maxInputArtifacts: 10
  }
};

export const prdWriterV1Skill: SkillDefinition = {
  id: "prd-writer@1.0",
  name: "prd-writer",
  description: "Writes a PRD from discovery context.",
  version: "1.0",
  dependencies: ["codebase-research"],
  category: "product",
  status: "available",
  inputArtifacts: [ArtifactType.DISCOVERY_REPORT],
  outputArtifacts: [ArtifactType.PRD],
  templates: [prdTemplate],
  rules: [
    {
      id: "rule:prd-acceptance-criteria-required",
      description: "PRDs must include acceptance criteria.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 5,
    allowedWorkflowStages: ["PRD"]
  }
};

export const prdWriterV2Skill: SkillDefinition = {
  ...prdWriterV1Skill,
  id: "prd-writer@2.0",
  version: "2.0",
  description: "Writes a PRD from discovery context with stronger governance-ready scope controls.",
  rules: [
    ...prdWriterV1Skill.rules,
    {
      id: "rule:prd-non-goals-required",
      description: "PRDs must include explicit non-goals.",
      severity: "warning"
    }
  ]
};

export const techSpecWriterSkill: SkillDefinition = {
  id: "tech-spec-writer@1.0",
  name: "tech-spec-writer",
  description: "Writes technical specifications from product requirements.",
  version: "1.0",
  dependencies: ["prd-writer"],
  category: "architecture",
  status: "available",
  inputArtifacts: [ArtifactType.PRD],
  outputArtifacts: [ArtifactType.TECH_SPEC],
  templates: [techSpecTemplate],
  rules: [
    {
      id: "rule:tech-spec-risk-section-required",
      description: "Technical specs must include risks and mitigations.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 5,
    allowedWorkflowStages: ["TechSpec"]
  }
};

export const implementPlanSkill: SkillDefinition = {
  id: "implement-plan@1.0",
  name: "implement-plan",
  description: "Creates implementation planning artifacts from technical specifications.",
  version: "1.0",
  dependencies: ["tech-spec-writer"],
  category: "architecture",
  status: "available",
  inputArtifacts: [ArtifactType.PRD, ArtifactType.TECH_SPEC],
  outputArtifacts: [ArtifactType.IMPLEMENTATION_PLAN],
  templates: [],
  rules: [
    {
      id: "rule:implement-plan-task-breakdown-required",
      description: "Implementation plans must include clear task breakdowns and milestones.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: false,
    maxInputArtifacts: 8
  }
};

export const testPlanWriterSkill: SkillDefinition = {
  id: "test-plan-writer@1.0",
  name: "test-plan-writer",
  description: "Creates test planning artifacts from implementation plans and technical specs.",
  version: "1.0",
  dependencies: ["implement-plan"],
  category: "quality",
  status: "available",
  inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN, ArtifactType.CODE_CHANGE],
  outputArtifacts: [ArtifactType.TEST_RESULT],
  templates: [testPlanTemplate],
  rules: [
    {
      id: "rule:test-plan-critical-path-required",
      description: "Test plans must cover critical path behavior.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 6
  }
};

export const designSystemSkill: SkillDefinition = {
  id: "design-system@1.0",
  name: "design-system",
  description: "Applies APDOS design system guidance to frontend artifact transformations.",
  version: "1.0",
  dependencies: ["tech-spec-writer"],
  category: "design",
  status: "available",
  inputArtifacts: [ArtifactType.PRD, ArtifactType.TECH_SPEC],
  outputArtifacts: [ArtifactType.IMPLEMENTATION_PLAN],
  templates: [],
  rules: [
    {
      id: "rule:design-system-token-use-required",
      description: "Design output must identify relevant design system tokens or components.",
      severity: "warning"
    }
  ],
  constraints: {
    requiresHumanApproval: false,
    maxInputArtifacts: 5
  }
};

export const backendContributorSkill: SkillDefinition = {
  id: "backend-contributor@1.0",
  name: "backend-contributor",
  description: "Contributes backend implementation plans and code change artifacts.",
  version: "1.0",
  dependencies: ["implement-plan"],
  category: "backend",
  status: "available",
  inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
  outputArtifacts: [ArtifactType.CODE_CHANGE],
  templates: [],
  rules: [
    {
      id: "rule:backend-contract-impact-required",
      description: "Backend changes must describe API, data, or contract impact.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 8
  }
};

export const frontendContributorSkill: SkillDefinition = {
  id: "frontend-contributor@1.0",
  name: "frontend-contributor",
  description: "Contributes frontend implementation plans and code change artifacts.",
  version: "1.0",
  dependencies: ["implement-plan", "design-system"],
  category: "frontend",
  status: "available",
  inputArtifacts: [ArtifactType.PRD, ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
  outputArtifacts: [ArtifactType.CODE_CHANGE],
  templates: [],
  rules: [
    {
      id: "rule:frontend-state-coverage-required",
      description: "Frontend changes must account for loading, empty, error, and success states.",
      severity: "warning"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 8
  }
};

export const monoWebContributorSkill: SkillDefinition = {
  id: "mono-web-contributor@1.0",
  name: "mono-web-contributor",
  description: "Contributes monorepo web implementation artifacts.",
  version: "1.0",
  dependencies: ["implement-plan"],
  category: "frontend",
  status: "available",
  inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
  outputArtifacts: [ArtifactType.CODE_CHANGE],
  templates: [],
  rules: [
    {
      id: "rule:mono-web-package-boundary-required",
      description: "Monorepo web changes must identify affected packages and boundaries.",
      severity: "warning"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 8
  }
};

export const cronsContributorSkill: SkillDefinition = {
  id: "crons-contributor@1.0",
  name: "crons-contributor",
  description: "Contributes scheduled job and cron implementation artifacts.",
  version: "1.0",
  dependencies: ["implement-plan"],
  category: "backend",
  status: "available",
  inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
  outputArtifacts: [ArtifactType.CODE_CHANGE],
  templates: [],
  rules: [
    {
      id: "rule:cron-schedule-impact-required",
      description: "Cron changes must describe schedule, retry, and operational impact.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 8
  }
};

export const dataScienceMonorepoContributorSkill: SkillDefinition = {
  id: "data-science-monorepo-contributor@1.0",
  name: "data-science-monorepo-contributor",
  description: "Contributes data science monorepo implementation artifacts.",
  version: "1.0",
  dependencies: ["implement-plan"],
  category: "backend",
  status: "available",
  inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
  outputArtifacts: [ArtifactType.CODE_CHANGE],
  templates: [],
  rules: [
    {
      id: "rule:data-science-data-contract-required",
      description: "Data science changes must identify data contracts and model or metric impact.",
      severity: "warning"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 8
  }
};

export const aiDataAnalystSkill: SkillDefinition = {
  id: "ai-data-analyst@1.0",
  name: "ai-data-analyst",
  description: "Analyzes delivery artifacts and data outputs for validation findings.",
  version: "1.0",
  dependencies: ["backend-contributor"],
  category: "quality",
  status: "available",
  inputArtifacts: [ArtifactType.CODE_CHANGE, ArtifactType.TEST_RESULT],
  outputArtifacts: [ArtifactType.GOVERNANCE_FINDING],
  templates: [],
  rules: [
    {
      id: "rule:ai-data-analysis-evidence-required",
      description: "Analysis findings must include evidence and impacted metric context.",
      severity: "warning"
    }
  ],
  constraints: {
    requiresHumanApproval: false,
    maxInputArtifacts: 10
  }
};

export const gitGuardianSkill: SkillDefinition = {
  id: "git-guardian@1.0",
  name: "git-guardian",
  description: "Reviews code changes for git safety, secrets, and release readiness.",
  version: "1.0",
  dependencies: ["test-plan-writer"],
  category: "governance",
  status: "available",
  inputArtifacts: [ArtifactType.CODE_CHANGE, ArtifactType.TEST_RESULT],
  outputArtifacts: [ArtifactType.GOVERNANCE_FINDING],
  templates: [governanceTemplate],
  rules: [
    {
      id: "rule:git-guardian-no-secret-regression",
      description: "Git governance findings must identify secret, branch, and risky diff issues.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 10
  }
};

export const conventionsSkill: SkillDefinition = {
  id: "conventions@1.0",
  name: "conventions",
  description: "Applies repository conventions and review standards to delivery artifacts.",
  version: "1.0",
  dependencies: ["git-guardian"],
  category: "governance",
  status: "available",
  inputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.CODE_CHANGE],
  outputArtifacts: [ArtifactType.GOVERNANCE_FINDING],
  templates: [governanceTemplate],
  rules: [
    {
      id: "rule:conventions-deviation-required",
      description: "Convention findings must identify deviations or confirm compliance.",
      severity: "warning"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 10
  }
};

export const chronologLoggingSkill: SkillDefinition = {
  id: "chronolog-logging@1.0",
  name: "chronolog-logging",
  description: "Creates release logging and chronology artifacts for governed delivery.",
  version: "1.0",
  dependencies: ["git-guardian", "conventions"],
  category: "release",
  status: "available",
  inputArtifacts: [ArtifactType.GOVERNANCE_FINDING, ArtifactType.CODE_CHANGE, ArtifactType.TEST_RESULT],
  outputArtifacts: [ArtifactType.RELEASE_PACKAGE],
  templates: [releaseTemplate],
  rules: [
    {
      id: "rule:chronolog-release-evidence-required",
      description: "Release logs must include chronology and governance evidence.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 12
  }
};

export const governanceSkill: SkillDefinition = {
  id: "governance@1.0",
  name: "governance",
  description: "Reviews artifacts and emits governance findings.",
  version: "1.0",
  category: "governance",
  status: "available",
  inputArtifacts: [ArtifactType.PRD, ArtifactType.TECH_SPEC, ArtifactType.CODE_CHANGE],
  outputArtifacts: [ArtifactType.GOVERNANCE_FINDING],
  templates: [governanceTemplate],
  rules: [
    {
      id: "rule:governance-decision-required",
      description: "Governance findings must include approve, reject, or revise decisions.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 10,
    allowedWorkflowStages: ["GovernanceReview"]
  }
};

export const releaseSkill: SkillDefinition = {
  id: "release@1.0",
  name: "release",
  description: "Assembles approved artifacts into a release package.",
  version: "1.0",
  category: "release",
  status: "available",
  inputArtifacts: [ArtifactType.GOVERNANCE_FINDING, ArtifactType.CODE_CHANGE, ArtifactType.TEST_RESULT],
  outputArtifacts: [ArtifactType.RELEASE_PACKAGE],
  templates: [releaseTemplate],
  rules: [
    {
      id: "rule:release-requires-governance-finding",
      description: "Release packages require a governance finding.",
      severity: "error"
    }
  ],
  constraints: {
    requiresHumanApproval: true,
    maxInputArtifacts: 12,
    allowedWorkflowStages: ["ReleasePackage"]
  }
};

export const INITIAL_SKILL_DEFINITIONS = [
  repoRouterSkill,
  knowledgeSkill,
  codebaseResearchSkill,
  prdWriterV1Skill,
  prdWriterV2Skill,
  techSpecWriterSkill,
  implementPlanSkill,
  designSystemSkill,
  backendContributorSkill,
  frontendContributorSkill,
  monoWebContributorSkill,
  cronsContributorSkill,
  dataScienceMonorepoContributorSkill,
  aiDataAnalystSkill,
  testPlanWriterSkill,
  gitGuardianSkill,
  conventionsSkill,
  chronologLoggingSkill
] as const;
