import type { ArtifactType } from "@apdos/artifacts";

export interface ConsoleMetric {
  label: string;
  value: number;
  detail: string;
}

export interface ConsoleWorkflowStage {
  id: string;
  name: string;
  status: string;
  assignedAgent?: string;
  executedSkills: string[];
  artifactIds: string[];
}

export interface ConsoleWorkflow {
  id: string;
  goal: string;
  status: string;
  stages: ConsoleWorkflowStage[];
}

export interface ConsoleAgent {
  id: string;
  name: string;
  description: string;
  version: string;
  status: string;
  ownedSkills: string[];
  generatedArtifacts: string[];
  inputArtifacts: ArtifactType[];
  outputArtifacts: ArtifactType[];
}

export interface ConsoleSkill {
  id: string;
  name: string;
  version: string;
  status: string;
  category: string;
  description: string;
  ownerAgent?: string;
  workflowStage?: string;
  inputArtifacts: ArtifactType[];
  outputArtifacts: ArtifactType[];
  dependencies: string[];
  executionOrder?: number;
}

export interface ConsoleArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  description: string;
  status: string;
  createdBy: string;
  parentIds: string[];
  sourceAgent?: string;
  sourceSkillIds: string[];
}

export interface ConsoleLineageNode {
  id: string;
  label: string;
  type: string;
}

export interface ConsoleLineageEdge {
  id: string;
  source: string;
  target: string;
}

export interface RuntimeMonitorSnapshot {
  activeWorkflow: string;
  activeStage: string;
  activeAgent: string;
  activeSkill: string;
}

export interface PlatformSnapshot {
  metrics: ConsoleMetric[];
  workflow: ConsoleWorkflow;
  workflows: ConsoleWorkflow[];
  agents: ConsoleAgent[];
  skills: ConsoleSkill[];
  artifacts: ConsoleArtifact[];
  lineage: {
    nodes: ConsoleLineageNode[];
    edges: ConsoleLineageEdge[];
  };
  runtimeMonitor: RuntimeMonitorSnapshot;
  pendingApprovals: number;
}
