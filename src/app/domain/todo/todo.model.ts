export type TodoCategory = 'task' | 'bug';
export type TodoStatus = 'backlog' | 'next' | 'in_progress' | 'blocked' | 'done';

export interface Todo {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: TodoCategory;
  status: TodoStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTodoInput {
  projectId: string;
  title: string;
  description?: string;
  category?: TodoCategory;
}
