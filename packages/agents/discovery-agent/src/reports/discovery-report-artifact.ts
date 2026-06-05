import {
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import type { DiscoveryRequest } from "../contracts/discovery-request.js";
import type { DiscoveryReport } from "../contracts/discovery-report.js";

export interface CreateDiscoveryReportArtifactInput {
  request: DiscoveryRequest;
  report: DiscoveryReport;
  parentIds: string[];
  actorId: string;
  createdAt?: string;
  stageId?: string;
}

export function createDiscoveryReportArtifact(
  input: CreateDiscoveryReportArtifactInput
): BaseArtifact {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: `${input.request.workflowId}:discovery`,
    type: ArtifactType.DISCOVERY_REPORT,
    title: "Discovery Report",
    description: input.report.problemSummary,
    parentIds: [...input.parentIds],
    createdBy: input.actorId,
    createdAt,
    version: 1,
    status: "active",
    metadata: {
      workflowId: input.request.workflowId,
      stageId: input.stageId ?? "discovery",
      goal: input.request.goal,
      contextIds: [...input.request.contextIds],
      report: {
        problemSummary: input.report.problemSummary,
        affectedSystems: [...input.report.affectedSystems],
        repositories: [...input.report.repositories],
        dependencies: [...input.report.dependencies],
        risks: [...input.report.risks],
        openQuestions: [...input.report.openQuestions],
        recommendedNextSteps: [...input.report.recommendedNextSteps]
      }
    }
  };
}
