import { ArtifactType } from "@apdos/artifacts";
import {
  AgentResponsibility,
  WorkflowStageName,
  WorkflowType,
  type WorkflowDefinition
} from "../contracts/workflow-plan.js";

export const FEATURE_DELIVERY_V1_DEFINITION: WorkflowDefinition = {
  type: WorkflowType.FEATURE_DELIVERY_V1,
  stages: [
    {
      name: WorkflowStageName.DISCOVERY,
      artifactTypes: [ArtifactType.DISCOVERY_REPORT],
      agentResponsibilities: [AgentResponsibility.DISCOVERY_ANALYSIS]
    },
    {
      name: WorkflowStageName.PRD,
      artifactTypes: [ArtifactType.PRD],
      agentResponsibilities: [AgentResponsibility.PRODUCT_REQUIREMENTS]
    },
    {
      name: WorkflowStageName.TECH_SPEC,
      artifactTypes: [ArtifactType.TECH_SPEC],
      agentResponsibilities: [AgentResponsibility.TECHNICAL_DESIGN]
    },
    {
      name: WorkflowStageName.GOVERNANCE_REVIEW,
      artifactTypes: [ArtifactType.GOVERNANCE_FINDING],
      agentResponsibilities: [AgentResponsibility.GOVERNANCE_REVIEW]
    },
    {
      name: WorkflowStageName.RELEASE_PACKAGE,
      artifactTypes: [ArtifactType.RELEASE_PACKAGE],
      agentResponsibilities: [AgentResponsibility.RELEASE_PACKAGING]
    }
  ]
};
