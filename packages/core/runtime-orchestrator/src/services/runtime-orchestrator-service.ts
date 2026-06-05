import { ArtifactRegistry } from "@apdos/artifacts";
import { SkillGovernanceService } from "@apdos/skill-governance";
import { SkillRuntimeService } from "@apdos/skill-runtime";
import { StageStatus, WorkflowExecutionService } from "@apdos/workflow-engine";
import { RuntimeArtifactGenerator } from "../execution/artifact-generation.js";
import { RuntimeSkillExecutor } from "../execution/runtime-skill-executor.js";
import { RuntimeAgentResolver } from "../resolution/runtime-agent-resolver.js";
import { RuntimeSkillResolver } from "../resolution/runtime-skill-resolver.js";
import { RuntimeStageResolver } from "../resolution/runtime-stage-resolver.js";
import { RuntimeHealthService } from "./runtime-health-service.js";
import type {
  ExecuteRuntimeStageInput,
  RuntimeExecutionResult,
  RuntimeOrchestratorDependencies,
  RuntimeHealthCheckResult
} from "../contracts/runtime-orchestration.js";
import {
  RuntimeExecutionError,
  RuntimeValidationError,
  WorkflowExecutionError
} from "../contracts/runtime-orchestration.js";

export class RuntimeOrchestratorService {
  readonly stageResolver: RuntimeStageResolver;
  readonly agentResolver: RuntimeAgentResolver;
  readonly skillResolver: RuntimeSkillResolver;
  readonly skillExecutor: RuntimeSkillExecutor;
  readonly artifactGenerator: RuntimeArtifactGenerator;
  readonly runtimeHealth: RuntimeHealthService;

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
    this.runtimeHealth = new RuntimeHealthService(skillGovernance, skillRuntime);
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

  validateRuntime(): RuntimeHealthCheckResult {
    return this.runtimeHealth.validate();
  }

  async executeSkills(input: ExecuteRuntimeStageInput): Promise<RuntimeExecutionResult> {
    this.validateRuntime();

    const { workflow, stage } = this.stageResolver.resolveWorkflowStage(input.workflowId, input.stageId);
    const selectedAgent = this.agentResolver.resolveAgentForStage(stage.id);
    const skills = this.skillResolver.resolveSkillsForStage(stage.id);
    let stageAdvanced = false;

    try {
      if (stage.status === StageStatus.PENDING) {
        this.workflowExecutionService.advanceStage({
          workflowId: workflow.id,
          stageId: stage.id,
          occurredAt: input.requestedAt
        });
        stageAdvanced = true;
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
    } catch (error) {
      if (stageAdvanced || stage.status === StageStatus.RUNNING) {
        this.failRunningStage(workflow.id, stage.id, error, input.requestedAt);
      }

      if (error instanceof RuntimeValidationError || error instanceof RuntimeExecutionError) {
        throw error;
      }

      throw new WorkflowExecutionError(`Runtime orchestration failed: ${workflow.id}/${stage.id}`, error);
    }
  }

  private failRunningStage(
    workflowId: string,
    stageId: string,
    error: unknown,
    occurredAt?: string
  ): void {
    const workflow = this.workflowExecutionService.getWorkflow(workflowId);
    const stage = workflow?.stages.find((candidate) => candidate.id === stageId);

    if (!stage || stage.status !== StageStatus.RUNNING) {
      return;
    }

    this.workflowExecutionService.failStage({
      workflowId,
      stageId,
      reason: error instanceof Error ? error.message : "Runtime orchestration failed",
      occurredAt
    });
  }
}
