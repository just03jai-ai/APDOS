import type { BaseArtifact } from "../types/base-artifact.js";

export function getChildren(
  artifactId: string,
  artifacts: BaseArtifact[]
): BaseArtifact[] {
  return artifacts.filter((artifact) => artifact.parentIds.includes(artifactId));
}

export function getAncestorIds(
  artifactId: string,
  artifacts: BaseArtifact[]
): string[] {
  const byId = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
  const ancestors = new Set<string>();

  function visit(currentId: string): void {
    const artifact = byId.get(currentId);
    if (!artifact) {
      return;
    }

    for (const parentId of artifact.parentIds) {
      if (!ancestors.has(parentId)) {
        ancestors.add(parentId);
        visit(parentId);
      }
    }
  }

  visit(artifactId);
  return Array.from(ancestors);
}

export function getDescendantIds(
  artifactId: string,
  artifacts: BaseArtifact[]
): string[] {
  const descendants = new Set<string>();

  function visit(currentId: string): void {
    for (const child of getChildren(currentId, artifacts)) {
      if (!descendants.has(child.id)) {
        descendants.add(child.id);
        visit(child.id);
      }
    }
  }

  visit(artifactId);
  return Array.from(descendants);
}
