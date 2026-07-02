import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client = inject(SupabaseClientService).client;

  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this.claimInvitations();
    return data;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) throw error;
    // Oturum hemen açıldıysa (e-posta doğrulama kapalıysa) bekleyen davetleri al.
    if (data.session) await this.claimInvitations();
    return data;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getSession() {
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  async getUserId(): Promise<string | null> {
    const { data } = await this.client.auth.getSession();
    return data.session?.user.id ?? null;
  }

  /** Sunucuda doğrulanmış kullanıcı (token geçersiz/süresi dolmuşsa null). */
  async getValidUser() {
    const { data, error } = await this.client.auth.getUser();
    if (error) return null;
    return data.user;
  }

  /** E-postayla eşleşen bekleyen davetleri üyeliğe çevirir (DB tarafı SECURITY DEFINER). */
  async claimInvitations() {
    const { error } = await this.client.rpc('claim_my_invitations');
    if (error) console.warn('Davet kabul edilemedi:', error.message);
  }
}
