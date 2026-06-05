export interface ProductRequest {
  workflowId: string;
  discoveryArtifactId: string;
}

export function validateProductRequest(request: ProductRequest): void {
  if (!request.workflowId.trim()) {
    throw new Error("Product workflowId is required");
  }

  if (!request.discoveryArtifactId.trim()) {
    throw new Error("Product discoveryArtifactId is required");
  }
}
