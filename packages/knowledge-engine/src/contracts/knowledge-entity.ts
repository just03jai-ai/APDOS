export type KnowledgeEntityType =
  | "Artifact"
  | "Workflow"
  | "Decision"
  | "Approval"
  | "Agent"
  | "Skill";

export interface KnowledgeEntity {
  id: string;
  type: KnowledgeEntityType;
  title: string;
  description?: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}
