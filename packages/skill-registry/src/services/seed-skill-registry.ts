import { SkillRegistry } from "../registry/skill-registry.js";
import { INITIAL_SKILL_DEFINITIONS } from "./seed-skills.js";

export function createSeededSkillRegistry(): SkillRegistry {
  return new SkillRegistry(INITIAL_SKILL_DEFINITIONS);
}
