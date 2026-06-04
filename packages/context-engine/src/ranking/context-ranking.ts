import type { BaseArtifact } from "@apdos/artifacts";
import type { WorkflowHistoryEvent } from "@apdos/workflow-engine";

export type ArtifactContextSource = "direct" | "parent" | "workflow-history";

export interface RankedArtifact {
  artifact: BaseArtifact;
  rank: number;
  source: ArtifactContextSource;
}

const SOURCE_RANK: Record<ArtifactContextSource, number> = {
  direct: 0,
  parent: 1,
  "workflow-history": 2
};

export function rankArtifacts(input: {
  directArtifactIds: string[];
  artifacts: BaseArtifact[];
  workflowHistory: WorkflowHistoryEvent[];
}): RankedArtifact[] {
  const directArtifactIds = new Set(input.directArtifactIds);
  const artifactsById = new Map(input.artifacts.map((artifact) => [artifact.id, artifact]));
  const parentArtifactIds = new Set<string>();
  const workflowHistoryArtifactIds = new Set<string>();

  for (const artifactId of directArtifactIds) {
    const artifact = artifactsById.get(artifactId);
    for (const parentId of artifact?.parentIds ?? []) {
      parentArtifactIds.add(parentId);
    }
  }

  for (const event of input.workflowHistory) {
    for (const artifactId of event.artifactIds) {
      workflowHistoryArtifactIds.add(artifactId);
    }
  }

  return input.artifacts
    .map((artifact) => {
      const source = resolveArtifactSource({
        artifactId: artifact.id,
        directArtifactIds,
        parentArtifactIds,
        workflowHistoryArtifactIds
      });

      return source
        ? {
            artifact,
            rank: SOURCE_RANK[source],
            source
          }
        : undefined;
    })
    .filter((artifact): artifact is RankedArtifact => artifact !== undefined)
    .sort((left, right) => {
      if (left.rank !== right.rank) {
        return left.rank - right.rank;
      }

      return left.artifact.createdAt.localeCompare(right.artifact.createdAt) ||
        left.artifact.id.localeCompare(right.artifact.id);
    });
}

function resolveArtifactSource(input: {
  artifactId: string;
  directArtifactIds: Set<string>;
  parentArtifactIds: Set<string>;
  workflowHistoryArtifactIds: Set<string>;
}): ArtifactContextSource | undefined {
  if (input.directArtifactIds.has(input.artifactId)) {
    return "direct";
  }

  if (input.parentArtifactIds.has(input.artifactId)) {
    return "parent";
  }

  if (input.workflowHistoryArtifactIds.has(input.artifactId)) {
    return "workflow-history";
  }

  return undefined;
}
