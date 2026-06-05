# FarMart Skills - Installation & Usage Guide

Official skills repository for FarMart Engineering team to enhance AI coding assistants with FarMart-specific best practices.

## 📦 Available Skills

### fmt-conventions

FarMart-wide repo conventions skill for standardizing GitHub workflows, JavaScript runtime metadata, `APP_ENV`, `.env` file layout, script names, naming, formatting, branching, and git hooks across Node.js/Express, Python monorepos, Nx React monorepos, and misc repos.

**Use cases:**

- Auditing repos for consistency gaps
- Standardizing shared GitHub workflows and CI guardrails
- Normalizing Volta + Corepack + pnpm setup
- Enforcing `APP_ENV` and `.env.dev/.env.stage/.env.prod/.env.local`
- Defining standard branch names and git hooks
- Teaching AI agents FarMart repo conventions

### fmt-repo-router

FarMart multi-repo routing skill for choosing the right repository and concrete adjacent repos before making changes from the workspace root.

**Use cases:**

- Routing product requests to the correct frontend, backend, mobile, cron, QA, docs, shared UI, logging, or CI repo
- Verifying repo ownership with code evidence before editing
- Naming connected repos for API, permissions, route, queue, shared package, env, and workflow changes
- Deciding which companion skill to load after the owning repo is known
- Avoiding wrong-repo edits when agents run from the `/farmart` workspace root

### farmart-chronolog-logging

Comprehensive logging skill for FarMart's chronolog library with OpenTelemetry distributed tracing, proper log levels, contextual logging, and cross-service trace propagation.

**Use cases:**

- Setting up logging in new services
- Implementing distributed tracing across microservices
- Propagating trace context through SQS
- Debugging production issues with proper logging
- Adding structured logging to existing code

### fmt-crons-contributor

FarMart CRONs contributor guide for adding, changing, testing, documenting, and reviewing scheduled jobs in the `CRONs` repository.

**Use cases:**

- Adding new cron jobs or cron services
- Updating job IDs, registry metadata, schedules, or Mongo `JobConfig` reconciliation
- Improving cron service READMEs, runbooks, observability, and failure-mode documentation
- Applying CRONs conventions for ESM, pnpm, Biome, `APP_ENV`, job logging, and Go job artifacts
- Reviewing CRONs changes for retry safety, data-store impact, secrets handling, and operational risk

### fmt-data-science-monorepo-contributor

FarMart `data_science_monorepo` contributor guide for writing, changing, testing, documenting, packaging, and reviewing Python services, libraries, jobs, Dockerfiles, and GitHub Actions.

**Use cases:**

- Migrating or adding uv-native Python packages with `pyproject.toml` and `uv.lock`
- Standardizing Python 3.14 across services, libraries, jobs, and tooling
- Wiring local monorepo dependencies with `[tool.uv.sources]`
- Updating `harvester` or `data_pipelines` job packages safely
- Fixing Dockerfiles and GitHub Actions for ARM-native image builds and uv-based installs
- Validating runtime-sensitive codepaths with compile checks, tests, and AWS-backed smoke imports

### fmt-farmartos-backend-contributor

FarMart `farmartos-backend` contributor guide for writing, changing, testing, documenting, and reviewing backend code.

**Use cases:**

- Writing or reviewing services, DALs, controllers, migrations, and seeders
- Applying farmartos-backend conventions for naming, transactions, logging, error classes, and Sequelize
- Reviewing PRs for security, TDD coverage, migration safety, and common Sequelize pitfalls
- Onboarding contributors to farmartos-backend architecture and code review expectations

### fmt-farmartos-frontend-contributor

FarMart `farmartos-frontend` contributor guide for routing work to the right app docs and safely changing Farmart OS, Farmart Pro PWA, shared packages, routes, permissions, frontend contracts, and CCL-based UI.

**Use cases:**

- Routing frontend work to `apps/farmart-os`, `apps/farmart-pro`, or `packages/*`
- Reading app-local docs before changing routes, screens, forms, listings, drawers, modals, or search flows
- Coordinating with `fmt-feature-ui-generator` for PRD/HLD/LLD-backed UI scaffolds
- Applying `fmt-design-system` for CCL styling, Typography, spacing, modal, and design-variant rules
- Reviewing frontend PRs for route integration, permissions, typed data wiring, and documentation gaps

### fmt-mono-farmart-web-contributor

