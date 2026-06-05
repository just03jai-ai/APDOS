export interface QaRequest {
  workflowId: string;
  prdArtifactId: string;
  techSpecArtifactId: string;
  implementationPlanArtifactId: string;
  engineeringPackageArtifactId: string;
}

export function validateQaRequest(request: QaRequest): void {
  if (!request.workflowId.trim()) {
    throw new Error("QA workflowId is required");
  }

  if (!request.prdArtifactId.trim()) {
    throw new Error("QA prdArtifactId is required");
  }

  if (!request.techSpecArtifactId.trim()) {
    throw new Error("QA techSpecArtifactId is required");
  }

  if (!request.implementationPlanArtifactId.trim()) {
    throw new Error("QA implementationPlanArtifactId is required");
  }

  if (!request.engineeringPackageArtifactId.trim()) {
    throw new Error("QA engineeringPackageArtifactId is required");
  }
}
