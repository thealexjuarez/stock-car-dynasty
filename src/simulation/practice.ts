import { getEffectiveDriverStats } from '@/data/archetype-config';
import { practiceResolutionTuning as tuning } from '@/data/practice-config';
import { getNextRace, starterGameState } from '@/data/starter-game-state';
import { getSeededVariance } from '@/simulation/seeded-variance';
import type { GameState } from '@/types/game';
import type {
  PracticeChoice,
  PracticeEntryInput,
  PracticeEntryResult,
  PracticeInput,
  PracticeResult,
} from '@/types/practice';

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const average = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length;

function getCrewFeedback(setupConfidence: number) {
  if (setupConfidence >= tuning.feedbackThresholds.strong) {
    return 'Ray Hollis: “Both cars are answering the wheel. We can race from here.”';
  }

  if (setupConfidence >= tuning.feedbackThresholds.usable) {
    return 'Ray Hollis: “The balance is close. Stay tidy and it should hold together.”';
  }

  return 'Ray Hollis: “We found a direction, but the cars still need a careful hand.”';
}

function formatSessionEffect(label: string, value: number) {
  return value > 0 ? `${label} +${value}` : `No direct ${label.toLowerCase()} bonus`;
}

function resolveEntry(input: PracticeInput, entry: PracticeEntryInput): PracticeEntryResult {
  const { driver, vehicle } = entry;
  const effectiveStats = getEffectiveDriverStats(driver);
  const trackStats = input.track.keyStats.map((stat) => effectiveStats[stat]);
  const variance = getSeededVariance(
    `${input.race.id}:${vehicle.id}:${input.selectedChoice.id}`,
    tuning.varianceMaximum,
  );
  const rawConfidence =
    average(trackStats) * tuning.weights.trackRelevantDriverStats +
    driver.overall * tuning.weights.driverOverall +
    vehicle.performance * tuning.weights.vehiclePerformance +
    vehicle.condition * tuning.weights.vehicleCondition +
    input.team.engineeringQuality * tuning.weights.engineeringQuality +
    input.crewChiefQuality * tuning.weights.crewChiefQuality +
    input.selectedChoice.effects.setupConfidence +
    variance;
  const setupConfidence = Math.round(
    clamp(rawConfidence, tuning.confidenceBounds.minimum, tuning.confidenceBounds.maximum),
  );
  const strongestTrackStat = input.track.keyStats.reduce((strongest, stat) =>
    effectiveStats[stat] > effectiveStats[strongest] ? stat : strongest,
  );

  return {
    driverId: driver.id,
    vehicleId: vehicle.id,
    carNumber: vehicle.number,
    driverName: driver.name,
    setupConfidence,
    qualifyingPaceBonus: input.selectedChoice.effects.qualifyingPace,
    racePaceBonus: input.selectedChoice.effects.racePace,
    crewFeedback: getCrewFeedback(setupConfidence),
    insight: `Marco DeSoto: “${strongestTrackStat} is where ${driver.name} gives us the most to work with at ${input.track.name}.”`,
    qualifyingEffect: formatSessionEffect(
      'Qualifying preparation',
      input.selectedChoice.effects.qualifyingPace,
    ),
    raceEffect: formatSessionEffect('Race preparation', input.selectedChoice.effects.racePace),
  };
}

export function createPracticeInput(
  selectedChoice: PracticeChoice,
  state: GameState = starterGameState,
): PracticeInput | undefined {
  const { race, track } = getNextRace(state);
  const crewChief = state.staff.find((staff) => staff.role === 'Crew Chief' && staff.active);

  if (!race || !track || !crewChief) {
    return undefined;
  }

  const entries = state.vehicles.flatMap((vehicle) => {
    const driver = state.drivers.find((item) => item.id === vehicle.assignedDriverId);
    return driver && vehicle.active ? [{ driver, vehicle }] : [];
  });

  return {
    race,
    track,
    team: state.team,
    crewChiefQuality: crewChief.quality,
    entries,
    selectedChoice,
  };
}

export function resolvePractice(input: PracticeInput): PracticeResult {
  return {
    raceId: input.race.id,
    raceName: input.race.name,
    trackName: input.track.name,
    trackType: input.track.type,
    selectedChoice: input.selectedChoice,
    entries: input.entries.map((entry) => resolveEntry(input, entry)),
  };
}
