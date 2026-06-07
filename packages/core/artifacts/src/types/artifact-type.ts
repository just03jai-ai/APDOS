export enum ArtifactType {
  IDEA = "IDEA",
  DISCOVERY_REPORT = "DISCOVERY_REPORT",
  PRD = "PRD",
  DESIGN_PACKAGE = "DESIGN_PACKAGE",
  TECH_SPEC = "TECH_SPEC",
  IMPLEMENTATION_PLAN = "IMPLEMENTATION_PLAN",
  TASK = "TASK",
  CODE_CHANGE = "CODE_CHANGE",
  ENGINEERING_PACKAGE = "ENGINEERING_PACKAGE",
  QA_PACKAGE = "QA_PACKAGE",
  TEST_RESULT = "TEST_RESULT",
  GOVERNANCE_FINDING = "GOVERNANCE_FINDING",
  GOVERNANCE_PACKAGE = "GOVERNANCE_PACKAGE",
  RELEASE_PACKAGE = "RELEASE_PACKAGE"
}

export const ARTIFACT_TYPES = Object.values(ArtifactType);

export function isArtifactType(value: unknown): value is ArtifactType {
  return typeof value === "string" && ARTIFACT_TYPES.includes(value as ArtifactType);
}
