import { Injectable, inject } from '@angular/core';
import { DecisionRepository } from './decision.repository';
import { ActivityRepository } from '../activity/activity.repository';
import { Decision, CreateDecisionInput } from './decision.model';

/**
 * Karar iş mantığı. Mutasyondan SONRA anlamlı olayları loglar.
 */
@Injectable({ providedIn: 'root' })
export class DecisionService {
  private readonly decisions = inject(DecisionRepository);
  private readonly activity = inject(ActivityRepository);

  async add(input: CreateDecisionInput): Promise<Decision> {
    const decision = await this.decisions.create(input);
    await this.activity.record({
      projectId: decision.projectId,
      type: 'decision_added',
      summary: `Karar eklendi: ${decision.title}`,
      meta: { decisionId: decision.id },
    });
    return decision;
  }
}
