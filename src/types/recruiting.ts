import type {
  DriverArchetype,
  DriverStat,
  ManufacturerId,
  SponsorLead,
  TrackType,
} from '@/types/game';

export type RecruitingActionId =
  | 'text-dm'
  | 'social-follow'
  | 'scout-report'
  | 'crew-chief-call'
  | 'watch-race-tape'
  | 'driver-highlight'
  | 'owner-call'
  | 'background-check'
  | 'behind-scenes-feature'
  | 'sponsor-research'
  | 'pitch-seat'
  | 'fan-poll'
  | 'pitch-stability'
  | 'shop-tour'
  | 'pitch-development'
  | 'sponsor-intro'
  | 'film-session'
  | 'pitch-growth'
  | 'spotlight-video'
  | 'sponsor-feature'
  | 'race-weekend-visit'
  | 'sim-session'
  | 'manufacturer-pitch'
  | 'full-development-plan'
  | 'private-test-day'
  | 'contract-offer';

export type RecruitingCategory =
  | 'Direct Contact'
  | 'Social'
  | 'Scouting'
  | 'Relationship'
  | 'Evaluation'
  | 'Pitch'
  | 'Visit'
  | 'Social / Sponsor'
  | 'Evaluation / Visit'
  | 'Offer';

export type RelationshipPath =
  | 'Direct Contact'
  | 'Evaluation'
  | 'Team Visit'
  | 'Development Path'
  | 'Social Campaign'
  | 'Sponsor Connection'
  | 'Seat Opportunity'
  | 'Team Stability'
  | 'Competitive Growth'
  | 'Manufacturer Fit'
  | 'Contract';

export type RecruitingStaffGroup = 'development' | 'social' | 'none';
export type CompetingPressure = 'Low' | 'Medium' | 'High';
export type ProspectAvailability = 'Available' | 'Signed' | 'Unavailable';
export type ProspectRoleExpectation =
  | 'Reserve / Development'
  | 'Flexible'
  | 'Active Seat';
export type ContractTermYears = 1 | 2 | 3;
export type ScoutingBandId = 'basic' | 'profile' | 'evaluation' | 'exact';

export type RecruitingPrerequisites = {
  completedAll?: RecruitingActionId[];
  completedAny?: RecruitingActionId[];
  minimumScouting?: number;
  minimumInterest?: number;
  minimumEngagement?: number;
  contactEstablished?: boolean;
  activeSponsor?: boolean;
  openReserveSlot?: boolean;
};

export type RecruitingActionDefinition = {
  id: RecruitingActionId;
  canonicalName: string;
  contextualName?: string;
  rpCost: number;
  category: RecruitingCategory;
  prerequisites: RecruitingPrerequisites;
  repeatable: boolean;
  maximumLifetimeUses: number;
  oncePerWeekend: boolean;
  effects: {
    scouting: number;
    interest: number;
    engagement: number;
    visibility: number;
  };
  revealBehavior: string;
  unlocks: RecruitingActionId[];
  staffGroup: RecruitingStaffGroup;
  cashCost: number;
  relationshipPaths: RelationshipPath[];
  futureSystemNotes: string;
};

export type ProspectSponsorPackage = {
  label: string;
  projectedRaceBacking: { minimum: number; maximum: number };
  conditions: string[];
};

export type ProspectDealbreaker =
  | 'active-seat-only'
  | 'manufacturer-mismatch'
  | 'minimum-reputation'
  | 'none';

export type RecruitingProspect = {
  id: string;
  name: string;
  age: number;
  hometown: string;
  racingBackground: string;
  currentSeries: string;
  overall: number;
  potential: number;
  stats: Record<DriverStat, number>;
  archetypes: [DriverArchetype, DriverArchetype];
  salaryDemand: number;
  preferredTerm: ContractTermYears;
  baseInterest: number;
  roleExpectation: ProspectRoleExpectation;
  sponsorPackage?: ProspectSponsorPackage;
  personalFundingPackage?: number;
  dealbreakers: string[];
  blockingDealbreaker: ProspectDealbreaker;
  competingPressure: CompetingPressure;
  availability: ProspectAvailability;
  developmentOutlook: string;
  recruitingPullSensitivity: number;
  manufacturerFit: ManufacturerId[];
  trackStrengths: TrackType[];
  minimumReputation: number;
  regionalProspect: boolean;
  shortTrackProspect: boolean;
};

