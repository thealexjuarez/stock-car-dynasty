import type {
  RacePresentationConfig,
  RacePresentationEntrant,
  RacePresentationModel,
  RunningOrderEntry,
  SceneCar,
} from '@/types/race-presentation';
import { getOvalPresentationPhase } from '@/presentation/oval-presentation';
import { selectFocusedTimingTower } from '@/simulation/race-field';

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
  elapsedMs: number,
) => {
  const progress = Math.min(1, elapsedMs / config.sessionDurationMs);
  const simulatedDistance =
    getStartDistance(entrant, config) +
    config.presentationTravelLaps * progress * entrant.paceFactor;

  if (
    config.kind !== 'race' ||
    entrant.authoritativeFinishPosition === undefined ||
    progress <= 0.9
  ) {
    return simulatedDistance;
  }

  const finishOrderSpacing = 0.012;
  const finishOrderDistance =
    7.3 +
    config.presentationTravelLaps * progress +
    (config.fieldSize - entrant.authoritativeFinishPosition) * finishOrderSpacing;
  const convergence = (progress - 0.9) / 0.1;

  return simulatedDistance * (1 - convergence) + finishOrderDistance * convergence;
};

function getInterval(leaderDistance: number, distance: number, position: number) {
  if (position === 1) {
    return 'Leader';
  }

  return `+${((leaderDistance - distance) * 40).toFixed(1)}`;
}

export function getRunningOrder(
  entrants: readonly RacePresentationEntrant[],
  config: RacePresentationConfig,
  elapsedMs: number,
): RunningOrderEntry[] {
  const isResolvedRaceFinish =
    config.kind === 'race' && elapsedMs >= config.sessionDurationMs;
  const ordered = entrants
    .map((entrant) => ({ entrant, distance: getDistance(entrant, config, elapsedMs) }))
    .sort(
      (left, right) => {
        if (
          isResolvedRaceFinish &&
          left.entrant.authoritativeFinishPosition !== undefined &&
          right.entrant.authoritativeFinishPosition !== undefined
        ) {
          return (
            left.entrant.authoritativeFinishPosition -
              right.entrant.authoritativeFinishPosition ||
            left.entrant.id.localeCompare(right.entrant.id)
          );
        }

        return (
          right.distance - left.distance ||
          left.entrant.id.localeCompare(right.entrant.id)
        );
      },
    );
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

export function getQualifyingRunState(
  entrants: readonly RacePresentationEntrant[],
  config: RacePresentationConfig,
  elapsedMs: number,
) {
  if (config.kind !== 'qualifying') {
    return {};
  }

  const playerEntries = entrants.filter((entrant) => entrant.isPlayerTeam);
  const runDurationMs =
    (config.sessionDurationMs - config.qualifyingResultDurationMs) /
    Math.max(1, playerEntries.length);
  const runIndex = Math.floor(elapsedMs / runDurationMs);
  const activeEntry = playerEntries[runIndex];

  return {
    activeEntryId: activeEntry?.id,
    runNumber: activeEntry ? runIndex + 1 : undefined,
  };
}

export function createRacePresentationModel(
  entrants: readonly RacePresentationEntrant[],
  config: RacePresentationConfig,
  elapsedMs: number,
  focusedDriverId: string,
): RacePresentationModel {
  const runningOrder = getRunningOrder(entrants, config, elapsedMs);
  const focusedEntry = runningOrder.find(
    (entry) => entry.playerDriverId === focusedDriverId,
  );

  if (!focusedEntry) {
    throw new Error(`Missing focused player driver: ${focusedDriverId}`);
  }

  const sessionProgress = Math.min(100, (elapsedMs / config.sessionDurationMs) * 100);
  const qualifyingRunState = getQualifyingRunState(entrants, config, elapsedMs);
  const currentLap =
    config.kind === 'qualifying'
      ? Math.min(config.totalLaps, qualifyingRunState.runNumber ?? config.totalLaps)
      : Math.min(config.totalLaps, Math.floor(focusedEntry.distance) + 1);

  return {
    runningOrder,
    timingTowerOrder: selectFocusedTimingTower(runningOrder),
    visibleCars: getVisibleSceneCars(runningOrder, focusedEntry, config),
    currentLap,
    sessionProgress,
    focusedEntry,
    elapsedMs,
    isComplete: elapsedMs >= config.sessionDurationMs,
    activeQualifyingEntryId: qualifyingRunState.activeEntryId,
    qualifyingRunNumber: qualifyingRunState.runNumber,
    ovalPhase: getOvalPresentationPhase(elapsedMs, config.ovalCycleMs),
  };
}