FarMart `mono-farmart-web` contributor guide for routing work to the right app or package docs and safely changing mobile web, Capacitor surfaces, tracking frontend, Farmart AI, shared packages, bridge behavior, and frontend contracts.

**Use cases:**

- Routing work to `apps/farmart-web`, `apps/tracking-service`, `apps/farmart-ai`, or `packages/*`
- Reading app/package docs before changing mobile-web routes, shared packages, tracking flows, bridge contracts, or UI
- Coordinating with `fmt-feature-ui-generator` for PRD/HLD/LLD-backed UI scaffolds
- Applying `fmt-design-system` where CCL or FarMart shared UI rules are involved
- Reviewing frontend PRs for app ownership, backend adjacency, bridge compatibility, typed data wiring, and documentation gaps

### fmt-tech-spec-writer

Jira-linked technical design writer for HLDs, LLDs, phased implementation plans, technical approaches, architecture decisions, and change maintenance.

**Use cases:**

- Creating or updating `hld.md`, `lld.md`, and `implementation-plan.md` in `docs/tickets/{JIRA-KEY}-slug/`
- Turning PRDs or Jira requirements into engineering design documents
- Keeping HLD/LLD free from file-by-file implementation details
- Capturing phased implementation, rollout, validation, and rollback in `implementation-plan.md`
- Maintaining design changes through `change-log.md`, `decisions/`, and `updates/`

### fmt-test-plan-writer

Jira-linked manual QA test plan writer for test scenarios, test cases, regression coverage, test data, environments, and QA sign-off criteria.

**Use cases:**

- Creating or updating `test-plan.md` in `docs/tickets/{JIRA-KEY}-slug/`
- Translating PRDs, HLDs, LLDs, implementation plans, and Jira requirements into manual QA scenarios
- Writing step-by-step test cases with expected results and test data
- Identifying edge cases, negative cases, permission checks, regression risks, and release smoke coverage

### fmt-git-guardian

FarMart git workflow guardian for docs and code repositories, including ticket branches, sync cadence, safe pushes, PR flow, and conflict handling.

**Use cases:**

- Creating or choosing the right branch for docs or code work
- Working safely on shared docs ticket branches
- Pulling latest before editing and pushing meaningful docs changes quickly
- Preparing commits, pushes, and PRs with Jira-aware commit messages
- Resolving push rejections, rebases, and merge conflicts safely

### fmt-implement-plan

Implementation executor for approved FarMart ticket implementation plans, keeping execution tied to PRD, HLD, LLD, test plan, change log, and git workflow.

**Use cases:**

- Implementing `docs/tickets/{JIRA-KEY}-slug/implementation-plan.md` phase by phase
- Resuming partially completed implementation plans
- Running automated verification and pausing for manual verification
- Handling plan-vs-code reality mismatches and updating ticket docs when discoveries change scope
- Coordinating code changes with `fmt-git-guardian` and repo-specific contributor skills

### fmt-codebase-research

Current-state codebase research skill for mapping how FarMart systems work with concrete file references and docs workflow alignment.

**Use cases:**

- Researching current implementation before PRD, HLD, LLD, implementation-plan, or test-plan work
- Creating Jira-linked research under `docs/tickets/{JIRA-KEY}-slug/research/`
- Creating exploratory research under `docs/thoughts/{name}/research/`
- Finding code paths, data flows, tests, examples, and historical context without proposing changes
- Producing evidence with file:line references for downstream writer skills

---

## 🚀 Quick Start

### Install All FarMart Skills

```bash
npx skills add FarMart-Engineering/skills
```

This will show you a list of available skills. Select the ones you want to install.

### Install a Specific Skill

```bash
npx skills add FarMart-Engineering/skills@fmt-conventions
npx skills add FarMart-Engineering/skills@fmt-repo-router
npx skills add FarMart-Engineering/skills@farmart-chronolog-logging
npx skills add FarMart-Engineering/skills@fmt-farmartos-backend-contributor
npx skills add FarMart-Engineering/skills@fmt-data-science-monorepo-contributor
npx skills add FarMart-Engineering/skills@fmt-farmartos-frontend-contributor
npx skills add FarMart-Engineering/skills@fmt-mono-farmart-web-contributor
npx skills add FarMart-Engineering/skills@fmt-tech-spec-writer
npx skills add FarMart-Engineering/skills@fmt-test-plan-writer
npx skills add FarMart-Engineering/skills@fmt-git-guardian
npx skills add FarMart-Engineering/skills@fmt-implement-plan
npx skills add FarMart-Engineering/skills@fmt-codebase-research
```

