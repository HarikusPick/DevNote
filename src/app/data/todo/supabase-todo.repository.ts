import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { TodoRepository } from '../../domain/todo/todo.repository';
import { Todo, CreateTodoInput, TodoStatus } from '../../domain/todo/todo.model';

@Injectable()
export class SupabaseTodoRepository extends TodoRepository {
  private readonly client = inject(SupabaseClientService).client;

  override async getByProject(projectId: string): Promise<Todo[]> {
    const { data, error } = await this.client
      .from('todos')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data.map(this.toDomain);
  }

  override async create(input: CreateTodoInput): Promise<Todo> {
    const { data, error } = await this.client
      .from('todos')
      .insert({
        project_id: input.projectId,
        title: input.title,
        description: input.description ?? '',
        category: input.category ?? 'task',
      })
      .select()
      .single();
    if (error) throw error;
    return this.toDomain(data);
  }

  override async updateStatus(id: string, status: TodoStatus): Promise<void> {
    const { error } = await this.client
      .from('todos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  override async update(
    id: string,
    changes: Partial<Pick<Todo, 'title' | 'description' | 'category' | 'sortOrder'>>,
  ): Promise<void> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (changes.title !== undefined) row['title'] = changes.title;
    if (changes.description !== undefined) row['description'] = changes.description;
    if (changes.category !== undefined) row['category'] = changes.category;
    if (changes.sortOrder !== undefined) row['sort_order'] = changes.sortOrder;

    const { error } = await this.client.from('todos').update(row).eq('id', id);
    if (error) throw error;
  }

  override async delete(id: string): Promise<void> {
    const { error } = await this.client.from('todos').delete().eq('id', id);
    if (error) throw error;
  }

  // DB satırı (snake_case) → domain modeli (camelCase). `any` sadece burada.
  private toDomain(row: any): Todo {
    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status,
      sortOrder: row.sort_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
