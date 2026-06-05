export interface DiscoveredSkill {
  sourceId: string;
  folderName: string;
  sourcePath: string;
  skillFilePath: string;
}

export interface ParsedSkill {
  skillId: string;
  skillName: string;
  description: string;
  version: string;
  sourcePath: string;
  skillFilePath: string;
  references: string[];
  examples: string[];
  metadata: Record<string, string>;
}
