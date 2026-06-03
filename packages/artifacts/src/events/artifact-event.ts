import type { BaseArtifact } from "../types/base-artifact.js";

export enum ArtifactEventType {
  REGISTERED = "REGISTERED",
  UPDATED = "UPDATED"
}

export interface ArtifactEvent {
  id: string;
  artifactId: string;
  type: ArtifactEventType;
  occurredAt: string;
  actorId: string;
  artifact: BaseArtifact;
}
