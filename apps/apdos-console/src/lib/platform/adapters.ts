import { createSeededAgentRegistry } from "@apdos/agent-registry";
import { ArtifactType, type BaseArtifact } from "@apdos/artifacts";
import { DeliveryWorkflowService } from "@apdos/delivery-workflow";
import { SkillGovernanceService } from "@apdos/skill-governance";
import { createSeededSkillRegistry } from "@apdos/skill-registry";
import { WorkflowStatus } from "@apdos/workflow-engine";
import type { AgentDefinition } from "@apdos/agent-registry";
import type { SkillDefinition } from "@apdos/skill-registry";
import type { WorkflowStage } from "@apdos/workflow-engine";
import type {
  ConsoleAgent,
  ConsoleArtifact,
  ConsoleLineageEdge,
  ConsoleLineageNode,
  ConsoleSkill,
  ConsoleWorkflowStage,
  PlatformSnapshot
} from "./types";

const SAMPLE_WORKFLOW_ID = "console:supplier-payment-approval";
const SAMPLE_GOAL = "Build supplier payment approval workflow";
const SAMPLE_TIME = "2026-06-05T00:00:00.000Z";

export async function getPlatformSnapshot(): Promise<PlatformSnapshot> {
  const delivery = await new DeliveryWorkflowService().run({
    workflowId: SAMPLE_WORKFLOW_ID,
    goal: SAMPLE_GOAL,
    actorId: "apdos-console",
    createdAt: SAMPLE_TIME
  });
  const agentRegistry = createSeededAgentRegistry();
  const skillRegistry = createSeededSkillRegistry();
  const governance = new SkillGovernanceService();
  const agents = agentRegistry.listAgents();
  const skills = skillRegistry.listSkills();
  const consoleArtifacts = delivery.artifacts.map(toConsoleArtifact);
  const workflowStages = delivery.workflow.stages.map((stage) =>
    toConsoleWorkflowStage(stage, delivery.artifacts, governance)
  );
  const consoleAgents = agents.map((agent) =>
    toConsoleAgent(agent, consoleArtifacts, governance)
  );
  const consoleSkills = skills.map((skill) => toConsoleSkill(skill, governance));
  const pendingApprovals = delivery.approvals.filter((approval) => approval.status === "PENDING").length;
  const techSpecStage = workflowStages.find((stage) => stage.id === "tech-spec") ?? workflowStages[0];

  return {
    metrics: [
      {
        label: "Active Workflows",
        value: delivery.workflow.status === WorkflowStatus.RUNNING ? 1 : 0,
        detail: "Currently running workflow instances"
      },
      {
        label: "Completed Workflows",
        value: delivery.workflow.status === WorkflowStatus.COMPLETED ? 1 : 0,
        detail: "Finished delivery workflows"
      },
      {
        label: "Registered Agents",
        value: consoleAgents.length,
        detail: "Seeded APDOS agent registry"
      },
      {
        label: "Registered Skills",
        value: consoleSkills.length,
        detail: "Seeded skill registry versions"
      },
      {
        label: "Artifacts Generated",
        value: consoleArtifacts.length,
        detail: "Artifacts produced by the sample workflow"
      },
      {
        label: "Pending Approvals",
        value: pendingApprovals,
        detail: "Approval gates awaiting action"
      }
    ],
    workflow: {
      id: delivery.workflow.id,
      goal: delivery.workflow.goal,
      status: delivery.workflow.status,
      stages: workflowStages
    },
    workflows: [
      {
        id: delivery.workflow.id,
        goal: delivery.workflow.goal,
        status: delivery.workflow.status,
        stages: workflowStages
      }
    ],
    agents: consoleAgents,
    skills: consoleSkills,
    artifacts: consoleArtifacts,
    lineage: buildLineage(consoleArtifacts),
    runtimeMonitor: {
      activeWorkflow: delivery.workflow.id,
      activeStage: techSpecStage.name,
      activeAgent: techSpecStage.assignedAgent ?? "delivery-workflow",
      activeSkill: techSpecStage.executedSkills.at(-1) ?? "none"
    },
    pendingApprovals
  };
}

export async function getWorkflow(id: string) {
  const snapshot = await getPlatformSnapshot();
  return snapshot.workflows.find((workflow) => workflow.id === decodeURIComponent(id));
}

export async function getAgent(id: string) {
  const snapshot = await getPlatformSnapshot();
  return snapshot.agents.find((agent) => agent.id === decodeURIComponent(id));
}

export async function getSkill(id: string) {
  const snapshot = await getPlatformSnapshot();
  return snapshot.skills.find((skill) => skill.id === decodeURIComponent(id));
}

