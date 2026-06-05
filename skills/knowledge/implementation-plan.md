# Implementation Plan: fmt-farmartos-knowledge

**Branch:** `feat/fmt-farmartos-knowledge`
**Skill:** `fmt-farmartos-knowledge`
**Outline workspace:** `https://farmart.getoutline.com`
**FarmartOS collection:** `b4136697-1089-4450-adef-735bb13f9ffd`

---

## What We're Building

A Claude Code skill that is the single AI agent entry point for all FarmartOS context.
Agents invoke this skill when they need to understand any FarmartOS module — its
product purpose, technical architecture, design history, deviations, gotchas, and contacts.

Outline remains the source of truth. The skill routes agents to the right Outline docs
via MCP. No content is mirrored — only an index of document IDs + compressed static facts.

---

## Architecture

```
User / AI Agent
  └── fmt-farmartos-knowledge (this skill)
        ├── SKILL.md          ← lean entry point, workflow, cross-skill routing
        ├── references/
        │   ├── module-index.md   ← module → Outline doc IDs (all versions)
        │   ├── glossary.md       ← domain terms (ML ≠ ML, PCO, PA, etc.)
        │   └── domain-map.md     ← module dependencies from prod code
        └── questions.md          ← open questions for human review session
              │
              ▼ Outline MCP calls
        farmart.getoutline.com
              └── FarmartOS collection (b4136697)
                    ├── Product Documentation (features overview)
                    ├── Engineering Documentation (actual impl flows)
                    └── Stories (s01–s48: PRD → HLD → LLD → release checklist)
```

**Source of truth priority:**
1. Prod code (`main` branch of MarketLinkage-BE + central-admin-panel)
2. Outline Engineering Documentation
3. Outline Sprint HLD/LLD
4. If still unclear → add to `questions.md`

---

## Data Flow

### AI Agent querying a module

```
Agent: "How does PO creation work?"
  │
  ▼
fmt-farmartos-knowledge loads into context
  │
  ├── Reads module-index.md → finds Purchase Orders doc IDs
  ├── Calls Outline MCP: fetch cf3c674b (product doc)
  ├── Calls Outline MCP: fetch 8f3f1c09 (engineering doc)
  ├── Calls Outline MCP: s09 → s13 → s28 → s29 → s35 (version chain)
  ├── Calls Outline MCP: latest release checklist for delivery lead
  │
  └── Synthesizes:
        WHAT: PO lifecycle, roles, entry conditions
        HOW: actual flow from engineering doc + prod code
        HISTORY: v1→v2 evolution, key decisions at each step
        DEVIATIONS: where code differs from HLD [inferred/verified]
        GOTCHAS: non-obvious behaviour, edge cases
        CONTACTS: primary (git blame) + secondary (delivery lead, PM)
```

### Human reviewing open questions

```
Human opens questions.md
  └── Reviews [verify] items
  └── Fills in answers inline
  └── Owner runs git blame commands for code owner contacts
  └── Answers folded back into domain-map.md and module-index.md
```

---

## Build Phases

### Phase 1 — Skill scaffold ✅ Done
- [x] Create `fmt-farmartos-knowledge/` at skills repo root
- [x] Write `SKILL.md` — lean entry point, workflow, guardrails, cross-skill routing
- [x] Write `references/module-index.md` — all 27 modules, all Outline doc IDs
- [x] Write `references/glossary.md` — domain terms
- [x] Write `references/domain-map.md` — module dependencies from prod code
- [x] Write `questions.md` — open questions for review session

### Phase 2 — Outline MCP configuration ✅ Done (2026-05-26)
- [x] Add Outline MCP to `~/.claude/settings.json` using `outline-mcp-server@5.8.5` (npm)
  - Package: `outline-mcp-server@latest` via npx stdio transport
  - Env vars: `OUTLINE_API_KEY`, `OUTLINE_API_URL=https://farmart.getoutline.com/api`
  - Tool names: `get_document`, `search_documents`, `list_documents`, `list_collections`
  - MCP tools pre-approved in `permissions.allow` — zero permission prompts per doc fetch
  - Works with Node 22 (package tested, stdio mode confirmed working)
- [x] SKILL.md rewritten to use `mcp__outline__get_document` — removed all curl calls
  - Skill slimmed from 540 → 176 lines; pitfalls moved to `pitfalls.md`
- [x] Prerequisites section added to SKILL.md for new users
- [ ] Test: invoke skill, ask about Purchase Orders, verify Outline MCP fetches correctly
- [ ] Validate that all doc IDs in module-index.md resolve successfully

### Phase 3 — Code owner contacts
- [ ] Run git blame on key BE modules (see Q11 in questions.md) to get primary contacts
- [ ] Parse release checklists for s14, s22, s28, s29, s32, s35, s40, s41 to extract
      delivery leads and PMs
- [ ] Add `references/contacts.md` with the populated table

### Phase 4 — Human review session (one-time)
- [ ] Review all `[verify]` items in `domain-map.md`
- [ ] Answer all questions in `questions.md`
- [ ] Update domain-map.md and module-index.md with verified answers
- [ ] Identify any Outline docs that are stubs/outdated — flag for content update

### Phase 5 — Update fmt-farmartos-backend-contributor
- [ ] Add a section to `fmt-farmartos-backend-contributor/SKILL.md`:
  > "Before implementing code that touches an existing module, invoke
  > `fmt-farmartos-knowledge` to get the module's architecture, gotchas,
  > and design history."
- [ ] PR to skills repo, review, merge

### Phase 6 — Install and validate
- [ ] Install skill locally: `npx skills add file:./fmt-farmartos-knowledge`
- [ ] Test with realistic prompts (see Testing section below)
- [ ] Run `scripts/quick_validate.py fmt-farmartos-knowledge`
- [ ] Submit PR on `feat/fmt-farmartos-knowledge` branch

---

## Testing

### Baseline (RED) — without skill
Ask an agent: "How does the invoicing flow work in FarmartOS?"
Expected without skill: Agent guesses or says it doesn't know. It should not
be able to route to the correct Outline documents automatically.

### With skill (GREEN)
Ask the same question with skill loaded.
Expected: Agent reads module-index → fetches Outline docs → returns structured
answer with WHAT/HOW/HISTORY/DEVIATIONS/GOTCHAS/CONTACTS.

### Pressure test scenarios
1. "Explain the PO creation flow" — tests module-index + multi-doc fetch
2. "What changed between SO approval v1 and v3?" — tests version chain reading
3. "Who should I ask about the payment module?" — tests contacts resolution
4. "Is there a gotcha with Zoho sync?" — tests cross-module dependency lookup

---

## Files Created

```
fmt-farmartos-knowledge/
├── SKILL.md                        ← entry point (this is the skill)
├── implementation-plan.md          ← this file
├── questions.md                    ← open questions for review session
└── references/
    ├── module-index.md             ← 27 modules × all Outline doc IDs
    ├── glossary.md                 ← domain terms
    └── domain-map.md               ← module dependencies from prod code
```

---

## Open Items Before PR

1. Outline MCP configured and tested (Phase 2)
2. Contacts table populated (Phase 3)
3. All `[verify]` items in domain-map.md resolved (Phase 4)
4. fmt-farmartos-backend-contributor updated (Phase 5)
5. `scripts/quick_validate.py` passing
