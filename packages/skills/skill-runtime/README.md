# APDOS Skill Runtime

The Skill Runtime loads registered APDOS skills, resolves requested versions, and executes them through a deterministic runtime contract.

This package intentionally does not call OpenAI, Anthropic, or any real prompt engine. Execution currently uses deterministic mock output so agents can integrate against stable contracts before LLM-backed execution exists.

## Runtime Lifecycle

1. An agent requests a skill by name and version, for example `prd-writer@2.0` or `skillId: "prd-writer", version: "2.0"`.
2. `SkillRuntimeService.resolveVersion()` resolves the exact skill definition from `@apdos/skill-registry`.
3. `SkillRuntimeService.loadSkill()` returns the registered skill definition, including templates, rules, constraints, input artifacts, and output artifacts.
4. `SkillRuntimeService.executeSkill()` validates the execution request and delegates to the deterministic executor.
5. The executor returns a `SkillResult` with generated artifacts, rule-derived findings, and execution metadata.

## Execution Contract

Skill execution requests contain:

- `skillId`
- `version`
- `inputArtifacts`
- `context`

Skill results contain:

- `artifacts`
- `findings`
- `metadata`

## Agent Interaction

Agents should receive a `SkillRuntimeService` dependency and request execution when they need registered skill behavior:

```ts
const result = await skillRuntime.executeSkill({
  skillId: "prd-writer",
  version: "2.0",
  inputArtifacts: [discoveryArtifact],
  context: {
    workflowId: "workflow-1",
    agentId: "product-agent",
    stageId: "PRD"
  }
});
```

The same flow applies to Discovery, Product, and Architecture agents:

- Discovery Agent can execute `codebase-research@1.0` or `knowledge@1.0` before deterministic discovery analysis.
- Product Agent can execute `prd-writer@1.0` or `prd-writer@2.0` to produce PRD artifacts.
- Architecture Agent can execute `tech-spec-writer@1.0` to produce technical specification artifacts.

## Future LLM Integration

LLM-backed execution should be added behind the `SkillExecutor` interface. The agent-facing contract should remain stable:

- keep `SkillExecutionRequest` as the input boundary;
- keep `SkillResult` as the output boundary;
- use registry templates, rules, and constraints to build prompts;
- record provider, model, prompt version, and token metadata in `SkillResult.metadata`;
- preserve deterministic tests by keeping `DeterministicSkillExecutor` available for unit tests and local workflows.
