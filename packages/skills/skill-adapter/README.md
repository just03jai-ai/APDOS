# APDOS Skill Adapter

The Skill Adapter discovers external skill repositories, parses `SKILL.md` files, registers them into the APDOS Skill Registry, and exposes them through the Skill Runtime.

## Architecture

The adapter has four deterministic stages:

1. `FilesystemSkillSourceDiscovery` scans enabled filesystem sources and finds immediate child folders containing `SKILL.md`.
2. `SkillParser` extracts skill metadata from frontmatter and Markdown content.
3. `SkillSyncService` converts parsed external skills into APDOS `SkillDefinition` records and registers missing versions.
4. `SkillAdapterService` exposes `loadSkill()`, `resolveSkill()`, and `executeSkill()` through the Skill Runtime.

No LLM execution, embeddings, or vector database is used. External skills are registered with deterministic defaults and can be executed by the existing deterministic Skill Runtime.

## Configuration

External skill sources are configured in `config/skills.config.json`:

```json
{
  "sources": [
    {
      "id": "local-skills",
      "type": "filesystem",
      "path": "/Users/jaisingh/Desktop/AI Agents/Skills",
      "enabled": true
    }
  ]
}
```

Only enabled filesystem sources are scanned. Each direct child folder with a `SKILL.md` file is treated as one external skill.

## Runtime Integration

After synchronization, external skills are available through APDOS runtime APIs:

```ts
const adapter = new SkillAdapterService();
await adapter.syncSkills(config.sources);

const skill = adapter.loadSkill("prd-writer");
const result = await adapter.executeSkill({
  skillId: "prd-writer",
  inputArtifacts,
  context: {
    agentId: "product-agent",
    workflowId: "workflow-1"
  }
});
```

## Startup Bootstrap

Use `loadExternalSkills()` during APDOS startup:

```ts
await loadExternalSkills();
```

By default this reads `config/skills.config.json` from the current working directory.

## CLI

Run:

```bash
pnpm skills:sync
```

Expected output:

```text
Discovered: 17
Registered: 17
Skipped: 0
Errors: 0
```

If seeded APDOS skills already exist in the registry, matching skill versions are skipped rather than re-registered.

## Onboarding New Skills

To add a new external skill:

1. Create a folder under an enabled skill source.
2. Add a `SKILL.md` file.
3. Optionally include frontmatter fields such as `name`, `description`, and `version`.
4. Add examples such as `EXAMPLES.md` and reference files under `references/`.
5. Run `pnpm skills:sync`.
