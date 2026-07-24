import { recruitingActions } from '@/data/recruiting-config';
import {
  recruitingActionCopy,
  type RecruitingActionGroup,
} from '@/data/recruiting-copy';
import {
  getActionAvailability,
  type ActionAvailability,
} from '@/simulation/recruiting';
import type { GameState } from '@/types/game';
import type {
  RecruitingActionDefinition,
  RecruitingActionId,
} from '@/types/recruiting';

export const RECRUITING_ACTION_ROW_HEIGHT = 58;
export const MINIMUM_VISIBLE_ACTION_ROWS = 5;
export const DEFAULT_COMPACT_ACTION_COUNT = 6;

export type RecruitingActionRowState =
  | 'Available'
  | 'Selected'
  | 'Used This Week'
  | 'Locked'
  | 'Completed'
  | 'Insufficient RP';

export function getRecruitingActionRowState(
  availability: ActionAvailability,
  selected = false,
): RecruitingActionRowState {
  if (selected) return 'Selected';
  if (availability.completed) return 'Completed';
  if (
    availability.blockers.some(
      (blocker) =>
        blocker.code === 'weekly-limit' || blocker.code === 'used-this-week',
    )
  ) {
    return 'Used This Week';
  }
  if (
    availability.blockers[0]?.code === 'resources' &&
    availability.blockers[0].reason.includes('RP')
  ) {
    return 'Insufficient RP';
  }
  return availability.available ? 'Available' : 'Locked';
}

export function toggleExpandedRecruitingAction(
  current: RecruitingActionId | null,
  requested: RecruitingActionId,
) {
  return current === requested ? null : requested;
}

export function getOrderedRecruitingActions(
  state: GameState,
  prospectId: string,
  group: RecruitingActionGroup,
  recommendedId?: RecruitingActionId,
): RecruitingActionDefinition[] {
  return recruitingActions
    .map((definition, index) => ({
      availability: getActionAvailability(state, prospectId, definition.id),
      definition,
      index,
    }))
    .filter(
      ({ definition }) =>
        group === 'All' || recruitingActionCopy[definition.id].group === group,
    )
    .sort((left, right) => {
      const leftPriority =
        left.definition.id === recommendedId && left.availability.available
          ? 0
          : left.availability.available
            ? 1
            : 2;
      const rightPriority =
        right.definition.id === recommendedId && right.availability.available
          ? 0
          : right.availability.available
            ? 1
            : 2;
      return leftPriority - rightPriority || left.index - right.index;
    })
    .map(({ definition }) => definition);
}
