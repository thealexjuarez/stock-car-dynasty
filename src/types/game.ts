import type { RecruitingState } from '@/types/recruiting';
import type { RaceFieldState } from '@/types/race-field';

export type DriverMorale = 'Happy' | 'Neutral' | 'Concerned';
export type DriverConfidence = 'Steady' | 'Shaken' | 'Hot';
export type DriverFatigue = 'Fresh' | 'Tired' | 'Worn';
export type VehicleReadiness = 'Ready' | 'At Risk' | 'Not Ready';
export type DamageClassification =
  | 'clean-light'
  | 'minor'
  | 'moderate'
  | 'heavy'
  | 'major'
  | 'near-total';
export type RepairApproach = 'minimum' | 'recommended' | 'full';
export type RepairOptionId = `${DamageClassification}:${RepairApproach}`;
export type TrackType = 'Short Track' | 'Intermediate' | 'Superspeedway' | 'Road Course' | 'Long Oval';
export type DriverStat = 'Speed' | 'Cornering' | 'Braking' | 'Throttle Control' | 'Racecraft' | 'Qualifying' | 'Restarts' | 'Tire Management' | 'Consistency' | 'Awareness';
export type DriverArchetype =
  | 'Complete Driver'
  | 'Road Course Specialist'
  | 'Short Track Specialist'
  | 'Superspeedway Specialist'
  | 'Long Run Driver'
  | 'Aggressive Driver'
  | 'Reliable Journeyman'
  | 'Development Prospect';
export type ArchetypeSlot = 'primary' | 'secondary';
export type ArchetypeRiskFlag =
  | 'higher-contact-risk'
  | 'smaller-contact-risk'
  | 'reduced-damage-risk'
  | 'small-damage-risk-reduction';
export type StaffTrait =
  | 'Development-Minded'
  | 'Local Buzz Builder'
  | 'Budget Fixer'
  | 'Short Track Network'
  | string;
export type SponsorLead = {
  id: string;
  sponsorName: string;
  projectedRaceBacking: { minimum: number; maximum: number };
  activationCondition: string;
  status: 'dormant';
};
export type RepairTransaction = {
  id: string;
  raceId: string;
  vehicleId: string;
  vehicleNumber: string;
  optionId: RepairOptionId;
  damageClass: DamageClassification;
  baseCost: number;
  budgetFixerDiscount: number;
  chargedCost: number;
  conditionBefore: number;
  conditionAfter: number;
};
export type WeekendSettlementRecord = {
  id: string;
  raceId: string;
  season: number;
  week: number;
  winningsByCar: {
    vehicleId: string;
    carNumber: string;
    finishPosition: number;
    amount: number;
  }[];
  totalRaceWinnings: number;
  sponsorIncome: number;
  operatingCostBase: number;
  budgetFixerDiscount: number;
  operatingCostCharged: number;
  operatingCostShortfall: number;
  repairSpending: number;
  settlementCashChange: number;
  netWeekend: number;
  cashBeforeWeekend: number;
  cashAfter: number;
};
export type EconomyState = {
  processedTransactionIds: string[];
  repairTransactions: RepairTransaction[];
  settlementHistory: WeekendSettlementRecord[];
};

export type Team = {
  id: string; name: string; cash: number; series: string; sanctioningBody: string; manufacturerId: ManufacturerId;
  reputation: number; brandPower: number; recruitingPull: number; sponsorAppeal: number;
  carPerformance: number; pitCrewQuality: number; engineeringQuality: number; garageEfficiency: number; morale: number;
};
export type Driver = {
  id: string; name: string; age: number; hometown: string; carNumber: string; overall: number; potential: number;
  role: string; archetypes: [DriverArchetype, DriverArchetype]; stats: Record<DriverStat, number>; salary: number; contract: string;
  morale: DriverMorale; confidence: DriverConfidence; fatigue: DriverFatigue; exp: number; nextRatingExp: number;
  developmentTrend: string; growthModifiers: string[]; sponsorLeads: SponsorLead[]; active: boolean;
};
export type Vehicle = {
  id: string; number: string; assignedDriverId: string; condition: number; damage: number;
  damageClass: DamageClassification; readiness: VehicleReadiness; performance: number;
  chassisWear: string; engineWear: string; note: string; active: boolean;
};
export type StaffMember = { id: string; name: string; role: string; quality: number; trait: StaffTrait; salary: number; effect: string; active: boolean };
export type Sponsor = { id: string; name: string; slot: string; personality: string; annualValue: number; goal: string; bonus: string; active: boolean };
export type Facility = { id: string; name: string; level: number; cap: number; purpose: string };
export type ManufacturerId = 'fard' | 'chevrolat' | 'toyoda';
export type Manufacturer = {
  id: ManufacturerId;
  displayName: 'Fard' | 'Chevrolat' | 'Toyoda';
  description: string;
  presentation: {
    compactName: string;
    initials: string;
  };
};
export type TrackRisk = 'Low' | 'Medium' | 'High';
export type Track = { id: string; name: string; type: TrackType; keyStats: DriverStat[]; tireWear: TrackRisk; cautionRisk: TrackRisk; strategyNote: string };
export type RaceEvent = { id: string; round: number; week: number; name: string; trackId: string };
export type GameState = {
  stateVersion: number;
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
  manufacturers: Manufacturer[];
  facilities: Facility[];
  tracks: Track[];
  calendar: RaceEvent[];
  nextRaceId: string;
  economy: EconomyState;
  recruiting: RecruitingState;
  raceField: RaceFieldState;
};
