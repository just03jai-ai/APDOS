import type { ArtifactType } from "@apdos/artifacts";
import { SkillMappingService } from "./skill-mapping-service.js";
import type {
  SkillGovernanceMetadata,
  SkillRecommendationContext,
  WorkflowStageId
} from "../contracts/skill-governance-metadata.js";

export class SkillRecommendationService {
  constructor(private readonly mappingService = new SkillMappingService()) {}

  recommendNextSkill(context: SkillRecommendationContext): SkillGovernanceMetadata | undefined {
    const completedSkills = new Set(context.completedSkills ?? []);
    const availableArtifacts = new Set(context.availableArtifacts ?? []);

    return this.mappingService
      .listSkills({ enabledOnly: true })
      .filter((skill) => !completedSkills.has(skill.skillId))
      .filter((skill) => !context.agentId || skill.ownerAgent === context.agentId)
      .filter((skill) => !context.workflowStage || skill.workflowStage === context.workflowStage)
      .filter((skill) => dependenciesAreComplete(skill, completedSkills))
      .filter((skill) => artifactsAreAvailable(skill.inputArtifacts, availableArtifacts))
      .at(0);
  }

  recommendNextAgent(context: SkillRecommendationContext): string | undefined {
    return this.recommendNextSkill(context)?.ownerAgent;
  }

  recommendWorkflowStage(context: SkillRecommendationContext): WorkflowStageId | undefined {
    return this.recommendNextSkill(context)?.workflowStage;
  }
}

function dependenciesAreComplete(skill: SkillGovernanceMetadata, completedSkills: Set<string>): boolean {
  return skill.dependencies.every((dependency) => completedSkills.has(dependency));
}

function artifactsAreAvailable(requiredArtifacts: ArtifactType[], availableArtifacts: Set<ArtifactType>): boolean {
  if (requiredArtifacts.length === 0) {
    return true;
  }

  return requiredArtifacts.some((artifactType) => availableArtifacts.has(artifactType));
}
