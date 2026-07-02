import { Project, CreateProjectInput } from './project.model';

export abstract class ProjectRepository {
  abstract getAll(): Promise<Project[]>;
  abstract getById(id: string): Promise<Project | null>;
  abstract create(input: CreateProjectInput): Promise<Project>;
  abstract update(
    id: string,
    changes: Partial<Pick<Project, 'name' | 'description' | 'status' | 'stage' | 'nextAction'>>,
  ): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
