import type { BaseArtifact } from "../types/base-artifact.js";

export interface ArtifactLineageNode {
  artifact: BaseArtifact;
  parentIds: string[];
  childIds: string[];
}

export interface ArtifactLineageGraphModel {
  nodes: ArtifactLineageNode[];
}

export class ArtifactLineageGraph {
  private readonly artifactsById = new Map<string, BaseArtifact>();
  private readonly childIdsByParentId = new Map<string, Set<string>>();
  private readonly parentIdsByChildId = new Map<string, Set<string>>();

  constructor(artifacts: BaseArtifact[] = []) {
    for (const artifact of artifacts) {
      this.addArtifact(artifact);
    }
  }

  addArtifact(artifact: BaseArtifact): void {
    this.artifactsById.set(artifact.id, cloneArtifact(artifact));

    if (!this.parentIdsByChildId.has(artifact.id)) {
      this.parentIdsByChildId.set(artifact.id, new Set());
    }

    for (const parentId of artifact.parentIds) {
      this.linkParentToChild(parentId, artifact.id);
    }
  }

  linkParentToChild(parentId: string, childId: string): void {
    this.assertKnownArtifact(parentId);
    this.assertKnownArtifact(childId);

    const parentIds = this.parentIdsByChildId.get(childId) ?? new Set<string>();
    parentIds.add(parentId);
    this.parentIdsByChildId.set(childId, parentIds);

    const childIds = this.childIdsByParentId.get(parentId) ?? new Set<string>();
    childIds.add(childId);
    this.childIdsByParentId.set(parentId, childIds);

    const child = this.artifactsById.get(childId);
    if (child && !child.parentIds.includes(parentId)) {
      child.parentIds = [...child.parentIds, parentId];
    }
  }

  getParents(artifactId: string): BaseArtifact[] {
    return this.resolveArtifacts(this.parentIdsByChildId.get(artifactId));
  }

  getChildren(artifactId: string): BaseArtifact[] {
    return this.resolveArtifacts(this.childIdsByParentId.get(artifactId));
  }

  getAncestors(artifactId: string): BaseArtifact[] {
    return this.resolveArtifacts(this.walkParents(artifactId));
  }

  getDescendants(artifactId: string): BaseArtifact[] {
    return this.resolveArtifacts(this.walkChildren(artifactId));
  }

  toModel(): ArtifactLineageGraphModel {
    return {
      nodes: Array.from(this.artifactsById.values()).map((artifact) => ({
        artifact: cloneArtifact(artifact),
        parentIds: Array.from(this.parentIdsByChildId.get(artifact.id) ?? []),
        childIds: Array.from(this.childIdsByParentId.get(artifact.id) ?? [])
      }))
    };
  }

  private walkParents(artifactId: string): string[] {
    const ancestors = new Set<string>();

    const visit = (currentId: string): void => {
      for (const parentId of this.parentIdsByChildId.get(currentId) ?? []) {
        if (!ancestors.has(parentId)) {
          ancestors.add(parentId);
          visit(parentId);
        }
      }
    };

    visit(artifactId);
    return Array.from(ancestors);
  }

  private walkChildren(artifactId: string): string[] {
    const descendants = new Set<string>();

    const visit = (currentId: string): void => {
      for (const childId of this.childIdsByParentId.get(currentId) ?? []) {
        if (!descendants.has(childId)) {
          descendants.add(childId);
          visit(childId);
        }
      }
    };

    visit(artifactId);
    return Array.from(descendants);
  }

  private resolveArtifacts(ids: Iterable<string> | undefined): BaseArtifact[] {
    if (!ids) {
      return [];
    }

    return Array.from(ids)
      .map((id) => this.artifactsById.get(id))
      .filter((artifact): artifact is BaseArtifact => artifact !== undefined)
      .map(cloneArtifact);
  }

  private assertKnownArtifact(artifactId: string): void {
    if (!this.artifactsById.has(artifactId)) {
      throw new Error(`Artifact not found in lineage graph: ${artifactId}`);
    }
  }
}

export function getChildren(
  artifactId: string,
  artifacts: BaseArtifact[]
): BaseArtifact[] {
  return new ArtifactLineageGraph(artifacts).getChildren(artifactId);
}

export function getParents(
  artifactId: string,
  artifacts: BaseArtifact[]
): BaseArtifact[] {
  return new ArtifactLineageGraph(artifacts).getParents(artifactId);
}

export function getAncestorIds(
  artifactId: string,
  artifacts: BaseArtifact[]
): string[] {
  return new ArtifactLineageGraph(artifacts)
    .getAncestors(artifactId)
    .map((artifact) => artifact.id);
}

export function getAncestors(
  artifactId: string,
  artifacts: BaseArtifact[]
): BaseArtifact[] {
  return new ArtifactLineageGraph(artifacts).getAncestors(artifactId);
}

export function getDescendantIds(
  artifactId: string,
  artifacts: BaseArtifact[]
): string[] {
  return new ArtifactLineageGraph(artifacts)
    .getDescendants(artifactId)
    .map((artifact) => artifact.id);
}

export function getDescendants(
  artifactId: string,
  artifacts: BaseArtifact[]
): BaseArtifact[] {
  return new ArtifactLineageGraph(artifacts).getDescendants(artifactId);
}

function cloneArtifact(artifact: BaseArtifact): BaseArtifact {
  return {
    ...artifact,
    parentIds: [...artifact.parentIds],
    metadata: { ...artifact.metadata }
  };
}
