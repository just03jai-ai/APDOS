import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { DiscoveredSkill, ParsedSkill } from "../contracts/external-skill.js";

export class SkillParser {
  async parseSkill(skill: DiscoveredSkill): Promise<ParsedSkill> {
    const content = await readFile(skill.skillFilePath, "utf8");
    const frontmatter = parseFrontmatter(content);
    const body = removeFrontmatter(content);
    const title = firstMarkdownHeading(body);
    const skillId = normalizeSkillId(skill.folderName);
    const skillName = frontmatter.name ?? title ?? humanizeSkillName(skill.folderName);
    const description =
      frontmatter.description ??
      firstNonEmptyParagraph(body) ??
      `External skill loaded from ${skill.folderName}.`;

    return {
      skillId,
      skillName,
      description,
      version: frontmatter.version ?? "1.0",
      sourcePath: skill.sourcePath,
      skillFilePath: skill.skillFilePath,
      references: await collectFiles(skill.sourcePath, "references"),
      examples: await collectExamples(skill.sourcePath),
      metadata: frontmatter
    };
  }
}

function parseFrontmatter(content: string): Record<string, string> {
  if (!content.startsWith("---")) {
    return {};
  }

  const endIndex = content.indexOf("\n---", 3);

  if (endIndex === -1) {
    return {};
  }

  const block = content.slice(3, endIndex).trim();
  const metadata: Record<string, string> = {};

  for (const line of block.split("\n")) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (key) {
      metadata[key] = value;
    }
  }

  return metadata;
}

function removeFrontmatter(content: string): string {
  if (!content.startsWith("---")) {
    return content;
  }

  const endIndex = content.indexOf("\n---", 3);
  return endIndex === -1 ? content : content.slice(endIndex + 4);
}

function firstMarkdownHeading(content: string): string | undefined {
  return content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "))
    ?.replace(/^#\s+/, "")
    .trim();
}

function firstNonEmptyParagraph(content: string): string | undefined {
  return content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("```"));
}

async function collectExamples(sourcePath: string): Promise<string[]> {
  const entries = await readdir(sourcePath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /example/i.test(entry.name))
    .map((entry) => path.join(sourcePath, entry.name))
    .sort();
}

async function collectFiles(sourcePath: string, directoryName: string): Promise<string[]> {
  const directoryPath = path.join(sourcePath, directoryName);

  try {
    if (!(await stat(directoryPath)).isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  const entries = await readdir(directoryPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(directoryPath, entry.name))
    .sort();
}

function normalizeSkillId(folderName: string): string {
  return folderName.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
}

function humanizeSkillName(folderName: string): string {
  return folderName
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
