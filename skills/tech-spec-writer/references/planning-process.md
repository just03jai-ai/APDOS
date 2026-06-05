# Planning process

Use this process before writing or updating HLD, LLD, or implementation-plan documents.

This process is adapted for FarMart docs from HumanLayer's interactive implementation planning workflow: read context first, research thoroughly, verify assumptions, present options, get alignment, then write the document.

## Initial response

When the user asks for an HLD, LLD, technical spec, or implementation plan:

1. Check whether the user provided a Jira key, ticket text, file path, PRD path, or existing workspace.
2. If a file path or ticket workspace was provided, immediately read those files fully.
3. If no context was provided, ask for:
   - Jira key or exploratory destination
   - task/ticket description
   - relevant PRD, research, codebase, designs, or links
   - constraints or known decisions

Do not write the final docs in the first response unless the user explicitly provided enough complete context and asked for a quick draft.

## Step 1: Context gathering and initial analysis

### Read mentioned files fully

Read all mentioned files immediately and completely:

- ticket workspace `README.md`
- `prd.md`
- existing `hld.md`, `lld.md`, `implementation-plan.md`
- `test-plan.md`
- `change-log.md`
- files under `research/`, `decisions/`, and `updates/`
- Jira exports or pasted ticket files
- JSON/data/API contract files
- designs or screenshots when available

Important rules:

- Do not read important context files partially.
- Do not spawn research subagents before reading the explicitly provided files yourself.
- Do not assume a stakeholder correction is true without checking available evidence.

### Research current reality

After reading provided context, research the actual codebase when relevant:

- locate related files
- understand current implementation and data flow
- identify similar patterns to follow
- find tests and examples
- find integration points and dependencies
- collect file:line references

Use parallel research tasks where useful, but keep each task focused.

Good research task prompts specify:

- exact repo/directory to inspect
- exact system/component to investigate
- expected output format
- file:line references required
- read-only behavior unless implementation is explicitly requested

### Verify understanding

Before drafting, present a concise understanding:

```markdown
Based on the PRD/ticket and code research, I understand we need to [summary].

I found:
- [current implementation detail with file:line]
- [pattern or constraint with file:line]
- [integration or risk]

Questions my research could not answer:
- [business/product decision]
- [technical tradeoff requiring owner input]
```

Only ask questions that cannot be answered from available docs/code.

## Step 2: Research and discovery

If the user corrects a misunderstanding:

1. Do not blindly accept the correction.
2. Read the referenced files/directories.
3. Re-run targeted research if needed.
4. Update the understanding only after verification.

Build a small planning checklist in the response or scratch notes:

- [ ] Read PRD and ticket hub
- [ ] Read existing design docs
- [ ] Inspect current implementation
- [ ] Find similar patterns
- [ ] Identify design options
- [ ] Resolve open questions
- [ ] Draft outline
- [ ] Write/update docs

## Step 3: Present options before finalizing design

For non-trivial work, present findings and options before writing final HLD/LLD:

```markdown
## Current state
- [key discovery]
- [constraint]

## Design options
1. Option A — pros/cons
2. Option B — pros/cons

## Recommendation
[recommended approach and why]

## Open questions
- [question]
```

Wait for alignment when the option materially affects architecture, contracts, data model, security, user behavior, rollout, or QA scope.

## Step 4: Outline before detailed writing

Before writing a large set of docs, propose the structure:

```markdown
I propose updating:

1. hld.md — [scope]
2. lld.md — [scope]
3. implementation-plan.md — [phases]

Implementation phases:
1. [phase] — [outcome]
2. [phase] — [outcome]
3. [phase] — [outcome]

Does this structure and sequencing look right?
```

For simple updates, this can be brief. For large changes, get explicit confirmation before writing full details.

## Step 5: Write or update docs

Write/update only the documents requested or required by the scope:

- `hld.md` for high-level architecture
- `lld.md` for detailed design contracts and behavior
- `implementation-plan.md` for phased execution

Keep HLD and LLD free from file-by-file implementation instructions. Put execution details in `implementation-plan.md`.

## Step 6: Review and iterate

After drafting:

1. Report document paths.
2. Summarize major design choices.
3. List unresolved questions.
4. List downstream docs that need updates, especially PRD or test plan.
5. Ask the user to review scope, correctness, and missing edge cases.

## Quality rules

- Be skeptical of vague requirements.
- Verify with code and docs.
- Include references for current-state claims.
- Separate design from implementation execution.
- Include explicit non-goals.
- Include risks and mitigations.
- Include rollout and rollback in the implementation plan.
- Do not leave open questions in an approved/final implementation plan.
- If open questions remain, mark document status as `draft` and make the blockers explicit.

## Success criteria for implementation-plan.md

Always separate:

### Automated verification

Examples:

- tests pass: `pnpm test`
- lint passes: `pnpm lint`
- build passes: `pnpm build`
- migration applies cleanly
- API contract test passes
- file exists or config is generated

### Manual verification

Examples:

- flow works in UI
- QA validates staged environment
- performance acceptable under real conditions
- stakeholder validates copy/behavior
- rollback path confirmed

Do not mix manual acceptance checks with automated commands.
