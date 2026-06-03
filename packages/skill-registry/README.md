# APDOS Skill Registry

The Skill Registry is the source of truth for reusable APDOS skills.

In APDOS:

- Agent = worker
- Skill = capability pack

Agents do not hardcode expertise. They discover and load skills from this registry, then use those definitions to determine whether they can perform a specific artifact transformation.

## Skill Lifecycle

A skill starts as a definition with:

- `id`
- `name`
- `description`
- `version`
- `category`
- `status`
- `inputArtifacts`
- `outputArtifacts`
- `templates`
- `rules`
- `constraints`

The registry stores definitions only. It does not execute prompts, call AI providers, or run graph workflows.

Typical lifecycle:

1. Define the skill contract and supported artifact transformation.
2. Register the skill in `SkillRegistry`.
3. Let agents query available skills by category, input artifact, or output artifact.
4. Deprecate old definitions by changing `status` when a newer version replaces them.

## Versioning

Skills are versioned by stable name plus version:

- `prd-writer@1.0`
- `prd-writer@2.0`

Both versions can exist in the registry at the same time. Agents can call `listSkillVersions("prd-writer")` to inspect version history or `getSkillVersion("prd-writer", "2.0")` to select a specific version.

## How Agents Load Skills

Agents use the registry as a discovery layer:

- `findSkillsByCategory()` finds skills in a capability area.
- `findSkillsByInputArtifact()` finds skills that can consume a known artifact.
- `findSkillsByOutputArtifact()` finds skills that can produce a required artifact.
- `getSkill()` loads a specific skill definition by id.

For example, an agent that needs to transform a `DISCOVERY_REPORT` into a `PRD` can query for skills that output `PRD`, then inspect versions, templates, rules, and constraints before selecting `prd-writer@2.0`.

## Boundaries

This package intentionally does not implement:

- AI execution
- prompt execution
- LangGraph
- OpenAI
- Anthropic
