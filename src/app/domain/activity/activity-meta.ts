import { ActivityType } from './activity.model';

/** Geçmiş zaman çizelgesinde her olay tipinin nokta/ikon rengi (badge tonu). */
export const ACTIVITY_TONE: Record<ActivityType, string> = {
  status_change:      'violet',
  next_action_change: 'blue',
  todo_added:         'gray',
  todo_done:          'green',
  decision_added:     'amber',
  note_added:         'zinc',
};
