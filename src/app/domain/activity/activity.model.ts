export type ActivityType =
  | 'status_change' | 'next_action_change'
  | 'todo_added' | 'todo_done' | 'decision_added' | 'note_added';

export interface Activity {
  id: string;
  projectId: string;
  type: ActivityType;
  summary: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

export interface RecordActivityInput {
  projectId: string;
  type: ActivityType;
  summary: string;
  meta?: Record<string, unknown>;
}
