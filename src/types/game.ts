export type DriverMorale = 'Happy' | 'Neutral' | 'Concerned';
export type DriverConfidence = 'Steady' | 'Shaken' | 'Hot';
export type DriverFatigue = 'Fresh' | 'Tired' | 'Worn';
export type TrackType = 'Short Track' | 'Intermediate' | 'Superspeedway' | 'Road Course' | 'Long Oval';
export type DriverStat = 'Speed' | 'Cornering' | 'Braking' | 'Throttle Control' | 'Racecraft' | 'Qualifying' | 'Restarts' | 'Tire Management' | 'Consistency' | 'Awareness';

export type Team = {
  id: string; name: string; cash: number; series: string; sanctioningBody: string; manufacturerId: ManufacturerId | null;
  reputation: number; brandPower: number; recruitingPull: number; sponsorAppeal: number;
  carPerformance: number; pitCrewQuality: number; engineeringQuality: number; garageEfficiency: number; morale: number;
};
export type Driver = {
  id: string; name: string; age: number; hometown: string; carNumber: string; overall: number; potential: number;
  role: string; archetypes: string[]; stats: Record<DriverStat, number>; salary: number; contract: string;
  morale: DriverMorale; confidence: DriverConfidence; fatigue: DriverFatigue; exp: number; nextRatingExp: number;
  developmentTrend: string; growthModifiers: string[]; active: boolean;
};
export type Vehicle = {
  id: string; number: string; assignedDriverId: string; condition: number; performance: number;
  chassisWear: string; engineWear: string; note: string; active: boolean;
};
export type StaffMember = { id: string; name: string; role: string; quality: number; trait: string; salary: number; effect: string; active: boolean };
export type Sponsor = { id: string; name: string; slot: string; personality: string; annualValue: number; goal: string; bonus: string; active: boolean };
export type Facility = { id: string; name: string; level: number; cap: number; purpose: string };
export type ManufacturerId = 'manufacturer-ford' | 'manufacturer-chevrolet' | 'manufacturer-toyota';
export type Manufacturer = { id: ManufacturerId; name: 'Ford' | 'Chevrolet' | 'Toyota' };
export type StartingWorldOrganization = {
  id: string;
  name: string;
  role: 'Unresolved';
  teamRelationship: 'Unresolved';
  sourceNote: string;
};
export type Track = { id: string; name: string; type: TrackType; keyStats: DriverStat[]; tireWear: string; cautionRisk: string; strategyNote: string };
export type RaceEvent = { id: string; round: number; week: number; name: string; trackId: string };
export type GameState = { sanctioningBody: string; series: string; season: number; week: number; currentDate: string; team: Team; drivers: Driver[]; vehicles: Vehicle[]; staff: StaffMember[]; sponsors: Sponsor[]; manufacturers: Manufacturer[]; startingWorldOrganizations: StartingWorldOrganization[]; facilities: Facility[]; tracks: Track[]; calendar: RaceEvent[]; nextRaceId: string };
