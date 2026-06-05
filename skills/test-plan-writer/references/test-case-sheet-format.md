# Test Cases Local Table Format

This file is the canonical format reference for this skill.

**Default:** write test cases directly in `test-plan.md` using the 14-column markdown table below. Keep test cases local to the ticket workspace. Do not require any external spreadsheet link or workbook viewer for the default workflow.

## Deliverable

| Output | Path | When |
| ------ | ---- | ---- |
| Test plan (required) | `docs/tickets/<JIRA-KEY>-<slug>/test-plan.md` | Always |
| Local companion export (optional) | `docs/tickets/<JIRA-KEY>-<slug>/test-cases.csv` or another ticket-local file | Only if the user explicitly asks |

The **Test cases** section must contain the full 14-column markdown table. Do not add Python scripts, generators, or spreadsheet tooling unless the user explicitly requests an additional local export artifact.

## Column specification

| Column | Required on create | Content rules |
| ------ | ------------------ | ------------- |
| **Test Case ID** | Yes | Stable ID: `TC-001`, `TC-002`, … Preserve IDs when updating. |
| **Test Scenario** | Yes | Short scenario / flow name. Reuse across related rows. |
| **Platform** | Yes | Allowed local value or plan-wide `N/A`. |
| **Module** | Yes | Feature area, screen, service, or API surface. |
| **Test Case Description** | Yes | `Preconditions: …` then `Steps: 1. …` and `Test data: …`. In markdown use `<br>` between lines. |
| **Severity** | Yes | `S0`, `S1`, or `S2`. |
| **Test Type** | Yes | Allowed local value. |
| **Positive / Negative** | Yes | `Positive` or `Negative`. |
| **Expected Result** | Yes | Observable, measurable outcome. |
| **Action Performed By** | Yes | Allowed local value. |
| **Status** | Yes | `Not Executed` on create. |
| **Developer Assigned** | Yes | `Yatender` or `N/A`. |
| **Developer Test CheckList** | Yes | Text or `N/A`. |
| **Comments** | Yes | Notes or `N/A`. |

## Allowed values

Use **only** these values (plus plan-wide or row-level `N/A` where allowed).

### Platform

- `FMT Pro`, `FarMartOS`, `FarMartApp`, `Saudabook App`, or plan-wide `N/A`

### Severity

- `S0`, `S1`, `S2` (not `P0` / `P1` / `P2`)

### Test Type

- `Functionality`, `Flow`, `Design`, `Usability`, `Suggestions` (suggestions-only)

### Positive / Negative

- `Positive`, `Negative`

### Action Performed By

- `FC`, `RPM`, `SH`, `Logistics`, `KYC Analyst`, `MISS`, `VP`, `AP`, `HR`, `Warehouse_Manager`

### Status

- `Not Executed`, `In Progress`, `Pass`, `Fail`, `Blocked`

### Developer Assigned

- `Yatender`, or `N/A`

## N/A rules (mandatory)

1. **Never leave a cell empty** in the test cases table.
2. **Plan-wide N/A:** set **every row** in that column to `N/A` when the column does not apply.
3. Document plan-wide N/A above the table: `**Column applicability:** …`

## Local-first workflow

1. Store the canonical test cases directly in `test-plan.md`.
2. Keep the 14-column markdown table complete and up to date.
3. If the user explicitly asks for another local artifact such as `.csv`, create it inside the same ticket folder.
4. Do **not** point users to external spreadsheet tools or require spreadsheet tooling for the default workflow.

## Example table row

```markdown
| TC-001 | Order checkout – happy path | FarMartOS | SO Details | Preconditions: User logged in.<br>Steps: 1. Open SO. 2. Verify credit snapshot.<br>Test data: limit 1000000. | S0 | Flow | Positive | Credit Requested shows 200000. | RPM | Not Executed | N/A | N/A | N/A |
```

## What not to use

- Legacy 8-column table.
- Empty cells instead of `N/A`.
- External spreadsheet links or spreadsheet-only workflows.
- Invented dropdown values.
