import type { BaseArtifact } from "../types/base-artifact.js";

export enum ArtifactEventType {
  ARTIFACT_CREATED = "ArtifactCreated",
  ARTIFACT_UPDATED = "ArtifactUpdated",
  ARTIFACT_APPROVED = "ArtifactApproved",
  ARTIFACT_REJECTED = "ArtifactRejected",
  ARTIFACT_ARCHIVED = "ArtifactArchived"
}

export interface ArtifactEventPayload {
  artifact: BaseArtifact;
  previousArtifact?: BaseArtifact;
  changes?: Partial<BaseArtifact>;
  reason?: string;
}

export interface ArtifactEvent {
  id: string;
  artifactId: string;
  type: ArtifactEventType;
  occurredAt: string;
  actorId: string;
  payload: ArtifactEventPayload;
}

export type ArtifactCreatedEvent = ArtifactEvent & {
  type: ArtifactEventType.ARTIFACT_CREATED;
};

export type ArtifactUpdatedEvent = ArtifactEvent & {
  type: ArtifactEventType.ARTIFACT_UPDATED;
};

export type ArtifactApprovedEvent = ArtifactEvent & {
  type: ArtifactEventType.ARTIFACT_APPROVED;
};

export type ArtifactRejectedEvent = ArtifactEvent & {
  type: ArtifactEventType.ARTIFACT_REJECTED;
};

export type ArtifactArchivedEvent = ArtifactEvent & {
  type: ArtifactEventType.ARTIFACT_ARCHIVED;
};

export type ArtifactDomainEvent =
  | ArtifactCreatedEvent
  | ArtifactUpdatedEvent
  | ArtifactApprovedEvent
  | ArtifactRejectedEvent
  | ArtifactArchivedEvent;

export type CreateArtifactEventInput = Omit<ArtifactEvent, "id" | "occurredAt">;

export function createArtifactEvent(
  input: CreateArtifactEventInput,
  sequence: number,
  occurredAt: string = new Date().toISOString()
): ArtifactEvent {
  return {
    ...input,
    id: `${input.artifactId}:${input.type}:${sequence}`,
    occurredAt,
    payload: clonePayload(input.payload)
  };
}

export function cloneArtifactEvent(event: ArtifactEvent): ArtifactEvent {
  return {
    ...event,
    payload: clonePayload(event.payload)
  };
}

function clonePayload(payload: ArtifactEventPayload): ArtifactEventPayload {
  return {
    ...payload,
    artifact: cloneArtifact(payload.artifact),
    previousArtifact: payload.previousArtifact
      ? cloneArtifact(payload.previousArtifact)
      : undefined,
    changes: payload.changes ? cloneArtifactPatch(payload.changes) : undefined
  };
}

function cloneArtifactPatch(changes: Partial<BaseArtifact>): Partial<BaseArtifact> {
  return {
    ...changes,
    parentIds: changes.parentIds ? [...changes.parentIds] : undefined,
    metadata: changes.metadata ? { ...changes.metadata } : undefined
  };
}

function cloneArtifact(artifact: BaseArtifact): BaseArtifact {
  return {
    ...artifact,
    parentIds: [...artifact.parentIds],
    metadata: { ...artifact.metadata }
  };
}
