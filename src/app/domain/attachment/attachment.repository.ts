import { Attachment } from './attachment.model';

export abstract class AttachmentRepository {
  abstract getByProject(projectId: string): Promise<Attachment[]>;
  abstract upload(projectId: string, file: File): Promise<Attachment>; // storage'a yükle + tablo satırı
  abstract getDownloadUrl(storagePath: string): Promise<string>;       // signed URL
  abstract delete(attachment: Attachment): Promise<void>;              // storage objesi + satır
}