### Install with Flags

```bash
# Install globally for your user (all projects)
npx skills add FarMart-Engineering/skills@fmt-conventions -g -y

# Install locally for this project only
npx skills add FarMart-Engineering/skills@fmt-conventions -y
```

---

## 📖 Skills CLI Reference

### Core Commands

#### `npx skills add <source>`

Install a skill from various sources.

**Syntax:**

```bash
npx skills add <owner>/<repo>[@skill-name]
npx skills add <url>
npx skills add file:./path/to/skill
```

**Options:**

- `-g, --global` - Install skill globally (user-level) instead of project-level
- `-y, --yes` - Skip confirmation prompts, auto-accept installation
- `--force` - Force reinstall even if skill already exists

**Examples:**

```bash
# Install from GitHub, select skill interactively
npx skills add FarMart-Engineering/skills

# Install specific skill from GitHub
npx skills add FarMart-Engineering/skills@farmart-chronolog-logging

# Install globally without prompts
npx skills add FarMart-Engineering/skills@farmart-chronolog-logging -g -y

# Install from URL
npx skills add https://raw.githubusercontent.com/FarMart-Engineering/skills/main/farmart-chronolog-logging/SKILL.md

# Install from local directory (for testing)
npx skills add file:./farmart-chronolog-logging
```

#### `npx skills list`

List all installed skills.

**Options:**

- `-g, --global` - List globally installed skills
- (no flags) - List project-level skills

**Examples:**

```bash
# List project skills
npx skills list

# List global skills
npx skills list -g
```

#### `npx skills remove <skill-name>`

Remove an installed skill.

**Options:**

- `-g, --global` - Remove from global skills
- `-y, --yes` - Skip confirmation prompt

**Examples:**

```bash
# Remove project skill
npx skills remove farmart-chronolog-logging

# Remove global skill without prompt
npx skills remove farmart-chronolog-logging -g -y
```

#### `npx skills find [query]`

Search for skills in the open skills ecosystem.

**Examples:**

```bash
# Interactive search
npx skills find

# Search by keyword
npx skills find logging
npx skills find react testing
npx skills find distributed tracing
```

#### `npx skills init <skill-name>`

Create a new skill in the current directory.

**Example:**

```bash
npx skills init my-custom-skill
```

This creates:

```
my-custom-skill/
└── SKILL.md
```

#### `npx skills check`

Check for updates to installed skills.

**Examples:**

```bash
# Check project skills
npx skills check

# Check global skills
npx skills check -g
```

#### `npx skills update`

Update all installed skills to latest versions.

**Options:**

- `-g, --global` - Update global skills
- `-y, --yes` - Skip confirmation prompts

**Examples:**

```bash
# Update project skills
npx skills update

# Update global skills without prompts
npx skills update -g -y
```

---

## 🎯 Installation Scenarios

### For Individual Developers

**Recommended: Global installation**

Install skills globally so they're available across all your projects:

```bash
npx skills add FarMart-Engineering/skills@farmart-chronolog-logging -g -y
```

**Verify installation:**

```bash
npx skills list -g
```

**Use in any project:**
Once installed globally, Claude Code and other AI assistants will automatically use the skill when you ask logging-related questions.

### For Team Projects

**Recommended: Project-level installation**

Install skills at the project level and commit the skill configuration:

```bash
cd /path/to/your/project
npx skills add FarMart-Engineering/skills@farmart-chronolog-logging -y
```

This creates:

```
your-project/
├── .agents/
│   └── skills/
│       └── farmart-chronolog-logging/
└── [your code]
```

**Commit to git:**

```bash
git add .agents/
git commit -m "chore: Add FarMart chronolog logging skill"
git push
```

Now all team members who clone the repo will have access to the skill.

### For CI/CD Environments

Add skill installation to your CI/CD setup scripts:

```bash
# In your setup script or Dockerfile
npx skills add FarMart-Engineering/skills@farmart-chronolog-logging -y
```

---

## 🔧 Advanced Usage

### Installing Multiple Skills

```bash
# Interactive selection from repository
npx skills add FarMart-Engineering/skills

# Or install each individually
npx skills add FarMart-Engineering/skills@farmart-chronolog-logging -y
npx skills add FarMart-Engineering/skills@fmt-farmartos-backend-contributor -y
```

### Updating Skills

