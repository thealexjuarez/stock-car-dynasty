import { getNextRace, starterGameState } from '@/data/starter-game-state';
import type {
  CarSpriteMetadata,
  RacePresentationConfig,
  RacePresentationEntrant,
  RaceSessionKind,
} from '@/types/race-presentation';

/**
 * PRESENTATION-ONLY SESSION ASSUMPTIONS.
 *
 * The vNext Bible locks the 32-car ERCA grid and race-weekend order, but not
 * qualifying format, lap counts, telemetry, camera range, or sample motion.
 * Every temporary presentation value lives here so future simulation work can
 * replace it without rewriting the HUD or scene components.
 */
export const racePresentationAssumptions = {
  canonicalFieldSize: 32,
  prototypeFieldSize: 12,
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
} as const;

const sprite = (
  bodyColor: string,
  accentColor: string,
  numberColor = '#FFFFFF',
): CarSpriteMetadata => ({
  bodyColor,
  accentColor,
  numberColor,
  logicalWidth: racePresentationAssumptions.spriteLogicalWidth,
  logicalHeight: racePresentationAssumptions.spriteLogicalHeight,
});

const canonicalPrototypeCompetitorData = [
  {
    id: 'presentation-12', carNumber: '12', driverName: 'Grant Calder', lane: 0,
    qualifyingOnTrack: true, qualifyingStartDistance: 0.538, raceStartDistance: 7.538,
    paceFactor: 1.012, tireStatus: 'Good', tirePercent: 92, fuelPercent: 74,
    sprite: sprite('#E9E2D0', '#B52832', '#111827'),
  },
  {
    id: 'presentation-13', carNumber: '13', driverName: 'Wesley Boone', lane: 2,
    qualifyingOnTrack: false, qualifyingStartDistance: 0.415, raceStartDistance: 7.518,
    paceFactor: 1.004, tireStatus: 'Good', tirePercent: 90, fuelPercent: 73,
    sprite: sprite('#E07A22', '#121820'),
  },
  {
    id: 'presentation-2', carNumber: '2', driverName: 'Dale Iverson', lane: 1,
    qualifyingOnTrack: false, qualifyingStartDistance: 0.31, raceStartDistance: 7.502,
    paceFactor: 1.009, tireStatus: 'Good', tirePercent: 91, fuelPercent: 72,
    sprite: sprite('#E8B923', '#243047', '#111827'),
  },
  {
    id: 'presentation-20', carNumber: '20', driverName: 'Nolan Briggs', lane: 0,
    qualifyingOnTrack: true, qualifyingStartDistance: 0.472, raceStartDistance: 7.486,
    paceFactor: 1.001, tireStatus: 'Good', tirePercent: 89, fuelPercent: 72,
    sprite: sprite('#5E7CE2', '#E7EEF9'),
  },
  {
    id: 'presentation-7', carNumber: '7', driverName: 'Spencer Vale', lane: 2,
    qualifyingOnTrack: true, qualifyingStartDistance: 0.518, raceStartDistance: 7.471,
    paceFactor: 1.006, tireStatus: 'Good', tirePercent: 90, fuelPercent: 71,
    sprite: sprite('#35A56F', '#0C2530'),
  },
  {
    id: 'presentation-71', carNumber: '71', driverName: 'Marcus Wynn', lane: 1,
    qualifyingOnTrack: false, qualifyingStartDistance: 0.245, raceStartDistance: 7.454,
    paceFactor: 0.998, tireStatus: 'Used', tirePercent: 86, fuelPercent: 70,
    sprite: sprite('#8E5DB7', '#E9DBF6'),
  },
  {
    id: 'presentation-5', carNumber: '5', driverName: 'Parker Bell', lane: 0,
    qualifyingOnTrack: false, qualifyingStartDistance: 0.19, raceStartDistance: 7.437,
    paceFactor: 0.996, tireStatus: 'Used', tirePercent: 85, fuelPercent: 70,
    sprite: sprite('#D9485F', '#F7D9DE'),
  },
  {
    id: 'presentation-55', carNumber: '55', driverName: 'Austin Keene', lane: 2,
    qualifyingOnTrack: true, qualifyingStartDistance: 0.446, raceStartDistance: 7.421,
    paceFactor: 0.992, tireStatus: 'Used', tirePercent: 84, fuelPercent: 69,
    sprite: sprite('#34A6C8', '#D9F3FA', '#10212A'),
  },
  {
    id: 'presentation-18', carNumber: '18', driverName: 'Logan Price', lane: 1,
    qualifyingOnTrack: true, qualifyingStartDistance: 0.489, raceStartDistance: 7.405,
    paceFactor: 0.994, tireStatus: 'Used', tirePercent: 83, fuelPercent: 69,
    sprite: sprite('#F1EFEA', '#2F5C99', '#142033'),
  },
  {
    id: 'presentation-81', carNumber: '81', driverName: 'Trey Maddox', lane: 0,
    qualifyingOnTrack: false, qualifyingStartDistance: 0.12, raceStartDistance: 7.388,
    paceFactor: 0.989, tireStatus: 'Used', tirePercent: 82, fuelPercent: 68,
    sprite: sprite('#39424E', '#D4A927'),
  },
] as const satisfies readonly Omit<
  RacePresentationEntrant,
  'isPlayerTeam' | 'playerDriverId' | 'carCondition'
