import { DEFAULT_SKILL_GOVERNANCE_METADATA } from "../contracts/default-skill-governance.js";
import type {
  SkillGovernanceMetadata,
  SkillId,
  WorkflowStageId
} from "../contracts/skill-governance-metadata.js";

export class SkillMappingService {
  private readonly metadataBySkillId: Map<SkillId, SkillGovernanceMetadata>;

  constructor(metadata: SkillGovernanceMetadata[] = DEFAULT_SKILL_GOVERNANCE_METADATA) {
    this.metadataBySkillId = new Map(metadata.map((entry) => [entry.skillId, cloneMetadata(entry)]));
  }

  listSkills(options: { enabledOnly?: boolean } = {}): SkillGovernanceMetadata[] {
    return this.sortSkills([...this.metadataBySkillId.values()], options.enabledOnly ?? false);
  }

  getSkill(skillId: SkillId): SkillGovernanceMetadata | undefined {
    const metadata = this.metadataBySkillId.get(skillId);
    return metadata ? cloneMetadata(metadata) : undefined;
  }

  getSkillsForAgent(agentId: string, options: { enabledOnly?: boolean } = {}): SkillGovernanceMetadata[] {
    return this.sortSkills(
      [...this.metadataBySkillId.values()].filter((entry) => entry.ownerAgent === agentId),
      options.enabledOnly ?? true
    );
  }

  getSkillsForWorkflowStage(
    workflowStage: WorkflowStageId,
    options: { enabledOnly?: boolean } = {}
  ): SkillGovernanceMetadata[] {
    return this.sortSkills(
      [...this.metadataBySkillId.values()].filter((entry) => entry.workflowStage === workflowStage),
      options.enabledOnly ?? true
    );
  }

  getSkillDependencies(skillId: SkillId): SkillGovernanceMetadata[] {
    const metadata = this.metadataBySkillId.get(skillId);

    if (!metadata) {
      return [];
    }

    return metadata.dependencies
      .map((dependency) => this.metadataBySkillId.get(dependency))
      .filter((dependency): dependency is SkillGovernanceMetadata => dependency !== undefined)
      .map(cloneMetadata)
      .sort(compareExecutionOrder);
  }

  getDependents(skillId: SkillId): SkillGovernanceMetadata[] {
    return this.sortSkills(
      [...this.metadataBySkillId.values()].filter((entry) => entry.dependencies.includes(skillId)),
      true
    );
  }

  private sortSkills(skills: SkillGovernanceMetadata[], enabledOnly: boolean): SkillGovernanceMetadata[] {
    return skills
      .filter((entry) => !enabledOnly || entry.enabled)
      .map(cloneMetadata)
      .sort(compareExecutionOrder);
  }
}

function compareExecutionOrder(left: SkillGovernanceMetadata, right: SkillGovernanceMetadata): number {
  return left.executionOrder - right.executionOrder || left.skillId.localeCompare(right.skillId);
}

function cloneMetadata(metadata: SkillGovernanceMetadata): SkillGovernanceMetadata {
  return {
    ...metadata,
    version: metadata.version,
    inputArtifacts: [...metadata.inputArtifacts],
    outputArtifacts: [...metadata.outputArtifacts],
    dependencies: [...metadata.dependencies]
  };
}
