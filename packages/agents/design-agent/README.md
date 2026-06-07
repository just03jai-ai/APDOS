# APDOS Design Agent

The Design Agent converts discovery and product context into a prototype-ready `DESIGN_PACKAGE`.

## Execution Lifecycle

1. Load `DISCOVERY_REPORT` and `PRD` from the Artifact Registry.
2. Load an optional `TECH_SPEC` when Design is invoked after architecture context exists.
3. Resolve Design-stage skills through Skill Governance.
4. Execute the governed skill chain through `RuntimeSkillExecutor` and Skill Runtime.
5. Aggregate the skill execution evidence into one registered `DESIGN_PACKAGE`.

The delivery workflow runs Design before Architecture, so its required workflow inputs are Discovery Report and PRD. Standalone calls can add a Tech Spec for architecture-informed enrichment.

## Governed Skills

- `user-journey-designer`
- `user-flow-designer`
- `ia-designer`
- `wireframe-planner`
- `component-mapper`
- `prototype-planner`

The agent does not hardcode this list at execution time. It resolves all skills assigned to the `design` workflow stage.

## Artifact Lineage

The final package records supplied source artifacts as parents and preserves `sourceAgent`, `sourceSkillIds`, `workflowId`, and `stageId` metadata.
