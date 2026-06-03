# APDOS Agent Registry

The Agent Registry is the source of truth for agents available to APDOS. It stores agent definitions, capabilities, supported artifact inputs and outputs, required skills, and execution constraints.

The registry is definition-only. It does not execute agents, call AI providers, or own workflow orchestration logic.

## Why The Registry Exists

APDOS is artifact-centric: workflow stages move work forward by producing and consuming typed artifacts. The Executive Orchestrator can already create deterministic workflow plans, but it needs a stable place to discover which agents can satisfy each stage.

The Agent Registry provides that lookup layer. It lets the platform answer questions such as:

- Which agents are available?
- Which agent can produce a `PRD`?
- Which agent accepts a `TECH_SPEC` as input?
- Which capabilities and skills does an agent require?
- Which execution constraints apply before scheduling the agent?

## How The Orchestrator Will Use It

For each workflow stage, the orchestrator can inspect the stage's required artifacts and agent responsibilities, then query the registry:

- `findAgentsByCapability()` to match a stage capability.
- `findAgentsByInputArtifact()` to find agents that can consume an existing artifact.
- `findAgentsByOutputArtifact()` to find agents that can produce the next required artifact.
- `getAgent()` to inspect skills, supported artifacts, status, and constraints before selection.

This allows the orchestrator to determine which registered agent definitions can perform a specific stage without coupling workflow planning to hardcoded agent implementations.

## Seed Agents

The package seeds five initial definition-only agents:

- `DiscoveryAgent`
- `ProductAgent`
- `ArchitectureAgent`
- `GovernanceAgent`
- `ReleaseAgent`

Use `createSeededAgentRegistry()` to create an in-memory registry with these definitions.

## Adding Future Agents

Add future agents by creating an `AgentDefinition` with:

- stable `id`, `name`, `description`, `version`, and `status`
- one or more `capabilities`
- supported `inputArtifacts`
- supported `outputArtifacts`
- `requiredSkills`
- `executionConstraints`

Then register it with `registerAgent()` or add it to the seed list if it should be available by default.