```bash
# Check for updates
npx skills check

# Update all skills
npx skills update -y
```

### Removing Skills

```bash
# Remove specific skill
npx skills remove farmart-chronolog-logging

# Remove all skills (one by one)
npx skills list  # See what's installed
npx skills remove skill-name -y
```

### Testing Skills Locally

Before pushing to the repository, test your skill locally:

```bash
# From the skills repository directory
npx skills add file:./farmart-chronolog-logging

# Test with Claude Code or other AI assistants
# Ask: "Help me add logging using chronolog"

# Remove after testing
npx skills remove farmart-chronolog-logging
```

---

## 🎨 Using Skills with AI Assistants

### Claude Code

Once installed, skills are automatically available. Just ask:

```
"Help me add logging to this Express endpoint using chronolog"

"How do I propagate trace context through SQS with chronolog?"

"Set up distributed tracing for this microservice"

"Show me the best way to log errors with chronolog"
```

Claude Code will automatically reference the farmart-chronolog-logging skill.

### Cursor

Skills work the same way with Cursor:

1. Install the skill (global or project-level)
2. Ask questions naturally
3. Cursor uses the skill automatically

### Other AI Assistants

Skills are compatible with:

- Claude Code ✅
- Cursor ✅
- OpenCode ✅
- Amp ✅
- Antigravity ✅
- Cline ✅
- And more...

---

## 📂 Where Skills Are Stored

### Project-Level Skills

```
your-project/
└── .agents/
    └── skills/
        └── farmart-chronolog-logging/
            └── SKILL.md
```

### Global Skills

```
~/.config/skills/
└── farmart-chronolog-logging/
    └── SKILL.md
```

(Exact path may vary by OS)

---

## 🔐 Security

Skills run with full agent permissions, so only install skills from trusted sources:

- ✅ Official FarMart-Engineering skills
- ✅ Well-known organizations (anthropics, vercel-labs, microsoft)
- ✅ Skills with high install counts (1K+)
- ⚠️ Review skill content before installing from unknown sources

**Check security risk:**
When installing, the CLI shows security assessments from:

- Gen AI safety check
- Socket security scan
- Snyk vulnerability scan

---

## 🆘 Troubleshooting

### Skill Not Found

**Error:** `No matching skills found for: farmart-chronolog-logging`

**Solutions:**

1. Check the skill name is correct
2. Ensure the repository exists at `FarMart-Engineering/skills`
3. Try without the `@skill-name` to see all available skills:
   ```bash
   npx skills add FarMart-Engineering/skills
   ```

### Skill Not Being Used by AI

**Symptoms:** AI doesn't reference the skill

**Solutions:**

1. Verify skill is installed:

   ```bash
   npx skills list
   # or
   npx skills list -g
   ```

2. Be explicit in your prompt:

   ```
   "Using the farmart-chronolog-logging skill, help me..."
   ```

3. Reinstall the skill:
   ```bash
   npx skills remove farmart-chronolog-logging -y
   npx skills add FarMart-Engineering/skills@farmart-chronolog-logging -y
   ```

### Permission Errors

**Error:** Permission denied when installing globally

**Solution:** Use global flag properly:

```bash
npx skills add FarMart-Engineering/skills@farmart-chronolog-logging -g -y
```

### Git Clone Errors

**Error:** Failed to clone repository

**Solutions:**

1. Check your GitHub access
2. Ensure repository name is correct: `FarMart-Engineering/skills`
3. Try with HTTPS instead of SSH (automatically used by skills CLI)

---

## 📚 Skill Documentation

Each skill includes comprehensive documentation:

- **SKILL.md** - Main skill instructions for AI assistants
- **README.md** - Human-readable documentation
- **QUICK_START_GUIDE.md** - Quick reference for developers
- **UPDATE_NOTES.md** - Changelog and migration guides (if applicable)

**View skill documentation:**

```bash
# After installation, navigate to skill directory
cd .agents/skills/farmart-chronolog-logging/
cat README.md
```

---

## 🔄 Keeping Skills Updated

Skills are versioned and updated over time. Stay current:

```bash
# Check for updates regularly
npx skills check

# Update when available
npx skills update -y
```

**Set up a reminder:**

- Weekly: `npx skills check`
- Monthly: `npx skills update -y`

---

## 🤝 Contributing

Want to create a new skill for FarMart?

### Skill naming convention

Repository-specific contributor skills must use this naming pattern:

```text
fmt-${repo}-contributor
```

