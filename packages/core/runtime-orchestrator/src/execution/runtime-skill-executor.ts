import type { BaseArtifact } from "@apdos/artifacts";
import type { ArtifactType } from "@apdos/artifacts";
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
        const skillInputArtifacts = filterArtifactsForSkill(currentArtifacts, skill);
        const result = await this.skillRuntime.executeSkill({
          skillId: skill.skillId,
          version: skill.version ?? "1.0",
          inputArtifacts: skillInputArtifacts.map(cloneArtifact),
          context: {
            workflowId: input.workflowId,
            stageId: input.stageId,
            agentId: skill.ownerAgent || input.selectedAgent,
            requestedAt: input.requestedAt,
            metadata: {
              runtimeOrchestrated: true,
              executionOrder: skill.executionOrder,
              availableArtifactIds: currentArtifacts.map((artifact) => artifact.id),
              selectedInputArtifactIds: skillInputArtifacts.map((artifact) => artifact.id)
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

export function filterArtifactsForSkill(
  availableArtifacts: BaseArtifact[],
  skill: SkillGovernanceMetadata
): BaseArtifact[] {
  const requiredArtifactTypes = uniqueArtifactTypes(skill.inputArtifacts);

  if (requiredArtifactTypes.length === 0) {
    return [];
  }

  const missingArtifactTypes = requiredArtifactTypes.filter(
    (artifactType) => !availableArtifacts.some((artifact) => artifact.type === artifactType)
  );

  if (missingArtifactTypes.length > 0) {
    throw new RuntimeExecutionError(
      `Missing input artifacts for ${skill.skillId}: ${missingArtifactTypes.join(", ")}`
    );
  }

  return availableArtifacts.filter((artifact) => requiredArtifactTypes.includes(artifact.type));
}

function uniqueArtifactTypes(artifactTypes: ArtifactType[]): ArtifactType[] {
  return [...new Set(artifactTypes)];
}

function cloneArtifact(artifact: BaseArtifact): BaseArtifact {
  return {
    ...artifact,
    parentIds: [...artifact.parentIds],
    metadata: { ...artifact.metadata }
  };
}
