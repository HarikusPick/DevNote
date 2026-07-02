import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { ProjectRepository } from './domain/project/project.repository';
import { SupabaseProjectRepository } from './data/project/supabase-project.repository';
import { TodoRepository } from './domain/todo/todo.repository';
import { SupabaseTodoRepository } from './data/todo/supabase-todo.repository';
import { NoteRepository } from './domain/note/note.repository';
import { SupabaseNoteRepository } from './data/note/supabase-note.repository';
import { ActivityRepository } from './domain/activity/activity.repository';
import { SupabaseActivityRepository } from './data/activity/supabase-activity.repository';
import { DecisionRepository } from './domain/decision/decision.repository';
import { SupabaseDecisionRepository } from './data/decision/supabase-decision.repository';
import { AttachmentRepository } from './domain/attachment/attachment.repository';
import { SupabaseAttachmentRepository } from './data/attachment/supabase-attachment.repository';
import { CollaborationRepository } from './domain/collaboration/collaboration.repository';
import { SupabaseCollaborationRepository } from './data/collaboration/supabase-collaboration.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: ProjectRepository, useClass: SupabaseProjectRepository },
    { provide: TodoRepository, useClass: SupabaseTodoRepository },
    { provide: NoteRepository, useClass: SupabaseNoteRepository },
    { provide: ActivityRepository, useClass: SupabaseActivityRepository },
    { provide: DecisionRepository, useClass: SupabaseDecisionRepository },
    { provide: AttachmentRepository, useClass: SupabaseAttachmentRepository },
    { provide: CollaborationRepository, useClass: SupabaseCollaborationRepository },
  ],
};
