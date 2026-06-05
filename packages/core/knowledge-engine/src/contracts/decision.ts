export interface DecisionRecord {
  id: string;
  title: string;
  rationale: string;
  alternatives: string[];
  selectedOption: string;
  createdAt: string;
  projectId?: string;
  workflowId?: string;
  artifactIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface OutcomeRecord {
  id: string;
  decisionId: string;
  title: string;
  description: string;
  createdAt: string;
  status: "successful" | "failed" | "partial" | "unknown";
  metadata?: Record<string, unknown>;
}

export interface MemoryHistory {
  decisions: DecisionRecord[];
  outcomes: OutcomeRecord[];
}
