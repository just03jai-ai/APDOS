import type { ApprovalRequest } from "@apdos/approval-engine";
import type { BaseArtifact } from "@apdos/artifacts";
import type {
  WorkflowHistoryEvent,
  WorkflowInstance
} from "@apdos/workflow-engine";
import type {
  ContextPackage,
  ContextSizeLimits,
  GovernanceFinding
} from "../contracts/context-package.js";
import type { ContextRequest } from "../contracts/context-request.js";
import {
  rankArtifacts,
  type RankedArtifact
} from "../ranking/context-ranking.js";
import type { ContextSources } from "../services/context-sources.js";

const DEFAULT_LIMITS: ContextSizeLimits = {
  maxArtifacts: 10,
  maxWorkflowHistoryEvents: 25,
  maxApprovals: 10,
  maxGovernanceFindings: 10
};

const GOVERNANCE_SEVERITY_RANK: Record<GovernanceFinding["severity"], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

export class ContextRetrievalService {
  private readonly limits: ContextSizeLimits;

  constructor(
    private readonly sources: ContextSources,
    limits: Partial<ContextSizeLimits> = {}
  ) {
    this.limits = {
      ...DEFAULT_LIMITS,
      ...limits
    };
    validateLimits(this.limits);
  }

  async getWorkflowContext(request: ContextRequest): Promise<ContextPackage> {
    validateContextRequest(request);

    const workflow = this.requireWorkflow(request.workflowId);
    const allArtifacts = await this.sources.artifacts.list();
    const rankedArtifacts = rankArtifacts({
      directArtifactIds: request.artifactIds,
      artifacts: allArtifacts,
      workflowHistory: resolveWorkflowHistoryForRanking(workflow)
    });

    return this.buildContextPackage({
      request,
      rankedArtifacts,
      workflowHistory: workflow.history,
      approvals: this.resolveApprovals(request),
      governanceFindings: this.resolveGovernanceFindings(request, rankedArtifacts)
    });
  }

  async getArtifactContext(request: ContextRequest): Promise<ContextPackage> {
    validateContextRequest(request);

    const workflow = this.requireWorkflow(request.workflowId);
    const artifacts = await this.resolveRequestedArtifacts(request.artifactIds);
    const allArtifacts = await this.sources.artifacts.list();
    const artifactIds = artifacts.map((artifact) => artifact.id);
    const rankedArtifacts = rankArtifacts({
      directArtifactIds: artifactIds,
      artifacts: allArtifacts,
      workflowHistory: filterHistoryByArtifactIds(workflow.history, artifactIds)
    });

    return this.buildContextPackage({
      request,
      rankedArtifacts,
      workflowHistory: filterHistoryByArtifactIds(workflow.history, artifactIds),
      approvals: this.resolveApprovals(request),
      governanceFindings: this.resolveGovernanceFindings(request, rankedArtifacts)
    });
  }

  async getAgentContext(request: ContextRequest): Promise<ContextPackage> {
    validateContextRequest(request);

    if (!request.agentId.trim()) {
      throw new Error("agentId is required");
    }

    if (!request.skillIds.length) {
      throw new Error("At least one skillId is required");
    }

    return this.getWorkflowContext(request);
  }

  private requireWorkflow(workflowId: string): WorkflowInstance {
    const workflow = this.sources.workflows.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return workflow;
  }

  private async resolveRequestedArtifacts(artifactIds: string[]): Promise<BaseArtifact[]> {
    const artifacts = await Promise.all(
      artifactIds.map((artifactId) => this.sources.artifacts.retrieve(artifactId))
    );

    return artifacts.filter((artifact): artifact is BaseArtifact => artifact !== undefined);
  }

  private resolveApprovals(request: ContextRequest): ApprovalRequest[] {
    return (this.sources.approvals?.listApprovals() ?? [])
      .filter((approval) => approval.workflowId === request.workflowId)
      .sort((left, right) => left.requestedAt.localeCompare(right.requestedAt))
      .slice(0, this.limits.maxApprovals)
      .map(cloneApproval);
  }

