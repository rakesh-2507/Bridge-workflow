export interface WorkflowStage {
  id: string;
  stage: string;
  details: string;
}

export interface WorkflowDefinition {
  id: string;
  title: string;
  description: string;
  accent: "cyan" | "purple";
  stages: WorkflowStage[];
}