import type { AgentCapability } from "../contracts/agent-capability.js";

export const discoveryAnalysisCapability: AgentCapability = {
  id: "capability:discovery-analysis",
  name: "Discovery Analysis",
  description: "Analyzes product goals and turns early intent into discovery artifacts."
};

export const productRequirementsCapability: AgentCapability = {
  id: "capability:product-requirements",
  name: "Product Requirements",
  description: "Translates validated discovery findings into product requirements."
};

export const technicalArchitectureCapability: AgentCapability = {
  id: "capability:technical-architecture",
  name: "Technical Architecture",
  description: "Produces technical architecture and implementation planning artifacts."
};

export const governanceReviewCapability: AgentCapability = {
  id: "capability:governance-review",
  name: "Governance Review",
  description: "Reviews delivery artifacts for governance, quality, and release readiness."
};

export const releasePackagingCapability: AgentCapability = {
  id: "capability:release-packaging",
  name: "Release Packaging",
  description: "Assembles approved artifacts into release packages."
};

export const AGENT_CAPABILITIES = [
  discoveryAnalysisCapability,
  productRequirementsCapability,
  technicalArchitectureCapability,
  governanceReviewCapability,
  releasePackagingCapability
] as const;
