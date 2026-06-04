import {
  ApprovalStatus,
  type ApprovalRequest,
  type ApprovalType
} from "@apdos/approval-engine";
import type { ArtifactType, BaseArtifact } from "@apdos/artifacts";
import type {
  ValidationContext
} from "../contracts/artifact-validator.js";
import type {
  ValidationFinding,
  ValidationSeverity
} from "../contracts/validation-finding.js";
import type { ValidationResult } from "../contracts/validation-result.js";

export interface ValidationRule {
  id: string;
  evaluate(
    artifact: BaseArtifact,
    context: ValidationContext
  ): ValidationFinding[];
}

const SCORE_PENALTY: Record<ValidationSeverity, number> = {
  LOW: 5,
  MEDIUM: 15,
  HIGH: 30,
  CRITICAL: 45
};

export function evaluateValidationRules(input: {
  artifact: BaseArtifact;
  rules: ValidationRule[];
  context?: ValidationContext;
}): ValidationResult {
  const findings = input.rules.flatMap((rule) =>
    rule.evaluate(input.artifact, input.context ?? {})
  );
  const score = Math.max(
    0,
    100 - findings.reduce((total, finding) => total + SCORE_PENALTY[finding.severity], 0)
  );

  return {
    artifactId: input.artifact.id,
    artifactType: input.artifact.type,
    valid: findings.length === 0,
    score,
    findings
  };
}

export function createRequiredFieldsRule(input: {
  id: string;
  requiredMetadataFields?: string[];
}): ValidationRule {
  return {
    id: input.id,
    evaluate: (artifact) => {
      const findings: ValidationFinding[] = [];

      if (!artifact.title.trim()) {
        findings.push(createFinding(input.id, "HIGH", "Artifact title is required."));
      }

      if (!artifact.description.trim()) {
        findings.push(createFinding(input.id, "HIGH", "Artifact description is required."));
      }

      for (const field of input.requiredMetadataFields ?? []) {
        if (!hasMetadataValue(artifact, field)) {
          findings.push(
            createFinding(input.id, "HIGH", `Required metadata field is missing: ${field}.`)
          );
        }
      }

      return findings;
    }
  };
}

export function createArtifactDependencyRule(input: {
  id: string;
  requiredParentTypes: ArtifactType[];
}): ValidationRule {
  return {
    id: input.id,
    evaluate: (artifact, context) => {
      const artifactsById = new Map(
        (context.artifacts ?? []).map((candidate) => [candidate.id, candidate])
      );
      const parentArtifacts = artifact.parentIds
        .map((parentId) => artifactsById.get(parentId))
        .filter((parent): parent is BaseArtifact => parent !== undefined);
      const findings: ValidationFinding[] = [];

      for (const requiredParentType of input.requiredParentTypes) {
        if (!parentArtifacts.some((parent) => parent.type === requiredParentType)) {
          findings.push(
            createFinding(
              input.id,
              "HIGH",
              `Artifact requires a parent artifact of type: ${requiredParentType}.`
            )
          );
        }
      }

      for (const parentId of artifact.parentIds) {
        if (!artifactsById.has(parentId)) {
          findings.push(
            createFinding(input.id, "MEDIUM", `Parent artifact was not provided: ${parentId}.`)
          );
        }
      }

      return findings;
    }
  };
}

export function createApprovalRequirementRule(input: {
  id: string;
  approvalType: ApprovalType;
}): ValidationRule {
  return {
    id: input.id,
    evaluate: (artifact, context) => {
      const workflowId = readMetadataString(artifact, "workflowId");
      const stageId = readMetadataString(artifact, "stageId");

      if (!workflowId || !stageId) {
        return [
          createFinding(
            input.id,
            "CRITICAL",
            "Artifact requires workflowId and stageId metadata for approval validation."
          )
        ];
      }

      const approval = (context.approvals ?? []).find((candidate: ApprovalRequest) =>
        candidate.workflowId === workflowId &&
        candidate.stageId === stageId &&
        candidate.approvalType === input.approvalType &&
        candidate.status === ApprovalStatus.APPROVED
      );

      return approval
        ? []
        : [
            createFinding(
              input.id,
              "CRITICAL",
              `Artifact requires approved gate: ${input.approvalType}.`
            )
          ];
    }
  };
}

function createFinding(
  ruleId: string,
  severity: ValidationSeverity,
  message: string
): ValidationFinding {
  return {
    severity,
    message,
    ruleId
  };
}

function hasMetadataValue(artifact: BaseArtifact, field: string): boolean {
  const value = artifact.metadata[field];

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== undefined && value !== null;
}

function readMetadataString(
  artifact: BaseArtifact,
  field: string
): string | undefined {
  const value = artifact.metadata[field];

  return typeof value === "string" && value.trim() ? value : undefined;
}
