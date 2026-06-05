# Engineering Agent

The APDOS Engineering Agent owns engineering-stage execution. It consumes product and architecture artifacts, resolves governed engineering skills, executes them through Skill Runtime, and registers `CODE_CHANGE` plus aggregate `ENGINEERING_PACKAGE` artifacts.

## Responsibilities

- Validate implementation context.
- Load required `PRD`, `TECH_SPEC`, and `IMPLEMENTATION_PLAN` artifacts.
- Resolve engineering-stage skills from Skill Governance.
- Execute skills through `RuntimeSkillExecutor` and `SkillRuntimeService`.
- Preserve lineage from input artifacts to generated code-change artifacts.
- Aggregate generated code changes into an `ENGINEERING_PACKAGE`.

## Current Skills

The default governance map resolves these engineering-stage skills:

- `backend-contributor`
- `frontend-contributor`
- `mono-web-contributor`
- `crons-contributor`
- `data-science-monorepo-contributor`

## Non-Goals

- Real code generation.
- Repository writes.
- Pull request creation.
- LLM execution.

The current implementation uses deterministic Skill Runtime execution, consistent with the rest of APDOS.
