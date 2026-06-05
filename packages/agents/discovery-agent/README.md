# APDOS Discovery Agent

The Discovery Agent replaces the mocked Delivery Workflow discovery stage with a deterministic APDOS agent implementation.

It converts a business goal and relevant context IDs into a structured discovery report, then produces a `DISCOVERY_REPORT` artifact.

## Discovery Lifecycle

1. Receive a `DiscoveryRequest`.
2. Validate `goal`, `workflowId`, and `contextIds`.
3. Optionally retrieve workflow context through the Context Engine.
4. Optionally confirm the workflow exists through the Workflow Engine.
5. Analyze the goal with deterministic rules.
6. Generate a `DiscoveryReport`.
7. Create a `DISCOVERY_REPORT` artifact through the Artifact Engine.

## Request Contract

```ts
interface DiscoveryRequest {
  goal: string;
  workflowId: string;
  contextIds: string[];
}
```

## Report Structure

```ts
interface DiscoveryReport {
  problemSummary: string;
  affectedSystems: string[];
  repositories: string[];
  dependencies: string[];
  risks: string[];
  openQuestions: string[];
  recommendedNextSteps: string[];
}
```

The report is stored in the artifact metadata under `metadata.report`.

## Delivery Workflow Integration

Delivery Workflow V1 now calls `DiscoveryAgentService.generateDiscoveryReport()` for the Discovery stage. The resulting `DISCOVERY_REPORT` artifact is linked to the `IDEA` artifact as its parent and is used by later PRD generation.

## Future Skill Integration

The current implementation uses deterministic analysis rules only. Future versions can load APDOS skills such as:

- `repo-router`
- `codebase-research`
- `knowledge`

Those skills should enrich the same report contract without changing the artifact output shape.

## Boundaries

This package does not implement:

- OpenAI
- Anthropic
- LangGraph
- real repository scanning
- LLM validation
