import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { ActivityRepository } from '../../domain/activity/activity.repository';
import { Activity, RecordActivityInput } from '../../domain/activity/activity.model';

@Injectable()
export class SupabaseActivityRepository extends ActivityRepository {
  private readonly client = inject(SupabaseClientService).client;

  override async getByProject(projectId: string): Promise<Activity[]> {
    const { data, error } = await this.client
      .from('activities')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(this.toDomain);
  }

  override async record(input: RecordActivityInput): Promise<void> {
    const { error } = await this.client.from('activities').insert({
      project_id: input.projectId,
      type: input.type,
      summary: input.summary,
      meta: input.meta ?? {},
    });
    if (error) throw error;
  }

  // DB satırı (snake_case) → domain modeli (camelCase). `any` sadece burada.
  private toDomain(row: any): Activity {
    return {
      id: row.id,
      projectId: row.project_id,
      type: row.type,
      summary: row.summary,
      meta: row.meta ?? undefined,
      createdAt: new Date(row.created_at),
    };
  }
}
