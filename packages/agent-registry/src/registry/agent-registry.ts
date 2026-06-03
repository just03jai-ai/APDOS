import type { ArtifactType } from "@apdos/artifacts";
import type { AgentDefinition } from "../contracts/agent-definition.js";

export class AgentRegistry {
  private agents = new Map<string, AgentDefinition>();

  constructor(initialAgents: readonly AgentDefinition[] = []) {
    for (const agent of initialAgents) {
      this.registerAgent(agent);
    }
  }

  registerAgent(agent: AgentDefinition): AgentDefinition {
    validateAgentDefinition(agent);

    if (this.agents.has(agent.id)) {
      throw new Error(`Agent already exists: ${agent.id}`);
    }

    this.agents.set(agent.id, cloneAgentDefinition(agent));
    return cloneAgentDefinition(agent);
  }

  unregisterAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  getAgent(agentId: string): AgentDefinition | undefined {
    const agent = this.agents.get(agentId);
    return agent ? cloneAgentDefinition(agent) : undefined;
  }

  listAgents(): AgentDefinition[] {
    return Array.from(this.agents.values()).map(cloneAgentDefinition);
  }

  findAgentsByCapability(capabilityId: string): AgentDefinition[] {
    return this.listAgents().filter((agent) =>
      agent.capabilities.some((capability) => capability.id === capabilityId)
    );
  }

  findAgentsByInputArtifact(artifactType: ArtifactType): AgentDefinition[] {
    return this.listAgents().filter((agent) =>
      agent.inputArtifacts.includes(artifactType)
    );
  }

  findAgentsByOutputArtifact(artifactType: ArtifactType): AgentDefinition[] {
    return this.listAgents().filter((agent) =>
      agent.outputArtifacts.includes(artifactType)
    );
  }
}

function validateAgentDefinition(agent: AgentDefinition): void {
  if (!agent.id.trim()) {
    throw new Error("Agent id is required");
  }

  if (!agent.name.trim()) {
    throw new Error("Agent name is required");
  }

  if (!agent.version.trim()) {
    throw new Error("Agent version is required");
  }

  if (agent.capabilities.length === 0) {
    throw new Error(`Agent must define at least one capability: ${agent.id}`);
  }
}

function cloneAgentDefinition(agent: AgentDefinition): AgentDefinition {
  return {
    ...agent,
    capabilities: agent.capabilities.map((capability) => ({ ...capability })),
    inputArtifacts: [...agent.inputArtifacts],
    outputArtifacts: [...agent.outputArtifacts],
    requiredSkills: [...agent.requiredSkills],
    executionConstraints: { ...agent.executionConstraints }
  };
}
