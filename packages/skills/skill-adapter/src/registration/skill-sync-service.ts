import { ArtifactType } from "@apdos/artifacts";
import {
  type SkillCategory,
  type SkillDefinition,
  SkillRegistry
} from "@apdos/skill-registry";
import type { ParsedSkill } from "../contracts/external-skill.js";
import type { SkillSyncError, SkillSyncResult } from "../contracts/sync-result.js";

export class SkillSyncService {
  constructor(private readonly registry: SkillRegistry) {}

  syncSkills(skills: readonly ParsedSkill[]): SkillSyncResult {
    const registeredSkills: SkillDefinition[] = [];
    const errors: SkillSyncError[] = [];
    let skipped = 0;

    for (const skill of skills) {
      const definition = toSkillDefinition(skill);

      if (this.registry.getSkill(definition.id)) {
        skipped += 1;
        continue;
      }

      try {
        registeredSkills.push(this.registry.registerSkill(definition));
      } catch (error) {
        errors.push({
          skillId: skill.skillId,
          sourcePath: skill.sourcePath,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      discovered: skills.length,
      registered: registeredSkills.length,
      skipped,
      errors,
      skills: skills.map((skill) => ({
        ...skill,
        references: [...skill.references],
        examples: [...skill.examples],
        metadata: { ...skill.metadata }
      })),
      registeredSkills
    };
  }
}

export function toSkillDefinition(skill: ParsedSkill): SkillDefinition {
  return {
    id: `${skill.skillId}@${skill.version}`,
    name: skill.skillId,
    description: skill.description,
    version: skill.version,
    category: inferCategory(skill.skillId, skill.skillName),
    status: "available",
    inputArtifacts: inferInputArtifacts(skill.skillId),
    outputArtifacts: inferOutputArtifacts(skill.skillId),
    templates: [],
    rules: [
      {
        id: `rule:${skill.skillId}:external-source-required`,
        description: `External skill ${skill.skillId} must retain its source SKILL.md path.`,
        severity: "info"
      }
    ],
    constraints: {
      requiresHumanApproval: false,
      maxInputArtifacts: 10
    }
  };
}

function inferCategory(skillId: string, skillName: string): SkillCategory {
  const value = `${skillId} ${skillName}`.toLowerCase();

  if (value.includes("router")) return "routing";
  if (value.includes("research")) return "research";
  if (value.includes("knowledge") || value.includes("convention")) return "knowledge";
  if (value.includes("prd")) return "product";
  if (value.includes("tech-spec") || value.includes("architecture")) return "architecture";
  if (value.includes("test") || value.includes("guardian")) return "quality";
  if (value.includes("design")) return "design";
  if (value.includes("backend") || value.includes("cron") || value.includes("data")) return "backend";
  if (value.includes("frontend") || value.includes("web")) return "frontend";

  return "knowledge";
}

function inferInputArtifacts(skillId: string): ArtifactType[] {
  if (skillId.includes("prd")) return [ArtifactType.DISCOVERY_REPORT];
  if (skillId.includes("tech-spec")) return [ArtifactType.PRD];
  if (skillId.includes("test")) return [ArtifactType.TECH_SPEC, ArtifactType.IMPLEMENTATION_PLAN];
  if (skillId.includes("implement")) return [ArtifactType.TECH_SPEC];
  if (skillId.includes("contributor")) return [ArtifactType.IMPLEMENTATION_PLAN, ArtifactType.TECH_SPEC];
  return [ArtifactType.IDEA, ArtifactType.PRD, ArtifactType.TECH_SPEC];
}

function inferOutputArtifacts(skillId: string): ArtifactType[] {
  if (skillId.includes("prd")) return [ArtifactType.PRD];
  if (skillId.includes("tech-spec")) return [ArtifactType.TECH_SPEC];
  if (skillId.includes("test")) return [ArtifactType.TEST_RESULT];
  if (skillId.includes("implement")) return [ArtifactType.IMPLEMENTATION_PLAN];
  if (skillId.includes("contributor")) return [ArtifactType.CODE_CHANGE];
  if (skillId.includes("guardian")) return [ArtifactType.GOVERNANCE_FINDING];
  return [ArtifactType.TASK];
}
