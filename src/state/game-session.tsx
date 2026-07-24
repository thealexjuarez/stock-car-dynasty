import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';

import {
  createInitialGameSessionState,
  gameSessionReducer,
} from '@/state/game-session-reducer';
import { starterGameState } from '@/data/starter-game-state';
import { getSettlementTransactionId } from '@/simulation/economy';
import type { RepairOptionId } from '@/types/game';
import type { PracticeChoiceId } from '@/types/practice';
import type { RacePlan } from '@/types/race-depth';
import type {
  ContractTermYears,
  RecruitingActionId,
} from '@/types/recruiting';
import type { GameSessionAction, GameSessionState } from '@/types/race-weekend';

type GameSessionContextValue = {
  state: GameSessionState;
  completePractice: (choiceId: PracticeChoiceId) => void;
  beginQualifying: () => void;
  showGrid: () => void;
  setRacePlan: (plan: RacePlan) => void;
  beginRace: () => void;
  showResults: () => void;
  advanceEvent: () => void;
  repairVehicle: (vehicleId: string, optionId: RepairOptionId) => void;
  completeRecruitingAction: (
    prospectId: string,
    actionId: Exclude<RecruitingActionId, 'contract-offer'>,
  ) => void;
  makeRecruitingOffer: (
    prospectId: string,
    annualSalary: number,
    termYears: ContractTermYears,
  ) => void;
};

const GameSessionContext = createContext<GameSessionContextValue | undefined>(undefined);

export function GameSessionProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(
    gameSessionReducer,
    starterGameState,
    createInitialGameSessionState,
  );
  const send = useCallback((action: GameSessionAction) => dispatch(action), []);
  const value = useMemo<GameSessionContextValue>(
    () => ({
      state,
      completePractice: (choiceId) => send({ type: 'COMPLETE_PRACTICE', choiceId }),
      beginQualifying: () => send({ type: 'BEGIN_QUALIFYING' }),
      showGrid: () => send({ type: 'SHOW_GRID' }),
      setRacePlan: (plan) => send({ type: 'SET_RACE_PLAN', plan }),
      beginRace: () => send({ type: 'BEGIN_RACE' }),
      showResults: () => send({ type: 'SHOW_RESULTS' }),
      advanceEvent: () => {
        if (!state.weekend.race) {
          throw new Error('A completed race is required before settlement');
        }
        send({
          type: 'ADVANCE_EVENT',
          actionId: getSettlementTransactionId(state.weekend.race),
        });
      },
      repairVehicle: (vehicleId, optionId) => {
        const vehicle = state.game.vehicles.find((item) => item.id === vehicleId);
        if (!vehicle) {
          throw new Error(`Unknown vehicle: ${vehicleId}`);
        }
        send({
          type: 'REPAIR_VEHICLE',
          actionId: [
            state.game.season,
            state.weekend.raceId,
            vehicle.id,
            vehicle.condition,
          ].join(':'),
          vehicleId,
          optionId,
        });
      },
      completeRecruitingAction: (prospectId, recruitingActionId) => {
        const progress = state.game.recruiting.campaigns[prospectId];
        if (!progress) {
          throw new Error(`Unknown recruiting prospect: ${prospectId}`);
        }
        const useIndex =
          (progress.completedActionUses[recruitingActionId] ?? 0) + 1;
        send({
          type: 'COMPLETE_RECRUITING_ACTION',
          transactionId: [
            'recruit',
            state.game.season,
            state.weekend.raceId,
            prospectId,
            recruitingActionId,
            useIndex,
          ].join(':'),
          prospectId,
          recruitingActionId,
        });
      },
      makeRecruitingOffer: (prospectId, annualSalary, termYears) => {
        const progress = state.game.recruiting.campaigns[prospectId];
        if (!progress) {
          throw new Error(`Unknown recruiting prospect: ${prospectId}`);
        }
        send({
          type: 'MAKE_RECRUITING_OFFER',
          transactionId: [
            'offer',
            state.game.season,
            state.weekend.raceId,
            prospectId,
            progress.offerHistory.length + 1,
          ].join(':'),
          prospectId,
          annualSalary,
          termYears,
          role: 'Reserve / Development',
        });
      },
    }),
    [send, state],
  );

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

export function useGameSession() {
  const context = useContext(GameSessionContext);
  if (!context) throw new Error('useGameSession must be used inside GameSessionProvider');
  return context;
}
