import { raceWeekendTuning as tuning } from '@/data/race-weekend-config';
import { getNextRace } from '@/data/starter-game-state';
import { getSeededUnit, getSeededVariance } from '@/simulation/seeded-variance';
import { updateVehicleCondition } from '@/simulation/vehicle-repair';
import type { Driver, GameState, Track } from '@/types/game';
import type { PracticeResult } from '@/types/practice';
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
  return average(track.keyStats.map((stat) => driver.stats[stat]));
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
      score =
        getTrackAbility(driver, track) * 0.45 +
        driver.overall * 0.2 +
        vehicle.performance * 0.2 +
        vehicle.condition * 0.1 +
        state.team.engineeringQuality * 0.05 +
        (practiceEntry?.qualifyingPaceBonus ?? 0);
    }

    score += getSeededVariance(`${seed}:qualifying:${entrant.id}`, tuning.qualifyingVariance);
    return { ...entrant, score: round(score) };
  });

  const entries: QualifyingEntryResult[] = scored
    .sort((left, right) => right.score - left.score || left.carNumber.localeCompare(right.carNumber))
    .map((entry, index) => ({ ...entry, position: index + 1 }));

  return { raceId: race.id, seed, entries };
}

function getPayout(position: number) {
  return Math.max(
    tuning.payout.minimum,
    tuning.payout.winner - (position - 1) * tuning.payout.positionStep,
  );
}

function getExp(position: number, finished: boolean) {
  return (
    Math.max(tuning.exp.minimum, tuning.exp.base - position * tuning.exp.positionStep) +
    (finished ? tuning.exp.finishBonus : 0)
  );
}

function getConditionLoss(seed: string, dnf: boolean) {
  const unit = getSeededUnit(`${seed}:damage`);
  return dnf ? 8 + Math.floor(unit * 11) : Math.floor(unit * 6);
}

export function resolveRace(
  state: GameState,
  qualifying: QualifyingResult,
  practice: PracticeResult,
  seed: string,
): RaceResult {
  const { race, track } = getNextRace(state);

  if (!race || !track || race.id !== qualifying.raceId) {
    throw new Error('Cannot race without a matching current grid');
  }

  const provisional = qualifying.entries.map((entrant) => {
    let ability = entrant.baselineRating;
    let dnfRisk: number = tuning.cautionDnfRisk[track.cautionRisk];

    if (entrant.isPlayerTeam) {
      const { driver, vehicle } = getPlayerParts(state, entrant);
      const practiceEntry = getPracticeEntry(practice, entrant);
      ability =
        getTrackAbility(driver, track) * 0.42 +
        driver.overall * 0.18 +
        vehicle.performance * 0.2 +
        vehicle.condition * 0.1 +
        state.team.pitCrewQuality * 0.1 +
        (practiceEntry?.racePaceBonus ?? 0);
      dnfRisk = Math.max(0.01, dnfRisk - driver.stats.Awareness / 2_000);
    }

    const dnf = getSeededUnit(`${seed}:incident:${entrant.id}`) < dnfRisk;
    const gridEffect = (qualifying.entries.length - entrant.position) * 0.12;
    const score =
      ability +
      gridEffect +
      getSeededVariance(`${seed}:race:${entrant.id}`, tuning.raceVariance) -
      (dnf ? 100 : 0);

    return { entrant, dnf, score: round(score) };
  });

  const entries: RaceEntryResult[] = provisional
    .sort((left, right) => right.score - left.score || left.entrant.position - right.entrant.position)
    .map(({ entrant, dnf, score }, index) => {
      const finishPosition = index + 1;
      const isPlayerTeam = entrant.isPlayerTeam;
      return {
        ...entrant,
        startPosition: entrant.position,
        finishPosition,
        score,
        status: dnf ? 'DNF' : 'Running',
        payout: isPlayerTeam ? getPayout(finishPosition) : 0,
        exp: isPlayerTeam ? getExp(finishPosition, !dnf) : 0,
        conditionLoss: isPlayerTeam
          ? getConditionLoss(`${seed}:${entrant.id}`, dnf)
          : 0,
      };
    });
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
  const currentIndex = state.calendar.findIndex((event) => event.id === result.raceId);
  const nextIndex = currentIndex + 1;
  const startsNewSeason = nextIndex >= state.calendar.length;
  const nextRace = state.calendar[startsNewSeason ? 0 : nextIndex];

  if (currentIndex < 0 || !nextRace) {
    throw new Error('Cannot advance from an unknown event');
  }

  return {
    ...state,
    season: state.season + (startsNewSeason ? 1 : 0),
    week: nextRace.week,
    currentDate: addDays(state.currentDate, 7),
    nextRaceId: nextRace.id,
    team: { ...state.team, cash: state.team.cash + result.playerPayout },
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
}
