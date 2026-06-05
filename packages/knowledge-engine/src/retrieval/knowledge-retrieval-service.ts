import type { DecisionRecord } from "../contracts/decision.js";
import type { KnowledgeEntity } from "../contracts/knowledge-entity.js";
import { cloneEntity, KnowledgeGraph } from "../graph/knowledge-graph.js";
import {
  cloneDecision,
  type RetrieveHistoryOptions,
  MemoryService
} from "../memory/memory-service.js";

export interface SimilarityResult<T> {
  item: T;
  score: number;
  matchedTerms: string[];
}

export interface ProjectHistory {
  projectId: string;
  entities: KnowledgeEntity[];
  decisions: DecisionRecord[];
}

export class KnowledgeRetrievalService {
  constructor(
    private readonly graph: KnowledgeGraph,
    private readonly memory: MemoryService
  ) {}

  findSimilarArtifacts(query: string, limit = 5): SimilarityResult<KnowledgeEntity>[] {
    return this.rankEntities(
      query,
      this.graph.listEntities().filter((entity) => entity.type === "Artifact"),
      limit
    );
  }

  findSimilarDecisions(query: string, limit = 5): SimilarityResult<DecisionRecord>[] {
    return rankItems(
      query,
      this.memory.retrieveHistory().decisions,
      (decision) => [
        decision.title,
        decision.rationale,
        decision.selectedOption,
        ...decision.alternatives
      ],
      cloneDecision,
      limit
    );
  }

  getProjectHistory(projectId: string): ProjectHistory {
    const entities = this.graph
      .listEntities()
      .filter((entity) => entity.metadata.projectId === projectId)
      .sort(compareEntity);
    const history = this.memory.retrieveHistory({ projectId });

    return {
      projectId,
      entities: entities.map(cloneEntity),
      decisions: history.decisions
    };
  }

  retrieveHistory(options: RetrieveHistoryOptions = {}) {
    return this.memory.retrieveHistory(options);
  }

  private rankEntities(
    query: string,
    entities: KnowledgeEntity[],
    limit: number
  ): SimilarityResult<KnowledgeEntity>[] {
    return rankItems(
      query,
      entities,
      (entity) => [
        entity.title,
        entity.description ?? "",
        ...Object.values(entity.metadata).map(String)
      ],
      cloneEntity,
      limit
    );
  }
}

function rankItems<T>(
  query: string,
  items: T[],
  getTextFields: (item: T) => string[],
  cloneItem: (item: T) => T,
  limit: number
): SimilarityResult<T>[] {
  const queryTerms = tokenize(query);

  if (queryTerms.length === 0) {
    return [];
  }

  return items
    .map((item) => {
      const textTerms = new Set(tokenize(getTextFields(item).join(" ")));
      const matchedTerms = queryTerms.filter((term) => textTerms.has(term));

      return {
        item: cloneItem(item),
        score: matchedTerms.length / queryTerms.length,
        matchedTerms
      };
    })
    .filter((result) => result.score > 0)
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.matchedTerms.join(",").localeCompare(second.matchedTerms.join(","))
    )
    .slice(0, Math.max(0, limit));
}

function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .map((term) => term.trim())
        .filter(Boolean)
    )
  );
}

function compareEntity(first: KnowledgeEntity, second: KnowledgeEntity): number {
  return first.createdAt.localeCompare(second.createdAt) || first.id.localeCompare(second.id);
}
