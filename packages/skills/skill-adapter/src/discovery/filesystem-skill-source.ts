import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { DiscoveredSkill } from "../contracts/external-skill.js";
import type { FilesystemSkillSource } from "../contracts/skill-source.js";

export class FilesystemSkillSourceDiscovery {
  async discoverSkills(
    sources: readonly FilesystemSkillSource[]
  ): Promise<DiscoveredSkill[]> {
    const discovered: DiscoveredSkill[] = [];

    for (const source of sources) {
      if (!source.enabled) {
        continue;
      }

      const rootPath = path.resolve(process.cwd(), source.path);
      const entries = await readdir(rootPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        const sourcePath = path.join(rootPath, entry.name);
        const skillFilePath = path.join(sourcePath, "SKILL.md");

        if (await isFile(skillFilePath)) {
          discovered.push({
            sourceId: source.id,
            folderName: entry.name,
            sourcePath,
            skillFilePath
          });
        }
      }
    }

    return discovered.sort((first, second) =>
      first.sourcePath.localeCompare(second.sourcePath)
    );
  }
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}
