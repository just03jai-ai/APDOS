export interface FilesystemSkillSource {
  id: string;
  type: "filesystem";
  path: string;
  enabled: boolean;
}

export interface SkillAdapterConfig {
  sources: FilesystemSkillSource[];
}
