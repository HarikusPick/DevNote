export interface Note {
  id: string;
  projectId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteInput {
  projectId: string;
  content: string;
}
