# Outline Token Setup

Run this when the pre-flight token check returns `NOT_FOUND`.
No packages to install, no restart required — just saves the API token.

---

## A — Find existing token

Run all three in parallel:

```bash
fish -c 'echo ${OUTLINE_API_KEY:-NOT_FOUND}' 2>/dev/null
```
```bash
bash -c 'source ~/.bashrc 2>/dev/null; source ~/.bash_profile 2>/dev/null; echo "${OUTLINE_API_KEY:-NOT_FOUND}"'
```
```bash
python3 -c "
import json, os
try:
    d = json.load(open(os.path.expanduser('~/.claude/settings.json')))
    print(d.get('outlineApiToken', 'NOT_FOUND'))
except Exception:
    print('NOT_FOUND')
"
```

Use the first value that starts with `ol_api_`.

If all return `NOT_FOUND`, ask the user exactly this:
> "To connect to Outline, I need your API token. Get one at `https://farmart.getoutline.com/settings/api-and-access` → New token → paste it here."

---

## B — Save the token

Once you have the token, save it and add permissions in one step:

```bash
python3 -c "
import json, os
TOKEN = 'REPLACE_WITH_TOKEN'
path = os.path.expanduser('~/.claude/settings.json')
with open(path) as f:
    d = json.load(f)
d['outlineApiToken'] = TOKEN
allow = d.setdefault('permissions', {}).setdefault('allow', [])
for p in [
    'Bash(curl -s -X POST https://farmart.getoutline.com/api/documents.info *)',
    'Bash(curl -s -X POST https://farmart.getoutline.com/api/documents.search *)',
    'Bash(curl -s -X POST https://farmart.getoutline.com/api/documents.list *)'
]:
    if p not in allow:
        allow.append(p)
with open(path, 'w') as f:
    json.dump(d, f, indent=2)
print('Token saved and permissions added.')
"
```

---

## C — Verify and continue

Run the token check:
```bash
python3 -c "import json,os; print(json.load(open(os.path.expanduser('~/.claude/settings.json'))).get('outlineApiToken','NOT_FOUND'))"
```

If it starts with `ol_api_`, setup is complete. **No restart required.**
Return to the skill pre-flight and proceed with Step 0.
