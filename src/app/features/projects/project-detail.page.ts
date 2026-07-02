import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProjectRepository } from '../../domain/project/project.repository';
import { TodoRepository } from '../../domain/todo/todo.repository';
import { NoteRepository } from '../../domain/note/note.repository';
import { ActivityRepository } from '../../domain/activity/activity.repository';
import { DecisionRepository } from '../../domain/decision/decision.repository';
import { AttachmentRepository } from '../../domain/attachment/attachment.repository';
import { ProjectService } from '../../domain/project/project.service';
import { TodoService } from '../../domain/todo/todo.service';
import { NoteService } from '../../domain/note/note.service';
import { DecisionService } from '../../domain/decision/decision.service';
import { Project, ProjectStatus } from '../../domain/project/project.model';
import { Todo, TodoStatus, TodoCategory } from '../../domain/todo/todo.model';
import { Note } from '../../domain/note/note.model';
import { Decision } from '../../domain/decision/decision.model';
import { Attachment } from '../../domain/attachment/attachment.model';
import { Activity } from '../../domain/activity/activity.model';
import { STATUS_META, PROJECT_STATUS_ORDER } from '../../domain/project/project-status.meta';
import {
  TODO_STATUS_META, TODO_STATUS_ORDER, TODO_CATEGORY_META, groupTodosByStatus, TodoGroup,
} from '../../domain/todo/todo-status.meta';
import { ACTIVITY_TONE } from '../../domain/activity/activity-meta';
import { SnapshotService } from '../../domain/snapshot/snapshot.service';
import { CollaborationRepository } from '../../domain/collaboration/collaboration.repository';
import { ProjectMember, ProjectInvitation, MemberRole, InviteRole } from '../../domain/collaboration/collaboration.model';
import { AuthService } from '../../core/auth/auth.service';
import { WorkspaceShell } from '../../shared/workspace-shell/workspace-shell';
import { RichEditor } from '../../shared/rich-editor/rich-editor';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, WorkspaceShell, CdkDropList, CdkDrag, CdkDragHandle, RichEditor],
  templateUrl: './project-detail.page.html',
  styleUrl: './project-detail.page.scss',
})
export class ProjectDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectRepo = inject(ProjectRepository);
  private readonly todoRepo = inject(TodoRepository);
  private readonly noteRepo = inject(NoteRepository);
  private readonly activityRepo = inject(ActivityRepository);
  private readonly decisionRepo = inject(DecisionRepository);
  private readonly attachmentRepo = inject(AttachmentRepository);
  private readonly collabRepo = inject(CollaborationRepository);
  private readonly authService = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly todoService = inject(TodoService);
  private readonly noteService = inject(NoteService);
  private readonly decisionService = inject(DecisionService);
  private readonly snapshotService = inject(SnapshotService);

  readonly project = signal<Project | null>(null);
  readonly todos = signal<Todo[]>([]);
  readonly notes = signal<Note[]>([]);
  readonly decisions = signal<Decision[]>([]);
  readonly attachments = signal<Attachment[]>([]);
  readonly activities = signal<Activity[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly savingMeta = signal(false);
  readonly addingTodo = signal(false);
  readonly addingNote = signal(false);
  readonly editingNoteId = signal<string | null>(null);
  readonly savingNote = signal(false);
  readonly addingDecision = signal(false);
  readonly decisionFormOpen = signal(false);
  readonly expandedDecisionId = signal<string | null>(null);
  readonly uploadingFile = signal(false);

  // İşbirliği
  readonly members = signal<ProjectMember[]>([]);
  readonly invitations = signal<ProjectInvitation[]>([]);
  readonly myRole = signal<MemberRole | null>(null);
  readonly inviting = signal(false);
  readonly shareInfo = signal<string | null>(null);
  readonly confirmDeleteOpen = signal(false);
  readonly deletingProject = signal(false);
  readonly isOwner = computed(() => this.myRole() === 'owner');
  readonly canEdit = computed(() => this.myRole() === 'owner' || this.myRole() === 'editor');

  readonly noteCount = computed(() => this.notes().length);
  readonly decisionCount = computed(() => this.decisions().length);
  readonly attachmentCount = computed(() => this.attachments().length);
  readonly memberCount = computed(() => this.members().length);

  // Sabit referanslar (template için)
  readonly statusMeta = STATUS_META;
  readonly statusOrder = PROJECT_STATUS_ORDER;
  readonly todoStatusMeta = TODO_STATUS_META;
  readonly todoStatusOrder = TODO_STATUS_ORDER;
  readonly categoryMeta = TODO_CATEGORY_META;
  readonly activityTone = ACTIVITY_TONE;

  readonly todoCount = computed(() => this.todos().length);

  // Türetilmiş veri: status değişince signal güncellenir, bunlar otomatik yeniden hesaplanır.
  readonly groups = computed(() => groupTodosByStatus(this.todos()));
  readonly snapshot = computed(() => this.snapshotService.build(this.project(), this.todos()));

  readonly metaForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl<ProjectStatus>('idea', { nonNullable: true }),
    stage: new FormControl('', { nonNullable: true }),
    nextAction: new FormControl('', { nonNullable: true }),
  });

  readonly addForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl<TodoCategory>('task', { nonNullable: true }),
  });

  // Notlar zengin metin (HTML) olarak tutulur — signal ile.
  readonly newNoteHtml = signal('');
  readonly editNoteHtml = signal('');

  readonly decisionForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    context: new FormControl('', { nonNullable: true }),
    chosen: new FormControl('', { nonNullable: true }),
    rejectedAlternatives: new FormControl('', { nonNullable: true }),
    rationale: new FormControl('', { nonNullable: true }),
  });

  readonly inviteForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<InviteRole>('editor', { nonNullable: true }),
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Proje bulunamadı.');
      this.loading.set(false);
      return;
    }
    await this.load(id);
  }

  private async load(id: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [project, todos, notes, decisions, attachments, activities] = await Promise.all([
        this.projectRepo.getById(id),
        this.todoRepo.getByProject(id),
        this.noteRepo.getByProject(id),
        this.decisionRepo.getByProject(id),
        this.attachmentRepo.getByProject(id),
        this.activityRepo.getByProject(id),
      ]);
      if (!project) {
        this.error.set('Proje bulunamadı.');
        return;
      }
      this.project.set(project);
      this.todos.set(todos);
      this.notes.set(notes);
      this.decisions.set(decisions);
      this.attachments.set(attachments);
      this.activities.set(activities);
      this.metaForm.setValue({
        name: project.name,
        description: project.description,
        status: project.status,
        stage: project.stage,
        nextAction: project.nextAction,
      });
      await this.loadCollaboration(id);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Veri yüklenemedi.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Üyeler + (sahipse) bekleyen davetler + kendi rolüm. */
  private async loadCollaboration(projectId: string) {
    try {
      const [members, uid] = await Promise.all([
        this.collabRepo.getMembers(projectId),
        this.authService.getUserId(),
      ]);
      this.members.set(members);
      this.myRole.set(members.find(m => m.userId === uid)?.role ?? null);
      if (this.isOwner()) {
        this.invitations.set(await this.collabRepo.getPendingInvitations(projectId));
      }
    } catch {
      // İşbirliği verisi yüklenemese bile sayfa çalışmaya devam etsin.
    }
  }

  /** Loglanan bir mutasyondan sonra geçmiş zaman çizelgesini tazeler. */
  private async refreshActivities() {
    const current = this.project();
    if (!current) return;
    try {
      this.activities.set(await this.activityRepo.getByProject(current.id));
    } catch {
      // Geçmiş tazelenemese bile asıl işlem başarılı; sessiz geç.
    }
  }

  /** ad/açıklama/status/stage/nextAction değiştiğinde kaydet (yalnızca değişiklik varsa). */
  async saveMeta() {
    const current = this.project();
    if (!current) return;

    // Proje adı boş bırakılamaz → eski değere geri al ve çık.
    if (this.metaForm.controls.name.invalid) {
      this.metaForm.patchValue({ name: current.name });
      return;
    }

    const raw = this.metaForm.getRawValue();
    const name = raw.name.trim();
    const { description, status, stage, nextAction } = raw;

    if (
      name === current.name &&
      description === current.description &&
      status === current.status &&
      stage === current.stage &&
      nextAction === current.nextAction
    ) {
      return;
    }

    this.savingMeta.set(true);
    this.error.set(null);
    try {
      const updated = await this.projectService.updateMeta(current, {
        name, description, status, stage, nextAction,
      });
      this.project.set(updated);
      await this.refreshActivities();
    } catch (err: any) {
      this.error.set(err?.message ?? 'Proje güncellenemedi.');
    } finally {
      this.savingMeta.set(false);
    }
  }

  async addTodo() {
    const current = this.project();
    if (!current || this.addForm.invalid || this.addingTodo()) return;
    this.addingTodo.set(true);
    this.error.set(null);
    try {
      const { title, category } = this.addForm.getRawValue();
      const todo = await this.todoService.add({ projectId: current.id, title, category });
      this.todos.update(ts => [...ts, todo]);
      this.addForm.reset({ title: '', category: 'task' });
      await this.refreshActivities();
    } catch (err: any) {
      this.error.set(err?.message ?? 'Todo eklenemedi.');
    } finally {
      this.addingTodo.set(false);
    }
  }

  async changeTodoStatus(todo: Todo, status: TodoStatus) {
    if (todo.status === status) return;
    const previous = todo.status;
    // İyimser güncelleme: önce yerel signal'i değiştir → grup anında taşınır.
    this.todos.update(ts =>
      ts.map(t => (t.id === todo.id ? { ...t, status, updatedAt: new Date() } : t)),
    );
    this.error.set(null);
    try {
      await this.todoService.changeStatus(todo, status);
      await this.refreshActivities();
    } catch (err: any) {
      // Hata → eski duruma geri al.
      this.todos.update(ts =>
        ts.map(t => (t.id === todo.id ? { ...t, status: previous } : t)),
      );
      this.error.set(err?.message ?? 'Durum güncellenemedi.');
    }
  }

  /** Aynı status grubu içinde sürükle-bırak ile sıralama. */
  async dropTodo(event: CdkDragDrop<Todo[]>, group: TodoGroup) {
    if (event.previousIndex === event.currentIndex) return;

    // Grubun yeni sırasını hesapla ve sortOrder'ları indekse göre ata.
    const items = [...group.items];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    const reordered = items.map((t, i) => ({ ...t, sortOrder: i }));

    // İyimser: yerel signal'i, bu status'un slotlarına yeni sırayı yerleştirerek güncelle.
    const previous = this.todos();
    const queue = [...reordered];
    this.todos.set(previous.map(t => (t.status === group.status ? queue.shift()! : t)));

    try {
      await Promise.all(reordered.map((t, i) => this.todoRepo.update(t.id, { sortOrder: i })));
    } catch (err: any) {
      this.todos.set(previous); // hata → eski sıraya dön
      this.error.set(err?.message ?? 'Sıralama kaydedilemedi.');
    }
  }

  async deleteTodo(todo: Todo) {
    try {
      await this.todoRepo.delete(todo.id);
      this.todos.update(ts => ts.filter(t => t.id !== todo.id));
    } catch (err: any) {
      this.error.set(err?.message ?? 'Todo silinemedi.');
    }
  }

  // --- Notlar (zengin metin / HTML) ---

  /** İçeriği etiketlerden arındırıp boş olup olmadığını kontrol eder. */
  isNoteEmpty(html: string): boolean {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === '';
  }

  async addNote() {
    const current = this.project();
    const html = this.newNoteHtml();
    if (!current || this.isNoteEmpty(html) || this.addingNote()) return;
    this.addingNote.set(true);
    this.error.set(null);
    try {
      const note = await this.noteService.add({ projectId: current.id, content: html });
      this.notes.update(ns => [note, ...ns]);
      this.newNoteHtml.set('');
      await this.refreshActivities();
    } catch (err: any) {
      this.error.set(err?.message ?? 'Not eklenemedi.');
    } finally {
      this.addingNote.set(false);
    }
  }

  startEditNote(note: Note) {
    this.editingNoteId.set(note.id);
    this.editNoteHtml.set(note.content);
  }

  cancelEditNote() {
    this.editingNoteId.set(null);
  }

  async saveEditNote(note: Note) {
    const content = this.editNoteHtml();
    if (this.isNoteEmpty(content) || this.savingNote()) return;
    this.savingNote.set(true);
    this.error.set(null);
    try {
      await this.noteRepo.update(note.id, content);
      this.notes.update(ns =>
        ns.map(n => (n.id === note.id ? { ...n, content, updatedAt: new Date() } : n)),
      );
      this.editingNoteId.set(null);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Not güncellenemedi.');
    } finally {
      this.savingNote.set(false);
    }
  }

  async deleteNote(note: Note) {
    try {
      await this.noteRepo.delete(note.id);
      this.notes.update(ns => ns.filter(n => n.id !== note.id));
      if (this.editingNoteId() === note.id) this.editingNoteId.set(null);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Not silinemedi.');
    }
  }

  // --- Kararlar ---

  openDecisionForm() {
    this.decisionForm.reset({
      title: '', context: '', chosen: '', rejectedAlternatives: '', rationale: '',
    });
    this.decisionFormOpen.set(true);
  }

  closeDecisionForm() {
    if (this.addingDecision()) return;
    this.decisionFormOpen.set(false);
  }

  toggleDecision(id: string) {
    this.expandedDecisionId.update(curr => (curr === id ? null : id));
  }

  async addDecision() {
    const current = this.project();
    if (!current || this.decisionForm.invalid || this.addingDecision()) return;
    this.addingDecision.set(true);
    this.error.set(null);
    try {
      const decision = await this.decisionService.add({
        projectId: current.id,
        ...this.decisionForm.getRawValue(),
      });
      this.decisions.update(ds => [decision, ...ds]);
      this.decisionFormOpen.set(false);
      await this.refreshActivities();
    } catch (err: any) {
      this.error.set(err?.message ?? 'Karar eklenemedi.');
    } finally {
      this.addingDecision.set(false);
    }
  }

  async deleteDecision(decision: Decision) {
    try {
      await this.decisionRepo.delete(decision.id);
      this.decisions.update(ds => ds.filter(d => d.id !== decision.id));
      if (this.expandedDecisionId() === decision.id) this.expandedDecisionId.set(null);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Karar silinemedi.');
    }
  }

  // --- Dosyalar ---

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const current = this.project();
    if (!file || !current || this.uploadingFile()) return;

    this.uploadingFile.set(true);
    this.error.set(null);
    try {
      const attachment = await this.attachmentRepo.upload(current.id, file);
      this.attachments.update(as => [attachment, ...as]);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Dosya yüklenemedi.');
    } finally {
      this.uploadingFile.set(false);
      input.value = ''; // aynı dosya tekrar seçilebilsin
    }
  }

  async downloadAttachment(attachment: Attachment) {
    this.error.set(null);
    try {
      const url = await this.attachmentRepo.getDownloadUrl(attachment.storagePath);
      window.open(url, '_blank', 'noopener');
    } catch (err: any) {
      this.error.set(err?.message ?? 'İndirme bağlantısı oluşturulamadı.');
    }
  }

  async deleteAttachment(attachment: Attachment) {
    try {
      await this.attachmentRepo.delete(attachment);
      this.attachments.update(as => as.filter(a => a.id !== attachment.id));
    } catch (err: any) {
      this.error.set(err?.message ?? 'Dosya silinemedi.');
    }
  }

  // --- İşbirliği ---

  async invite() {
    const current = this.project();
    if (!current || this.inviteForm.invalid || this.inviting()) return;
    this.inviting.set(true);
    this.error.set(null);
    this.shareInfo.set(null);
    try {
      const { email, role } = this.inviteForm.getRawValue();
      const warning = await this.collabRepo.invite(current.id, email.trim(), role);
      this.invitations.set(await this.collabRepo.getPendingInvitations(current.id));
      this.inviteForm.reset({ email: '', role: 'editor' });
      this.shareInfo.set(warning ?? `Davet gönderildi: ${email}`);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Davet gönderilemedi.');
    } finally {
      this.inviting.set(false);
    }
  }

  async revokeInvitation(inv: ProjectInvitation) {
    try {
      await this.collabRepo.revokeInvitation(inv.id);
      this.invitations.update(list => list.filter(i => i.id !== inv.id));
    } catch (err: any) {
      this.error.set(err?.message ?? 'Davet iptal edilemedi.');
    }
  }

  async removeMember(member: ProjectMember) {
    const current = this.project();
    if (!current) return;
    try {
      await this.collabRepo.removeMember(current.id, member.userId);
      this.members.update(list => list.filter(m => m.userId !== member.userId));
    } catch (err: any) {
      this.error.set(err?.message ?? 'Üye çıkarılamadı.');
    }
  }

  roleLabel(role: MemberRole | InviteRole): string {
    return role === 'owner' ? 'Sahip' : role === 'editor' ? 'Editör' : 'Görüntüleyici';
  }

  // --- Proje silme (yalnızca sahip) ---

  openDeleteConfirm() {
    this.error.set(null);
    this.confirmDeleteOpen.set(true);
  }

  closeDeleteConfirm() {
    if (this.deletingProject()) return;
    this.confirmDeleteOpen.set(false);
  }

  async deleteProject() {
    const current = this.project();
    if (!current || this.deletingProject()) return;
    this.deletingProject.set(true);
    this.error.set(null);
    try {
      // Depodaki dosyaları temizle (DB satırları cascade ile gider, Storage objeleri gitmez).
      for (const file of this.attachments()) {
        try { await this.attachmentRepo.delete(file); } catch { /* yetim dosya kalsa da devam */ }
      }
      await this.projectRepo.delete(current.id);
      await this.router.navigate(['/projects']);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Proje silinemedi.');
      this.deletingProject.set(false);
      this.confirmDeleteOpen.set(false);
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
