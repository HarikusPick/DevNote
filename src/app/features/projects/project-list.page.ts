import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectRepository } from '../../domain/project/project.repository';
import { Project, ProjectStatus } from '../../domain/project/project.model';
import { WorkspaceShell } from '../../shared/workspace-shell/workspace-shell';
import { STATUS_META } from '../../domain/project/project-status.meta';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, WorkspaceShell],
  templateUrl: './project-list.page.html',
  styleUrl: './project-list.page.scss',
})
export class ProjectListPage implements OnInit {
  private readonly projectRepo = inject(ProjectRepository);

  readonly projects = signal<Project[]>([]);
  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly modalOpen = signal(false);

  readonly count = computed(() => this.projects().length);
  readonly statusMeta = STATUS_META;

  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl(''),
  });

  async ngOnInit() {
    await this.loadProjects();
  }

  async loadProjects() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const projects = await this.projectRepo.getAll();
      this.projects.set(projects);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Projeler yüklenemedi.');
    } finally {
      this.loading.set(false);
    }
  }

  openModal() {
    this.form.reset({ name: '', description: '' });
    this.error.set(null);
    this.modalOpen.set(true);
  }

  closeModal() {
    if (this.creating()) return;
    this.modalOpen.set(false);
  }

  async createProject() {
    if (this.form.invalid || this.creating()) return;
    this.creating.set(true);
    this.error.set(null);
    try {
      const project = await this.projectRepo.create({
        name: this.form.value.name!,
        description: this.form.value.description ?? '',
      });
      this.projects.update(ps => [project, ...ps]);
      this.modalOpen.set(false);
      this.form.reset({ name: '', description: '' });
    } catch (err: any) {
      this.error.set(err?.message ?? 'Proje oluşturulamadı.');
    } finally {
      this.creating.set(false);
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
