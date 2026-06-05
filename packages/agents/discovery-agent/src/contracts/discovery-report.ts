export interface DiscoveryReport {
  problemSummary: string;
  affectedSystems: string[];
  repositories: string[];
  dependencies: string[];
  risks: string[];
  openQuestions: string[];
  recommendedNextSteps: string[];
}
