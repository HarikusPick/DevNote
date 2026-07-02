import { Project } from '../project/project.model';
import { Todo } from '../todo/todo.model';

/** Bir projenin "kaldığım yer" özeti — aggregation sonucu. */
export interface ProjectSnapshot {
  project: Project | null;
  nextAction: string;
  openTodos: Todo[];   // next + in_progress + blocked
  blocked: Todo[];     // yalnızca blocked
  recent: Todo[];      // son güncellenen 5 todo
  counts: { open: number; done: number };
}
