export const DELIVERY_WORKFLOW_TYPE = "apdos-delivery-workflow-v1";

export const DELIVERY_STAGE_IDS = {
  idea: "idea",
  discovery: "discovery",
  prd: "prd",
  techSpec: "tech-spec",
  engineering: "engineering",
  qa: "qa",
  validation: "validation",
  approval: "approval",
  releasePackage: "release-package"
} as const;

export const DELIVERY_WORKFLOW_DEFINITION = {
  id: DELIVERY_WORKFLOW_TYPE,
  name: "APDOS Delivery Workflow V1",
  description: "Transforms a business goal into a governed release package.",
  stages: [
    {
      id: DELIVERY_STAGE_IDS.idea,
      name: "Idea"
    },
    {
      id: DELIVERY_STAGE_IDS.discovery,
      name: "Discovery"
    },
    {
      id: DELIVERY_STAGE_IDS.prd,
      name: "PRD"
    },
    {
      id: DELIVERY_STAGE_IDS.techSpec,
      name: "Tech Spec"
    },
    {
      id: DELIVERY_STAGE_IDS.engineering,
      name: "Engineering"
    },
    {
      id: DELIVERY_STAGE_IDS.qa,
      name: "QA"
    },
    {
      id: DELIVERY_STAGE_IDS.validation,
      name: "Validation"
    },
    {
      id: DELIVERY_STAGE_IDS.approval,
      name: "Approval"
    },
    {
      id: DELIVERY_STAGE_IDS.releasePackage,
      name: "Release Package"
    }
  ]
};
