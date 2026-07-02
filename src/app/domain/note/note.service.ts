import { Injectable, inject } from '@angular/core';
import { NoteRepository } from './note.repository';
import { ActivityRepository } from '../activity/activity.repository';
import { Note, CreateNoteInput } from './note.model';

/**
 * Not iş mantığı. Mutasyondan SONRA anlamlı olayları loglar.
 */
@Injectable({ providedIn: 'root' })
export class NoteService {
  private readonly notes = inject(NoteRepository);
  private readonly activity = inject(ActivityRepository);

  async add(input: CreateNoteInput): Promise<Note> {
    const note = await this.notes.create(input);
    await this.activity.record({
      projectId: note.projectId,
      type: 'note_added',
      summary: 'Not eklendi',
      meta: { noteId: note.id },
    });
    return note;
  }
}
