import { type BaseArtifact } from "@apdos/artifacts";
import type { SkillDefinition } from "@apdos/skill-registry";
import type {
  SkillExecutionRequest,
  SkillFinding,
  SkillResult
} from "../contracts/skill-execution.js";

export interface SkillExecutor {
  execute(skill: SkillDefinition, request: SkillExecutionRequest): Promise<SkillResult>;
}

export class DeterministicSkillExecutor implements SkillExecutor {
  async execute(
    skill: SkillDefinition,
    request: SkillExecutionRequest
  ): Promise<SkillResult> {
    const startedAt = request.context.requestedAt ?? new Date().toISOString();
    const completedAt = startedAt;
    const inputArtifactIds = request.inputArtifacts.map((artifact) => artifact.id);
    const workflowId = request.context.workflowId ?? "runtime";
    const executionId = `${workflowId}:${skill.id}:execution`;

    return {
      artifacts: skill.outputArtifacts.map((artifactType, index) => ({
        id: `${workflowId}:${skill.name}:${skill.version}:${artifactType.toLowerCase()}`,
        type: artifactType,
        title: `${skill.name} ${artifactType} output`,
        description: `Deterministic mock output produced by ${skill.id}.`,
        parentIds: inputArtifactIds,
        createdBy: request.context.agentId,
        createdAt: completedAt,
        version: 1,
        status: "draft",
        metadata: {
          skillId: skill.id,
          skillName: skill.name,
          skillVersion: skill.version,
          executionId,
          outputIndex: index,
          stageId: request.context.stageId,
          templates: skill.templates.map((template) => template.id),
          deterministic: true
        }
      })),
      findings: createFindings(skill),
      metadata: {
        executionId,
        skillId: skill.id,
        skillName: skill.name,
        version: skill.version,
        agentId: request.context.agentId,
        startedAt,
        completedAt,
        status: "succeeded",
        deterministic: true,
        inputArtifactIds
      }
    };
  }
}

function createFindings(skill: SkillDefinition): SkillFinding[] {
  if (skill.rules.length === 0) {
    return [
      {
        id: `${skill.id}:deterministic-execution`,
        severity: "info",
        message: `Executed ${skill.id} with deterministic mock execution.`
      }
    ];
  }

  return skill.rules.map((rule) => ({
    id: rule.id,
    severity: rule.severity,
    message: rule.description,
    metadata: {
      skillId: skill.id,
      deterministic: true
    }
  }));
}
