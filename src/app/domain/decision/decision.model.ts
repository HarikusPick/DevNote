export interface Decision {
  id: string;
  projectId: string;
  title: string;
  context: string;
  chosen: string;
  rejectedAlternatives: string;
  rationale: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDecisionInput {
  projectId: string;
  title: string;
  context?: string;
  chosen?: string;
  rejectedAlternatives?: string;
  rationale?: string;
}
