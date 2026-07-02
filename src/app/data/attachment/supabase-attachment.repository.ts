import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../core/supabase/supabase-client.service';
import { AttachmentRepository } from '../../domain/attachment/attachment.repository';
import { Attachment } from '../../domain/attachment/attachment.model';

const BUCKET = 'project-files';
const SIGNED_URL_TTL = 60; // saniye

@Injectable()
export class SupabaseAttachmentRepository extends AttachmentRepository {
  private readonly client = inject(SupabaseClientService).client;

  override async getByProject(projectId: string): Promise<Attachment[]> {
    const { data, error } = await this.client
      .from('attachments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(this.toDomain);
  }

  override async upload(projectId: string, file: File): Promise<Attachment> {
    // Storage RLS yolun ilk klasörünü user_id sayar → {user_id}/{project_id}/{uuid}-{fileName}
    const userId = await this.requireUserId();
    const safeName = this.sanitizeFileName(file.name);
    const storagePath = `${userId}/${projectId}/${crypto.randomUUID()}-${safeName}`;

    // 1) Önce storage'a yükle
    const { error: uploadError } = await this.client.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type || undefined, upsert: false });
    if (uploadError) throw uploadError;

    // 2) Sonra metadata satırını yaz
    const { data, error } = await this.client
      .from('attachments')
      .insert({
        project_id: projectId,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type ?? '',
        size: file.size,
      })
      .select()
      .single();

    if (error) {
      // Satır yazılamazsa yüklenen objeyi geri al (yetim dosya bırakma)
      await this.client.storage.from(BUCKET).remove([storagePath]);
      throw error;
    }
    return this.toDomain(data);
  }

  override async getDownloadUrl(storagePath: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL);
    if (error) throw error;
    return data.signedUrl;
  }

  override async delete(attachment: Attachment): Promise<void> {
    // 1) Önce storage objesini sil
    const { error: storageError } = await this.client.storage
      .from(BUCKET)
      .remove([attachment.storagePath]);
    if (storageError) throw storageError;

    // 2) Sonra satırı sil
    const { error } = await this.client.from('attachments').delete().eq('id', attachment.id);
    if (error) throw error;
  }

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) throw error ?? new Error('Oturum bulunamadı.');
    return data.user.id;
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  // DB satırı (snake_case) → domain modeli (camelCase). `any` sadece burada.
  private toDomain(row: any): Attachment {
    return {
      id: row.id,
      projectId: row.project_id,
      fileName: row.file_name,
      storagePath: row.storage_path,
      mimeType: row.mime_type,
      size: Number(row.size),
      createdAt: new Date(row.created_at),
    };
  }
}
