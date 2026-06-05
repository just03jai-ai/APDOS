export interface EngineeringRequest {
  workflowId: string;
  prdArtifactId: string;
  techSpecArtifactId: string;
  implementationPlanArtifactId: string;
}

export function validateEngineeringRequest(request: EngineeringRequest): void {
  if (!request.workflowId.trim()) {
    throw new Error("Engineering workflowId is required");
  }

  if (!request.prdArtifactId.trim()) {
    throw new Error("Engineering prdArtifactId is required");
  }

  if (!request.techSpecArtifactId.trim()) {
    throw new Error("Engineering techSpecArtifactId is required");
  }

  if (!request.implementationPlanArtifactId.trim()) {
    throw new Error("Engineering implementationPlanArtifactId is required");
  }
}
