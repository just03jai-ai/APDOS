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

export const productDesignCapability: AgentCapability = {
  id: "capability:product-design",
  name: "Product Design",
  description: "Transforms product context into prototype-ready design packages."
};

export const technicalArchitectureCapability: AgentCapability = {
  id: "capability:technical-architecture",
  name: "Technical Architecture",
  description: "Produces technical architecture and implementation planning artifacts."
};

export const engineeringDeliveryCapability: AgentCapability = {
  id: "capability:engineering-delivery",
  name: "Engineering Delivery",
  description: "Turns architecture outputs into implementation-ready engineering packages."
};

export const qaValidationCapability: AgentCapability = {
  id: "capability:qa-validation",
  name: "QA Validation",
  description: "Turns engineering packages into validation-ready QA evidence."
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
  productDesignCapability,
  technicalArchitectureCapability,
  engineeringDeliveryCapability,
  qaValidationCapability,
  governanceReviewCapability,
  releasePackagingCapability
] as const;
