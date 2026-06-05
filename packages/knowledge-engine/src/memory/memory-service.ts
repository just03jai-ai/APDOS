import type {
  DecisionRecord,
  MemoryHistory,
  OutcomeRecord
} from "../contracts/decision.js";

export interface RetrieveHistoryOptions {
  projectId?: string;
  workflowId?: string;
  decisionId?: string;
}

export class MemoryService {
  private readonly decisions = new Map<string, DecisionRecord>();
  private readonly outcomes = new Map<string, OutcomeRecord>();

  recordDecision(decision: DecisionRecord): DecisionRecord {
    validateDecision(decision);

    if (this.decisions.has(decision.id)) {
      throw new Error(`Decision already exists: ${decision.id}`);
    }

    const cloned = cloneDecision(decision);
    this.decisions.set(cloned.id, cloned);

    return cloneDecision(cloned);
  }

  recordOutcome(outcome: OutcomeRecord): OutcomeRecord {
    validateOutcome(outcome);

    if (!this.decisions.has(outcome.decisionId)) {
      throw new Error(`Decision not found for outcome: ${outcome.decisionId}`);
    }

    if (this.outcomes.has(outcome.id)) {
      throw new Error(`Outcome already exists: ${outcome.id}`);
    }

    const cloned = cloneOutcome(outcome);
    this.outcomes.set(cloned.id, cloned);

    return cloneOutcome(cloned);
  }

  retrieveHistory(options: RetrieveHistoryOptions = {}): MemoryHistory {
    const decisions = Array.from(this.decisions.values()).filter((decision) =>
      matchesDecision(decision, options)
    );
    const decisionIds = new Set(decisions.map((decision) => decision.id));
    const outcomes = Array.from(this.outcomes.values()).filter((outcome) =>
      decisionIds.has(outcome.decisionId)
    );

    return {
      decisions: decisions.sort(compareByCreatedAt).map(cloneDecision),
      outcomes: outcomes.sort(compareByCreatedAt).map(cloneOutcome)
    };
  }
}

function validateDecision(decision: DecisionRecord): void {
  if (!decision.id.trim()) {
    throw new Error("Decision id is required");
  }

  if (!decision.title.trim()) {
    throw new Error(`Decision title is required: ${decision.id}`);
  }

  if (!decision.rationale.trim()) {
    throw new Error(`Decision rationale is required: ${decision.id}`);
  }

  if (!decision.selectedOption.trim()) {
    throw new Error(`Decision selectedOption is required: ${decision.id}`);
  }

  if (!decision.createdAt.trim()) {
    throw new Error(`Decision createdAt is required: ${decision.id}`);
  }
}

function validateOutcome(outcome: OutcomeRecord): void {
  if (!outcome.id.trim()) {
    throw new Error("Outcome id is required");
  }

  if (!outcome.decisionId.trim()) {
    throw new Error(`Outcome decisionId is required: ${outcome.id}`);
  }

  if (!outcome.title.trim()) {
    throw new Error(`Outcome title is required: ${outcome.id}`);
  }

  if (!outcome.createdAt.trim()) {
    throw new Error(`Outcome createdAt is required: ${outcome.id}`);
  }
}

function matchesDecision(
  decision: DecisionRecord,
  options: RetrieveHistoryOptions
): boolean {
  if (options.decisionId && decision.id !== options.decisionId) {
    return false;
  }

  if (options.projectId && decision.projectId !== options.projectId) {
    return false;
  }

  if (options.workflowId && decision.workflowId !== options.workflowId) {
    return false;
  }

  return true;
}

function compareByCreatedAt(
  first: { id: string; createdAt: string },
  second: { id: string; createdAt: string }
): number {
  return first.createdAt.localeCompare(second.createdAt) || first.id.localeCompare(second.id);
}

export function cloneDecision(decision: DecisionRecord): DecisionRecord {
  return {
    ...decision,
    alternatives: [...decision.alternatives],
    artifactIds: decision.artifactIds ? [...decision.artifactIds] : undefined,
    metadata: decision.metadata ? { ...decision.metadata } : undefined
  };
}

export function cloneOutcome(outcome: OutcomeRecord): OutcomeRecord {
  return {
    ...outcome,
    metadata: outcome.metadata ? { ...outcome.metadata } : undefined
  };
}
