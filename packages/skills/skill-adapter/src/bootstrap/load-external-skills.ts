import { readFile } from "node:fs/promises";
import path from "node:path";
import { SkillAdapterService } from "../services/skill-adapter-service.js";
import type { SkillAdapterConfig } from "../contracts/skill-source.js";
import type { SkillSyncResult } from "../contracts/sync-result.js";

export interface LoadExternalSkillsOptions {
  configPath?: string;
  service?: SkillAdapterService;
}

export async function loadExternalSkills(
  options: LoadExternalSkillsOptions = {}
): Promise<SkillSyncResult> {
  const configPath =
    options.configPath ?? path.resolve(process.cwd(), "config/skills.config.json");
  const config = await readSkillAdapterConfig(configPath);
  const service = options.service ?? new SkillAdapterService();

  return service.syncSkills(config.sources);
}

export async function readSkillAdapterConfig(
  configPath: string
): Promise<SkillAdapterConfig> {
  const config = JSON.parse(await readFile(configPath, "utf8")) as SkillAdapterConfig;

  if (!Array.isArray(config.sources)) {
    throw new Error(`Skill adapter config must define sources: ${configPath}`);
  }

  return config;
}
