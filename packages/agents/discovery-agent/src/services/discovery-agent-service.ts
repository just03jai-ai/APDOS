import {
  ArtifactRegistry,
  type BaseArtifact
} from "@apdos/artifacts";
import { ContextRetrievalService } from "@apdos/context-engine";
import type {
  SkillExecutionRequest,
  SkillResult,
  SkillRuntimeService
} from "@apdos/skill-runtime";
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
  skillRuntime?: Pick<SkillRuntimeService, "executeSkill">;
  workflows?: WorkflowExecutionService;
}

export interface GenerateDiscoveryReportInput {
  request: DiscoveryRequest;
  parentArtifactIds?: string[];
  actorId?: string;
  createdAt?: string;
  stageId?: string;
  registerArtifact?: boolean;
  skillExecutions?: AgentSkillExecutionRequest[];
}

export interface DiscoveryReportGenerationResult {
  report: DiscoveryReport;
  artifact: BaseArtifact;
  skillResults: SkillResult[];
}

export type AgentSkillExecutionRequest = Omit<
  SkillExecutionRequest,
  "context"
> & {
  context?: Partial<SkillExecutionRequest["context"]>;
}

export class DiscoveryAgentService {
  constructor(
    private readonly dependencies: DiscoveryAgentServiceDependencies = {}
  ) {}

  analyzeGoal(request: DiscoveryRequest): DiscoveryReport {
    return analyzeGoalWithDeterministicRules(request);
  }

  async executeSkill(
    input: AgentSkillExecutionRequest
  ): Promise<SkillResult> {
    if (!this.dependencies.skillRuntime) {
      throw new Error("Skill Runtime dependency is required for skill execution");
    }

    return this.dependencies.skillRuntime.executeSkill(
      this.buildSkillExecutionRequest(input)
    );
  }

  async generateDiscoveryReport(
    input: GenerateDiscoveryReportInput
  ): Promise<DiscoveryReportGenerationResult> {
    validateDiscoveryRequest(input.request);

    await this.loadContext(input.request);
    this.assertWorkflowExists(input.request.workflowId);

    const skillResults = await this.executeRequestedSkills(
      input.skillExecutions ?? []
    );
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
      artifact,
      skillResults
    };
  }

  private async executeRequestedSkills(
    skillExecutions: AgentSkillExecutionRequest[]
  ): Promise<SkillResult[]> {
    const results: SkillResult[] = [];

    for (const skillExecution of skillExecutions) {
      results.push(await this.executeSkill(skillExecution));
    }

    return results;
  }

  private buildSkillExecutionRequest(
    input: AgentSkillExecutionRequest
  ): SkillExecutionRequest {
    return {
      ...input,
      inputArtifacts: input.inputArtifacts.map((artifact) => ({ ...artifact })),
      context: {
        workflowId: input.context?.workflowId,
        agentId: input.context?.agentId ?? "discovery-agent",
        stageId: input.context?.stageId,
        requestedAt: input.context?.requestedAt,
        metadata: input.context?.metadata
      }
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
