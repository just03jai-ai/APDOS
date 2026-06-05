import type { BaseArtifact } from "../types/base-artifact.js";

export interface ArtifactStorage {
  save(artifact: BaseArtifact): Promise<void>;
  findById(id: string): Promise<BaseArtifact | undefined>;
  update(artifact: BaseArtifact): Promise<void>;
  list(): Promise<BaseArtifact[]>;
}

export class InMemoryArtifactStorage implements ArtifactStorage {
  private readonly artifacts = new Map<string, BaseArtifact>();

  async save(artifact: BaseArtifact): Promise<void> {
    this.artifacts.set(artifact.id, cloneArtifact(artifact));
  }

  async findById(id: string): Promise<BaseArtifact | undefined> {
    const artifact = this.artifacts.get(id);
    return artifact ? cloneArtifact(artifact) : undefined;
  }

  async update(artifact: BaseArtifact): Promise<void> {
    this.artifacts.set(artifact.id, cloneArtifact(artifact));
  }

  async list(): Promise<BaseArtifact[]> {
    return Array.from(this.artifacts.values()).map(cloneArtifact);
  }
}

export function cloneArtifact(artifact: BaseArtifact): BaseArtifact {
  return {
    ...artifact,
    parentIds: [...artifact.parentIds],
    metadata: { ...artifact.metadata }
  };
}
