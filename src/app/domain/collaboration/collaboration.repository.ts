import { ProjectMember, ProjectInvitation, InviteRole } from './collaboration.model';

export abstract class CollaborationRepository {
  abstract getMembers(projectId: string): Promise<ProjectMember[]>;
  abstract getPendingInvitations(projectId: string): Promise<ProjectInvitation[]>;
  /** Başarılıysa null; davet kaydedildi ama e-posta gitmediyse uyarı metni döner. */
  abstract invite(projectId: string, email: string, role: InviteRole): Promise<string | null>;
  abstract revokeInvitation(invitationId: string): Promise<void>;
  abstract removeMember(projectId: string, userId: string): Promise<void>;
}
