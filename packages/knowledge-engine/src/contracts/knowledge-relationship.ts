export type KnowledgeRelationshipType =
  | "CREATED"
  | "APPROVED"
  | "GENERATED"
  | "DEPENDS_ON"
  | "REPLACED"
  | "RELATED_TO";

export interface KnowledgeRelationship {
  id: string;
  type: KnowledgeRelationshipType;
  fromEntityId: string;
  toEntityId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}
