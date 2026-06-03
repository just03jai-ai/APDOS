import type { ArtifactType } from "@apdos/artifacts";

export interface WorkflowStageDefinition {
  id: string;
  name: string;
  description: string;
  artifactTypes: ArtifactType[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  stages: WorkflowStageDefinition[];
}