export type RecruitingActionHistoryEntry = {
  id: string;
  season: number;
  week: number;
  raceId: string;
  actionId: RecruitingActionId;
  actionName: string;
  useIndex: number;
  rpCost: number;
  cashCost: number;
  scoutingGain: number;
  interestGain: number;
  engagementGain: number;
  visibilityGain: number;
  reasons: string[];
};

export type OfferBreakdown = {
  interest: number;
  salaryFit: number;
  termFit: number;
  roleFit: number;
  relationshipDepth: number;
  reputationFit: number;
  visibilityFit: number;
  competingPressure: number;
  developmentStaffBonus: number;
  total: number;
  threshold: number;
  unmetDealbreakers: string[];
};

export type RecruitingOfferHistoryEntry = {
  id: string;
  season: number;
  week: number;
  raceId: string;
  annualSalary: number;
  termYears: ContractTermYears;
  role: 'Reserve / Development';
  signingBonus: number;
  accepted: boolean;
  breakdown: OfferBreakdown;
};

export type ProspectRecruitingProgress = {
  prospectId: string;
  scoutingConfidence: number;
  interest: number;
  engagement: number;
  completedActionUses: Partial<Record<RecruitingActionId, number>>;
  actionsUsedThisWeekend: RecruitingActionId[];
  weeklyActionCount: number;
  actionHistory: RecruitingActionHistoryEntry[];
  relationshipPaths: RelationshipPath[];
  offerHistory: RecruitingOfferHistoryEntry[];
  offerCooldown: boolean;
  signed: boolean;
  recruitingCostToDate: { rp: number; cash: number };
};

export type ReserveDriver = {
  prospectId: string;
  name: string;
  age: number;
  hometown: string;
  overall: number;
  potential: number;
  stats: Record<DriverStat, number>;
  archetypes: [DriverArchetype, DriverArchetype];
  annualSalary: number;
  termYears: ContractTermYears;
  role: 'Reserve / Development';
  sponsorPackage?: ProspectSponsorPackage;
  personalFundingPackage?: number;
  developmentHistory: string[];
  sponsorLeads: SponsorLead[];
};

export type RecruitingState = {
  spendableRp: number;
  visibility: number;
  prospects: RecruitingProspect[];
  campaigns: Record<string, ProspectRecruitingProgress>;
  processedTransactionIds: string[];
  reserveDriver?: ReserveDriver;
};

export type RecruitingActionCommand = {
  transactionId: string;
  prospectId: string;
  actionId: Exclude<RecruitingActionId, 'contract-offer'>;
  season: number;
  week: number;
  raceId: string;
};

export type RecruitingOfferCommand = {
  transactionId: string;
  prospectId: string;
  annualSalary: number;
  termYears: ContractTermYears;
  role: 'Reserve / Development';
  season: number;
  week: number;
  raceId: string;
};

export type ProspectRevealView = {
  id: string;
  name: string;
  age: number;
  racingBackground: string;
  availability: ProspectAvailability;
  scoutingConfidence: number;
  scoutingBand: ScoutingBandId;
  overall: number | null;
  overallRange: [number, number] | null;
  potential: number | null;
  potentialRange: [number, number] | null;
  stats: Partial<Record<DriverStat, number>>;
  statRanges: Partial<Record<DriverStat, [number, number]>>;
  archetypes: [DriverArchetype, DriverArchetype] | null;
  currentSeries: string | null;
  salaryDemand: number | null;
  salaryRange: [number, number] | null;
  preferredTerm: ContractTermYears | null;
  interest: number | null;
  interestLabel: string | null;
  knownInterestFactors: string[];
  sponsorInformation: string | null;
  roleExpectation: ProspectRoleExpectation | null;
  dealbreakers: string[] | null;
  competingPressure: CompetingPressure | null;
  developmentOutlook: string;
  trackStrengths: TrackType[];
  engagement: number;
  relationshipPaths: RelationshipPath[];
  recruitingCostToDate: { rp: number; cash: number };
};
