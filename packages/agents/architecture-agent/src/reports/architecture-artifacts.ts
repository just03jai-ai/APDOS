import {
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import type { ArchitectureRequest } from "../contracts/architecture-request.js";
import type { ImplementationPlanContract } from "../contracts/implementation-plan.js";
import type { TechnicalSpecificationContract } from "../contracts/technical-specification.js";

export interface CreateTechSpecArtifactInput {
  request: ArchitectureRequest;
  techSpec: TechnicalSpecificationContract;
  actorId: string;
  createdAt?: string;
  stageId?: string;
}

export interface CreateImplementationPlanArtifactInput {
  request: ArchitectureRequest;
  techSpecArtifactId: string;
  implementationPlan: ImplementationPlanContract;
  actorId: string;
  createdAt?: string;
  stageId?: string;
}

export function createTechSpecArtifact(input: CreateTechSpecArtifactInput): BaseArtifact {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: `${input.request.workflowId}:tech-spec`,
    type: ArtifactType.TECH_SPEC,
    title: "Technical Specification",
    description: input.techSpec.architectureOverview,
    parentIds: [input.request.prdArtifactId],
    createdBy: input.actorId,
    createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId: input.request.workflowId,
      stageId: input.stageId ?? "tech-spec",
      architecture: input.techSpec.architectureOverview,
      architectureOverview: input.techSpec.architectureOverview,
      components: [...input.techSpec.components],
      interfaces: [...input.techSpec.interfaces],
      apiContracts: [...input.techSpec.apiContracts],
      dataModel: [...input.techSpec.dataModel],
      dependencies: [...input.techSpec.dependencies],
      risks: [...input.techSpec.risks],
      assumptions: [...input.techSpec.assumptions]
    }
  };
}

export function createImplementationPlanArtifact(
  input: CreateImplementationPlanArtifactInput
): BaseArtifact {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: `${input.request.workflowId}:implementation-plan`,
    type: ArtifactType.IMPLEMENTATION_PLAN,
    title: "Implementation Plan",
    description: `Implementation plan for ${input.request.prdArtifactId}.`,
    parentIds: [input.techSpecArtifactId],
    createdBy: input.actorId,
    createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId: input.request.workflowId,
      stageId: input.stageId ?? "tech-spec",
      phases: [...input.implementationPlan.phases],
      milestones: [...input.implementationPlan.milestones],
      tasks: [...input.implementationPlan.tasks],
      dependencies: [...input.implementationPlan.dependencies]
    }
  };
}
