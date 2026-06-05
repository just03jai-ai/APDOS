# APDOS

APDOS is the AI Product Delivery Operating System. It turns business goals into governed delivery workflows using deterministic agents, artifact lineage, approvals, validation, skill execution, and organizational memory.

The current implementation is a TypeScript monorepo focused on deterministic runtime behavior. It does not call OpenAI, Anthropic, vector databases, or external prompt execution services.

## Capabilities

- Artifact Engine for typed delivery artifacts, registry operations, lineage, and event history
- Workflow Engine for deterministic workflow definitions, instances, transitions, and stage history
- Approval Engine for human approval gates and workflow blocking
- Validation Engine for artifact validation rules and governance findings
- Context Engine for retrieving workflow, artifact, approval, agent, and skill context
- Knowledge Engine for deterministic graph memory, decisions, outcomes, and project history
- Agent Registry for APDOS agent definitions and capabilities
- Discovery Agent and Architecture Agent deterministic services
- Skill Registry, Skill Runtime, Skill Adapter, and Skill Governance for loading, executing, mapping, and recommending registered skills
- Delivery Workflow for end-to-end APDOS delivery orchestration

## Repository Layout

```text
APDOS/
├── apps/
├── config/
│   └── skills.config.json
├── docs/
├── packages/
│   ├── agents/
│   ├── core/
│   ├── governance/
│   ├── skills/
│   └── workflows/
├── skills/
├── tooling/
├── package.json
├── package-lock.json
└── pnpm-workspace.yaml
```

## Package Layers

### Core

```text
packages/core/artifacts
packages/core/context-engine
packages/core/knowledge-engine
packages/core/orchestrator
packages/core/workflow-engine
```

Core packages provide the APDOS primitives used by agents, governance, skills, and workflows.

### Governance

```text
packages/governance/approval-engine
packages/governance/validation-engine
```

Governance packages enforce approval gates and deterministic artifact validation.

### Agents

```text
packages/agents/agent-registry
packages/agents/discovery-agent
packages/agents/architecture-agent
packages/agents/product-agent
```

Agent packages contain registry definitions and deterministic agent services. The Product Agent package is currently scaffolded/incomplete compared with Discovery and Architecture.

### Skills

```text
packages/skills/skill-registry
packages/skills/skill-runtime
packages/skills/skill-adapter
packages/skills/skill-governance
```

Skill packages discover external skills, register them, resolve versions, map ownership and workflow usage, validate dependencies, recommend next steps, and execute deterministic mock skill runs.

### Workflows

```text
packages/workflows/delivery-workflow
```

Workflow packages compose engines and agents into larger delivery flows.

## Skills

Repo-local skills live in:

```text
skills/
```

The default configuration is:

```json
{
  "sources": [
    {
      "id": "local-skills",
      "type": "filesystem",
      "path": "./skills",
      "enabled": true
    }
  ]
}
```

Run skill synchronization with:

```bash
pnpm skills:sync
```

Expected current result:

```text
Discovered: 17
Registered: 17
Skipped: 0
Errors: 0
```

## Development

Install dependencies:

```bash
npm install
```

Run all tests:

```bash
npm test
```

Run Skill Adapter sync:

```bash
pnpm skills:sync
```

Run a single workspace test:

```bash
npm test --workspace @apdos/skill-adapter
```

## Current Runtime Model

APDOS currently uses deterministic in-memory services:

- no LLM provider integration
- no vector database
- no persistent production database
- no external approval identity provider
- no deployment runtime under `apps/` yet

This keeps the platform predictable while the core contracts, agents, skills, workflows, and governance layers mature.

## Documentation

Additional design notes and reviews live in:

```text
docs/
```

External skill documentation lives under each skill folder in:

```text
skills/<skill-id>/
```
