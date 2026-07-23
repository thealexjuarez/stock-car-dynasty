import { getPracticeChoice } from '@/data/practice-config';
import { RACE_READY_THRESHOLD } from '@/data/repair-config';
import { getWeekendEntrants } from '@/data/race-presentation-data';
import { getNextRace, starterGameState } from '@/data/starter-game-state';
import { createPracticeInput, resolvePractice } from '@/simulation/practice';
import {
  applyRaceSettlement,
  resolveQualifying,
  resolveRace,
} from '@/simulation/race-weekend';
import {
  applyVehicleRepair,
  getRaceReadinessBlockers,
} from '@/simulation/vehicle-repair';
import { normalizeGameState } from '@/state/game-state-migration';
import type { GameState } from '@/types/game';
import type {
  GameSessionAction,
  GameSessionState,
  RaceWeekendState,
} from '@/types/race-weekend';

function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    team: { ...state.team },
    drivers: state.drivers.map((driver) => ({
      ...driver,
      archetypes: [...driver.archetypes],
      stats: { ...driver.stats },
      growthModifiers: [...driver.growthModifiers],
      sponsorLeads: driver.sponsorLeads.map((lead) => ({
        ...lead,
        projectedRaceBacking: { ...lead.projectedRaceBacking },
      })),
    })),
    vehicles: state.vehicles.map((vehicle) => ({ ...vehicle })),
    staff: state.staff.map((staff) => ({ ...staff })),
    sponsors: state.sponsors.map((sponsor) => ({ ...sponsor })),
    manufacturers: state.manufacturers.map((manufacturer) => ({
      ...manufacturer,
      presentation: { ...manufacturer.presentation },
    })),
    facilities: state.facilities.map((facility) => ({ ...facility })),
    tracks: state.tracks.map((track) => ({ ...track, keyStats: [...track.keyStats] })),
    calendar: state.calendar.map((event) => ({ ...event })),
    economy: {
      processedTransactionIds: [...state.economy.processedTransactionIds],
      repairTransactions: state.economy.repairTransactions.map(
        (transaction) => ({ ...transaction }),
      ),
      settlementHistory: state.economy.settlementHistory.map((settlement) => ({
        ...settlement,
        winningsByCar: settlement.winningsByCar.map((line) => ({ ...line })),
      })),
    },
  };
}

function createWeekend(state: GameState): RaceWeekendState {
  const { race } = getNextRace(state);
  if (!race) throw new Error('Game session requires a current race');
  return {
    raceId: race.id,
    seed: `season-${state.season}:${race.id}`,
    phase: 'preview',
  };
}

export function createInitialGameSessionState(
  gameState: GameState = starterGameState,
): GameSessionState {
  const game = cloneGameState(normalizeGameState(gameState));
  return { game, weekend: createWeekend(game) };
}

export function gameSessionReducer(
  state: GameSessionState,
  action: GameSessionAction,
): GameSessionState {
  switch (action.type) {
    case 'COMPLETE_PRACTICE': {
      const blockers = getRaceReadinessBlockers(state.game);
      if (blockers.length > 0) {
        const cars = blockers.map((vehicle) => `Car #${vehicle.number}`).join(' and ');
        throw new Error(
          `Weekend entry on hold: ${cars} must reach ${RACE_READY_THRESHOLD}% condition before practice.`,
        );
      }
      const input = createPracticeInput(getPracticeChoice(action.choiceId), state.game);
      if (!input) throw new Error('Practice input is unavailable');
      return {
        ...state,
        weekend: {
          ...state.weekend,
          phase: 'practice-result',
          practice: resolvePractice(input),
          qualifying: undefined,
          race: undefined,
        },
      };
    }
    case 'BEGIN_QUALIFYING': {
      if (!state.weekend.practice) throw new Error('Practice must be completed first');
      return {
        ...state,
        weekend: {
          ...state.weekend,
          phase: 'qualifying',
          qualifying: resolveQualifying(
            state.game,
            getWeekendEntrants(state.game),
            state.weekend.practice,
            state.weekend.seed,
          ),
        },
      };
    }
    case 'SHOW_GRID':
      if (!state.weekend.qualifying) throw new Error('Qualifying must be completed first');
      return { ...state, weekend: { ...state.weekend, phase: 'grid' } };
    case 'BEGIN_RACE': {
      const { practice, qualifying } = state.weekend;
      if (!practice || !qualifying) throw new Error('A practice result and grid are required');
      return {
        ...state,
        weekend: {
          ...state.weekend,
          phase: 'race',
          race: resolveRace(
            state.game,
            qualifying,
            practice,
            `${state.weekend.seed}:race`,
          ),
        },
      };
    }
    case 'SHOW_RESULTS':
      if (!state.weekend.race) throw new Error('The race must be completed first');
      return { ...state, weekend: { ...state.weekend, phase: 'results' } };
    case 'ADVANCE_EVENT': {
      if (state.game.economy.processedTransactionIds.includes(action.actionId)) {
        return state;
      }
      if (!state.weekend.race || state.weekend.phase !== 'results') {
        throw new Error('Results must be reviewed before advancing');
      }
      const game = applyRaceSettlement(state.game, state.weekend.race);
      return { ...state, game, weekend: createWeekend(game) };
    }
    case 'REPAIR_VEHICLE': {
      const game = applyVehicleRepair(state.game, {
        actionId: action.actionId,
        raceId: state.weekend.raceId,
        vehicleId: action.vehicleId,
        optionId: action.optionId,
      });
      return game === state.game ? state : { ...state, game };
    }
  }
}
