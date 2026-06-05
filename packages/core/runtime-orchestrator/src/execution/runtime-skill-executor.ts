import type { BaseArtifact } from "@apdos/artifacts";
import type { SkillGovernanceMetadata } from "@apdos/skill-governance";
import { type SkillRuntimeService } from "@apdos/skill-runtime";
import {
  RuntimeExecutionError,
  type RuntimeSkillExecution
} from "../contracts/runtime-orchestration.js";

export class RuntimeSkillExecutor {
  constructor(private readonly skillRuntime: SkillRuntimeService) {}

  async executeSkills(input: {
    workflowId: string;
    stageId: string;
    selectedAgent: string;
    skills: SkillGovernanceMetadata[];
    inputArtifacts: BaseArtifact[];
    requestedAt?: string;
  }): Promise<RuntimeSkillExecution[]> {
    const executions: RuntimeSkillExecution[] = [];
    const currentArtifacts = input.inputArtifacts.map(cloneArtifact);

    for (const skill of input.skills) {
      try {
        const result = await this.skillRuntime.executeSkill({
          skillId: skill.skillId,
          version: "1.0",
          inputArtifacts: currentArtifacts.map(cloneArtifact),
          context: {
            workflowId: input.workflowId,
            stageId: input.stageId,
            agentId: skill.ownerAgent || input.selectedAgent,
            requestedAt: input.requestedAt,
            metadata: {
              runtimeOrchestrated: true,
              executionOrder: skill.executionOrder,
              availableArtifactIds: currentArtifacts.map((artifact) => artifact.id)
            }
          }
        });

        executions.push({
          skill,
          result
        });
        currentArtifacts.push(...result.artifacts.map(cloneArtifact));
      } catch (error) {
        throw new RuntimeExecutionError(`Skill execution failed: ${skill.skillId}`, error);
      }
    }

    return executions;
  }
}

function cloneArtifact(artifact: BaseArtifact): BaseArtifact {
  return {
    ...artifact,
    parentIds: [...artifact.parentIds],
    metadata: { ...artifact.metadata }
  };
}
