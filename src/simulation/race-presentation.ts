import type {
  RacePresentationConfig,
  RacePresentationEntrant,
  RacePresentationModel,
  RunningOrderEntry,
  SceneCar,
} from '@/types/race-presentation';

const getStartDistance = (
  entrant: RacePresentationEntrant,
  config: RacePresentationConfig,
) =>
  config.kind === 'qualifying'
    ? entrant.qualifyingStartDistance
    : entrant.raceStartDistance;

const getDistance = (
  entrant: RacePresentationEntrant,
  config: RacePresentationConfig,
  tick: number,
) => getStartDistance(entrant, config) + entrant.pacePerTick * tick;

function getInterval(leaderDistance: number, distance: number, position: number) {
  if (position === 1) {
    return 'Leader';
  }

  return `+${((leaderDistance - distance) * 40).toFixed(1)}`;
}

export function getRunningOrder(
  entrants: readonly RacePresentationEntrant[],
  config: RacePresentationConfig,
  tick: number,
): RunningOrderEntry[] {
  const ordered = entrants
    .map((entrant) => ({ entrant, distance: getDistance(entrant, config, tick) }))
    .sort((left, right) => right.distance - left.distance);
  const leaderDistance = ordered[0]?.distance ?? 0;

  return ordered.map(({ entrant, distance }, index) => ({
    ...entrant,
    distance,
    position: index + 1,
    interval: getInterval(leaderDistance, distance, index + 1),
  }));
}

function normalizeRelativeDistance(value: number) {
  if (value > 0.5) {
    return value - 1;
  }

  if (value < -0.5) {
    return value + 1;
  }

  return value;
}

export function getVisibleSceneCars(
  runningOrder: readonly RunningOrderEntry[],
  focusedEntry: RunningOrderEntry,
  config: RacePresentationConfig,
): SceneCar[] {
  return runningOrder
    .filter((entry) => config.kind === 'race' || entry.qualifyingOnTrack)
    .map((entry) => ({
      entrant: entry,
      relativeTrackPosition: normalizeRelativeDistance(entry.distance - focusedEntry.distance),
    }))
    .filter(
      (sceneCar) =>
        sceneCar.entrant.id === focusedEntry.id ||
        Math.abs(sceneCar.relativeTrackPosition) <= config.cameraWindow,
    )
    .sort(
      (left, right) =>
        Math.abs(left.relativeTrackPosition) - Math.abs(right.relativeTrackPosition),
    )
    .slice(0, config.visibleCarLimit)
    .sort((left, right) => left.entrant.lane - right.entrant.lane);
}

export function createRacePresentationModel(
  entrants: readonly RacePresentationEntrant[],
  config: RacePresentationConfig,
  tick: number,
  focusedDriverId: string,
): RacePresentationModel {
  const runningOrder = getRunningOrder(entrants, config, tick);
  const focusedEntry = runningOrder.find(
    (entry) => entry.playerDriverId === focusedDriverId,
  );

  if (!focusedEntry) {
    throw new Error(`Missing focused player driver: ${focusedDriverId}`);
  }

  const currentLap = Math.min(config.totalLaps, Math.floor(focusedEntry.distance) + 1);
  const sessionProgress = Math.min(
    100,
    Math.max(0, (focusedEntry.distance / config.totalLaps) * 100),
  );

  return {
    runningOrder,
    visibleCars: getVisibleSceneCars(runningOrder, focusedEntry, config),
    currentLap,
    sessionProgress,
    focusedEntry,
  };
}
