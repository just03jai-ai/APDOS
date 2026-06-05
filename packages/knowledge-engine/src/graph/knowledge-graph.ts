import type { KnowledgeEntity } from "../contracts/knowledge-entity.js";
import type {
  KnowledgeRelationship,
  KnowledgeRelationshipType
} from "../contracts/knowledge-relationship.js";

export interface RelatedEntity {
  entity: KnowledgeEntity;
  relationship: KnowledgeRelationship;
  direction: "outgoing" | "incoming";
}

export interface GetRelatedEntitiesOptions {
  relationshipTypes?: KnowledgeRelationshipType[];
  direction?: "outgoing" | "incoming" | "both";
}

export class KnowledgeGraph {
  private readonly entities = new Map<string, KnowledgeEntity>();
  private readonly relationships = new Map<string, KnowledgeRelationship>();

  addEntity(entity: KnowledgeEntity): KnowledgeEntity {
    validateEntity(entity);

    if (this.entities.has(entity.id)) {
      throw new Error(`Knowledge entity already exists: ${entity.id}`);
    }

    const cloned = cloneEntity(entity);
    this.entities.set(cloned.id, cloned);

    return cloneEntity(cloned);
  }

  addRelationship(relationship: KnowledgeRelationship): KnowledgeRelationship {
    validateRelationship(relationship);

    if (this.relationships.has(relationship.id)) {
      throw new Error(`Knowledge relationship already exists: ${relationship.id}`);
    }

    if (!this.entities.has(relationship.fromEntityId)) {
      throw new Error(`Relationship source entity not found: ${relationship.fromEntityId}`);
    }

    if (!this.entities.has(relationship.toEntityId)) {
      throw new Error(`Relationship target entity not found: ${relationship.toEntityId}`);
    }

    const cloned = cloneRelationship(relationship);
    this.relationships.set(cloned.id, cloned);

    return cloneRelationship(cloned);
  }

  getEntity(entityId: string): KnowledgeEntity | undefined {
    const entity = this.entities.get(entityId);
    return entity ? cloneEntity(entity) : undefined;
  }

  getRelatedEntities(
    entityId: string,
    options: GetRelatedEntitiesOptions = {}
  ): RelatedEntity[] {
    if (!this.entities.has(entityId)) {
      return [];
    }

    const direction = options.direction ?? "both";
    const allowedTypes = new Set(options.relationshipTypes ?? []);
    const filterByType = allowedTypes.size > 0;
    const related: RelatedEntity[] = [];

    for (const relationship of this.relationships.values()) {
      if (filterByType && !allowedTypes.has(relationship.type)) {
        continue;
      }

      if (
        (direction === "outgoing" || direction === "both") &&
        relationship.fromEntityId === entityId
      ) {
        const entity = this.entities.get(relationship.toEntityId);
        if (entity) {
          related.push({
            entity: cloneEntity(entity),
            relationship: cloneRelationship(relationship),
            direction: "outgoing"
          });
        }
      }

      if (
        (direction === "incoming" || direction === "both") &&
        relationship.toEntityId === entityId
      ) {
        const entity = this.entities.get(relationship.fromEntityId);
        if (entity) {
          related.push({
            entity: cloneEntity(entity),
            relationship: cloneRelationship(relationship),
            direction: "incoming"
          });
        }
      }
    }

    return related.sort((first, second) =>
      first.relationship.createdAt.localeCompare(second.relationship.createdAt) ||
      first.relationship.id.localeCompare(second.relationship.id)
    );
  }

  listEntities(): KnowledgeEntity[] {
    return Array.from(this.entities.values()).map(cloneEntity);
  }

  listRelationships(): KnowledgeRelationship[] {
    return Array.from(this.relationships.values()).map(cloneRelationship);
  }
}

function validateEntity(entity: KnowledgeEntity): void {
  if (!entity.id.trim()) {
    throw new Error("Knowledge entity id is required");
  }

  if (!entity.title.trim()) {
    throw new Error(`Knowledge entity title is required: ${entity.id}`);
  }

  if (!entity.createdAt.trim()) {
    throw new Error(`Knowledge entity createdAt is required: ${entity.id}`);
  }
}

function validateRelationship(relationship: KnowledgeRelationship): void {
  if (!relationship.id.trim()) {
    throw new Error("Knowledge relationship id is required");
  }

  if (!relationship.fromEntityId.trim()) {
    throw new Error(`Relationship source is required: ${relationship.id}`);
  }

  if (!relationship.toEntityId.trim()) {
    throw new Error(`Relationship target is required: ${relationship.id}`);
  }

  if (!relationship.createdAt.trim()) {
    throw new Error(`Relationship createdAt is required: ${relationship.id}`);
  }
}

export function cloneEntity(entity: KnowledgeEntity): KnowledgeEntity {
  return {
    ...entity,
    metadata: { ...entity.metadata }
  };
}

export function cloneRelationship(
  relationship: KnowledgeRelationship
): KnowledgeRelationship {
  return {
    ...relationship,
    metadata: { ...relationship.metadata }
  };
}
