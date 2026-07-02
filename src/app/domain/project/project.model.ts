export type ProjectStatus =
  | 'idea' | 'planning' | 'in_progress' | 'blocked'
  | 'testing' | 'on_hold' | 'done' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  stage: string;
  nextAction: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}
