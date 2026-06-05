# QA Agent

The APDOS QA Agent owns QA-stage execution. It consumes product, architecture, and engineering artifacts, resolves governed QA skills, executes them through Skill Runtime, and registers validation-ready `QA_PACKAGE` artifacts.

## Responsibilities

- Validate QA context.
- Load required `PRD`, `TECH_SPEC`, `IMPLEMENTATION_PLAN`, and `ENGINEERING_PACKAGE` artifacts.
- Resolve QA-stage skills from Skill Governance.
- Execute skills through `RuntimeSkillExecutor` and `SkillRuntimeService`.
- Register QA evidence artifacts and an aggregate `QA_PACKAGE`.
- Preserve lineage from input artifacts and QA evidence to the QA package.

## Current Skills

The default governance map resolves these QA-stage skills:

- `test-plan-writer`
- `ai-data-analyst`

## Non-Goals

- Real browser automation.
- Real repository test execution.
- LLM execution.
- External QA system integration.

The current implementation uses deterministic Skill Runtime execution, consistent with the rest of APDOS.
