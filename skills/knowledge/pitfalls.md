# Known Pitfalls — fmt-farmartos-knowledge

10 documented failure patterns caught in real usage. Each has a rule to prevent recurrence.

---

### 1. Stating calculations from docs instead of code

**What happened:** Answered "Bill Amount = Subtotal + Halting + Fulfillment Charges".
Fulfillment Charges are a Vendor Credit — they reduce payable, not in the bill.
The HLD described intent. `create_bill_service.js` had the truth.

**Rule:** Never state a financial formula without first reading the `*_service.js` that computes it.

---

### 2. Reading local clone instead of prod branch

**What happened:** Missed `auto_complete_invoice_api_service.js` and
`auto_create_cn_for_po_api_service.js` — both exist on prod but not in the stale local clone.

**Rule:** Always use `gh api ... ?ref=prod`. If `gh api` fails, use
`git fetch origin prod && git show origin/prod:<path>` — never `cat` a local file.

---

### 3. Wrong contact hierarchy

**What happened:** Gave Yashpal as primary owner of Supplier Payable.
Yogesh Verma created the HLD. Last git committer ≠ module owner.

**Rule:** Primary = `data.createdBy.name` from the latest sprint HLD/PRD in Outline.
Secondary BE/FE = most files touched (not commit count, not last committer).

---

### 4. Asking for tool permissions mid-flow

**What happened:** Asked for curl permission for each Outline fetch separately,
interrupting the flow multiple times.

**Rule:** Step 0 is non-negotiable — batch ALL tool calls in one parallel request at the start.
If a new doc is needed mid-flow, batch any new fetches together.

---

### 5. Over-verbose default answer

**What happened:** Dumped WHAT + HOW + HISTORY + DEVIATIONS + GOTCHAS + CONTACTS all at once.
The user only needed a summary.

**Rule:** Tier 1 only by default. After WHAT + HOW + GOTCHAS + CONTACTS, ask if the user
wants the full picture before continuing.

---

### 6. Telling the user to run commands themselves

**What happened:** Wrote "run git blame on apis/v1/..." in the CONTACTS section.
The user expected a name, not a command.

**Rule:** Never surface a shell command in the answer. Do the lookup, extract the name, output it.

---

### 7. Missing the cron repo

**What happened:** Advisory processing, retry workers, and other scheduled jobs for
Buyer Recon live in `FarMart-Engineering/crons`, not in farmartos-backend.

**Rule:** For any module mentioning "cron", "scheduler", "retry", "advisory", "sync", or
"background job" in Outline docs, always check:
```bash
gh api "repos/FarMart-Engineering/crons/contents?ref=master" --jq '.[].name'
```
`master` = prod for crons (transitioning to `prod` branch in future).

---

### 8. Presenting planned features as implemented

**What happened:** Described GST Portal fallback as a three-tier flow
(IRP → IRP2 → Zoho). The HLD described future scope. Prod only implements IRP → IRP2.
`irp_instance_id = 3` and `ENABLE_ROBUST_INVOICE_PUSH_FALLBACK` don't exist in the enum or code.

Also described `creation_pending` as unimplemented — it IS live as the default invoice status.

**Rule:**
1. Read the enum file to confirm any status value exists in code.
2. Grep for feature flags — absent = not shipped.
3. Read the actual API call / service file that implements a flow, not just the orchestrator.
4. Label: ✅ Implemented / 📋 Docs only / ⚠️ Deviation.

---

### 9. Answering from a single source

**What happened:** First answer used only Outline docs, missed that
`supplier_payable_management/` on prod has only one file — the real services live in
`apis/v1/payment/` and `common_services/zoho/`.

**Rule:** Always triangulate: Outline product doc → Outline HLD/LLD → prod code via `gh api`.
If the module directory is sparse, search across the full repo.

---

### 10. Claiming a secondary signal without checking all callers

**What happened:** Found `is_auto_created = true` as the correct signal for auto CNs.
Also stated "Auto CNs have `created_by = NULL`" — based only on the service function's
default parameter. Did not check callers. Both real callers pass `user_profile_id` from
`req.user`, so `created_by` is never null in practice.

**Rule:** Before asserting a field "always has value X", grep all callers of that service:
```bash
gh api "search/code?q=<function_name>+repo:FarMart-Engineering/farmartos-backend" --jq '.items[].path'
```
Read each caller file before stating what the field contains in prod.
