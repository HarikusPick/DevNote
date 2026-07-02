import { Todo, CreateTodoInput, TodoStatus } from './todo.model';

export abstract class TodoRepository {
  abstract getByProject(projectId: string): Promise<Todo[]>;
  abstract create(input: CreateTodoInput): Promise<Todo>;
  abstract updateStatus(id: string, status: TodoStatus): Promise<void>;
  abstract update(
    id: string,
    changes: Partial<Pick<Todo, 'title' | 'description' | 'category' | 'sortOrder'>>,
  ): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
