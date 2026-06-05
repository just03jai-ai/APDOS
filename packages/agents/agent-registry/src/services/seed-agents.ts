import { ArtifactType } from "@apdos/artifacts";
import type { AgentDefinition } from "../contracts/agent-definition.js";
import {
  discoveryAnalysisCapability,
  governanceReviewCapability,
  productRequirementsCapability,
  releasePackagingCapability,
  technicalArchitectureCapability
} from "../capabilities/agent-capabilities.js";

export const discoveryAgent: AgentDefinition = {
  id: "agent:discovery",
  name: "DiscoveryAgent",
  description: "Produces discovery reports from initial product ideas and business goals.",
  version: "0.1.0",
  status: "available",
  capabilities: [discoveryAnalysisCapability],
  inputArtifacts: [ArtifactType.IDEA],
  outputArtifacts: [ArtifactType.DISCOVERY_REPORT],
  requiredSkills: ["product-discovery", "user-research", "problem-framing"],
  executionConstraints: {
    maxConcurrentRuns: 1,
    requiresHumanApproval: false,
    allowedWorkflowStages: ["Discovery"]
  }
};

export const productAgent: AgentDefinition = {
  id: "agent:product",
  name: "ProductAgent",
  description: "Creates product requirement documents from discovery artifacts.",
  version: "0.1.0",
  status: "available",
  capabilities: [productRequirementsCapability],
  inputArtifacts: [ArtifactType.DISCOVERY_REPORT],
  outputArtifacts: [ArtifactType.PRD],
  requiredSkills: ["requirements-definition", "scope-management"],
  executionConstraints: {
    maxConcurrentRuns: 1,
    requiresHumanApproval: true,
    allowedWorkflowStages: ["PRD"]
  }
};

export const architectureAgent: AgentDefinition = {
  id: "agent:architecture",
  name: "ArchitectureAgent",
  description: "Creates technical specifications and implementation plans from product requirements.",
  version: "0.1.0",
  status: "available",
  capabilities: [technicalArchitectureCapability],
  inputArtifacts: [ArtifactType.PRD],
  outputArtifacts: [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
  requiredSkills: ["system-design", "technical-planning", "risk-analysis"],
  executionConstraints: {
    maxConcurrentRuns: 1,
    requiresHumanApproval: true,
    allowedWorkflowStages: ["TechSpec"]
  }
};

export const governanceAgent: AgentDefinition = {
  id: "agent:governance",
  name: "GovernanceAgent",
  description: "Reviews delivery artifacts and records governance findings.",
  version: "0.1.0",
  status: "available",
  capabilities: [governanceReviewCapability],
  inputArtifacts: [ArtifactType.PRD, ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN],
  outputArtifacts: [ArtifactType.GOVERNANCE_FINDING],
  requiredSkills: ["governance-review", "quality-assurance", "policy-analysis"],
  executionConstraints: {
    maxConcurrentRuns: 1,
    requiresHumanApproval: true,
    allowedWorkflowStages: ["GovernanceReview"]
  }
};

export const releaseAgent: AgentDefinition = {
  id: "agent:release",
  name: "ReleaseAgent",
  description: "Assembles approved delivery artifacts into a release package.",
  version: "0.1.0",
  status: "available",
  capabilities: [releasePackagingCapability],
  inputArtifacts: [ArtifactType.PRD, ArtifactType.TECH_SPEC, ArtifactType.GOVERNANCE_FINDING],
  outputArtifacts: [ArtifactType.RELEASE_PACKAGE],
  requiredSkills: ["release-planning", "artifact-packaging"],
  executionConstraints: {
    maxConcurrentRuns: 1,
    requiresHumanApproval: true,
    allowedWorkflowStages: ["ReleasePackage"]
  }
};

export const INITIAL_AGENT_DEFINITIONS = [
  discoveryAgent,
  productAgent,
  architectureAgent,
  governanceAgent,
  releaseAgent
] as const;
