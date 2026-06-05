import type {
  SkillDefinition,
  SkillRegistry
} from "@apdos/skill-registry";

export interface ResolvedSkillVersion {
  requestedSkill: string;
  skillName: string;
  version: string;
  skill: SkillDefinition;
}

export class SkillVersionResolver {
  constructor(private readonly registry: SkillRegistry) {}

  resolveVersion(skillId: string, version?: string): ResolvedSkillVersion {
    const parsed = parseSkillReference(skillId, version);
    const skill = this.findSkill(parsed.skillName, parsed.version);

    if (!skill) {
      throw new Error(
        `Skill version not found: ${parsed.skillName}@${parsed.version}`
      );
    }

    return {
      requestedSkill: skillId,
      skillName: skill.name,
      version: skill.version,
      skill
    };
  }

  resolveLatest(skillName: string): ResolvedSkillVersion {
    const versions = this.registry.listSkillVersions(skillName);

    if (versions.length === 0) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    const skill = versions.sort(compareSkillsByVersion).at(-1);

    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    return {
      requestedSkill: skillName,
      skillName: skill.name,
      version: skill.version,
      skill
    };
  }

  private findSkill(skillName: string, version: string): SkillDefinition | undefined {
    return (
      this.registry.getSkillVersion(skillName, version) ??
      this.registry.getSkill(`${skillName}@${version}`)
    );
  }
}

function parseSkillReference(
  skillId: string,
  version?: string
): { skillName: string; version: string } {
  if (!skillId.trim()) {
    throw new Error("Skill id is required");
  }

  if (version?.trim()) {
    return {
      skillName: skillId.trim(),
      version: version.trim()
    };
  }

  const separatorIndex = skillId.lastIndexOf("@");

  if (separatorIndex <= 0 || separatorIndex === skillId.length - 1) {
    throw new Error(`Skill version is required: ${skillId}`);
  }

  return {
    skillName: skillId.slice(0, separatorIndex),
    version: skillId.slice(separatorIndex + 1)
  };
}

function compareSkillsByVersion(
  first: SkillDefinition,
  second: SkillDefinition
): number {
  return compareVersions(first.version, second.version);
}

function compareVersions(first: string, second: string): number {
  const firstParts = first.split(".").map(Number);
  const secondParts = second.split(".").map(Number);
  const length = Math.max(firstParts.length, secondParts.length);

  for (let index = 0; index < length; index += 1) {
    const firstPart = firstParts[index] ?? 0;
    const secondPart = secondParts[index] ?? 0;

    if (firstPart !== secondPart) {
      return firstPart - secondPart;
    }
  }

  return first.localeCompare(second);
}
