import type { DecisionRecord, MemoryHistory, OutcomeRecord } from "../contracts/decision.js";
import type { KnowledgeEntity } from "../contracts/knowledge-entity.js";
import type { KnowledgeRelationship } from "../contracts/knowledge-relationship.js";
import {
  type GetRelatedEntitiesOptions,
  KnowledgeGraph,
  type RelatedEntity
} from "../graph/knowledge-graph.js";
import { MemoryService, type RetrieveHistoryOptions } from "../memory/memory-service.js";
import {
  KnowledgeRetrievalService,
  type ProjectHistory,
  type SimilarityResult
} from "../retrieval/knowledge-retrieval-service.js";

export interface KnowledgeEngineServiceDependencies {
  graph?: KnowledgeGraph;
  memory?: MemoryService;
}

export class KnowledgeEngineService {
  private readonly graph: KnowledgeGraph;
  private readonly memory: MemoryService;
  private readonly retrieval: KnowledgeRetrievalService;

  constructor(dependencies: KnowledgeEngineServiceDependencies = {}) {
    this.graph = dependencies.graph ?? new KnowledgeGraph();
    this.memory = dependencies.memory ?? new MemoryService();
    this.retrieval = new KnowledgeRetrievalService(this.graph, this.memory);
  }

  addEntity(entity: KnowledgeEntity): KnowledgeEntity {
    return this.graph.addEntity(entity);
  }

  addRelationship(relationship: KnowledgeRelationship): KnowledgeRelationship {
    return this.graph.addRelationship(relationship);
  }

  getEntity(entityId: string): KnowledgeEntity | undefined {
    return this.graph.getEntity(entityId);
  }

  getRelatedEntities(
    entityId: string,
    options: GetRelatedEntitiesOptions = {}
  ): RelatedEntity[] {
    return this.graph.getRelatedEntities(entityId, options);
  }

  recordDecision(decision: DecisionRecord): DecisionRecord {
    return this.memory.recordDecision(decision);
  }

  recordOutcome(outcome: OutcomeRecord): OutcomeRecord {
    return this.memory.recordOutcome(outcome);
  }

  retrieveHistory(options: RetrieveHistoryOptions = {}): MemoryHistory {
    return this.memory.retrieveHistory(options);
  }

  findSimilarArtifacts(
    query: string,
    limit?: number
  ): SimilarityResult<KnowledgeEntity>[] {
    return this.retrieval.findSimilarArtifacts(query, limit);
  }

  findSimilarDecisions(
    query: string,
    limit?: number
  ): SimilarityResult<DecisionRecord>[] {
    return this.retrieval.findSimilarDecisions(query, limit);
  }

  getProjectHistory(projectId: string): ProjectHistory {
    return this.retrieval.getProjectHistory(projectId);
  }
}
