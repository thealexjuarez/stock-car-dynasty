import { raceFieldTuning } from '@/data/race-field-config';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { getNextRace, starterGameState } from '@/data/starter-game-state';
import {
  calculateFieldEntryRating,
  getFieldDriver,
  getFieldOrganization,
} from '@/simulation/race-field';
import type { GameState } from '@/types/game';
import type { RaceWeekendState, WeekendEntrant } from '@/types/race-weekend';
import type {
  CarSpriteMetadata,
  RacePresentationConfig,
  RacePresentationEntrant,
  RaceSessionKind,
} from '@/types/race-presentation';

/**
 * PRESENTATION-ONLY SESSION ASSUMPTIONS.
 *
 * The ERCA field size is authoritative. Qualifying duration, lap counts,
 * telemetry, camera range, and sample motion remain provisional presentation
 * values and are centralized here for later tuning.
 */
export const racePresentationAssumptions = {
  canonicalFieldSize: raceFieldTuning.fieldSize,
  fieldSize: raceFieldTuning.fieldSize,
  visibleCarLimit: 7,
  spriteLogicalWidth: 108,
  spriteLogicalHeight: 44,
  cameraWindow: 0.065,
  sampleIntervalMs: 500,
  visualInterpolationMs: 540,
  ovalCycleMs: 12_000,
  worldMotionPixelsPerSecond: 300,
  bankAngleDegrees: 3.5,
  turnCarAngleDegrees: 2.25,
  qualifyingLaps: 2,
  qualifyingRunDurationMs: 24_000,
  qualifyingResultDurationMs: 6_000,
  qualifyingTravelLaps: 1.8,
  raceLaps: 40,
  racePresentationDurationMs: 180_000,
  racePresentationTravelLaps: 32.5,
  temperatureFahrenheit: 78,
  weather: 'Clear',
  trackCondition: 'Dry',
  presentationPaceBase: 0.972,
  presentationPaceRatingScale: 0.00045,
} as const;

const sprite = (
  bodyColor: string,
  accentColor: string,
  manufacturerId: RacePresentationEntrant['manufacturerId'],
  numberColor = '#FFFFFF',
): CarSpriteMetadata => ({
  bodyColor,
  accentColor,
  numberColor,
  manufacturerId,
  logicalWidth: racePresentationAssumptions.spriteLogicalWidth,
  logicalHeight: racePresentationAssumptions.spriteLogicalHeight,
});

const playerPaintSchemes: Record<string, Pick<CarSpriteMetadata, 'bodyColor' | 'accentColor'>> = {
  '45': { bodyColor: '#D93A32', accentColor: '#F4F1E8' },
  '46': { bodyColor: '#2878C8', accentColor: '#F1C84B' },
};

export function getRacePresentationConfig(kind: RaceSessionKind): RacePresentationConfig {
  const qualifyingDurationMs =
    racePresentationAssumptions.qualifyingRunDurationMs * 2 +
    racePresentationAssumptions.qualifyingResultDurationMs;

  return {
    kind,
    sessionLabel:
      kind === 'qualifying'
        ? raceWeekendCopy.qualifying.sessionLabel
        : raceWeekendCopy.race.sessionLabel,
    totalLaps:
      kind === 'qualifying'
        ? racePresentationAssumptions.qualifyingLaps
        : racePresentationAssumptions.raceLaps,
    weather: racePresentationAssumptions.weather,
    trackCondition: racePresentationAssumptions.trackCondition,
    temperatureFahrenheit: racePresentationAssumptions.temperatureFahrenheit,
    cautionState: 'Green',
    canonicalFieldSize: racePresentationAssumptions.canonicalFieldSize,
    fieldSize: racePresentationAssumptions.fieldSize,
    visibleCarLimit: racePresentationAssumptions.visibleCarLimit,
    cameraWindow: racePresentationAssumptions.cameraWindow,
    sampleIntervalMs: racePresentationAssumptions.sampleIntervalMs,
    visualInterpolationMs: racePresentationAssumptions.visualInterpolationMs,
    ovalCycleMs: racePresentationAssumptions.ovalCycleMs,
    sessionDurationMs:
      kind === 'qualifying'
        ? qualifyingDurationMs
        : racePresentationAssumptions.racePresentationDurationMs,
    qualifyingResultDurationMs: racePresentationAssumptions.qualifyingResultDurationMs,
    presentationTravelLaps:
      kind === 'qualifying'
        ? racePresentationAssumptions.qualifyingTravelLaps
        : racePresentationAssumptions.racePresentationTravelLaps,
    worldMotionPixelsPerSecond: racePresentationAssumptions.worldMotionPixelsPerSecond,
    bankAngleDegrees: racePresentationAssumptions.bankAngleDegrees,
    turnCarAngleDegrees: racePresentationAssumptions.turnCarAngleDegrees,
  };
}

