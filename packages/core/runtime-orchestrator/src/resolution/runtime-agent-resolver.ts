import type { SkillGovernanceService } from "@apdos/skill-governance";

export class RuntimeAgentResolver {
  constructor(private readonly skillGovernance: SkillGovernanceService) {}

  resolveAgentForStage(workflowStage: string): string {
    const skills = this.skillGovernance.mapping.getSkillsForWorkflowStage(workflowStage);
    const selectedSkill = skills.at(0);

    if (!selectedSkill) {
      throw new Error(`No governed skills found for workflow stage: ${workflowStage}`);
    }

    return selectedSkill.ownerAgent;
  }
}
