import { Injectable, inject } from '@angular/core';
import { ProjectRepository } from './project.repository';
import { ActivityRepository } from '../activity/activity.repository';
import { Project, ProjectStatus } from './project.model';
import { STATUS_META } from './project-status.meta';

interface MetaChanges {
  name: string;
  description: string;
  status: ProjectStatus;
  stage: string;
  nextAction: string;
}

/**
 * Proje iş mantığı. Mutasyondan SONRA anlamlı olayları activity'ye loglar.
 * Loglama burada (serviste) yapılır — component'te değil.
 */
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly projects = inject(ProjectRepository);
  private readonly activity = inject(ActivityRepository);

  /** status/stage/nextAction günceller; değişen anlamlı alanları loglar. Güncel projeyi döner. */
  async updateMeta(project: Project, changes: MetaChanges): Promise<Project> {
    await this.projects.update(project.id, changes);

    if (changes.status !== project.status) {
      await this.activity.record({
        projectId: project.id,
        type: 'status_change',
        summary: `Durum: ${STATUS_META[project.status].label} → ${STATUS_META[changes.status].label}`,
        meta: { from: project.status, to: changes.status },
      });
    }

    if (changes.nextAction !== project.nextAction) {
      await this.activity.record({
        projectId: project.id,
        type: 'next_action_change',
        summary: changes.nextAction
          ? `Sıradaki aksiyon: "${changes.nextAction}"`
          : 'Sıradaki aksiyon temizlendi',
        meta: { from: project.nextAction, to: changes.nextAction },
      });
    }

    return { ...project, ...changes, updatedAt: new Date() };
  }
}
