export type GovernanceDecision = "GO" | "CONDITIONAL_GO" | "NO_GO";
export type GovernanceFindingSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface GovernanceFindingEvidence {
  message: string;
  severity: GovernanceFindingSeverity;
  skillId: string;
}

export interface GovernancePackageContents {
  riskAssessment: string[];
  securityReview: string[];
  complianceReview: string[];
  dependencyRisks: string[];
  architectureConcerns: string[];
  qualityFindings: string[];
  openQuestions: string[];
  approvalChecklist: string[];
  recommendations: string[];
  decision: GovernanceDecision;
  findings: GovernanceFindingEvidence[];
}
