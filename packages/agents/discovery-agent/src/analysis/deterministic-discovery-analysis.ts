import type { DiscoveryRequest } from "../contracts/discovery-request.js";

export function validateDiscoveryRequest(request: DiscoveryRequest): void {
  if (!request.goal.trim()) {
    throw new Error("Discovery goal is required");
  }

  if (!request.workflowId.trim()) {
    throw new Error("Discovery workflowId is required");
  }

  if (!Array.isArray(request.contextIds)) {
    throw new Error("Discovery contextIds must be an array");
  }
}
