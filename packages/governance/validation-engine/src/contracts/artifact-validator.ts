import type { ApprovalRequest } from "@apdos/approval-engine";
import type { ArtifactType, BaseArtifact } from "@apdos/artifacts";
import type { ValidationResult } from "./validation-result.js";

export interface ValidationContext {
  artifacts?: BaseArtifact[];
  approvals?: ApprovalRequest[];
}

export interface ArtifactValidator {
  artifactType: ArtifactType;
  validate(
    artifact: BaseArtifact,
    context?: ValidationContext
  ): ValidationResult;
}
