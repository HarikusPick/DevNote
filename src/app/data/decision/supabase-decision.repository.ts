import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { DecisionRepository } from '../../domain/decision/decision.repository';
import { Decision, CreateDecisionInput } from '../../domain/decision/decision.model';

@Injectable()
export class SupabaseDecisionRepository extends DecisionRepository {
  private readonly client = inject(SupabaseClientService).client;

  override async getByProject(projectId: string): Promise<Decision[]> {
    const { data, error } = await this.client
      .from('decisions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(this.toDomain);
  }

  override async create(input: CreateDecisionInput): Promise<Decision> {
    const { data, error } = await this.client
      .from('decisions')
      .insert({
        project_id: input.projectId,
        title: input.title,
        context: input.context ?? '',
        chosen: input.chosen ?? '',
        rejected_alternatives: input.rejectedAlternatives ?? '',
        rationale: input.rationale ?? '',
      })
      .select()
      .single();
    if (error) throw error;
    return this.toDomain(data);
  }

  override async update(
    id: string,
    changes: Partial<Omit<CreateDecisionInput, 'projectId'>>,
  ): Promise<void> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (changes.title !== undefined) row['title'] = changes.title;
    if (changes.context !== undefined) row['context'] = changes.context;
    if (changes.chosen !== undefined) row['chosen'] = changes.chosen;
    if (changes.rejectedAlternatives !== undefined) row['rejected_alternatives'] = changes.rejectedAlternatives;
    if (changes.rationale !== undefined) row['rationale'] = changes.rationale;

    const { error } = await this.client.from('decisions').update(row).eq('id', id);
    if (error) throw error;
  }

  override async delete(id: string): Promise<void> {
    const { error } = await this.client.from('decisions').delete().eq('id', id);
    if (error) throw error;
  }

  // DB satırı (snake_case) → domain modeli (camelCase). `any` sadece burada.
  // Dikkat: rejected_alternatives ↔ rejectedAlternatives çevrimi.
  private toDomain(row: any): Decision {
    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      context: row.context,
      chosen: row.chosen,
      rejectedAlternatives: row.rejected_alternatives,
      rationale: row.rationale,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
