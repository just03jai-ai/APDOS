# APDOS Governance Agent

The Governance Agent converts delivery artifacts into approval-ready governance packages.

## Execution Lifecycle

1. Load `PRD`, `TECH_SPEC`, `IMPLEMENTATION_PLAN`, `ENGINEERING_PACKAGE`, and `QA_PACKAGE` from Artifact Registry.
2. Resolve Governance-stage skills through Skill Governance.
3. Execute `git-guardian`, `conventions`, and `ai-data-analyst` through Runtime Skill Executor.
4. Preserve generated governance finding lineage.
5. Register a `GOVERNANCE_PACKAGE` with a `GO`, `CONDITIONAL_GO`, or `NO_GO` decision.

## Decision Evidence

Decisions are derived from structured runtime findings:

- `GO`: no blocking evidence, review findings, or open questions.
- `CONDITIONAL_GO`: runtime evidence has `requiresReview: true` or an `openQuestion`.
- `NO_GO`: runtime evidence has `blocking: true`, `outcome: "failed"`, or a non-deterministic error finding.

Each normalized governance finding retains only its generating skill as `sourceSkillIds`.
Findings expose `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` severity.
Delivery Workflow fails the Governance stage on `NO_GO`. A `CONDITIONAL_GO` blocks the Governance stage and creates a pending approval.

## Governance Package

`GOVERNANCE_PACKAGE` contains:

- risk assessment
- security review
- compliance review
- dependency risks
- architecture concerns
- quality findings
- open questions
- approval checklist
- recommendations
- decision