>[];

const canonicalPrototypeCompetitors: RacePresentationEntrant[] =
  canonicalPrototypeCompetitorData.map((entry) => ({ ...entry, isPlayerTeam: false }));

const playerPaintSchemes: Record<string, CarSpriteMetadata> = {
  '45': sprite('#D93A32', '#F4F1E8'),
  '46': sprite('#2878C8', '#F1C84B'),
};

export function getRacePresentationConfig(kind: RaceSessionKind): RacePresentationConfig {
  const qualifyingDurationMs =
    racePresentationAssumptions.qualifyingRunDurationMs * 2 +
    racePresentationAssumptions.qualifyingResultDurationMs;

  return {
    kind,
    sessionLabel: kind === 'qualifying' ? 'Qualifying' : 'Live Race',
    totalLaps:
      kind === 'qualifying'
        ? racePresentationAssumptions.qualifyingLaps
        : racePresentationAssumptions.raceLaps,
    weather: racePresentationAssumptions.weather,
    trackCondition: racePresentationAssumptions.trackCondition,
    temperatureFahrenheit: racePresentationAssumptions.temperatureFahrenheit,
    cautionState: 'Green',
    canonicalFieldSize: racePresentationAssumptions.canonicalFieldSize,
    prototypeFieldSize: racePresentationAssumptions.prototypeFieldSize,
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

export function getRacePresentationEntrants(): RacePresentationEntrant[] {
  const playerEntries = starterGameState.vehicles.map((vehicle, index) => {
    const driver = starterGameState.drivers.find(
      (item) => item.id === vehicle.assignedDriverId,
    );

    if (!driver) {
      throw new Error(`Missing assigned driver for Car #${vehicle.number}`);
    }

    return {
      id: `presentation-${vehicle.number}`,
      carNumber: vehicle.number,
      driverName: driver.name,
      playerDriverId: driver.id,
      isPlayerTeam: true,
      lane: index === 0 ? 1 : 2,
      qualifyingOnTrack: true,
      qualifyingStartDistance: index === 0 ? 0.5 : 0.458,
      raceStartDistance: index === 0 ? 7.462 : 7.429,
      paceFactor: index === 0 ? 1.003 : 0.997,
      tireStatus: 'Good',
      tirePercent: index === 0 ? 88 : 85,
      fuelPercent: index === 0 ? 71 : 69,
      carCondition: vehicle.condition,
      sprite: {
        ...playerPaintSchemes[vehicle.number],
        manufacturerId: starterGameState.team.manufacturerId,
      },
    } satisfies RacePresentationEntrant;
  });

  return [...canonicalPrototypeCompetitors, ...playerEntries];
}

export function getRacePresentationContext() {
  const { race, track } = getNextRace();

  if (!race || !track) {
    throw new Error('Missing current race or track for race presentation');
  }

  return { race, track };
}
