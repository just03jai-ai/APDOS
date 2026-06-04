import { ApprovalType } from "@apdos/approval-engine";
import { ArtifactType, type BaseArtifact } from "@apdos/artifacts";
import type {
  ArtifactValidator,
  ValidationContext
} from "../contracts/artifact-validator.js";
import type { ValidationResult } from "../contracts/validation-result.js";
import {
  createApprovalRequirementRule,
  createArtifactDependencyRule,
  createRequiredFieldsRule,
  evaluateValidationRules,
  type ValidationRule
} from "../rules/rule-engine.js";

export class RuleBasedArtifactValidator implements ArtifactValidator {
  constructor(
    readonly artifactType: ArtifactType,
    private readonly rules: ValidationRule[]
  ) {}

  validate(
    artifact: BaseArtifact,
    context: ValidationContext = {}
  ): ValidationResult {
    if (artifact.type !== this.artifactType) {
      throw new Error(
        `Validator ${this.artifactType} cannot validate artifact type: ${artifact.type}`
      );
    }

    return evaluateValidationRules({
      artifact,
      rules: this.rules,
      context
    });
  }
}

export function createPrdValidator(): ArtifactValidator {
  return new RuleBasedArtifactValidator(ArtifactType.PRD, [
    createRequiredFieldsRule({
      id: "prd.required-fields",
      requiredMetadataFields: ["problemStatement", "successMetrics"]
    }),
    createArtifactDependencyRule({
      id: "prd.dependencies",
      requiredParentTypes: [ArtifactType.IDEA]
    })
  ]);
}

export function createTechSpecValidator(): ArtifactValidator {
  return new RuleBasedArtifactValidator(ArtifactType.TECH_SPEC, [
    createRequiredFieldsRule({
      id: "tech-spec.required-fields",
      requiredMetadataFields: ["architecture", "interfaces"]
    }),
    createArtifactDependencyRule({
      id: "tech-spec.dependencies",
      requiredParentTypes: [ArtifactType.PRD]
    }),
    createApprovalRequirementRule({
      id: "tech-spec.architecture-approval",
      approvalType: ApprovalType.ARCHITECTURE_APPROVAL
    })
  ]);
}

export function createReleasePackageValidator(): ArtifactValidator {
  return new RuleBasedArtifactValidator(ArtifactType.RELEASE_PACKAGE, [
    createRequiredFieldsRule({
      id: "release-package.required-fields",
      requiredMetadataFields: ["releaseVersion", "rollbackPlan"]
    }),
    createArtifactDependencyRule({
      id: "release-package.dependencies",
      requiredParentTypes: [ArtifactType.CODE_CHANGE, ArtifactType.TEST_RESULT]
    }),
    createApprovalRequirementRule({
      id: "release-package.production-approval",
      approvalType: ApprovalType.PRODUCTION_APPROVAL
    })
  ]);
}

export function createBuiltInValidators(): ArtifactValidator[] {
  return [
    createPrdValidator(),
    createTechSpecValidator(),
    createReleasePackageValidator()
  ];
}
