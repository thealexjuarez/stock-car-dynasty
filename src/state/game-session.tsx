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
import type { RepairOptionId } from '@/types/game';
import type { PracticeChoiceId } from '@/types/practice';
import type { GameSessionAction, GameSessionState } from '@/types/race-weekend';

type GameSessionContextValue = {
  state: GameSessionState;
  completePractice: (choiceId: PracticeChoiceId) => void;
  beginQualifying: () => void;
  showGrid: () => void;
  beginRace: () => void;
  showResults: () => void;
  advanceEvent: () => void;
  repairVehicle: (vehicleId: string, optionId: RepairOptionId) => void;
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
      beginRace: () => send({ type: 'BEGIN_RACE' }),
      showResults: () => send({ type: 'SHOW_RESULTS' }),
      advanceEvent: () => send({ type: 'ADVANCE_EVENT' }),
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
