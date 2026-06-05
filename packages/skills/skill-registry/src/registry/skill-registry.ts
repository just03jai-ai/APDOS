import type { ArtifactType } from "@apdos/artifacts";
import type {
  SkillCategory,
  SkillDefinition
} from "../contracts/skill-definition.js";

export class SkillRegistry {
  private skills = new Map<string, SkillDefinition>();

  constructor(initialSkills: readonly SkillDefinition[] = []) {
    for (const skill of initialSkills) {
      this.registerSkill(skill);
    }
  }

  registerSkill(skill: SkillDefinition): SkillDefinition {
    validateSkillDefinition(skill);

    if (this.skills.has(skill.id)) {
      throw new Error(`Skill already exists: ${skill.id}`);
    }

    this.skills.set(skill.id, cloneSkillDefinition(skill));
    return cloneSkillDefinition(skill);
  }

  unregisterSkill(skillId: string): boolean {
    return this.skills.delete(skillId);
  }

  getSkill(skillId: string): SkillDefinition | undefined {
    const skill = this.skills.get(skillId);
    return skill ? cloneSkillDefinition(skill) : undefined;
  }

  listSkills(): SkillDefinition[] {
    return Array.from(this.skills.values()).map(cloneSkillDefinition);
  }

  findSkillsByCategory(category: SkillCategory): SkillDefinition[] {
    return this.listSkills().filter((skill) => skill.category === category);
  }

  findSkillsByInputArtifact(artifactType: ArtifactType): SkillDefinition[] {
    return this.listSkills().filter((skill) =>
      skill.inputArtifacts.includes(artifactType)
    );
  }

  findSkillsByOutputArtifact(artifactType: ArtifactType): SkillDefinition[] {
    return this.listSkills().filter((skill) =>
      skill.outputArtifacts.includes(artifactType)
    );
  }

  listSkillVersions(skillName: string): SkillDefinition[] {
    return this.listSkills()
      .filter((skill) => skill.name === skillName)
      .sort((first, second) => first.version.localeCompare(second.version));
  }

  getSkillVersion(
    skillName: string,
    version: string
  ): SkillDefinition | undefined {
    return this.listSkillVersions(skillName).find(
      (skill) => skill.version === version
    );
  }
}

function validateSkillDefinition(skill: SkillDefinition): void {
  if (!skill.id.trim()) {
    throw new Error("Skill id is required");
  }

  if (!skill.name.trim()) {
    throw new Error("Skill name is required");
  }

  if (!skill.version.trim()) {
    throw new Error(`Skill version is required: ${skill.id}`);
  }

  if (skill.outputArtifacts.length === 0) {
    throw new Error(`Skill must define at least one output artifact: ${skill.id}`);
  }
}

function cloneSkillDefinition(skill: SkillDefinition): SkillDefinition {
  return {
    ...skill,
    dependencies: skill.dependencies ? [...skill.dependencies] : undefined,
    inputArtifacts: [...skill.inputArtifacts],
    outputArtifacts: [...skill.outputArtifacts],
    templates: skill.templates.map((template) => ({ ...template })),
    rules: skill.rules.map((rule) => ({ ...rule })),
    constraints: {
      ...skill.constraints,
      allowedWorkflowStages: skill.constraints.allowedWorkflowStages
        ? [...skill.constraints.allowedWorkflowStages]
        : undefined
    }
  };
}
