import { Injectable, inject } from '@angular/core';
import { TodoRepository } from './todo.repository';
import { ActivityRepository } from '../activity/activity.repository';
import { Todo, CreateTodoInput, TodoStatus } from './todo.model';

/**
 * Todo iş mantığı. Mutasyondan SONRA anlamlı olayları loglar.
 */
@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly todos = inject(TodoRepository);
  private readonly activity = inject(ActivityRepository);

  async add(input: CreateTodoInput): Promise<Todo> {
    const todo = await this.todos.create(input);
    await this.activity.record({
      projectId: todo.projectId,
      type: 'todo_added',
      summary: `Todo eklendi: ${todo.title}`,
      meta: { todoId: todo.id, category: todo.category },
    });
    return todo;
  }

  async changeStatus(todo: Todo, status: TodoStatus): Promise<void> {
    await this.todos.updateStatus(todo.id, status);
    if (status === 'done') {
      await this.activity.record({
        projectId: todo.projectId,
        type: 'todo_done',
        summary: `Tamamlandı: ${todo.title}`,
        meta: { todoId: todo.id },
      });
    }
  }
}
