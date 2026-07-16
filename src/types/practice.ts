import type { Driver, DriverStat, RaceEvent, Team, Track, Vehicle } from '@/types/game';

export type PracticeChoiceId = 'one-lap-speed' | 'long-run-balance' | 'driver-feedback';

export type PracticeChoice = {
  id: PracticeChoiceId;
  name: string;
  intent: string;
  description: string;
  effectSummary: string;
  ratingEmphasis: readonly DriverStat[];
  effects: {
    setupConfidence: number;
    qualifyingPace: number;
    racePace: number;
  };
};

export type PracticeEntryInput = {
  driver: Driver;
  vehicle: Vehicle;
};

export type PracticeInput = {
  race: RaceEvent;
  track: Track;
  team: Team;
  crewChiefQuality: number;
  entries: readonly PracticeEntryInput[];
  selectedChoice: PracticeChoice;
};

export type PracticeEntryResult = {
  carNumber: string;
  driverName: string;
  setupConfidence: number;
  crewFeedback: string;
  insight: string;
  qualifyingEffect: string;
  raceEffect: string;
};

export type PracticeResult = {
  raceId: string;
  raceName: string;
  trackName: string;
  trackType: Track['type'];
  selectedChoice: PracticeChoice;
  entries: PracticeEntryResult[];
};
