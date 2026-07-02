export type MemberRole = 'owner' | 'editor' | 'viewer';
export type InviteRole = 'editor' | 'viewer';

export interface ProjectMember {
  userId: string;
  email: string;
  role: MemberRole;
}

export interface ProjectInvitation {
  id: string;
  email: string;
  role: InviteRole;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: Date;
}
