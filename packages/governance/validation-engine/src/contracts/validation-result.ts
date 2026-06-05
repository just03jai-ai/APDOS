import type { ArtifactType } from "@apdos/artifacts";
import type { ValidationFinding } from "./validation-finding.js";

export interface ValidationResult {
  artifactId: string;
  artifactType: ArtifactType;
  valid: boolean;
  score: number;
  findings: ValidationFinding[];
}
