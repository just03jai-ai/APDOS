# Skill Governance

The APDOS Skill Governance Layer maps skills to the agents, workflow stages, artifacts, and dependencies that control deterministic skill execution.

It answers three operational questions:

- which agent owns a skill
- which workflow stage should use a skill
- which skill should run next based on artifacts and completed dependencies

## Lifecycle

Skills move through a deterministic governance lifecycle:

```text
discovered -> registered -> governed -> recommended -> executed
```

The Skill Adapter discovers external `SKILL.md` files and registers them into the Skill Registry. The Skill Governance Layer adds execution metadata on top of registered skills:

- `ownerAgent`
- `workflowStage`
- `inputArtifacts`
- `outputArtifacts`
- `dependencies`
- `executionOrder`
- `enabled`

This keeps governance separate from skill loading. A skill can exist in the registry without being enabled for workflow execution.

## Workflow Ownership

Default APDOS mappings cover the 17 imported skills:

```text
repo-router
knowledge
codebase-research
prd-writer
tech-spec-writer
implement-plan
design-system
backend-contributor
frontend-contributor
mono-web-contributor
crons-contributor
data-science-monorepo-contributor
ai-data-analyst
test-plan-writer
git-guardian
conventions
chronolog-logging
```

Skills are mapped to APDOS agents:

```text
agent:discovery
agent:product
agent:architecture
agent:engineering
agent:governance
agent:release
```

Skills are also mapped to workflow stages:

```text
idea
discovery
prd
tech-spec
engineering
validation
approval
release-package
```

## Dependency Management

Dependencies are modeled as skill-to-skill edges. For example:

```text
prd-writer -> tech-spec-writer -> implement-plan -> test-plan-writer -> git-guardian
```

The dependency graph supports:

- `buildSkillGraph()`
- `validateDependencies()`

Validation reports:

- missing dependencies
- disabled dependencies
- dependency cycles

## Services

Use `SkillMappingService` for direct lookups:

```ts
const service = new SkillMappingService();

service.getSkillsForAgent("agent:architecture");
service.getSkillsForWorkflowStage("tech-spec");
service.getSkillDependencies("frontend-contributor");
```

Use `SkillRecommendationService` for deterministic next-step routing:

```ts
const service = new SkillRecommendationService();

const skill = service.recommendNextSkill({
  workflowStage: "prd",
  availableArtifacts: ["DISCOVERY_REPORT"],
  completedSkills: ["repo-router", "knowledge", "codebase-research"]
});
```

Use `SkillGovernanceService` when a caller wants mapping, graph, and recommendation services from one entry point.

## Current Limits

The layer is deterministic and in-memory. It does not yet persist governance policy, enforce runtime permissions, or infer mappings with an LLM.
