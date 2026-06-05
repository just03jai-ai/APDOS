import type { ArtifactType, BaseArtifact } from "@apdos/artifacts";
import type {
  ArtifactValidator,
  ValidationContext
} from "../contracts/artifact-validator.js";
import type { ValidationResult } from "../contracts/validation-result.js";

export class ValidatorRegistry {
  private readonly validators = new Map<ArtifactType, ArtifactValidator>();

  constructor(validators: ArtifactValidator[] = []) {
    for (const validator of validators) {
      this.registerValidator(validator);
    }
  }

  registerValidator(validator: ArtifactValidator): void {
    if (this.validators.has(validator.artifactType)) {
      throw new Error(`Validator already registered: ${validator.artifactType}`);
    }

    this.validators.set(validator.artifactType, validator);
  }

  getValidator(artifactType: ArtifactType): ArtifactValidator | undefined {
    return this.validators.get(artifactType);
  }

  validateArtifact(
    artifact: BaseArtifact,
    context: ValidationContext = {}
  ): ValidationResult {
    const validator = this.getValidator(artifact.type);

    if (!validator) {
      throw new Error(`Validator not found for artifact type: ${artifact.type}`);
    }

    return validator.validate(artifact, context);
  }
}
