import { raceFieldTuning, resolveFieldPoints } from '@/data/race-field-config';
import type { GameState, Track } from '@/types/game';
import type {
  DriverStanding,
  RaceFieldEntry,
  RaceFieldOrganization,
} from '@/types/race-field';
import type { RunningOrderEntry } from '@/types/race-presentation';
import type { RaceResult } from '@/types/race-weekend';

const average = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0) /
  Math.max(1, values.length);

export function getFieldOrganization(
  state: GameState,
  teamId: string,
): RaceFieldOrganization {
  const organization = state.raceField.organizations.find(
    (item) => item.id === teamId,
  );
  if (!organization) throw new Error(`Unknown ERCA organization: ${teamId}`);
  return organization;
}

export function getFieldDriver(state: GameState, entry: RaceFieldEntry) {
  const driver = entry.isPlayerTeam
    ? state.drivers.find((item) => item.id === entry.driverId)
    : state.raceField.opponentDrivers.find(
        (item) => item.id === entry.driverId,
      );
  if (!driver) throw new Error(`Unknown ERCA field driver: ${entry.driverId}`);
  return driver;
}

export function calculateFieldEntryRating(
  state: GameState,
  entry: RaceFieldEntry,
  track: Track,
) {
  const driver = getFieldDriver(state, entry);
  const organization = getFieldOrganization(state, entry.teamId);
  const trackStats = average(track.keyStats.map((stat) => driver.stats[stat]));
  const driverRating =
    trackStats * raceFieldTuning.driverRatingWeights.trackStats +
    driver.overall * raceFieldTuning.driverRatingWeights.overall;
  const teamEquipmentRating =
    organization.teamPerformance *
      raceFieldTuning.teamRatingWeights.teamPerformance +
    organization.equipmentStrength *
      raceFieldTuning.teamRatingWeights.equipmentStrength;

  return (
    driverRating * raceFieldTuning.contributionWeights.driver +
    teamEquipmentRating *
      raceFieldTuning.contributionWeights.teamEquipment
  );
}

export function getStandingsTransactionId(
  result: Pick<RaceResult, 'raceId' | 'seed'>,
) {
  return `standings:${result.raceId}:${result.seed}`;
}

export function applyRaceFieldSettlement(
  state: GameState,
  result: RaceResult,
): GameState {
  const transactionId = getStandingsTransactionId(result);
  if (state.raceField.processedRaceIds.includes(transactionId)) return state;

  const resultByEntry = new Map(
    result.entries.map((entry) => [entry.id, entry]),
  );
  const standings = state.raceField.standings.map((standing) => {
    const finish = resultByEntry.get(standing.entryId);
    if (!finish) return standing;
    const starts = standing.starts + 1;
    const totalFinish = standing.totalFinish + finish.finishPosition;
    return {
      ...standing,
      points: standing.points + resolveFieldPoints(finish.finishPosition),
      starts,
      wins: standing.wins + (finish.finishPosition === 1 ? 1 : 0),
      topFives:
        standing.topFives + (finish.finishPosition <= 5 ? 1 : 0),
      topTens:
        standing.topTens + (finish.finishPosition <= 10 ? 1 : 0),
      totalFinish,
      averageFinish: Math.round((totalFinish / starts) * 100) / 100,
      lastFinish: finish.finishPosition,
    };
  });

  return {
    ...state,
    raceField: {
      ...state.raceField,
      standings,
      processedRaceIds: [
        ...state.raceField.processedRaceIds,
        transactionId,
      ],
    },
  };
}

export type StandingsRow = DriverStanding & {
  position: number;
  carNumber: string;
  driverName: string;
  teamName: string;
  teamCode: string;
  manufacturerId: RaceFieldEntry['manufacturerId'];
  isPlayerTeam: boolean;
};

export function selectStandings(state: GameState): StandingsRow[] {
  const entries = new Map(
    state.raceField.entries.map((entry) => [entry.id, entry]),
  );
  return state.raceField.standings
    .map((standing) => {
      const entry = entries.get(standing.entryId);
      if (!entry) {
        throw new Error(`Standing references unknown entry: ${standing.entryId}`);
      }
      const driver = getFieldDriver(state, entry);
      const organization = getFieldOrganization(state, entry.teamId);
      return {
        ...standing,
        carNumber: entry.carNumber,
        driverName: driver.name,
        teamName: organization.name,
        teamCode: organization.shortCode,
        manufacturerId: entry.manufacturerId,
        isPlayerTeam: entry.isPlayerTeam,
      };
    })
    .sort(
      (left, right) =>
        right.points - left.points ||
        right.wins - left.wins ||
        right.topFives - left.topFives ||
        (left.averageFinish ?? Number.MAX_SAFE_INTEGER) -
          (right.averageFinish ?? Number.MAX_SAFE_INTEGER) ||
        left.entryId.localeCompare(right.entryId),
    )
    .map((standing, index) => ({ ...standing, position: index + 1 }));
}

export function selectFocusedTimingTower(
  runningOrder: readonly RunningOrderEntry[],
  maximumRows = raceFieldTuning.timingTower.maximumVisibleRows,
): RunningOrderEntry[] {
  if (runningOrder.length <= maximumRows) return [...runningOrder];
  const requiredIds = new Set<string>();
  const addWindow = (index: number) => {
    for (
      let offset = -raceFieldTuning.timingTower.nearbyRadius;
      offset <= raceFieldTuning.timingTower.nearbyRadius;
      offset += 1
    ) {
      const entry = runningOrder[index + offset];
      if (entry) requiredIds.add(entry.id);
    }
  };

  if (runningOrder[0]) requiredIds.add(runningOrder[0].id);
  runningOrder.forEach((entry, index) => {
    if (entry.isPlayerTeam) addWindow(index);
  });

  const required = runningOrder.filter((entry) => requiredIds.has(entry.id));
  if (required.length <= maximumRows) return required;

  const apex = required.filter((entry) => entry.isPlayerTeam);
  const selectedIds = new Set([
    runningOrder[0]?.id,
    ...apex.map((entry) => entry.id),
  ]);
  const prioritizedNeighbors = required
    .filter((entry) => !selectedIds.has(entry.id))
    .sort((left, right) => {
      const leftDistance = Math.min(
        ...apex.map((entry) => Math.abs(entry.position - left.position)),
      );
      const rightDistance = Math.min(
        ...apex.map((entry) => Math.abs(entry.position - right.position)),
      );
      return leftDistance - rightDistance || left.position - right.position;
    });

  prioritizedNeighbors
    .slice(0, Math.max(0, maximumRows - selectedIds.size))
    .forEach((entry) => selectedIds.add(entry.id));
  return runningOrder.filter((entry) => selectedIds.has(entry.id));
}
