export type DriverMorale = 'Happy' | 'Neutral' | 'Concerned';
export type DriverConfidence = 'Steady' | 'Shaken' | 'Hot';
export type DriverFatigue = 'Fresh' | 'Tired' | 'Worn';
export type VehicleReadiness = 'Yes' | 'At Risk' | 'No';
export type ComponentStatus = 'Excellent' | 'Good' | 'Tired' | 'Worn' | 'Critical';
export type SponsorTier = 'Title Sponsor' | 'Secondary Sponsor' | 'Associate Sponsor';
export type StaffRole = 'Team Manager' | 'Crew Chief' | 'Mechanic Lead' | 'Marketing Admin';
export type TrackType =
  | 'Intermediate Oval'
  | 'Paperclip'
  | 'Short Track'
  | 'Superspeedway'
  | 'Tire-Wear Oval'
  | 'Road Course'
  | 'Street Course';

export type Team = {
  id: string;
  name: string;
  cash: number;
  brandPower: number;
  series: string;
  sanctioningBody: string;
  manufacturerId: string;
};

export type Driver = {
  id: string;
  name: string;
  age: number;
  overall: number;
  role: string;
  archetype: string;
  trait: string;
  morale: DriverMorale;
  confidence: DriverConfidence;
  fatigue: DriverFatigue;
  active: boolean;
};

export type Vehicle = {
  id: string;
  number: string;
  assignedDriverId: string;
  condition: number;
  wear: number;
  engine: ComponentStatus;
  transmission: ComponentStatus;
  raceReady: VehicleReadiness;
  active: boolean;
};

export type StaffMember = {
  id: string;
  name: string;
  role: StaffRole;
  overall: number;
  active: boolean;
};

export type Sponsor = {
  id: string;
  name: string;
  tier: SponsorTier;
  payoutPerRace: number;
  goal: string;
  active: boolean;
};

export type Facility = {
  id: string;
  name: string;
  level: number;
};

export type Manufacturer = {
  id: string;
  name: string;
  relationship: number;
  supportLevel: string;
  partsDiscountPercent: number;
};

export type Track = {
  id: string;
  name: string;
  type: TrackType;
};

export type RaceEvent = {
  id: string;
  round: number;
  week: number;
  name: string;
  trackId: string;
};

export type GameState = {
  sanctioningBody: string;
  series: string;
  season: number;
  week: number;
  currentDate: string;
  team: Team;
  drivers: Driver[];
  vehicles: Vehicle[];
  staff: StaffMember[];
  sponsors: Sponsor[];
  manufacturer: Manufacturer;
  facilities: Facility[];
  tracks: Track[];
  calendar: RaceEvent[];
  nextRaceId: string;
};
