import type { ArtifactType } from "@apdos/artifacts";

export interface GoalIntake {
  goal: string;
}

export enum WorkflowType {
  FEATURE_DELIVERY_V1 = "FEATURE_DELIVERY_V1"
}

export enum WorkflowStageName {
  DISCOVERY = "Discovery",
  PRD = "PRD",
  TECH_SPEC = "TechSpec",
  GOVERNANCE_REVIEW = "GovernanceReview",
  RELEASE_PACKAGE = "ReleasePackage"
}

export enum AgentResponsibility {
  DISCOVERY_ANALYSIS = "DiscoveryAnalysis",
  PRODUCT_REQUIREMENTS = "ProductRequirements",
  TECHNICAL_DESIGN = "TechnicalDesign",
  GOVERNANCE_REVIEW = "GovernanceReview",
  RELEASE_PACKAGING = "ReleasePackaging"
}

export interface RequiredArtifact {
  stageId: string;
  type: ArtifactType;
  title: string;
}

export interface RequiredAgent {
  stageId: string;
  responsibility: AgentResponsibility;
}

export interface WorkflowPlanStage {
  id: string;
  name: WorkflowStageName;
  order: number;
  artifactTypes: ArtifactType[];
  agentResponsibilities: AgentResponsibility[];
}

export interface WorkflowPlan {
  workflowId: string;
  workflowType: WorkflowType;
  goal: string;
  stages: WorkflowPlanStage[];
  requiredArtifacts: RequiredArtifact[];
  requiredAgents: RequiredAgent[];
}

export interface WorkflowStageDefinition {
  name: WorkflowStageName;
  artifactTypes: ArtifactType[];
  agentResponsibilities: AgentResponsibility[];
}

export interface WorkflowDefinition {
  type: WorkflowType;
  stages: WorkflowStageDefinition[];
}