export async function getArtifact(id: string) {
  const snapshot = await getPlatformSnapshot();
  return snapshot.artifacts.find((artifact) => artifact.id === decodeURIComponent(id));
}

function toConsoleWorkflowStage(
  stage: WorkflowStage,
  artifacts: BaseArtifact[],
  governance: SkillGovernanceService
): ConsoleWorkflowStage {
  const stageArtifacts = artifacts.filter((artifact) => stage.artifactIds.includes(artifact.id));
  const governedSkills = governance.mapping.getSkillsForWorkflowStage(stage.id);
  const assignedAgent = governedSkills[0]?.ownerAgent ?? resolveOperationalAgent(stage.id);
  const executedSkills = [...new Set(stageArtifacts.flatMap(readSourceSkillIds))];

  return {
    id: stage.id,
    name: toTitle(stage.id),
    status: stage.status,
    assignedAgent,
    executedSkills,
    artifactIds: [...stage.artifactIds]
  };
}

function toConsoleAgent(
  agent: AgentDefinition,
  artifacts: ConsoleArtifact[],
  governance: SkillGovernanceService
): ConsoleAgent {
  const ownedSkills = governance.mapping.getSkillsForAgent(agent.id).map((skill) => skill.skillId);

  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    version: agent.version,
    status: agent.status,
    ownedSkills,
    generatedArtifacts: artifacts
      .filter((artifact) => artifact.sourceAgent === agent.id || artifact.createdBy === agent.id || artifact.createdBy === agent.name)
      .map((artifact) => artifact.id),
    inputArtifacts: [...agent.inputArtifacts],
    outputArtifacts: [...agent.outputArtifacts]
  };
}

function toConsoleSkill(skill: SkillDefinition, governance: SkillGovernanceService): ConsoleSkill {
  const metadata = governance.mapping.getSkill(skill.name);

  return {
    id: skill.id,
    name: skill.name,
    version: skill.version,
    status: skill.status,
    category: skill.category,
    description: skill.description,
    ownerAgent: metadata?.ownerAgent,
    workflowStage: metadata?.workflowStage,
    inputArtifacts: [...skill.inputArtifacts],
    outputArtifacts: [...skill.outputArtifacts],
    dependencies: metadata?.dependencies ?? skill.dependencies ?? [],
    executionOrder: metadata?.executionOrder
  };
}

function toConsoleArtifact(artifact: BaseArtifact): ConsoleArtifact {
  return {
    id: artifact.id,
    type: artifact.type,
    title: artifact.title,
    description: artifact.description,
    status: artifact.status,
    createdBy: artifact.createdBy,
    parentIds: [...artifact.parentIds],
    sourceAgent: typeof artifact.metadata.sourceAgent === "string" ? artifact.metadata.sourceAgent : undefined,
    sourceSkillIds: readSourceSkillIds(artifact)
  };
}

function buildLineage(artifacts: ConsoleArtifact[]): { nodes: ConsoleLineageNode[]; edges: ConsoleLineageEdge[] } {
  const wantedTypes = new Set<ArtifactType>([
    ArtifactType.IDEA,
    ArtifactType.DISCOVERY_REPORT,
    ArtifactType.PRD,
    ArtifactType.TECH_SPEC,
    ArtifactType.IMPLEMENTATION_PLAN
  ]);
  const nodes = artifacts
    .filter((artifact) => wantedTypes.has(artifact.type))
    .map((artifact) => ({
      id: artifact.id,
      label: artifact.type.replace(/_/g, " "),
      type: artifact.type
    }));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: ConsoleLineageEdge[] = [];

  for (const artifact of artifacts) {
    if (!nodeIds.has(artifact.id)) {
      continue;
    }

    for (const parentId of artifact.parentIds) {
      if (nodeIds.has(parentId)) {
        edges.push({
          id: `${parentId}->${artifact.id}`,
          source: parentId,
          target: artifact.id
        });
      }
    }
  }

  return { nodes, edges };
}

function readSourceSkillIds(artifact: BaseArtifact | ConsoleArtifact): string[] {
  if ("sourceSkillIds" in artifact) {
    return artifact.sourceSkillIds;
  }

  return Array.isArray(artifact.metadata.sourceSkillIds)
    ? artifact.metadata.sourceSkillIds.map(String)
    : [];
}

function resolveOperationalAgent(stageId: string): string {
  if (stageId === "approval") {
    return "approval-engine";
  }

  if (stageId === "release-package") {
    return "agent:release";
  }

  return "delivery-workflow";
}

function toTitle(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
