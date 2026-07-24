import type {
  DriverArchetype,
  DriverStat,
  ManufacturerId,
} from '@/types/game';

export type FieldOrganizationTier =
  | 'Elite'
  | 'Strong'
  | 'Midfield'
  | 'Underfunded';

export type IncidentTendency = 'Low' | 'Medium' | 'High';

export type RaceFieldOrganization = {
  id: string;
  name: string;
  shortCode: string;
  manufacturerId: ManufacturerId;
  teamPerformance: number;
  equipmentStrength: number;
  reliability: number;
  tier: FieldOrganizationTier;
  primaryColor: string;
  accentColor: string;
  isPlayerTeam: boolean;
};

export type OpponentDriver = {
  id: string;
  name: string;
  age: number;
  overall: number;
  potential: number;
  archetypes: [DriverArchetype, DriverArchetype];
  stats: Record<DriverStat, number>;
  careerBackground: string;
  teamId: string;
  carNumber: string;
  manufacturerId: ManufacturerId;
  consistencyTendency: number;
  incidentTendency: IncidentTendency;
  developmentOutlook: string;
  active: boolean;
};

export type RaceFieldEntry = {
  id: string;
  carNumber: string;
  driverId: string;
  teamId: string;
  manufacturerId: ManufacturerId;
  active: boolean;
  series: 'ERCA Stock Series';
  isPlayerTeam: boolean;
};

export type DriverStanding = {
  entryId: string;
  driverId: string;
  points: number;
  starts: number;
  wins: number;
  topFives: number;
  topTens: number;
  totalFinish: number;
  averageFinish: number | null;
  lastFinish: number | null;
};

export type RaceFieldState = {
  organizations: RaceFieldOrganization[];
  opponentDrivers: OpponentDriver[];
  entries: RaceFieldEntry[];
  standings: DriverStanding[];
  processedRaceIds: string[];
};
