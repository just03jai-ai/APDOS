import type { BaseArtifact } from "@apdos/artifacts";
import { SkillRegistry, type SkillDefinition } from "@apdos/skill-registry";
import { SkillRuntimeService, type SkillResult } from "@apdos/skill-runtime";
import type { ParsedSkill } from "../contracts/external-skill.js";
import type { FilesystemSkillSource } from "../contracts/skill-source.js";
import type { SkillSyncResult } from "../contracts/sync-result.js";
import { FilesystemSkillSourceDiscovery } from "../discovery/filesystem-skill-source.js";
import { SkillParser } from "../parsing/skill-parser.js";
import { SkillSyncService } from "../registration/skill-sync-service.js";

export interface SkillAdapterServiceDependencies {
  registry?: SkillRegistry;
  runtime?: SkillRuntimeService;
  discovery?: FilesystemSkillSourceDiscovery;
  parser?: SkillParser;
}

export interface ExecuteExternalSkillInput {
  skillId: string;
  version?: string;
  inputArtifacts: BaseArtifact[];
  context: {
    workflowId?: string;
    agentId: string;
    stageId?: string;
    requestedAt?: string;
    metadata?: Record<string, unknown>;
  };
}

export class SkillAdapterService {
  private readonly registry: SkillRegistry;
  private readonly runtime: SkillRuntimeService;
  private readonly discovery: FilesystemSkillSourceDiscovery;
  private readonly parser: SkillParser;
  private readonly sync: SkillSyncService;

  constructor(dependencies: SkillAdapterServiceDependencies = {}) {
    this.registry = dependencies.registry ?? new SkillRegistry();
    this.runtime = dependencies.runtime ?? new SkillRuntimeService({ registry: this.registry });
    this.discovery = dependencies.discovery ?? new FilesystemSkillSourceDiscovery();
    this.parser = dependencies.parser ?? new SkillParser();
    this.sync = new SkillSyncService(this.registry);
  }

  async discoverSkills(sources: readonly FilesystemSkillSource[]): Promise<ParsedSkill[]> {
    const discovered = await this.discovery.discoverSkills(sources);
    return Promise.all(discovered.map((skill) => this.parser.parseSkill(skill)));
  }

  async syncSkills(sources: readonly FilesystemSkillSource[]): Promise<SkillSyncResult> {
    const skills = await this.discoverSkills(sources);
    return this.sync.syncSkills(skills);
  }

  loadSkill(skillId: string, version = "1.0"): SkillDefinition {
    return this.runtime.loadSkill(skillId, version);
  }

  resolveSkill(skillId: string, version = "1.0") {
    return this.runtime.resolveVersion(skillId, version);
  }

  executeSkill(input: ExecuteExternalSkillInput): Promise<SkillResult> {
    return this.runtime.executeSkill({
      skillId: input.skillId,
      version: input.version ?? "1.0",
      inputArtifacts: input.inputArtifacts,
      context: input.context
    });
  }
}
