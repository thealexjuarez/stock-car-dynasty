import type { ManufacturerId } from '@/types/game';
import type { ClosingPace, TireLabel } from '@/types/race-depth';

export type RaceSessionKind = 'qualifying' | 'race';
export type PlaybackSpeed = 1 | 2 | 4;
export type DriverPaceMode = 'Conserve' | 'Balanced' | 'Push';
export type TireStatus = TireLabel;
export type OvalPresentationPhase =
  | 'Front Straight'
  | 'Turns 1–2'
  | 'Back Straight'
  | 'Turns 3–4';

export type CarSpriteMetadata = {
  bodyColor: string;
  accentColor: string;
  numberColor: string;
  logicalWidth: number;
  logicalHeight: number;
  manufacturerId?: ManufacturerId;
};

export type RacePresentationEntrant = {
  id: string;
  carNumber: string;
  driverName: string;
  driverId: string;
  teamId: string;
  teamName: string;
  manufacturerId: ManufacturerId;
  playerDriverId?: string;
  isPlayerTeam: boolean;
  lane: 0 | 1 | 2;
  qualifyingOnTrack: boolean;
  qualifyingStartDistance: number;
  raceStartDistance: number;
  paceFactor: number;
  authoritativeFinishPosition?: number;
  tireStatus: TireStatus;
  tirePercent: number;
  fuelPercent: number;
  carCondition?: number;
  planLabel?: string;
  nextServiceLabel?: string;
  segmentSnapshots?: readonly {
    segment: number;
    position: number;
    tirePercent: number;
    tireStatus: TireStatus;
    fuelPercent: number;
    pace: ClosingPace;
    pitStatus: string;
    caution: boolean;
    damageConditionLoss: number;
  }[];
  sprite: CarSpriteMetadata;
};

export type RacePresentationConfig = {
  kind: RaceSessionKind;
  sessionLabel: string;
  totalLaps: number;
  weather: string;
  trackCondition: string;
  temperatureFahrenheit: number;
  cautionState: 'Green' | 'Caution';
  canonicalFieldSize: number;
  fieldSize: number;
  visibleCarLimit: number;
  cameraWindow: number;
  sampleIntervalMs: number;
  visualInterpolationMs: number;
  ovalCycleMs: number;
  sessionDurationMs: number;
  qualifyingResultDurationMs: number;
  presentationTravelLaps: number;
  worldMotionPixelsPerSecond: number;
  bankAngleDegrees: number;
  turnCarAngleDegrees: number;
};

export type RunningOrderEntry = RacePresentationEntrant & {
  position: number;
  distance: number;
  interval: string;
};

export type SceneCar = {
  entrant: RunningOrderEntry;
  relativeTrackPosition: number;
};

export type RacePresentationModel = {
  runningOrder: RunningOrderEntry[];
  timingTowerOrder: RunningOrderEntry[];
  visibleCars: SceneCar[];
  currentLap: number;
  sessionProgress: number;
  focusedEntry: RunningOrderEntry;
  elapsedMs: number;
  isComplete: boolean;
  activeQualifyingEntryId?: string;
  qualifyingRunNumber?: number;
  ovalPhase: OvalPresentationPhase;
  currentSegment: number;
  currentStage: number;
  currentSegmentLabel: string;
  cautionState: 'Green' | 'Caution' | 'Red Flag';
};
