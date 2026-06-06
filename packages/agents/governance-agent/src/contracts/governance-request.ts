export interface GovernanceRequest {
  workflowId: string;
  prdArtifactId: string;
  techSpecArtifactId: string;
  implementationPlanArtifactId: string;
  engineeringPackageArtifactId: string;
  qaPackageArtifactId: string;
}

export function validateGovernanceRequest(request: GovernanceRequest): void {
  if (!request.workflowId.trim()) {
    throw new Error("Governance workflowId is required");
  }

  const artifactIds = [
    request.prdArtifactId,
    request.techSpecArtifactId,
    request.implementationPlanArtifactId,
    request.engineeringPackageArtifactId,
    request.qaPackageArtifactId
  ];

  if (artifactIds.some((artifactId) => !artifactId.trim())) {
    throw new Error("Governance artifact IDs are required");
  }
}
