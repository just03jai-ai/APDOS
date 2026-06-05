---
name: fmt-codebase-research
description: Research and document FarMart codebases as-is with concrete file references. Use when the user needs current-state codebase understanding, architecture discovery, implementation mapping, historical context, or research notes for a Jira ticket workspace or exploratory docs workspace.
metadata:
  short-description: Research codebase current state
---

# Codebase Research

Research and document what exists in FarMart codebases. This skill creates factual current-state research that supports PRDs, HLDs, LLDs, implementation plans, test plans, or exploratory thoughts.

## Critical Rule: Document Only

Unless the user explicitly asks for critique or recommendations:

- Do not suggest improvements.
- Do not propose refactors.
- Do not perform root-cause analysis.
- Do not recommend future enhancements.
- Do not judge whether the implementation is good or bad.
- Describe what exists, where it exists, how it works, and how pieces connect.

## When to Use

Use this skill when the user asks to:

- understand how a codebase area works
- map current implementation before writing HLD/LLD/implementation-plan
- research existing behavior for a Jira ticket
- document current architecture or data flow
- find examples of patterns already used
- gather evidence with file:line references
- create research notes under `docs/tickets/<JIRA-KEY>-slug/research/` or `docs/thoughts/{name}/research/`

## Output Location

### Jira-linked research

If a Jira key is provided or the research supports an existing ticket workspace, save under:

```text
docs/tickets/<JIRA-KEY>-<slug>/research/YYYY-MM-DD-topic-<name>.md
```

Also link the research from the ticket workspace when useful.

### Exploratory research

If no Jira key exists, ask whether to save exploratory research under:

```text
docs/thoughts/<name>/research/YYYY-MM-DD-topic.md
```

Resolve `name` from `docs/.env`, not from the active git branch:

```bash
cd docs
test -f .env || cp .env.example .env
grep '^name=' .env
```

For intentionally shared exploratory research, use:

```text
docs/thoughts/shared/research/YYYY-MM-DD-topic.md
```

## Docs Repo Workflow Awareness

Before writing research into the docs repo:

1. Read `docs/readme.md`, `docs/tickets/README.md`, `docs/thoughts/README.md`, and `docs/contributors.md` when present.
2. For Jira-linked research, use the shared docs ticket branch:
   ```text
   docs/<JIRA-KEY>-<short-kebab-slug>
   ```
3. Pull latest before reading or writing ticket research:
   ```bash
   git fetch origin
   git checkout docs/<JIRA-KEY>-<short-kebab-slug>
   git pull --rebase origin docs/<JIRA-KEY>-<short-kebab-slug>
   ```
4. For exploratory research, use the contributor workspace from `docs/.env`.
5. Do not commit or push unless the user explicitly asks or confirms. If not committing, report exact commit/push commands.

## Process

### Phase 1: Intake

If the user gave no specific research question, ask for:

- research question or area
- target repo(s)
- Jira key or exploratory destination
- relevant files, PRD/HLD/LLD/plan/test-plan links
- whether they want documentation only or recommendations too

If files are mentioned, read them fully before spawning research tasks.

### Phase 2: Context Gathering

1. Read directly mentioned files fully.
2. Read relevant ticket workspace docs if Jira-linked:
   - `README.md`
   - `prd.md`
   - `hld.md`
   - `lld.md`
   - `implementation-plan.md`
   - `test-plan.md`
   - `change-log.md`
   - relevant `decisions/` and `updates/`
3. Identify repositories and directories to inspect.
4. Break the research question into focused sub-questions.

### Phase 3: Parallel Research

Use parallel research tasks when helpful:

- Locate relevant files and components.
- Analyze how current implementation works.
- Find similar patterns and examples.
- Find tests and fixtures.
- Search existing docs under `docs/tickets/` and `docs/thoughts/` for historical context.

Research task instructions should request:

- concrete file paths
- file:line references
- current behavior only
- no recommendations unless requested
- clear separation between code facts and historical docs

Wait for all research tasks before synthesizing.

### Phase 4: Synthesis

Synthesize findings using this priority order:

1. Live codebase behavior
2. Tests and fixtures
3. Runtime config/scripts
4. Ticket workspace docs
5. Historical thoughts/research
6. External docs only if explicitly requested

Include:

- answer to the user's research question
- current architecture and flow
- important files and responsibilities
- file:line references
- integration points
- tests/examples
- historical context if relevant
- open areas needing further investigation

Do not mix recommendations into current-state findings.

### Phase 5: Document Generation

Gather metadata before writing:

```bash
cd docs && git branch --show-current && git rev-parse --short HEAD && git remote get-url origin
# For each involved code repo:
git branch --show-current && git rev-parse --short HEAD && git remote get-url origin
```

Research document template:

```markdown
---
date: [ISO datetime with timezone]
created_at: YYYY-MM-DD::HH-MM
created_by: [Researcher]
updated_at: YYYY-MM-DD::HH-MM
updated_by: [Researcher]
researcher: [Researcher]
topic: "[User's question]"
ticket: [JIRA-KEY or TBD]
status: complete
sources:
  - repository: docs
    branch: [Branch]
    commit: [Commit]
    remote: [Remote]
  - repository: [Repo]
    branch: [Branch]
    commit: [Commit]
    remote: [Remote]
tags:
  - research
---

# Research: [Topic]

## Research question

[Original user query]

## Summary

[Concise answer]

## Current state

[What exists today]

## Detailed findings

### [Area]

- [Finding with file:line]

## Code references

- `path/to/file.ext:123` — [why it matters]

## Tests and examples

- `path/to/test.ext:45` — [coverage/example]

## Architecture notes

[Current patterns and flows]

## Historical context

[Relevant docs/tickets or docs/thoughts links]

## Open areas for further investigation

- [Unknown]
```

## Follow-up Research

When answering follow-up questions:

1. Re-read the existing research doc.
2. Add a new section:
   ```markdown
   ## Follow-up research: YYYY-MM-DD HH:mm
   ```
3. Update frontmatter `updated_at`, `updated_by`, and optionally `last_updated_note`.
4. Keep prior findings intact unless they are factually superseded; if superseded, explain why.

## Integration With Other Skills

- Use this research as input to `fmt-prd-writer`, `fmt-tech-spec-writer`, `fmt-test-plan-writer`, and `fmt-implement-plan`.
- If the research reveals design-changing facts, do not silently update HLD/LLD/plan; call out that `fmt-tech-spec-writer` should update canonical docs.
- If the research reveals QA-relevant behavior, call out that `fmt-test-plan-writer` may need to update `test-plan.md`.
- If the research is tied to implementation, link it from `implementation-plan.md` references.

## Quality Rules

- Read mentioned files before spawning tasks.
- Wait for all research tasks before synthesizing.
- Include file:line references for important claims.
- Separate live code facts from historical docs.
- Do not write placeholder metadata.
- Do not infer contributor identity from branch name.
- Do not save Jira-linked research into personal thoughts folders.
- Do not commit or push unless explicitly asked.

## Final Response Expectations

When reporting back:

- Provide research document path if one was written.
- Summarize the answer in bullets.
- List key file references.
- Mention repos/branches/commits researched.
- State whether recommendations were intentionally omitted.
- List follow-up questions or areas requiring deeper investigation.

---

**Version**: 2.0.0
**Last Updated**: 2026-05-09
**Maintainer**: FarMart Engineering
