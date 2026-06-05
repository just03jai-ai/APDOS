import type { ArtifactType } from "@apdos/artifacts";

export type SkillStatus = "available" | "experimental" | "deprecated";

export type SkillCategory =
  | "routing"
  | "research"
  | "knowledge"
  | "product"
  | "architecture"
  | "quality"
  | "design"
  | "backend"
  | "frontend"
  | "governance"
  | "release";

export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  artifactType: ArtifactType;
}

export interface SkillRule {
  id: string;
  description: string;
  severity: "info" | "warning" | "error";
}

export interface SkillConstraints {
  requiresHumanApproval?: boolean;
  maxInputArtifacts?: number;
  allowedWorkflowStages?: string[];
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  dependencies?: string[];
  category: SkillCategory;
  status: SkillStatus;
  inputArtifacts: ArtifactType[];
  outputArtifacts: ArtifactType[];
  templates: SkillTemplate[];
  rules: SkillRule[];
  constraints: SkillConstraints;
}
