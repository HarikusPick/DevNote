import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { CollaborationRepository } from '../../domain/collaboration/collaboration.repository';
import {
  ProjectMember, ProjectInvitation, InviteRole,
} from '../../domain/collaboration/collaboration.model';

@Injectable()
export class SupabaseCollaborationRepository extends CollaborationRepository {
  private readonly client = inject(SupabaseClientService).client;

  override async getMembers(projectId: string): Promise<ProjectMember[]> {
    const { data, error } = await this.client.rpc('get_project_members', { p: projectId });
    if (error) throw error;
    return (data ?? []).map(this.toMember);
  }

  override async getPendingInvitations(projectId: string): Promise<ProjectInvitation[]> {
    const { data, error } = await this.client
      .from('project_invitations')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(this.toInvitation);
  }

  override async invite(projectId: string, email: string, role: InviteRole): Promise<string | null> {
    const { data, error } = await this.client.functions.invoke('invite-member', {
      body: { projectId, email, role },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data?.warning ?? null;
  }

  override async revokeInvitation(invitationId: string): Promise<void> {
    const { error } = await this.client
      .from('project_invitations')
      .delete()
      .eq('id', invitationId);
    if (error) throw error;
  }

  override async removeMember(projectId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // DB satırı → domain. `any` sadece bu mapper'larda.
  private toMember(row: any): ProjectMember {
    return { userId: row.user_id, email: row.email, role: row.role };
  }

  private toInvitation(row: any): ProjectInvitation {
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: new Date(row.created_at),
    };
  }
}
