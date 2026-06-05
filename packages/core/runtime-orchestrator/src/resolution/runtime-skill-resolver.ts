import type { SkillGovernanceMetadata, SkillGovernanceService } from "@apdos/skill-governance";

export class RuntimeSkillResolver {
  constructor(private readonly skillGovernance: SkillGovernanceService) {}

  resolveSkillsForStage(workflowStage: string): SkillGovernanceMetadata[] {
    const skills = this.skillGovernance.mapping.getSkillsForWorkflowStage(workflowStage);

    if (skills.length === 0) {
      throw new Error(`No governed skills found for workflow stage: ${workflowStage}`);
    }

    return skills;
  }
}
