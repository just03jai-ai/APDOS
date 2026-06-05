import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { ArtifactType, type BaseArtifact } from "@apdos/artifacts";
import { SkillRegistry } from "@apdos/skill-registry";
import {
  FilesystemSkillSourceDiscovery,
  SkillAdapterService,
  SkillParser,
  SkillSyncService,
  loadExternalSkills
} from "../src/index.js";

describe("FilesystemSkillSourceDiscovery", () => {
  it("discovers skill folders with SKILL.md files", async () => {
    const root = await createSkillRepository({
      "prd-writer": skillMarkdown("fmt-prd-writer", "Write PRDs.")
    });
    await mkdir(path.join(root, "not-a-skill"));

    const discovery = new FilesystemSkillSourceDiscovery();
    const skills = await discovery.discoverSkills([
      {
        id: "test-skills",
        type: "filesystem",
        path: root,
        enabled: true
      }
    ]);

    assert.deepEqual(skills.map((skill) => skill.folderName), ["prd-writer"]);
    assert.equal(skills[0].sourceId, "test-skills");
    assert.equal(skills[0].skillFilePath, path.join(root, "prd-writer", "SKILL.md"));
  });
});

describe("SkillParser", () => {
  it("extracts skill metadata, references, and examples", async () => {
    const root = await createSkillRepository({
      "prd-writer": skillMarkdown("fmt-prd-writer", "Write senior product requirements.")
    });
    await mkdir(path.join(root, "prd-writer", "references"));
    await writeFile(path.join(root, "prd-writer", "references", "guide.md"), "# Guide\n");
    await writeFile(path.join(root, "prd-writer", "EXAMPLES.md"), "# Examples\n");
    const parser = new SkillParser();

    const skill = await parser.parseSkill({
      sourceId: "test-skills",
      folderName: "prd-writer",
      sourcePath: path.join(root, "prd-writer"),
      skillFilePath: path.join(root, "prd-writer", "SKILL.md")
    });

    assert.equal(skill.skillId, "prd-writer");
    assert.equal(skill.skillName, "fmt-prd-writer");
    assert.equal(skill.description, "Write senior product requirements.");
    assert.equal(skill.version, "1.0");
    assert.deepEqual(skill.references, [
      path.join(root, "prd-writer", "references", "guide.md")
    ]);
    assert.deepEqual(skill.examples, [path.join(root, "prd-writer", "EXAMPLES.md")]);
  });
});

describe("SkillSyncService", () => {
  it("registers external skills into the Skill Registry", () => {
    const registry = new SkillRegistry();
    const sync = new SkillSyncService(registry);

    const result = sync.syncSkills([
      {
        skillId: "prd-writer",
        skillName: "PRD Writer",
        description: "Write PRDs.",
        version: "1.0",
        sourcePath: "/skills/prd-writer",
        skillFilePath: "/skills/prd-writer/SKILL.md",
        references: [],
        examples: [],
        metadata: {}
      }
    ]);

    assert.equal(result.discovered, 1);
    assert.equal(result.registered, 1);
    assert.equal(result.skipped, 0);
    assert.equal(registry.getSkill("prd-writer@1.0")?.outputArtifacts[0], ArtifactType.PRD);
  });

  it("skips duplicate skill versions", () => {
    const registry = new SkillRegistry();
    const sync = new SkillSyncService(registry);
    const skill = {
      skillId: "codebase-research",
      skillName: "Codebase Research",
      description: "Research code.",
      version: "1.0",
      sourcePath: "/skills/codebase-research",
      skillFilePath: "/skills/codebase-research/SKILL.md",
      references: [],
      examples: [],
      metadata: {}
    };

    sync.syncSkills([skill]);
    const result = sync.syncSkills([skill]);

    assert.equal(result.registered, 0);
    assert.equal(result.skipped, 1);
    assert.equal(result.errors.length, 0);
  });
});

describe("SkillAdapterService", () => {
  it("discovers, registers, loads, resolves, and executes external skills", async () => {
    const root = await createSkillRepository({
      "tech-spec-writer": skillMarkdown("fmt-tech-spec-writer", "Write technical specs.")
    });
    const registry = new SkillRegistry();
    const service = new SkillAdapterService({ registry });

    const result = await service.syncSkills([
      {
        id: "test-skills",
        type: "filesystem",
        path: root,
        enabled: true
      }
    ]);

    assert.equal(result.discovered, 1);
    assert.equal(result.registered, 1);
    assert.equal(service.loadSkill("tech-spec-writer").id, "tech-spec-writer@1.0");
    assert.equal(service.resolveSkill("tech-spec-writer").version, "1.0");

    const execution = await service.executeSkill({
      skillId: "tech-spec-writer",
      inputArtifacts: [createPrdArtifact()],
      context: {
        workflowId: "workflow-1",
        agentId: "architecture-agent",
        requestedAt: "2026-01-01T00:00:00.000Z"
      }
    });

    assert.equal(execution.metadata.skillId, "tech-spec-writer@1.0");
    assert.equal(execution.artifacts[0].type, ArtifactType.TECH_SPEC);
  });
});

describe("loadExternalSkills", () => {
  it("bootstraps configured external skill repositories", async () => {
    const root = await createSkillRepository({
      "backend-contributor": skillMarkdown("backend-contributor", "Contribute backend changes.")
    });
    const configPath = path.join(root, "skills.config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        sources: [
          {
            id: "test-skills",
            type: "filesystem",
            path: root,
            enabled: true
          }
        ]
      })
    );

    const result = await loadExternalSkills({
      configPath,
      service: new SkillAdapterService({ registry: new SkillRegistry() })
    });

    assert.equal(result.discovered, 1);
    assert.equal(result.registered, 1);
    assert.equal(result.errors.length, 0);
  });
});

async function createSkillRepository(skills: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "apdos-skills-"));

  for (const [folderName, content] of Object.entries(skills)) {
    const folderPath = path.join(root, folderName);
    await mkdir(folderPath, { recursive: true });
    await writeFile(path.join(folderPath, "SKILL.md"), content);
  }

  return root;
}

function skillMarkdown(name: string, description: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\n${description}\n`;
}

function createPrdArtifact(): BaseArtifact {
  return {
    id: "workflow-1:prd",
    type: ArtifactType.PRD,
    title: "PRD",
    description: "Product requirements",
    parentIds: [],
    createdBy: "product-agent",
    createdAt: "2026-01-01T00:00:00.000Z",
    version: 1,
    status: "active",
    metadata: {
      workflowId: "workflow-1"
    }
  };
}
