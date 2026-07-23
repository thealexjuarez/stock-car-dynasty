import type { GameState, RepairOptionId } from '@/types/game';
import type { PracticeChoiceId, PracticeResult } from '@/types/practice';

export type RaceWeekendPhase =
  | 'preview'
  | 'practice-result'
  | 'qualifying'
  | 'grid'
  | 'race'
  | 'results';

export type WeekendEntrant = {
  id: string;
  carNumber: string;
  driverName: string;
  isPlayerTeam: boolean;
  driverId?: string;
  vehicleId?: string;
  baselineRating: number;
};

export type QualifyingEntryResult = WeekendEntrant & {
  position: number;
  score: number;
};

export type QualifyingResult = {
  raceId: string;
  seed: string;
  entries: QualifyingEntryResult[];
};

export type RaceFinishStatus = 'Running' | 'DNF';

export type RaceEntryResult = WeekendEntrant & {
  startPosition: number;
  finishPosition: number;
  score: number;
  status: RaceFinishStatus;
  payout: number;
  exp: number;
  conditionLoss: number;
};

export type RaceResult = {
  raceId: string;
  seed: string;
  entries: RaceEntryResult[];
  playerPayout: number;
  playerExp: number;
  playerConditionLoss: number;
};

export type RaceWeekendState = {
  raceId: string;
  seed: string;
  phase: RaceWeekendPhase;
  practice?: PracticeResult;
  qualifying?: QualifyingResult;
  race?: RaceResult;
};

export type GameSessionState = {
  game: GameState;
  weekend: RaceWeekendState;
  processedRepairActionIds: string[];
};

export type GameSessionAction =
  | { type: 'COMPLETE_PRACTICE'; choiceId: PracticeChoiceId }
  | { type: 'BEGIN_QUALIFYING' }
  | { type: 'SHOW_GRID' }
  | { type: 'BEGIN_RACE' }
  | { type: 'SHOW_RESULTS' }
  | { type: 'ADVANCE_EVENT' }
  | {
      type: 'REPAIR_VEHICLE';
      actionId: string;
      vehicleId: string;
      optionId: RepairOptionId;
    };
