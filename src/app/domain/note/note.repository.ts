import { Note, CreateNoteInput } from './note.model';

export abstract class NoteRepository {
  abstract getByProject(projectId: string): Promise<Note[]>;
  abstract create(input: CreateNoteInput): Promise<Note>;
  abstract update(id: string, content: string): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