export function getRacePresentationEntrants(
  state: GameState = starterGameState,
  weekend?: RaceWeekendState,
): RacePresentationEntrant[] {
  const { track } = getNextRace(state);
  if (!track) throw new Error('Missing current track for ERCA field');

  const activeEntries = state.raceField.entries.filter((entry) => entry.active);
  if (activeEntries.length !== raceFieldTuning.fieldSize) {
    throw new Error(
      `ERCA field must contain exactly ${raceFieldTuning.fieldSize} active entries`,
    );
  }

  return activeEntries.map((entry, index) => {
    const driver = getFieldDriver(state, entry);
    const organization = getFieldOrganization(state, entry.teamId);
    const vehicle = entry.isPlayerTeam
      ? state.vehicles.find((item) => item.assignedDriverId === entry.driverId)
      : undefined;
    const rating = calculateFieldEntryRating(state, entry, track);
    const qualifying = weekend?.qualifying?.entries.find((item) => item.id === entry.id);
    const race = weekend?.race?.entries.find((item) => item.id === entry.id);
    const qualifyingPosition = qualifying?.position ?? index + 1;
    const finishPosition = race?.finishPosition ?? qualifyingPosition;
    const orderedPosition =
      weekend?.phase === 'race' || weekend?.phase === 'results'
        ? finishPosition
        : qualifyingPosition;
    const paint = playerPaintSchemes[entry.carNumber];

    return {
      id: entry.id,
      carNumber: entry.carNumber,
      driverName: driver.name,
      driverId: entry.driverId,
      teamId: entry.teamId,
      teamName: organization.name,
      manufacturerId: entry.manufacturerId,
      playerDriverId: entry.isPlayerTeam ? entry.driverId : undefined,
      isPlayerTeam: entry.isPlayerTeam,
      lane: (Number(entry.carNumber) % 3) as 0 | 1 | 2,
      qualifyingOnTrack: entry.isPlayerTeam,
      qualifyingStartDistance:
        0.2 + (raceFieldTuning.fieldSize - qualifyingPosition) * 0.018,
      raceStartDistance:
        7.3 + (raceFieldTuning.fieldSize - qualifyingPosition) * 0.012,
      paceFactor:
        weekend
          ? 0.99 + (raceFieldTuning.fieldSize - orderedPosition) * 0.0012
          : racePresentationAssumptions.presentationPaceBase +
            rating * racePresentationAssumptions.presentationPaceRatingScale,
      tireStatus: index < 16 ? 'Good' : 'Used',
      tirePercent: Math.max(78, 94 - (index % 12)),
      fuelPercent: Math.max(66, 76 - (index % 10)),
      carCondition: vehicle?.condition,
      sprite: sprite(
        paint?.bodyColor ?? organization.primaryColor,
        paint?.accentColor ?? organization.accentColor,
        entry.manufacturerId,
        paint ? '#FFFFFF' : organization.accentColor,
      ),
    };
  });
}

export function getWeekendEntrants(state: GameState = starterGameState): WeekendEntrant[] {
  const { track } = getNextRace(state);
  if (!track) throw new Error('Missing current track for ERCA field');

  return state.raceField.entries
    .filter((entry) => entry.active)
    .map((entry) => {
      const driver = getFieldDriver(state, entry);
      const organization = getFieldOrganization(state, entry.teamId);
      const vehicle = entry.isPlayerTeam
        ? state.vehicles.find((item) => item.assignedDriverId === entry.driverId)
        : undefined;
      return {
        id: entry.id,
        carNumber: entry.carNumber,
        driverName: driver.name,
        teamId: entry.teamId,
        teamName: organization.name,
        manufacturerId: entry.manufacturerId,
        isPlayerTeam: entry.isPlayerTeam,
        driverId: entry.driverId,
        vehicleId: vehicle?.id,
        baselineRating: entry.isPlayerTeam
          ? 0
          : calculateFieldEntryRating(state, entry, track),
      };
    });
}

export function getRacePresentationContext(state: GameState = starterGameState) {
  const { race, track } = getNextRace(state);

  if (!race || !track) {
    throw new Error('Missing current race or track for race presentation');
  }

  return { race, track };
}
