export {
  type DecisionRecord,
  type MemoryHistory,
  type OutcomeRecord
} from "./contracts/decision.js";
export {
  type KnowledgeEntity,
  type KnowledgeEntityType
} from "./contracts/knowledge-entity.js";
export {
  type KnowledgeRelationship,
  type KnowledgeRelationshipType
} from "./contracts/knowledge-relationship.js";
export {
  KnowledgeGraph,
  type GetRelatedEntitiesOptions,
  type RelatedEntity
} from "./graph/knowledge-graph.js";
export {
  MemoryService,
  type RetrieveHistoryOptions
} from "./memory/memory-service.js";
export {
  KnowledgeRetrievalService,
  type ProjectHistory,
  type SimilarityResult
} from "./retrieval/knowledge-retrieval-service.js";
export {
  KnowledgeEngineService,
  type KnowledgeEngineServiceDependencies
} from "./services/knowledge-engine-service.js";
