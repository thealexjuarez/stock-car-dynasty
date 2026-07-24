import { resolveRacePayout } from '@/data/economy-config';
import { getEffectiveDriverStats } from '@/data/archetype-config';
import { raceFieldTuning } from '@/data/race-field-config';
import { raceWeekendTuning as tuning } from '@/data/race-weekend-config';
import { getNextRace } from '@/data/starter-game-state';
import {
  applyWeekendEconomy,
  getSettlementTransactionId,
} from '@/simulation/economy';
import { applyRecruitingWeekendSettlement } from '@/simulation/recruiting';
import {
  applyRaceFieldSettlement,
  getFieldDriver,
} from '@/simulation/race-field';
import { resolveRaceDepth } from '@/simulation/race-depth';
import { getSeededVariance } from '@/simulation/seeded-variance';
import { updateVehicleCondition } from '@/simulation/vehicle-repair';
import type { Driver, GameState, Track } from '@/types/game';
import type { PracticeResult } from '@/types/practice';
import type { RacePlan } from '@/types/race-depth';
import type {
  QualifyingEntryResult,
  QualifyingResult,
  RaceEntryResult,
  RaceResult,
  WeekendEntrant,
} from '@/types/race-weekend';

const average = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0) / Math.max(1, values.length);

const round = (value: number) => Math.round(value * 100) / 100;

function getPlayerParts(state: GameState, entrant: WeekendEntrant) {
  const driver = state.drivers.find((item) => item.id === entrant.driverId);
  const vehicle = state.vehicles.find((item) => item.id === entrant.vehicleId);

  if (!driver || !vehicle) {
    throw new Error(`Missing player entry data for Car #${entrant.carNumber}`);
  }

  return { driver, vehicle };
}

function getTrackAbility(driver: Driver, track: Track) {
  const effectiveStats = getEffectiveDriverStats(driver);
  return average(track.keyStats.map((stat) => effectiveStats[stat]));
}

function getPracticeEntry(practice: PracticeResult, entrant: WeekendEntrant) {
  return practice.entries.find((entry) => entry.vehicleId === entrant.vehicleId);
}

export function resolveQualifying(
  state: GameState,
  entrants: readonly WeekendEntrant[],
  practice: PracticeResult,
  seed: string,
): QualifyingResult {
  const { race, track } = getNextRace(state);

  if (!race || !track) {
    throw new Error('Cannot qualify without a current event');
  }

  const scored = entrants.map((entrant) => {
    let score = entrant.baselineRating;

    if (entrant.isPlayerTeam) {
      const { driver, vehicle } = getPlayerParts(state, entrant);
      const practiceEntry = getPracticeEntry(practice, entrant);
      const weights = raceFieldTuning.playerWeekendWeights.qualifying;
      score =
        getTrackAbility(driver, track) * weights.trackStats +
        driver.overall * weights.overall +
        vehicle.performance * weights.vehiclePerformance +
        vehicle.condition * weights.condition +
        state.team.engineeringQuality * weights.crew +
        (practiceEntry?.qualifyingPaceBonus ?? 0);
    } else {
      const fieldEntry = state.raceField.entries.find(
        (entry) => entry.id === entrant.id,
      );
      if (!fieldEntry) throw new Error(`Missing field entry: ${entrant.id}`);
      const driver = getFieldDriver(state, fieldEntry);
      const effectiveStats = getEffectiveDriverStats(driver);
      score =
        average(track.keyStats.map((stat) => effectiveStats[stat])) *
          raceFieldTuning.driverRatingWeights.trackStats +
        driver.overall * raceFieldTuning.driverRatingWeights.overall;
    }

    score += getSeededVariance(`${seed}:qualifying:${entrant.id}`, tuning.qualifyingVariance);
    return { ...entrant, score: round(score) };
  });

  const entries: QualifyingEntryResult[] = scored
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .map((entry, index) => ({ ...entry, position: index + 1 }));

  return { raceId: race.id, seed, entries };
}

function getExp(position: number, finished: boolean) {
  return (
    Math.max(tuning.exp.minimum, tuning.exp.base - position * tuning.exp.positionStep) +
    (finished ? tuning.exp.finishBonus : 0)
  );
}

export function resolveRace(
  state: GameState,
  qualifying: QualifyingResult,
  practice: PracticeResult,
  seed: string,
  playerPlans: Readonly<Record<string, RacePlan>> = {},
): RaceResult {
  const { race, track } = getNextRace(state);

  if (!race || !track || race.id !== qualifying.raceId) {
    throw new Error('Cannot race without a matching current grid');
  }

  const resolution = resolveRaceDepth({
    state,
    qualifying,
    practice,
    seed,
    playerPlans,
    resolvePayout: resolveRacePayout,
    resolveExp: getExp,
  });
  const entries: RaceEntryResult[] = resolution.entries;
  const playerEntries = entries.filter((entry) => entry.isPlayerTeam);

  return {
    raceId: race.id,
    seed,
    entries,
    playerPayout: playerEntries.reduce((total, entry) => total + entry.payout, 0),
    playerExp: playerEntries.reduce((total, entry) => total + entry.exp, 0),
    playerConditionLoss: playerEntries.reduce(
      (total, entry) => total + entry.conditionLoss,
      0,
    ),
    depthFacts: resolution.facts,
  };
}

function addDays(date: string, days: number) {
  const parsed = new Date(`${date} 00:00:00 UTC`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function applyRaceSettlement(state: GameState, result: RaceResult): GameState {
  const transactionId = getSettlementTransactionId(result);
  if (state.economy.processedTransactionIds.includes(transactionId)) {
    return state;
  }

  const currentIndex = state.calendar.findIndex((event) => event.id === result.raceId);
  const nextIndex = currentIndex + 1;
  const startsNewSeason = nextIndex >= state.calendar.length;
  const nextRace = state.calendar[startsNewSeason ? 0 : nextIndex];

  if (currentIndex < 0 || !nextRace) {
    throw new Error('Cannot advance from an unknown event');
  }

  const stateAfterEconomy = applyWeekendEconomy(state, result);

  const settledState: GameState = {
    ...stateAfterEconomy,
    season: state.season + (startsNewSeason ? 1 : 0),
    week: nextRace.week,
    currentDate: addDays(state.currentDate, 7),
    nextRaceId: nextRace.id,
    drivers: state.drivers.map((driver) => {
      const entry = result.entries.find((item) => item.driverId === driver.id);
      return entry ? { ...driver, exp: driver.exp + entry.exp } : driver;
    }),
    vehicles: state.vehicles.map((vehicle) => {
      const entry = result.entries.find((item) => item.vehicleId === vehicle.id);
      if (!entry) return vehicle;
      const condition = Math.max(0, vehicle.condition - entry.conditionLoss);
      return updateVehicleCondition(
        vehicle,
        condition,
        entry.conditionLoss > 0
          ? `${entry.conditionLoss}% condition lost at ${state.calendar[currentIndex].name}.`
          : 'Completed the event without measurable damage.',
      );
    }),
  };

  return applyRaceFieldSettlement(
    applyRecruitingWeekendSettlement(settledState, result, {
      season: state.season,
      week: state.week,
    }),
    result,
  );
}
