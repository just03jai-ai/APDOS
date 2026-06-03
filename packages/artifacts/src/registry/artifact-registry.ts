import {
  ArtifactEventType,
  cloneArtifactEvent,
  createArtifactEvent,
  type ArtifactEvent
} from "../events/artifact-event.js";
import { validateArtifact } from "../schemas/artifact-schema.js";
import {
  InMemoryArtifactStorage,
  type ArtifactStorage
} from "../storage/artifact-storage.js";
import type {
  BaseArtifact,
  CreateArtifactInput,
  UpdateArtifactInput
} from "../types/base-artifact.js";

export class ArtifactRegistry {
  private readonly events: ArtifactEvent[] = [];

  constructor(private readonly storage: ArtifactStorage = new InMemoryArtifactStorage()) {}

  async register(artifact: CreateArtifactInput): Promise<BaseArtifact> {
    validateArtifact(artifact);

    const existing = await this.storage.findById(artifact.id);
    if (existing) {
      throw new Error(`Artifact already exists: ${artifact.id}`);
    }

    await this.storage.save(artifact);
    this.recordEvent(
      ArtifactEventType.ARTIFACT_CREATED,
      artifact,
      artifact.createdBy
    );
    return artifact;
  }

  async retrieve(id: string): Promise<BaseArtifact | undefined> {
    return this.storage.findById(id);
  }

  async update(
    id: string,
    updates: UpdateArtifactInput,
    actorId: string
  ): Promise<BaseArtifact> {
    const current = await this.storage.findById(id);
    if (!current) {
      throw new Error(`Artifact not found: ${id}`);
    }

    const next: BaseArtifact = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
      createdBy: current.createdBy,
      parentIds: updates.parentIds ? [...updates.parentIds] : current.parentIds,
      metadata: updates.metadata ? { ...updates.metadata } : current.metadata
    };

    validateArtifact(next);
    await this.storage.update(next);
    this.recordEvent(ArtifactEventType.ARTIFACT_UPDATED, next, actorId, {
      previousArtifact: current,
      changes: updates
    });
    return next;
  }

  async list(): Promise<BaseArtifact[]> {
    return this.storage.list();
  }

  listEvents(): ArtifactEvent[] {
    return this.events.map(cloneArtifactEvent);
  }

  private recordEvent(
    type: ArtifactEventType,
    artifact: BaseArtifact,
    actorId: string,
    options: {
      previousArtifact?: BaseArtifact;
      changes?: UpdateArtifactInput;
      reason?: string;
    } = {}
  ): void {
    this.events.push(createArtifactEvent({
      artifactId: artifact.id,
      type,
      actorId,
      payload: {
        artifact,
        previousArtifact: options.previousArtifact,
        changes: options.changes,
        reason: options.reason
      }
    }, this.events.length + 1));
  }
}
