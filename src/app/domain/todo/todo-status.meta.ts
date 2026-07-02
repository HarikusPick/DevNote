import { Todo, TodoStatus, TodoCategory } from './todo.model';

export interface TodoStatusMeta {
  label: string;
  tone: string;
}

/** Todo durumlarının Türkçe etiketi + rozet rengi. Tek tanım noktası. */
export const TODO_STATUS_META: Record<TodoStatus, TodoStatusMeta> = {
  backlog:     { label: 'Backlog',      tone: 'zinc' },
  next:        { label: 'Sıradaki',     tone: 'blue' },
  in_progress: { label: 'Devam ediyor', tone: 'violet' },
  blocked:     { label: 'Engellendi',   tone: 'red' },
  done:        { label: 'Tamamlandı',   tone: 'green' },
};

/** Gruplama ve dropdown sırası. */
export const TODO_STATUS_ORDER: TodoStatus[] = [
  'backlog', 'next', 'in_progress', 'blocked', 'done',
];

export const TODO_CATEGORY_META: Record<TodoCategory, { label: string; tone: string }> = {
  task: { label: 'Görev', tone: 'gray' },
  bug:  { label: 'Hata',  tone: 'orange' },
};

export interface TodoGroup {
  status: TodoStatus;
  label: string;
  tone: string;
  items: Todo[];
}

/**
 * Todoları sabit sıralı gruplara böler (backlog → next → in_progress → blocked → done).
 * Boş gruplar gizlenir. Saf fonksiyon — türetilmiş (derived) veri, computed içinde çağrılır.
 */
export function groupTodosByStatus(todos: Todo[]): TodoGroup[] {
  return TODO_STATUS_ORDER
    .map(status => ({
      status,
      label: TODO_STATUS_META[status].label,
      tone: TODO_STATUS_META[status].tone,
      items: todos.filter(t => t.status === status),
    }))
    .filter(g => g.items.length > 0);
}
