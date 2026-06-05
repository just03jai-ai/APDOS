import { ArtifactRegistry } from "@apdos/artifacts";
import { SkillGovernanceService } from "@apdos/skill-governance";
import { SkillRuntimeService } from "@apdos/skill-runtime";
import { StageStatus, WorkflowExecutionService } from "@apdos/workflow-engine";
import { RuntimeArtifactGenerator } from "../execution/artifact-generation.js";
import { RuntimeSkillExecutor } from "../execution/runtime-skill-executor.js";
import { RuntimeAgentResolver } from "../resolution/runtime-agent-resolver.js";
import { RuntimeSkillResolver } from "../resolution/runtime-skill-resolver.js";
import { RuntimeStageResolver } from "../resolution/runtime-stage-resolver.js";
import type {
  ExecuteRuntimeStageInput,
  RuntimeExecutionResult,
  RuntimeOrchestratorDependencies
} from "../contracts/runtime-orchestration.js";

export class RuntimeOrchestratorService {
  readonly stageResolver: RuntimeStageResolver;
  readonly agentResolver: RuntimeAgentResolver;
  readonly skillResolver: RuntimeSkillResolver;
  readonly skillExecutor: RuntimeSkillExecutor;
  readonly artifactGenerator: RuntimeArtifactGenerator;

  private readonly workflowExecutionService: WorkflowExecutionService;

  constructor(dependencies: RuntimeOrchestratorDependencies = {}) {
    this.workflowExecutionService = dependencies.workflowExecutionService ?? new WorkflowExecutionService();
    const skillGovernance = dependencies.skillGovernance ?? new SkillGovernanceService();
    const skillRuntime = dependencies.skillRuntime ?? new SkillRuntimeService();

    this.stageResolver = new RuntimeStageResolver(this.workflowExecutionService);
    this.agentResolver = new RuntimeAgentResolver(skillGovernance);
    this.skillResolver = new RuntimeSkillResolver(skillGovernance);
    this.skillExecutor = new RuntimeSkillExecutor(skillRuntime);
    this.artifactGenerator = new RuntimeArtifactGenerator(dependencies.artifactRegistry);
  }

  resolveWorkflowStage(workflowId: string, stageId?: string) {
    return this.stageResolver.resolveWorkflowStage(workflowId, stageId);
  }

  resolveNextStage(workflowId: string, stageId: string) {
    const workflow = this.workflowExecutionService.getWorkflow(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return this.stageResolver.resolveNextStage(workflow, stageId);
  }

  resolveAgentForStage(workflowStage: string): string {
    return this.agentResolver.resolveAgentForStage(workflowStage);
  }

  resolveSkillsForStage(workflowStage: string) {
    return this.skillResolver.resolveSkillsForStage(workflowStage);
  }

  async executeSkills(input: ExecuteRuntimeStageInput): Promise<RuntimeExecutionResult> {
    const { workflow, stage } = this.stageResolver.resolveWorkflowStage(input.workflowId, input.stageId);
    const selectedAgent = this.agentResolver.resolveAgentForStage(stage.id);
    const skills = this.skillResolver.resolveSkillsForStage(stage.id);

    if (stage.status === StageStatus.PENDING) {
      this.workflowExecutionService.advanceStage({
        workflowId: workflow.id,
        stageId: stage.id,
        occurredAt: input.requestedAt
      });
    }

    const executedSkills = await this.skillExecutor.executeSkills({
      workflowId: workflow.id,
      stageId: stage.id,
      selectedAgent,
      skills,
      inputArtifacts: input.inputArtifacts,
      requestedAt: input.requestedAt
    });
    const generatedArtifacts = await this.artifactGenerator.createArtifactsFromExecution(executedSkills);
    const completedWorkflow = this.workflowExecutionService.completeStage({
      workflowId: workflow.id,
      stageId: stage.id,
      artifactIds: generatedArtifacts.map((artifact) => artifact.id),
      occurredAt: input.requestedAt
    });
    const nextStage = this.stageResolver.resolveNextStage(completedWorkflow, stage.id);

    return {
      selectedAgent,
      executedSkills,
      generatedArtifacts,
      nextStage
    };
  }
}
