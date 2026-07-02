import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { NoteRepository } from '../../domain/note/note.repository';
import { Note, CreateNoteInput } from '../../domain/note/note.model';

@Injectable()
export class SupabaseNoteRepository extends NoteRepository {
  private readonly client = inject(SupabaseClientService).client;

  override async getByProject(projectId: string): Promise<Note[]> {
    const { data, error } = await this.client
      .from('notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(this.toDomain);
  }

  override async create(input: CreateNoteInput): Promise<Note> {
    const { data, error } = await this.client
      .from('notes')
      .insert({ project_id: input.projectId, content: input.content })
      .select()
      .single();
    if (error) throw error;
    return this.toDomain(data);
  }

  override async update(id: string, content: string): Promise<void> {
    const { error } = await this.client
      .from('notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  override async delete(id: string): Promise<void> {
    const { error } = await this.client.from('notes').delete().eq('id', id);
    if (error) throw error;
  }

  // DB satırı (snake_case) → domain modeli (camelCase). `any` sadece burada.
  private toDomain(row: any): Note {
    return {
      id: row.id,
      projectId: row.project_id,
      content: row.content,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
