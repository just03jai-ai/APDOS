import type {
  SkillDefinition,
  SkillRegistry
} from "@apdos/skill-registry";
import {
  SkillVersionResolver,
  type ResolvedSkillVersion
} from "../versioning/skill-version-resolver.js";

export class SkillLoader {
  private readonly resolver: SkillVersionResolver;

  constructor(private readonly registry: SkillRegistry) {
    this.resolver = new SkillVersionResolver(registry);
  }

  loadSkill(skillId: string, version?: string): SkillDefinition {
    return this.resolveVersion(skillId, version).skill;
  }

  resolveVersion(skillId: string, version?: string): ResolvedSkillVersion {
    return this.resolver.resolveVersion(skillId, version);
  }

  listAvailableSkills(): SkillDefinition[] {
    return this.registry.listSkills().filter((skill) => skill.status === "available");
  }
}
