export type ValidationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ValidationFinding {
  severity: ValidationSeverity;
  message: string;
  ruleId: string;
}
