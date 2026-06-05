import { isArtifactType } from "../types/artifact-type.js";
import type { BaseArtifact } from "../types/base-artifact.js";

const VALID_STATUSES = new Set([
  "draft",
  "active",
  "superseded",
  "approved",
  "rejected",
  "archived"
]);

export class ArtifactValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Artifact validation failed: ${issues.join("; ")}`);
    this.name = "ArtifactValidationError";
  }
}

export function validateArtifact(artifact: BaseArtifact): void {
  const issues: string[] = [];

  if (!artifact.id.trim()) {
    issues.push("id is required");
  }

  if (!isArtifactType(artifact.type)) {
    issues.push("type is not a supported ArtifactType");
  }

  if (!artifact.title.trim()) {
    issues.push("title is required");
  }

  if (!artifact.description.trim()) {
    issues.push("description is required");
  }

  if (!Array.isArray(artifact.parentIds)) {
    issues.push("parentIds must be an array");
  }

  if (!artifact.createdBy.trim()) {
    issues.push("createdBy is required");
  }

  if (Number.isNaN(Date.parse(artifact.createdAt))) {
    issues.push("createdAt must be a valid ISO date string");
  }

  if (!Number.isInteger(artifact.version) || artifact.version < 1) {
    issues.push("version must be an integer greater than or equal to 1");
  }

  if (!VALID_STATUSES.has(artifact.status)) {
    issues.push("status is not supported");
  }

  if (
    artifact.metadata === null ||
    typeof artifact.metadata !== "object" ||
    Array.isArray(artifact.metadata)
  ) {
    issues.push("metadata must be an object");
  }

  if (issues.length > 0) {
    throw new ArtifactValidationError(issues);
  }
}
