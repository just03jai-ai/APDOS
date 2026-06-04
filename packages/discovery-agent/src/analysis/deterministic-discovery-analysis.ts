import type { DiscoveryRequest } from "../contracts/discovery-request.js";
import type { DiscoveryReport } from "../contracts/discovery-report.js";

export function analyzeGoalWithDeterministicRules(
  request: DiscoveryRequest
): DiscoveryReport {
  validateDiscoveryRequest(request);

  const normalizedGoal = normalizeGoal(request.goal);
  const keywords = new Set(normalizedGoal.split(" ").filter(Boolean));
  const affectedSystems = resolveAffectedSystems(keywords);
  const repositories = resolveRepositories(affectedSystems);

  return {
    problemSummary: `The workflow goal is to ${normalizedGoal}. APDOS should convert this goal into governed artifacts with validation, approval, and release traceability.`,
    affectedSystems,
    repositories,
    dependencies: resolveDependencies(affectedSystems),
    risks: resolveRisks(keywords, affectedSystems),
    openQuestions: resolveOpenQuestions(keywords),
    recommendedNextSteps: [
      "Create a PRD from this discovery report.",
      "Validate downstream artifacts before stage progression.",
      "Require approval gates before release package creation.",
      "Preserve artifact lineage from idea through release package."
    ]
  };
}

export function validateDiscoveryRequest(request: DiscoveryRequest): void {
  if (!request.goal.trim()) {
    throw new Error("Discovery goal is required");
  }

  if (!request.workflowId.trim()) {
    throw new Error("Discovery workflowId is required");
  }

  if (!Array.isArray(request.contextIds)) {
    throw new Error("Discovery contextIds must be an array");
  }
}

function normalizeGoal(goal: string): string {
  return goal.trim().replace(/\s+/g, " ");
}

function resolveAffectedSystems(keywords: Set<string>): string[] {
  const systems = new Set<string>([
    "artifact-engine",
    "workflow-engine",
    "validation-engine",
    "approval-engine"
  ]);

  if (keywords.has("supplier") || keywords.has("payment")) {
    systems.add("supplier-management");
    systems.add("payment-operations");
  }

  if (keywords.has("approval")) {
    systems.add("governance-controls");
  }

  if (keywords.has("release")) {
    systems.add("release-management");
  }

  return Array.from(systems);
}

function resolveRepositories(affectedSystems: string[]): string[] {
  const repositories = new Set<string>(["apdos"]);

  if (affectedSystems.includes("supplier-management")) {
    repositories.add("supplier-platform");
  }

  if (affectedSystems.includes("payment-operations")) {
    repositories.add("payment-services");
  }

  return Array.from(repositories);
}

function resolveDependencies(affectedSystems: string[]): string[] {
  const dependencies = new Set<string>([
    "artifact lineage",
    "workflow stage history",
    "validation findings",
    "approval records"
  ]);

  if (affectedSystems.includes("payment-operations")) {
    dependencies.add("payment approval policy");
  }

  if (affectedSystems.includes("supplier-management")) {
    dependencies.add("supplier identity and account data");
  }

  return Array.from(dependencies);
}

function resolveRisks(
  keywords: Set<string>,
  affectedSystems: string[]
): string[] {
  const risks = new Set<string>([
    "Workflow progression without validated artifacts.",
    "Release package missing complete artifact lineage."
  ]);

  if (keywords.has("approval")) {
    risks.add("Approval gates may be bypassed or resolved without human governance.");
  }

  if (affectedSystems.includes("payment-operations")) {
    risks.add("Payment policy errors can create financial or compliance exposure.");
  }

  return Array.from(risks);
}

function resolveOpenQuestions(keywords: Set<string>): string[] {
  const questions = new Set<string>([
    "Which approver roles are required for each protected workflow stage?",
    "What validation score threshold is required before approval?",
    "Which artifacts must be included in release package evidence?"
  ]);

  if (keywords.has("supplier") || keywords.has("payment")) {
    questions.add("Which supplier payment thresholds require additional approval?");
  }

  return Array.from(questions);
}
