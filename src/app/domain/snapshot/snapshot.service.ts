import { Injectable, inject } from '@angular/core';
import { ProjectRepository } from '../project/project.repository';
import { TodoRepository } from '../todo/todo.repository';
import { Project } from '../project/project.model';
import { Todo, TodoStatus } from '../todo/todo.model';
import { ProjectSnapshot } from './snapshot.model';

const OPEN_STATUSES: TodoStatus[] = ['next', 'in_progress', 'blocked'];

@Injectable({ providedIn: 'root' })
export class SnapshotService {
  private readonly projects = inject(ProjectRepository);
  private readonly todos = inject(TodoRepository);

  /** Veriyi repo'lardan çekip özetler (tek seferlik kullanım için). */
  async getForProject(projectId: string): Promise<ProjectSnapshot> {
    const project = await this.projects.getById(projectId);
    const all = await this.todos.getByProject(projectId);
    return this.build(project, all);
  }

  /**
   * Saf aggregation: verilen proje + todolardan özet üretir.
   * Tüm filtreleme/hesaplama burada; sayfa yalnızca sonucu gösterir.
   * Reaktif kullanım için component'te computed() içinden çağrılır.
   */
  build(project: Project | null, all: Todo[]): ProjectSnapshot {
    const open = all.filter(t => OPEN_STATUSES.includes(t.status));
    const recent = [...all].sort((a, b) => +b.updatedAt - +a.updatedAt).slice(0, 5);
    return {
      project,
      nextAction: project?.nextAction ?? '',
      openTodos: open,
      blocked: open.filter(t => t.status === 'blocked'),
      recent,
      counts: {
        open: open.length,
        done: all.filter(t => t.status === 'done').length,
      },
    };
  }
}
