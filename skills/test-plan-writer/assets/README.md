# Test plan assets

| Asset | Purpose |
| ----- | ------- |
| [`knowledge/dumps/`](knowledge/dumps/) | **Historical QA reference data** — consult only subfolders/files that clearly match the current feature, module, or ticket |

This skill folder has **no** required spreadsheet dependency for normal use.

## Agent workflow

1. Read ticket `prd.md`, `hld.md`, `lld.md`, and other ticket docs first when available.
2. Use `assets/knowledge/dumps/` selectively as historical reference material — do **not** read every CSV by default.
3. When using `knowledge/dumps/`, start with the most relevant subfolder(s) only and prefer summary files such as `index.csv`, `scenarios.csv`, or `rtm.csv` before detailed testcase dumps.
4. Analyze the user’s local project / codebase when relevant.
5. Write `docs/tickets/<JIRA-KEY>-<slug>/test-plan.md` with the 14-column local markdown test case table (**always**).

**Do not** add generator scripts, `requirements.txt`, or extra export tooling to the user’s repos unless they explicitly ask for an additional local artifact. Default handoff is the local markdown table in `test-plan.md`.

Format rules: [`../references/test-case-sheet-format.md`](../references/test-case-sheet-format.md)