  private resolveGovernanceFindings(
    request: ContextRequest,
    rankedArtifacts: RankedArtifact[]
  ): GovernanceFinding[] {
    const relevantArtifactIds = new Set([
      ...request.artifactIds,
      ...rankedArtifacts.map((rankedArtifact) => rankedArtifact.artifact.id)
    ]);

    return (this.sources.governanceFindings?.listFindings() ?? [])
      .filter(
        (finding) =>
          finding.workflowId === request.workflowId ||
          (finding.artifactId ? relevantArtifactIds.has(finding.artifactId) : false)
      )
      .sort((left, right) => {
        const severityRank =
          GOVERNANCE_SEVERITY_RANK[left.severity] - GOVERNANCE_SEVERITY_RANK[right.severity];

        return severityRank || left.createdAt.localeCompare(right.createdAt) ||
          left.id.localeCompare(right.id);
      })
      .slice(0, this.limits.maxGovernanceFindings)
      .map(cloneGovernanceFinding);
  }

  private buildContextPackage(input: {
    request: ContextRequest;
    rankedArtifacts: RankedArtifact[];
    workflowHistory: WorkflowHistoryEvent[];
    approvals: ApprovalRequest[];
    governanceFindings: GovernanceFinding[];
  }): ContextPackage {
    const includedRankedArtifacts = input.rankedArtifacts.slice(0, this.limits.maxArtifacts);
    const includedArtifactIds = includedRankedArtifacts.map(
      (rankedArtifact) => rankedArtifact.artifact.id
    );
    const omittedArtifactIds = input.rankedArtifacts
      .slice(this.limits.maxArtifacts)
      .map((rankedArtifact) => rankedArtifact.artifact.id);

    return {
      artifacts: includedRankedArtifacts.map((rankedArtifact) =>
        cloneArtifact(rankedArtifact.artifact)
      ),
      workflowHistory: input.workflowHistory
        .slice(0, this.limits.maxWorkflowHistoryEvents)
        .map(cloneWorkflowHistoryEvent),
      approvals: input.approvals,
      governanceFindings: input.governanceFindings,
      metadata: {
        workflowId: input.request.workflowId,
        agentId: input.request.agentId,
        skillIds: [...input.request.skillIds],
        requestedArtifactIds: [...input.request.artifactIds],
        includedArtifactIds,
        omittedArtifactIds,
        limits: { ...this.limits }
      }
    };
  }
}

function resolveWorkflowHistoryForRanking(
  workflow: WorkflowInstance
): WorkflowHistoryEvent[] {
  const stageArtifactIds = workflow.stages.flatMap((stage) => stage.artifactIds);

  if (!stageArtifactIds.length) {
    return workflow.history;
  }

  return [
    ...workflow.history,
    {
      id: `${workflow.id}:context:stage-artifacts`,
      workflowId: workflow.id,
      type: "WORKFLOW_STARTED",
      toStatus: workflow.status,
      artifactIds: stageArtifactIds,
      occurredAt: workflow.updatedAt
    }
  ];
}

function filterHistoryByArtifactIds(
  history: WorkflowHistoryEvent[],
  artifactIds: string[]
): WorkflowHistoryEvent[] {
  const artifactIdSet = new Set(artifactIds);

  return history.filter((event) =>
    event.artifactIds.some((artifactId) => artifactIdSet.has(artifactId))
  );
}

function validateContextRequest(request: ContextRequest): void {
  if (!request.workflowId.trim()) {
    throw new Error("workflowId is required");
  }

  if (!Array.isArray(request.artifactIds)) {
    throw new Error("artifactIds must be an array");
  }

  if (!Array.isArray(request.skillIds)) {
    throw new Error("skillIds must be an array");
  }
}

function validateLimits(limits: ContextSizeLimits): void {
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`Context limit must be a non-negative integer: ${name}`);
    }
  }
}

function cloneArtifact(artifact: BaseArtifact): BaseArtifact {
  return {
    ...artifact,
    parentIds: [...artifact.parentIds],
    metadata: { ...artifact.metadata }
  };
}

function cloneWorkflowHistoryEvent(event: WorkflowHistoryEvent): WorkflowHistoryEvent {
  return {
    ...event,
    artifactIds: [...event.artifactIds]
  };
}

function cloneApproval(approval: ApprovalRequest): ApprovalRequest {
  return { ...approval };
}

function cloneGovernanceFinding(finding: GovernanceFinding): GovernanceFinding {
  return {
    ...finding,
    metadata: finding.metadata ? { ...finding.metadata } : undefined
  };
}
