# Architecture Agent

The Architecture Agent turns a validated PRD and its delivery context into deterministic architecture artifacts.

## Architecture lifecycle

1. Delivery Workflow V1 completes Idea, Discovery, and PRD stages.
2. The Architecture Agent receives an Architecture Request containing `workflowId` and `prdArtifactId`.
3. The agent loads the PRD, its IDEA and DISCOVERY_REPORT parents, and Workflow Context.
4. Deterministic generation rules create a Technical Specification and Implementation Plan.
5. The agent registers a TECH_SPEC artifact and an IMPLEMENTATION_PLAN artifact.
6. Delivery Workflow V1 validates the TECH_SPEC before moving to validation evidence.

## Artifact relationships

The generated artifacts preserve architecture lineage:

- TECH_SPEC parent: PRD
- IMPLEMENTATION_PLAN parent: TECH_SPEC

Downstream implementation evidence can depend on both architecture artifacts while the release package still traces back to PRD, Discovery Report, and Idea.

## Future skill-runtime integration

This package intentionally does not call OpenAI, Anthropic, LangGraph, or real skill execution. The deterministic generation functions define the stable boundary for future architecture-writing and implementation-planning skills. A future runtime can replace the deterministic internals while keeping the same Architecture Request, contracts, artifact registration, context loading, and validation flow.
