import { Decision, CreateDecisionInput } from './decision.model';

export abstract class DecisionRepository {
  abstract getByProject(projectId: string): Promise<Decision[]>;
  abstract create(input: CreateDecisionInput): Promise<Decision>;
  abstract update(
    id: string,
    changes: Partial<Omit<CreateDecisionInput, 'projectId'>>,
  ): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
