import type { ArtifactRegistry, BaseArtifact } from "@apdos/artifacts";
import {
  RuntimeExecutionError,
  type RuntimeSkillExecution
} from "../contracts/runtime-orchestration.js";

export class RuntimeArtifactGenerator {
  constructor(private readonly artifactRegistry?: ArtifactRegistry) {}

  async createArtifactsFromExecution(executions: RuntimeSkillExecution[]): Promise<BaseArtifact[]> {
    const artifactsById = new Map<string, BaseArtifact>();

    for (const execution of executions) {
      for (const artifact of execution.result.artifacts) {
        artifactsById.set(artifact.id, {
          ...artifact,
          parentIds: [...artifact.parentIds],
          metadata: { ...artifact.metadata }
        });
      }
    }

    const artifacts = [...artifactsById.values()];

    if (!this.artifactRegistry) {
      return artifacts;
    }

    const registeredArtifacts: BaseArtifact[] = [];

    for (const artifact of artifacts) {
      try {
        registeredArtifacts.push(await this.artifactRegistry.register(artifact));
      } catch (error) {
        throw new RuntimeExecutionError(`Artifact creation failed: ${artifact.id}`, error);
      }
    }

    return registeredArtifacts;
  }
}
