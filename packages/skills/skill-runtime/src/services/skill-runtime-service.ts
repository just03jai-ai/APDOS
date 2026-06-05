import {
  SkillRegistry,
  createSeededSkillRegistry,
  type SkillDefinition
} from "@apdos/skill-registry";
import type {
  SkillExecutionRequest,
  SkillResult
} from "../contracts/skill-execution.js";
import {
  DeterministicSkillExecutor,
  type SkillExecutor
} from "../execution/deterministic-skill-executor.js";
import { SkillLoader } from "../loaders/skill-loader.js";
import type { ResolvedSkillVersion } from "../versioning/skill-version-resolver.js";

export interface SkillRuntimeServiceDependencies {
  registry?: SkillRegistry;
  executor?: SkillExecutor;
}

export class SkillRuntimeService {
  private readonly loader: SkillLoader;
  private readonly executor: SkillExecutor;

  constructor(dependencies: SkillRuntimeServiceDependencies = {}) {
    const registry = dependencies.registry ?? createSeededSkillRegistry();
    this.loader = new SkillLoader(registry);
    this.executor = dependencies.executor ?? new DeterministicSkillExecutor();
  }

  loadSkill(skillId: string, version?: string): SkillDefinition {
    return this.loader.loadSkill(skillId, version);
  }

  listSkills(): SkillDefinition[] {
    return this.loader.listAvailableSkills();
  }

  resolveVersion(skillId: string, version?: string): ResolvedSkillVersion {
    return this.loader.resolveVersion(skillId, version);
  }

  async executeSkill(request: SkillExecutionRequest): Promise<SkillResult> {
    const skill = this.loadSkill(request.skillId, request.version);
    this.validateExecutionRequest(skill, request);

    return this.executor.execute(skill, {
      ...request,
      skillId: skill.name,
      version: skill.version,
      inputArtifacts: request.inputArtifacts.map((artifact) => ({ ...artifact }))
    });
  }

  private validateExecutionRequest(
    skill: SkillDefinition,
    request: SkillExecutionRequest
  ): void {
    if (!request.context.agentId.trim()) {
      throw new Error("Skill execution agentId is required");
    }

    const maxInputArtifacts = skill.constraints.maxInputArtifacts;

    if (
      maxInputArtifacts !== undefined &&
      request.inputArtifacts.length > maxInputArtifacts
    ) {
      throw new Error(
        `Skill input artifact limit exceeded for ${skill.id}: ${request.inputArtifacts.length}/${maxInputArtifacts}`
      );
    }
  }
}
