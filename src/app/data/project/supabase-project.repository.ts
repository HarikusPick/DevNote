import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { ProjectRepository } from '../../domain/project/project.repository';
import { Project, CreateProjectInput } from '../../domain/project/project.model';

@Injectable()
export class SupabaseProjectRepository extends ProjectRepository {
  private readonly client = inject(SupabaseClientService).client;

  override async getAll(): Promise<Project[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(this.toDomain);
  }

  override async getById(id: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? this.toDomain(data) : null;
  }

  override async create(input: CreateProjectInput): Promise<Project> {
    const { data: userData, error: userError } = await this.client.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('Oturum doğrulanamadı. Lütfen tekrar giriş yapın.');
    }

    const id = crypto.randomUUID();
    const { error } = await this.client.from('projects').insert({
      id,
      user_id: userData.user.id,
      name: input.name,
      description: input.description ?? '',
    });
    if (error) throw error;

    const project = await this.getById(id);
    if (!project) throw new Error('Proje oluşturuldu ancak tekrar okunamadı.');
    return project;
  }

  override async update(
    id: string,
    changes: Partial<Pick<Project, 'name' | 'description' | 'status' | 'stage' | 'nextAction'>>,
  ): Promise<void> {
    // Snapshot updated_at'i kullandığı için her güncellemede mutlaka set edilir.
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (changes.name !== undefined) row['name'] = changes.name;
    if (changes.description !== undefined) row['description'] = changes.description;
    if (changes.status !== undefined) row['status'] = changes.status;
    if (changes.stage !== undefined) row['stage'] = changes.stage;
    if (changes.nextAction !== undefined) row['next_action'] = changes.nextAction;

    const { error } = await this.client.from('projects').update(row).eq('id', id);
    if (error) throw error;
  }

  override async delete(id: string): Promise<void> {
    // İlişkili todos/notes/decisions/attachments/activities/üyeler DB'de cascade ile silinir.
    const { error } = await this.client.from('projects').delete().eq('id', id);
    if (error) throw error;
  }

  // DB satırı (snake_case) → domain modeli (camelCase). `any` sadece burada.
  private toDomain(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      stage: row.stage,
      nextAction: row.next_action,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
