import { DEFAULT_SKILL_GOVERNANCE_METADATA } from "../contracts/default-skill-governance.js";
import { SkillDependencyGraphService } from "../graph/skill-dependency-graph.js";
import { SkillMappingService } from "./skill-mapping-service.js";
import { SkillRecommendationService } from "./skill-recommendation-service.js";
import type { SkillGovernanceMetadata } from "../contracts/skill-governance-metadata.js";

export class SkillGovernanceService {
  readonly mapping: SkillMappingService;
  readonly graph: SkillDependencyGraphService;
  readonly recommendations: SkillRecommendationService;

  constructor(metadata: SkillGovernanceMetadata[] = DEFAULT_SKILL_GOVERNANCE_METADATA) {
    this.mapping = new SkillMappingService(metadata);
    this.graph = new SkillDependencyGraphService(metadata);
    this.recommendations = new SkillRecommendationService(this.mapping);
  }
}
