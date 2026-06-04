import {
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { DELIVERY_STAGE_IDS } from "./delivery-stages.js";

export interface StageOutputInput {
  workflowId: string;
  goal: string;
  actorId: string;
  createdAt: string;
}

export function createIdeaArtifact(input: StageOutputInput): BaseArtifact {
  return createArtifact(input, {
    id: `${input.workflowId}:idea`,
    type: ArtifactType.IDEA,
    title: `Idea: ${input.goal}`,
    description: `Initial business goal captured for APDOS delivery: ${input.goal}.`,
    parentIds: [],
    stageId: DELIVERY_STAGE_IDS.idea,
    metadata: {
      goal: input.goal
    }
  });
}

export function createPrdArtifact(
  input: StageOutputInput,
  idea: BaseArtifact,
  discovery: BaseArtifact
): BaseArtifact {
  return createArtifact(input, {
    id: `${input.workflowId}:prd`,
    type: ArtifactType.PRD,
    title: "Product Requirements Document",
    description: `PRD for ${input.goal}.`,
    parentIds: [idea.id, discovery.id],
    stageId: DELIVERY_STAGE_IDS.prd,
    metadata: {
      problemStatement: `The business needs a governed delivery flow for: ${input.goal}.`,
      successMetrics: "A release package is produced with validation and approval evidence.",
      scope: ["Idea", "Discovery", "PRD", "Tech Spec", "Validation", "Approval", "Release"]
    }
  });
}

export function createCodeChangeArtifact(
  input: StageOutputInput,
  techSpec: BaseArtifact,
  implementationPlan?: BaseArtifact
): BaseArtifact {
  return createArtifact(input, {
    id: `${input.workflowId}:code-change`,
    type: ArtifactType.CODE_CHANGE,
    title: "Mock Code Change",
    description: `Deterministic implementation placeholder for ${input.goal}.`,
    parentIds: implementationPlan ? [techSpec.id, implementationPlan.id] : [techSpec.id],
    stageId: DELIVERY_STAGE_IDS.validation,
    metadata: {
      changeSet: "mock-delivery-workflow-v1"
    }
  });
}

export function createTestResultArtifact(
  input: StageOutputInput,
  codeChange: BaseArtifact
): BaseArtifact {
  return createArtifact(input, {
    id: `${input.workflowId}:test-result`,
    type: ArtifactType.TEST_RESULT,
    title: "Validation Test Result",
    description: "Deterministic validation evidence for workflow V1.",
    parentIds: [codeChange.id],
    stageId: DELIVERY_STAGE_IDS.validation,
    metadata: {
      passed: true,
      suite: "delivery-workflow-v1"
    }
  });
}

export function createReleasePackageArtifact(
  input: StageOutputInput,
  codeChange: BaseArtifact,
  testResult: BaseArtifact
): BaseArtifact {
  return createArtifact(input, {
    id: `${input.workflowId}:release-package`,
    type: ArtifactType.RELEASE_PACKAGE,
    title: "Governed Release Package",
    description: `Governed release package for ${input.goal}.`,
    parentIds: [codeChange.id, testResult.id],
    stageId: DELIVERY_STAGE_IDS.releasePackage,
    metadata: {
      releaseVersion: "1.0.0",
      rollbackPlan: "Restore the previous APDOS delivery package.",
      packageType: "mock-release"
    }
  });
}

function createArtifact(
  input: StageOutputInput,
  artifact: {
    id: string;
    type: ArtifactType;
    title: string;
    description: string;
    parentIds: string[];
    stageId: string;
    metadata: Record<string, unknown>;
  }
): BaseArtifact {
  return {
    id: artifact.id,
    type: artifact.type,
    title: artifact.title,
    description: artifact.description,
    parentIds: artifact.parentIds,
    createdBy: input.actorId,
    createdAt: input.createdAt,
    version: 1,
    status: "active",
    metadata: {
      ...artifact.metadata,
      workflowId: input.workflowId,
      stageId: artifact.stageId
    }
  };
}
