export interface DesignRequest {
  workflowId: string;
  discoveryArtifactId: string;
  prdArtifactId: string;
  techSpecArtifactId?: string;
}

export function validateDesignRequest(request: DesignRequest): void {
  if (!request.workflowId.trim()) {
    throw new Error("Design workflowId is required");
  }

  if (!request.discoveryArtifactId.trim()) {
    throw new Error("Design discoveryArtifactId is required");
  }

  if (!request.prdArtifactId.trim()) {
    throw new Error("Design prdArtifactId is required");
  }

  if (request.techSpecArtifactId !== undefined && !request.techSpecArtifactId.trim()) {
    throw new Error("Design techSpecArtifactId cannot be blank");
  }
}
