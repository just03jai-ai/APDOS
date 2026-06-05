import type { SkillDefinition } from "@apdos/skill-registry";
import type { ParsedSkill } from "./external-skill.js";

export interface SkillSyncError {
  skillId?: string;
  sourcePath?: string;
  message: string;
}

export interface SkillSyncResult {
  discovered: number;
  registered: number;
  skipped: number;
  errors: SkillSyncError[];
  skills: ParsedSkill[];
  registeredSkills: SkillDefinition[];
}
