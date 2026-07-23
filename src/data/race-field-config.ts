export const raceFieldTuning = {
  fieldSize: 32,
  opponentCount: 30,
  contributionWeights: {
    driver: 0.6,
    teamEquipment: 0.4,
  },
  driverRatingWeights: {
    trackStats: 0.7,
    overall: 0.3,
  },
  teamRatingWeights: {
    teamPerformance: 0.5,
    equipmentStrength: 0.5,
  },
  playerWeekendWeights: {
    qualifying: {
      trackStats: 0.42,
      overall: 0.18,
      vehiclePerformance: 0.2,
      condition: 0.1,
      crew: 0.1,
    },
    race: {
      trackStats: 0.42,
      overall: 0.18,
      vehiclePerformance: 0.2,
      condition: 0.1,
      crew: 0.1,
    },
  },
  standings: {
    maximumFinishPoints: 32,
    minimumFinishPoints: 1,
  },
  timingTower: {
    maximumVisibleRows: 10,
    nearbyRadius: 2,
  },
} as const;

export function resolveFieldPoints(finishPosition: number) {
  if (
    !Number.isInteger(finishPosition) ||
    finishPosition < 1 ||
    finishPosition > raceFieldTuning.fieldSize
  ) {
    throw new Error(`Invalid ERCA standings position: ${finishPosition}`);
  }

  return Math.max(
    raceFieldTuning.standings.minimumFinishPoints,
    raceFieldTuning.standings.maximumFinishPoints - finishPosition + 1,
  );
}
