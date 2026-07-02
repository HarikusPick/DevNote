import { Activity, RecordActivityInput } from './activity.model';

export abstract class ActivityRepository {
  abstract getByProject(projectId: string): Promise<Activity[]>; // created_at DESC
  abstract record(input: RecordActivityInput): Promise<void>;
}
