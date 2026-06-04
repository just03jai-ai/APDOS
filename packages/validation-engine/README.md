# APDOS Validation Engine

The Validation Engine determines whether an artifact is ready for approval or workflow progression. APDOS workflows should not progress only because an artifact exists; the artifact must satisfy deterministic rules first.

## What It Validates

Validation results include:

- `artifactId`
- `artifactType`
- `valid`
- `score`
- `findings`

Findings include:

- `severity`
- `message`
- `ruleId`

## Validator Registry

`ValidatorRegistry` is the source of truth for artifact validators.

It supports:

- `registerValidator()`
- `getValidator()`
- `validateArtifact()`

Validators are keyed by artifact type. Duplicate validator registration is rejected.

## Built-In Validators

The package includes deterministic validators for:

- `PRD`
- `TECH_SPEC`
- `RELEASE_PACKAGE`

The built-ins are definitions of validation behavior only. They do not run AI, call LLMs, or infer missing content.

## Rule Engine

The rule engine supports:

- required artifact fields
- artifact dependency checks
- approval requirement checks

Rules return findings. The validation score starts at 100 and is reduced by deterministic severity penalties.

## Workflow Usage

Before a workflow stage advances, APDOS can call:

```ts
const result = registry.validateArtifact(artifact, {
  artifacts,
  approvals
});

if (!result.valid) {
  // block progression or request remediation
}
```

## Boundaries

This package does not implement:

- AI reasoning
- LLM validation
- OpenAI
- Anthropic
- workflow progression
- approval creation