Use the repository name in lowercase kebab-case. Examples:

- `fmt-crons-contributor` for the `CRONs` repository
- `fmt-farmartos-backend-contributor` for the `farmartos-backend` repository
- `fmt-mono-farmart-web-contributor` for the `mono-farmart-web` repository

Use this pattern only for skills that teach AI assistants how to contribute to a specific repository. Cross-repo or domain skills can use other descriptive names, such as `fmt-conventions` or `farmart-chronolog-logging`.

1. **Create the skill:**

   ```bash
   cd /path/to/skills/repo
   npx skills init fmt-${repo}-contributor
   ```

2. **Edit the skill:**

   ```bash
   cd my-new-skill
   # Edit SKILL.md with your content
   ```

3. **Test locally:**

   ```bash
   npx skills add file:./my-new-skill
   # Test with AI assistant
   npx skills remove my-new-skill
   ```

4. **Submit for review:**
   ```bash
   git add my-new-skill/
   git commit -m "feat: Add my-new-skill"
   git push
   # Create pull request
   ```

---

## 📊 Skills CLI Cheat Sheet

| Command                    | Description           | Common Options                       |
| -------------------------- | --------------------- | ------------------------------------ |
| `npx skills add <source>`  | Install a skill       | `-g` (global), `-y` (yes), `--force` |
| `npx skills list`          | List installed skills | `-g` (global)                        |
| `npx skills remove <name>` | Remove a skill        | `-g` (global), `-y` (yes)            |
| `npx skills find [query]`  | Search for skills     | -                                    |
| `npx skills check`         | Check for updates     | `-g` (global)                        |
| `npx skills update`        | Update all skills     | `-g` (global), `-y` (yes)            |
| `npx skills init <name>`   | Create new skill      | -                                    |

---

## 🌐 Resources

- **Skills Marketplace:** https://skills.sh/
- **FarMart Skills Repo:** https://github.com/FarMart-Engineering/skills
- **Skills CLI Docs:** https://www.npmjs.com/package/skills
- **Claude Code Docs:** https://docs.claude.com/en/docs/claude-code

---

## ❓ FAQ

### Q: Should I install skills globally or per-project?

**A:**

- **Global** - If you work on multiple FarMart projects and want skills available everywhere
- **Project** - If skills are specific to one project or you want to commit them to git

### Q: Can I have both global and project skills?

**A:** Yes! AI assistants will use both. Project skills take precedence if there's a conflict.

### Q: How do I know which skills are installed?

**A:**

```bash
npx skills list      # Project skills
npx skills list -g   # Global skills
```

### Q: Do I need to reinstall skills after cloning a repo?

**A:** No, if skills are committed to the repo (in `.agents/skills/`). Yes, if they were global on the original machine.

### Q: Can I modify installed skills?

**A:** Yes, but changes will be overwritten on update. Instead, create a new skill or fork the repository.

### Q: How do I uninstall all skills?

**A:**

```bash
npx skills list
# Then remove each one:
npx skills remove skill-name -y
```

### Q: What if the skill isn't working?

**A:**

1. Check it's installed: `npx skills list`
2. Try being explicit: "Using the farmart-chronolog-logging skill..."
3. Reinstall: `npx skills remove <name> -y && npx skills add <source> -y`

---

## 🎓 Example Workflow

**Setting up a new developer:**

```bash
# 1. Clone FarMart project
git clone https://github.com/FarMart-Engineering/your-project.git
cd your-project

# 2. Install FarMart skills globally (one-time setup)
npx skills add FarMart-Engineering/skills@farmart-chronolog-logging -g -y

# 3. Verify installation
npx skills list -g

# 4. Start using with Claude Code
# Ask: "Help me add logging to this Express endpoint"
```

**Updating skills monthly:**

```bash
# Check for updates
npx skills check -g

# Update if available
npx skills update -g -y
```

**Working on a new microservice:**

```bash
# In your new service directory
npx skills add FarMart-Engineering/skills@farmart-chronolog-logging -y

# Commit to repo for team
git add .agents/
git commit -m "chore: Add logging skill"
```

---

## 📞 Support

- **Internal Questions:** Ask in #core-tech Slack channel
- **Skill Issues:** Create an issue in [FarMart-Engineering/skills](https://github.com/FarMart-Engineering/skills/issues)

---

**Maintained by FarMart Engineering**
**Last Updated:** 2026-05-09
**Version:** 1.0.1
