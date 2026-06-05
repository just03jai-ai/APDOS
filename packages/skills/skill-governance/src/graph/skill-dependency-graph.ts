import { DEFAULT_SKILL_GOVERNANCE_METADATA } from "../contracts/default-skill-governance.js";
import type {
  SkillDependencyGraph,
  SkillDependencyIssue,
  SkillDependencyValidationResult,
  SkillGovernanceMetadata,
  SkillId
} from "../contracts/skill-governance-metadata.js";

export class SkillDependencyGraphService {
  constructor(private readonly metadata: SkillGovernanceMetadata[] = DEFAULT_SKILL_GOVERNANCE_METADATA) {}

  buildSkillGraph(options: { enabledOnly?: boolean } = {}): SkillDependencyGraph {
    const enabledOnly = options.enabledOnly ?? true;
    const skills = this.metadata
      .filter((entry) => !enabledOnly || entry.enabled)
      .sort((left, right) => left.executionOrder - right.executionOrder || left.skillId.localeCompare(right.skillId));
    const includedSkillIds = new Set(skills.map((entry) => entry.skillId));

    return {
      nodes: skills.map((entry) => ({
        skillId: entry.skillId,
        ownerAgent: entry.ownerAgent,
        workflowStage: entry.workflowStage,
        executionOrder: entry.executionOrder,
        enabled: entry.enabled
      })),
      edges: skills.flatMap((entry) =>
        entry.dependencies
          .filter((dependency) => includedSkillIds.has(dependency))
          .map((dependency) => ({
            fromSkillId: dependency,
            toSkillId: entry.skillId
          }))
      )
    };
  }

  validateDependencies(): SkillDependencyValidationResult {
    const metadataBySkillId = new Map(this.metadata.map((entry) => [entry.skillId, entry]));
    const issues: SkillDependencyIssue[] = [];

    for (const entry of this.metadata) {
      for (const dependency of entry.dependencies) {
        const dependencyMetadata = metadataBySkillId.get(dependency);

        if (!dependencyMetadata) {
          issues.push({ skillId: entry.skillId, dependency, reason: "missing" });
          continue;
        }

        if (!dependencyMetadata.enabled) {
          issues.push({ skillId: entry.skillId, dependency, reason: "disabled" });
        }
      }
    }

    for (const skillId of findCycleSkillIds(this.metadata)) {
      issues.push({ skillId, dependency: skillId, reason: "cycle" });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

function findCycleSkillIds(metadata: SkillGovernanceMetadata[]): SkillId[] {
  const metadataBySkillId = new Map(metadata.map((entry) => [entry.skillId, entry]));
  const visiting = new Set<SkillId>();
  const visited = new Set<SkillId>();
  const cyclic = new Set<SkillId>();

  function visit(skillId: SkillId, path: SkillId[]): void {
    if (visiting.has(skillId)) {
      for (const cyclicSkillId of path.slice(path.indexOf(skillId))) {
        cyclic.add(cyclicSkillId);
      }
      return;
    }

    if (visited.has(skillId)) {
      return;
    }

    const metadataEntry = metadataBySkillId.get(skillId);
    if (!metadataEntry) {
      return;
    }

    visiting.add(skillId);

    for (const dependency of metadataEntry.dependencies) {
      visit(dependency, [...path, dependency]);
    }

    visiting.delete(skillId);
    visited.add(skillId);
  }

  for (const entry of metadata) {
    visit(entry.skillId, [entry.skillId]);
  }

  return [...cyclic].sort();
}
