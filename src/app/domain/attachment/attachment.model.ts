export interface Attachment {
  id: string;
  projectId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}
