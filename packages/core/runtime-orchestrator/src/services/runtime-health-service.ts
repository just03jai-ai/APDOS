import type { SkillDefinition } from "@apdos/skill-registry";
import type { SkillGovernanceService } from "@apdos/skill-governance";
import type { SkillRuntimeService } from "@apdos/skill-runtime";
import {
  RuntimeValidationError,
  type RuntimeHealthCheckResult
} from "../contracts/runtime-orchestration.js";

export class RuntimeHealthService {
  constructor(
    private readonly skillGovernance: SkillGovernanceService,
    private readonly skillRuntime: SkillRuntimeService
  ) {}

  validateRuntime(): RuntimeHealthCheckResult {
    const governedSkills = this.skillGovernance.mapping.listSkills({ enabledOnly: true });
    const runtimeSkills = listRuntimeSkills(this.skillRuntime);
    const governedSkillNames = uniqueSorted(governedSkills.map((skill) => skill.skillId));
    const runtimeSkillNames = uniqueSorted(runtimeSkills.map((skill) => skill.name));
    const missingSkillNames = governedSkillNames.filter((skillName) => !runtimeSkillNames.includes(skillName));
    const extraSkillNames = runtimeSkillNames.filter((skillName) => !governedSkillNames.includes(skillName));
    const dependencyValidation = this.skillGovernance.graph.validateDependencies();
    const dependencyIssues = dependencyValidation.issues.map(
      (issue) => `${issue.skillId}:${issue.dependency}:${issue.reason}`
    );
    const executableSkillNames: string[] = [];

    for (const skillName of governedSkillNames) {
      if (missingSkillNames.includes(skillName)) {
        continue;
      }

      try {
        this.skillRuntime.loadSkill(skillName, "1.0");
        executableSkillNames.push(skillName);
      } catch {
        missingSkillNames.push(skillName);
      }
    }

    return {
      valid: missingSkillNames.length === 0 && extraSkillNames.length === 0 && dependencyIssues.length === 0,
      governedSkillNames,
      runtimeSkillNames,
      missingSkillNames: uniqueSorted(missingSkillNames),
      extraSkillNames,
      dependencyIssues,
      executableSkillNames: uniqueSorted(executableSkillNames)
    };
  }

  validate(): RuntimeHealthCheckResult {
    const result = this.validateRuntime();

    if (!result.valid) {
      throw new RuntimeValidationError("Runtime validation failed", result);
    }

    return result;
  }
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function listRuntimeSkills(skillRuntime: SkillRuntimeService): SkillDefinition[] {
  const runtimeWithList = skillRuntime as unknown as {
    listSkills?: () => SkillDefinition[];
    loader?: {
      listAvailableSkills?: () => SkillDefinition[];
    };
  };

  if (runtimeWithList.listSkills) {
    return runtimeWithList.listSkills();
  }

  if (runtimeWithList.loader?.listAvailableSkills) {
    return runtimeWithList.loader.listAvailableSkills();
  }

  throw new RuntimeValidationError("Runtime skill registry cannot be inspected");
}
