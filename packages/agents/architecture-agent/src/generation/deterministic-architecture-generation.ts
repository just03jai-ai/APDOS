import type { ArchitectureRequest } from "../contracts/architecture-request.js";

export function validateArchitectureRequest(request: ArchitectureRequest): void {
  if (!request.workflowId.trim()) {
    throw new Error("Architecture request workflowId is required");
  }

  if (!request.prdArtifactId.trim()) {
    throw new Error("Architecture request prdArtifactId is required");
  }
}
