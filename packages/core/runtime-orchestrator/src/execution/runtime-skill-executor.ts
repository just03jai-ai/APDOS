import type { BaseArtifact } from "@apdos/artifacts";
import type { SkillGovernanceMetadata } from "@apdos/skill-governance";
import { type SkillRuntimeService } from "@apdos/skill-runtime";
import type { RuntimeSkillExecution } from "../contracts/runtime-orchestration.js";

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

    for (const skill of input.skills) {
      const result = await this.skillRuntime.executeSkill({
        skillId: skill.skillId,
        version: "1.0",
        inputArtifacts: input.inputArtifacts.map((artifact) => ({ ...artifact })),
        context: {
          workflowId: input.workflowId,
          stageId: input.stageId,
          agentId: skill.ownerAgent || input.selectedAgent,
          requestedAt: input.requestedAt,
          metadata: {
            runtimeOrchestrated: true,
            executionOrder: skill.executionOrder
          }
        }
      });

      executions.push({
        skill,
        result
      });
    }

    return executions;
  }
}
