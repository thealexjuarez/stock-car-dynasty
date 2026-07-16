import type { ManufacturerId } from '@/types/game';

export type RaceSessionKind = 'qualifying' | 'race';
export type PlaybackSpeed = 1 | 2 | 4;
export type DriverPaceMode = 'Conserve' | 'Balanced' | 'Push';
export type TireStatus = 'New' | 'Good' | 'Used' | 'Worn';

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
  playerDriverId?: string;
  isPlayerTeam: boolean;
  lane: 0 | 1 | 2;
  qualifyingOnTrack: boolean;
  qualifyingStartDistance: number;
  raceStartDistance: number;
  pacePerTick: number;
  tireStatus: TireStatus;
  tirePercent: number;
  fuelPercent: number;
  carCondition?: number;
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
  prototypeFieldSize: number;
  visibleCarLimit: number;
  cameraWindow: number;
  updateIntervalMs: number;
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
  visibleCars: SceneCar[];
  currentLap: number;
  sessionProgress: number;
  focusedEntry: RunningOrderEntry;
};
