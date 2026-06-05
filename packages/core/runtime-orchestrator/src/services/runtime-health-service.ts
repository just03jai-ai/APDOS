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
    const runtimeSkillByNameAndVersion = new Map(
      runtimeSkills.map((skill) => [`${skill.name}@${skill.version}`, skill])
    );
    const dependencyValidation = this.skillGovernance.graph.validateDependencies();
    const dependencyIssues = dependencyValidation.issues.map(
      (issue) => `${issue.skillId}:${issue.dependency}:${issue.reason}`
    );
    const metadataIssues = validateRuntimeMetadata(governedSkills, runtimeSkillByNameAndVersion);
    const executableSkillNames: string[] = [];

    for (const skill of governedSkills) {
      if (missingSkillNames.includes(skill.skillId)) {
        continue;
      }

      try {
        this.skillRuntime.loadSkill(skill.skillId, skill.version ?? "1.0");
        executableSkillNames.push(skill.skillId);
      } catch {
        missingSkillNames.push(skill.skillId);
      }
    }

    return {
      valid:
        missingSkillNames.length === 0 &&
        extraSkillNames.length === 0 &&
        dependencyIssues.length === 0 &&
        metadataIssues.length === 0,
      governedSkillNames,
      runtimeSkillNames,
      missingSkillNames: uniqueSorted(missingSkillNames),
      extraSkillNames,
      dependencyIssues,
      metadataIssues,
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

function validateRuntimeMetadata(
  governedSkills: ReturnType<SkillGovernanceService["mapping"]["listSkills"]>,
  runtimeSkillByNameAndVersion: Map<string, SkillDefinition>
): string[] {
  const issues: string[] = [];

  for (const governedSkill of governedSkills) {
    const version = governedSkill.version ?? "1.0";
    const runtimeSkill = runtimeSkillByNameAndVersion.get(`${governedSkill.skillId}@${version}`);

    if (!runtimeSkill) {
      issues.push(`${governedSkill.skillId}@${version}:version:missing`);
      continue;
    }

    collectArrayMismatchIssues(
      issues,
      `${governedSkill.skillId}@${version}`,
      "inputArtifacts",
      governedSkill.inputArtifacts,
      runtimeSkill.inputArtifacts
    );
    collectArrayMismatchIssues(
      issues,
      `${governedSkill.skillId}@${version}`,
      "outputArtifacts",
      governedSkill.outputArtifacts,
      runtimeSkill.outputArtifacts
    );
    collectArrayMismatchIssues(
      issues,
      `${governedSkill.skillId}@${version}`,
      "dependencies",
      governedSkill.dependencies,
      runtimeSkill.dependencies ?? []
    );
  }

  return issues;
}

function collectArrayMismatchIssues(
  issues: string[],
  skillId: string,
  field: string,
  governedValues: string[],
  runtimeValues: string[]
): void {
  const governed = uniqueSorted(governedValues);
  const runtime = uniqueSorted(runtimeValues);

  if (governed.join("|") !== runtime.join("|")) {
    issues.push(`${skillId}:${field}:governance=${governed.join(",")}:runtime=${runtime.join(",")}`);
  }
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
