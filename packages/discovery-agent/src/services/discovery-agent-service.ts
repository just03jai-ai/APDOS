import {
  ArtifactRegistry,
  type BaseArtifact
} from "@apdos/artifacts";
import { ContextRetrievalService } from "@apdos/context-engine";
import {
  WorkflowExecutionService,
  type WorkflowInstance
} from "@apdos/workflow-engine";
import {
  analyzeGoalWithDeterministicRules,
  validateDiscoveryRequest
} from "../analysis/deterministic-discovery-analysis.js";
import type { DiscoveryRequest } from "../contracts/discovery-request.js";
import type { DiscoveryReport } from "../contracts/discovery-report.js";
import {
  createDiscoveryReportArtifact
} from "../reports/discovery-report-artifact.js";

export interface DiscoveryAgentServiceDependencies {
  artifacts?: ArtifactRegistry;
  context?: ContextRetrievalService;
  workflows?: WorkflowExecutionService;
}

export interface GenerateDiscoveryReportInput {
  request: DiscoveryRequest;
  parentArtifactIds?: string[];
  actorId?: string;
  createdAt?: string;
  stageId?: string;
  registerArtifact?: boolean;
}

export interface DiscoveryReportGenerationResult {
  report: DiscoveryReport;
  artifact: BaseArtifact;
}

export class DiscoveryAgentService {
  constructor(
    private readonly dependencies: DiscoveryAgentServiceDependencies = {}
  ) {}

  analyzeGoal(request: DiscoveryRequest): DiscoveryReport {
    return analyzeGoalWithDeterministicRules(request);
  }

  async generateDiscoveryReport(
    input: GenerateDiscoveryReportInput
  ): Promise<DiscoveryReportGenerationResult> {
    validateDiscoveryRequest(input.request);

    await this.loadContext(input.request);
    this.assertWorkflowExists(input.request.workflowId);

    const report = this.analyzeGoal(input.request);
    const artifact = createDiscoveryReportArtifact({
      request: input.request,
      report,
      parentIds: input.parentArtifactIds ?? input.request.contextIds,
      actorId: input.actorId ?? "discovery-agent",
      createdAt: input.createdAt,
      stageId: input.stageId
    });

    if (input.registerArtifact ?? true) {
      await this.dependencies.artifacts?.register(artifact);
    }

    return {
      report,
      artifact
    };
  }

  private async loadContext(request: DiscoveryRequest): Promise<void> {
    if (!this.dependencies.context) {
      return;
    }

    await this.dependencies.context.getWorkflowContext({
      workflowId: request.workflowId,
      artifactIds: request.contextIds,
      agentId: "discovery-agent",
      skillIds: ["codebase-research", "knowledge"]
    });
  }

  private assertWorkflowExists(workflowId: string): void {
    if (!this.dependencies.workflows) {
      return;
    }

    const workflow: WorkflowInstance | undefined =
      this.dependencies.workflows.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found for discovery request: ${workflowId}`);
    }
  }
}
