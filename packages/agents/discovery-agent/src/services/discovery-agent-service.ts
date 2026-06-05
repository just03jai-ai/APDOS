import {
  ArtifactRegistry,
  ArtifactType,
  type BaseArtifact
} from "@apdos/artifacts";
import { ContextRetrievalService } from "@apdos/context-engine";
import { RuntimeSkillExecutor } from "@apdos/runtime-orchestrator";
import { SkillGovernanceService } from "@apdos/skill-governance";
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
  skillGovernance?: SkillGovernanceService;
  skillRuntime?: SkillRuntimeService;
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
    return createAggregatedDiscoveryReport(request, [], []);
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

    const inputArtifacts = await this.resolveInputArtifacts(input);
    const skillResults = input.skillExecutions
      ? await this.executeRequestedSkills(input.skillExecutions)
      : await this.executeGovernedSkills(input, inputArtifacts);
    const producedArtifacts = skillResults.flatMap((result) => result.artifacts);
    const report = createAggregatedDiscoveryReport(
      input.request,
      skillResults,
      producedArtifacts
    );
    const artifact = createDiscoveryReportArtifact({
      request: input.request,
      report,
      parentIds: input.parentArtifactIds ?? inputArtifacts.map((artifact) => artifact.id),
      actorId: input.actorId ?? "discovery-agent",
      createdAt: input.createdAt,
      stageId: input.stageId
    });
    artifact.metadata.sourceAgent = "agent:discovery";
    artifact.metadata.sourceSkillIds = skillResults.map((result) => result.metadata.skillId);
    artifact.metadata.sourceArtifactIds = producedArtifacts.map((producedArtifact) => producedArtifact.id);

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

  private async executeGovernedSkills(
    input: GenerateDiscoveryReportInput,
    inputArtifacts: BaseArtifact[]
  ): Promise<SkillResult[]> {
    const skillRuntime = this.requireSkillRuntime();
    const skillGovernance = this.dependencies.skillGovernance ?? new SkillGovernanceService();
    const skills = skillGovernance.mapping.getSkillsForAgent("agent:discovery");
    const executor = new RuntimeSkillExecutor(skillRuntime);
    const executions = await executor.executeSkills({
      workflowId: input.request.workflowId,
      stageId: input.stageId ?? "discovery",
      selectedAgent: "agent:discovery",
      skills,
      inputArtifacts,
      requestedAt: input.createdAt
    });

    return executions.map((execution) => execution.result);
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

  private async resolveInputArtifacts(input: GenerateDiscoveryReportInput): Promise<BaseArtifact[]> {
    const artifacts: BaseArtifact[] = [];

    if (this.dependencies.artifacts) {
      for (const artifactId of input.parentArtifactIds ?? input.request.contextIds) {
        const artifact = await this.dependencies.artifacts.retrieve(artifactId);

        if (artifact) {
          artifacts.push(artifact);
        }
      }
    }

    if (artifacts.length > 0) {
      return artifacts;
    }

    return [
      {
        id: input.request.contextIds[0] ?? `${input.request.workflowId}:idea`,
        type: ArtifactType.IDEA,
        title: "Idea",
        description: input.request.goal,
        parentIds: [],
        createdBy: input.actorId ?? "discovery-agent",
        createdAt: input.createdAt ?? new Date().toISOString(),
        version: 1,
        status: "active",
        metadata: {
          workflowId: input.request.workflowId,
          stageId: "idea",
          goal: input.request.goal
        }
      }
    ];
  }

  private requireSkillRuntime(): SkillRuntimeService {
    if (!this.dependencies.skillRuntime) {
      throw new Error("Skill Runtime dependency is required for governed Discovery Agent execution");
    }

    return this.dependencies.skillRuntime as SkillRuntimeService;
  }

  private async loadContext(request: DiscoveryRequest): Promise<void> {
    if (!this.dependencies.context) {
      return;
    }

    await this.dependencies.context.getWorkflowContext({
      workflowId: request.workflowId,
      artifactIds: request.contextIds,
      agentId: "discovery-agent",
      skillIds: (this.dependencies.skillGovernance ?? new SkillGovernanceService())
        .mapping.getSkillsForAgent("agent:discovery")
        .map((skill) => skill.skillId)
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

function createAggregatedDiscoveryReport(
  request: DiscoveryRequest,
  skillResults: SkillResult[],
  producedArtifacts: BaseArtifact[]
): DiscoveryReport {
  const executedSkillNames = skillResults.map((result) => result.metadata.skillName);
  const findingMessages = skillResults.flatMap((result) =>
    result.findings.map((finding) => finding.message)
  );

  return {
    problemSummary: `Discovery for ${request.goal}.`,
    affectedSystems: uniqueStrings([
      "artifact-engine",
      "workflow-engine",
      "skill-runtime",
      ...producedArtifacts.map((artifact) => String(artifact.metadata.stageId ?? artifact.type).toLowerCase())
    ]),
    repositories: uniqueStrings(
      executedSkillNames.length > 0 ? executedSkillNames : ["skill-governance"]
    ),
    dependencies: uniqueStrings([
      "skill governance metadata",
      "skill runtime execution",
      ...executedSkillNames
    ]),
    risks: uniqueStrings(
      findingMessages.length > 0
        ? findingMessages
        : ["Discovery depends on governed skill output quality."]
    ),
    openQuestions: ["Confirm business approval thresholds and exception paths."],
    recommendedNextSteps: ["Create PRD from governed discovery artifacts."]
  };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}
