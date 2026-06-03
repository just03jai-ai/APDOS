import type { ArtifactType } from "./artifact-type.js";

export type ArtifactStatus =
  | "draft"
  | "active"
  | "superseded"
  | "approved"
  | "rejected"
  | "archived";

export type ArtifactMetadata = Record<string, unknown>;

export interface BaseArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  description: string;
  parentIds: string[];
  createdBy: string;
  createdAt: string;
  version: number;
  status: ArtifactStatus;
  metadata: ArtifactMetadata;
}

export type CreateArtifactInput = BaseArtifact;

export type UpdateArtifactInput = Partial<
  Omit<BaseArtifact, "id" | "createdAt" | "createdBy">
>;
