import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ArtifactType } from "@apdos/artifacts";
import {
  AgentRegistry,
  createSeededAgentRegistry,
  discoveryAnalysisCapability,
  productRequirementsCapability,
  type AgentDefinition
} from "../src/index.js";

function buildAgent(overrides: Partial<AgentDefinition> = {}): AgentDefinition {
  return {
    id: "agent:test",
    name: "TestAgent",
    description: "Test agent definition.",
    version: "0.1.0",
    status: "available",
    capabilities: [discoveryAnalysisCapability],
    inputArtifacts: [ArtifactType.IDEA],
    outputArtifacts: [ArtifactType.DISCOVERY_REPORT],
    requiredSkills: ["test-skill"],
    executionConstraints: {
      maxConcurrentRuns: 1,
      requiresHumanApproval: false
    },
    ...overrides
  };
}

describe("AgentRegistry", () => {
  it("registers agents", () => {
    const registry = new AgentRegistry();
    const agent = buildAgent();

    registry.registerAgent(agent);

    assert.equal(registry.listAgents().length, 1);
    assert.equal(registry.listAgents()[0].id, agent.id);
  });

  it("rejects duplicate agent ids", () => {
    const registry = new AgentRegistry();
    const agent = buildAgent();

    registry.registerAgent(agent);

    assert.throws(
      () => registry.registerAgent(agent),
      /Agent already exists: agent:test/
    );
  });

  it("retrieves and unregisters agents", () => {
    const registry = new AgentRegistry();
    const agent = buildAgent();

    registry.registerAgent(agent);

    assert.deepEqual(registry.getAgent(agent.id), agent);
    assert.equal(registry.unregisterAgent(agent.id), true);
    assert.equal(registry.getAgent(agent.id), undefined);
  });

  it("filters agents by capability", () => {
    const registry = new AgentRegistry([
      buildAgent({ id: "agent:discovery", capabilities: [discoveryAnalysisCapability] }),
      buildAgent({
        id: "agent:product",
        capabilities: [productRequirementsCapability],
        inputArtifacts: [ArtifactType.DISCOVERY_REPORT],
        outputArtifacts: [ArtifactType.PRD]
      })
    ]);

    const agents = registry.findAgentsByCapability(productRequirementsCapability.id);

    assert.deepEqual(
      agents.map((agent) => agent.id),
      ["agent:product"]
    );
  });

  it("filters agents by input artifact", () => {
    const registry = createSeededAgentRegistry();

    const agents = registry.findAgentsByInputArtifact(ArtifactType.PRD);

    assert.deepEqual(
      agents.map((agent) => agent.name),
      ["ArchitectureAgent", "EngineeringAgent", "GovernanceAgent", "ReleaseAgent"]
    );
  });

  it("filters agents by output artifact", () => {
    const registry = createSeededAgentRegistry();

    const agents = registry.findAgentsByOutputArtifact(ArtifactType.RELEASE_PACKAGE);

    assert.deepEqual(
      agents.map((agent) => agent.name),
      ["ReleaseAgent"]
    );
  });

  it("seeds the initial APDOS agent definitions", () => {
    const registry = createSeededAgentRegistry();

    assert.deepEqual(
      registry.listAgents().map((agent) => agent.name),
      [
        "DiscoveryAgent",
        "ProductAgent",
        "ArchitectureAgent",
        "EngineeringAgent",
        "GovernanceAgent",
        "ReleaseAgent"
      ]
    );
  });
});
