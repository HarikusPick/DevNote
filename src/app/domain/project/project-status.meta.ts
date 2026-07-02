import { ProjectStatus } from './project.model';

export interface StatusMeta {
  label: string;
  tone: string;
}

/** Proje durumlarının Türkçe etiketi + rozet rengi. Tek tanım noktası. */
export const STATUS_META: Record<ProjectStatus, StatusMeta> = {
  idea:        { label: 'Fikir',        tone: 'gray' },
  planning:    { label: 'Planlama',     tone: 'blue' },
  in_progress: { label: 'Devam ediyor', tone: 'violet' },
  blocked:     { label: 'Engellendi',   tone: 'red' },
  testing:     { label: 'Test',         tone: 'amber' },
  on_hold:     { label: 'Beklemede',    tone: 'orange' },
  done:        { label: 'Tamamlandı',   tone: 'green' },
  archived:    { label: 'Arşivlendi',   tone: 'zinc' },
};

/** Sıralı dropdown/seçim için durum listesi. */
export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  'idea', 'planning', 'in_progress', 'blocked', 'testing', 'on_hold', 'done', 'archived',
];
