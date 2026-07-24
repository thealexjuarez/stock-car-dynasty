import type {
  DriverConfidence,
  ManufacturerId,
  TrackType,
} from '@/types/game';

export type RacePace = 'Conserve' | 'Balanced' | 'Push';
export type ClosingPace = RacePace | 'Attack';
export type DriverInstruction =
  | 'Protect the Car'
  | 'Run Your Race'
  | 'Defend Position'
  | 'Take Chances';
export type BroadStagePlan =
  | 'Track Position'
  | 'Balanced Race'
  | 'Long-Run Setup'
  | 'Save for the Finish';
export type StageEndCall = 'Chase Stage Points' | 'Flip the Stage';
export type FinalStagePitPlan =
  | 'Early Final Stop'
  | 'Balanced Final Stop'
  | 'Long Final Run'
  | 'Short Run / Fresh Tires Late'
  | 'Caution Preference';
export type TireLabel = 'Fresh' | 'Good' | 'Used' | 'Worn' | 'Critical';
export type PlannerClassification = 'Required' | 'Recommended' | 'Optional';
export type RaceDepthStopType =
  | 'stage'
  | 'final'
  | 'supplemental-planned'
  | 'combined-stage2-final'
  | 'emergency'
  | 'damage';
export type IncidentKind =
  | 'harmless-contact'
  | 'meaningful-contact'
  | 'solo-mistake'
  | 'spin'
  | 'off-track'
  | 'minor-damage'
  | 'moderate-damage'
  | 'major-damage'
  | 'race-ending-damage'
  | 'mechanical-failure'
  | 'fuel-starvation'
  | 'tire-abuse';
export type IncidentSeverity =
  | 'harmless'
  | 'spin'
  | 'minor'
  | 'moderate'
  | 'major'
  | 'race-ending';
export type ExpectationContext = 'Favorite' | 'On Target' | 'Underdog';
export type ExpectationClassification =
  | 'Significantly Above Expectation'
  | 'Above Expectation'
  | 'On Expectation'
  | 'Below Expectation'
  | 'Significantly Below Expectation';

export type RacePlan = {
  id: string;
  raceId: string;
  entryId: string;
  driverId: string;
  vehicleId?: string;
  basePace: RacePace;
  attackClosing: boolean;
  instruction: DriverInstruction;
  broadStagePlan: BroadStagePlan;
  stageCalls: Readonly<Record<1 | 2 | 3, StageEndCall>>;
  finalStagePitPlan: FinalStagePitPlan;
  locked: boolean;
};

export type RacePlanProjection = {
  legal: boolean;
  reasons: readonly string[];
  requiredMinimumStopCount: number;
  plannedStopCount: number;
  fourthStopClassification: PlannerClassification;
  projectedFinishTire: number;
  projectedMinimumFuel: number;
  projectedFinishFuel: number;
  projectedStagePosition: number;
  projectedRestartPosition: number;
  doubleStackWarning: boolean;
  riskLabel: 'Low' | 'Medium' | 'High';
  recommendation: string;
};

export type SeriesStageRules = {
  seriesId: string;
  stageCount: number;
  stageBoundaries: readonly number[];
  stagePointsEnabled: boolean;
  pointsPayingPositions: readonly number[];
  pointValues: readonly number[];
  playoffPointBehavior: 'none';
  scheduledStageBreakCaution: boolean;
  stageFinishRecorded: boolean;
  chaseFlipEnabled: boolean;
};

export type PitServiceFact = {
  id: string;
  entryId: string;
  serviceCycleNumber: number;
  plannedStopNumber: number;
  actualStopNumber: number;
  stopType: RaceDepthStopType;
  stageNumber?: number;
  plannerClassification: PlannerClassification;
  stageCall?: StageEndCall;
  finalStagePitPlan?: FinalStagePitPlan;
  segment: number;
  compressedTiming: number;
  underCaution: boolean;
  fourTireService: true;
  fuelBefore: number;
  fuelAdded: number;
  fuelAfter: 100;
  tireBefore: number;
  tireAfter: 100;
  pitRoadTimeLossSeconds: number;
  doubleStackDelaySeconds: number;
  pitMistake: boolean;
  unsafeRelease: boolean;
  restartPosition: number;
  positionsDelta: number;
  emergencyStop: boolean;
  damageStop: boolean;
  reason: string;
};

export type IncidentConsequence = {
  entryId: string;
  positionLoss: number;
  conditionLoss: number;
  dnf: boolean;
};

export type IncidentFact = {
  id: string;
  seedNamespace: string;
  segment: number;
  representativeLap: number;
  initiatorEntryId: string;
  involvedEntryIds: readonly string[];
  kind: IncidentKind;
  severity: IncidentSeverity;
  causeReasonCodes: readonly string[];
  caution: boolean;
  redFlag: boolean;
  qualifyingMajorMultiCar: boolean;
  consequences: readonly IncidentConsequence[];
};

export type SegmentEntryFact = {
  entryId: string;
  startPosition: number;
  finishPosition: number;
  tireBefore: number;
  tireAfter: number;
  tireLabel: TireLabel;
  fuelBefore: number;
  fuelAfter: number;
  pace: ClosingPace;
  instruction: DriverInstruction;
  broadStagePlan: BroadStagePlan;
  pitStopIds: readonly string[];
  incidentIds: readonly string[];
  segmentDelta: number;
  cumulativeEquipmentStress: number;
  damageConditionLoss: number;
  dnf: boolean;
};

export type SegmentFact = {
  id: string;
  segment: number;
  role:
    | 'Opening Run'
    | 'Early Run'
    | 'Mid-Race Run'
    | 'Long Run'
    | 'Late Run'
    | 'Closing Run'
    | 'Final Restart';
  stageNumber: number;
  startLap: number;
  endLap: number;
  startOrder: readonly string[];
  endOrder: readonly string[];
  caution: boolean;
  scheduledStageBreakCaution: boolean;
  redFlag: boolean;
  restart: boolean;
  pitStopIds: readonly string[];
  incidentIds: readonly string[];
  entries: readonly SegmentEntryFact[];
  ledEntryIds: readonly string[];
};

export type StageEntryFact = {
  entryId: string;
  call: StageEndCall;
  finishPosition: number;
  points: 0;
  flipped: boolean;
  preStagePitSegment?: number;
  stageBreakPit: boolean;
  restartPosition: number;
  positionsDeltaThroughCycle: number;
  doubleStackDelaySeconds: number;
};

export type StageFact = {
  id: string;
  stageNumber: number;
  boundarySegment: number;
  scheduledCautionId: string;
  officialOrder: readonly string[];
  stagePointsEnabled: false;
  entries: readonly StageEntryFact[];
  restartOrder: readonly string[];
};

export type EntryRaceFacts = {
  entryId: string;
  driverId: string;
  teamId: string;
  vehicleId?: string;
  manufacturerId: ManufacturerId;
  officialStart: boolean;
  classifiedFinish: boolean;
  startPosition: number;
  finishPosition: number;
  expectedPosition: number;
  expectedBand: readonly [number, number];
  expectationContext: ExpectationContext;
  expectationDelta: number;
  expectationClassification: ExpectationClassification;
  positionsGained: number;
  dnf: boolean;
  dnfReason?: IncidentKind;
  stageFinishPositions: readonly number[];
  stagePoints: readonly number[];
  plan: RacePlan;
  paceUsage: readonly ClosingPace[];
  plannedStopCount: number;
  actualStopCount: number;
  requiredMinimumStopCount: number;
  serviceIds: readonly string[];
  startingTireCondition: 100;
  finishingTireCondition: number;
  minimumTireCondition: number;
  tireConditionBySegment: readonly number[];
  totalTireWear: number;
  tireCliffExposure: boolean;
  falloffPenalty: number;
  tireFailure: boolean;
  startingFuel: 100;
  finishingFuel: number;
  minimumFuel: number;
  fuelBySegment: readonly number[];
  fuelStarvation: boolean;
  incidentIds: readonly string[];
  incidentTypes: readonly IncidentKind[];
  harmlessContact: boolean;
  meaningfulContact: boolean;
  spin: boolean;
  offTrack: boolean;
  penalty: boolean;
  unsafeRelease: boolean;
  mechanicalFailure: boolean;
  redFlagInvolvement: boolean;
  majorDamage: boolean;
  cooked: boolean;
  cleanRace: boolean;
  cleanRaceDefinition: 'clean-race-v1';
  cleanRaceDisqualifyingIds: readonly string[];
  equipmentStress: number;
  routineConditionLoss: number;
  strategyConditionLoss: number;
  incidentConditionLoss: number;
  severeEventConditionLoss: number;
  totalConditionLoss: number;
  finalCondition: number;
  readinessImpact: 'Ready' | 'At Risk' | 'Not Ready';
  top20: boolean;
  top10: boolean;
  topFive: boolean;
  win: boolean;
  confidenceInput: DriverConfidence;
  archetypeReasonCodes: readonly string[];
  strategyReasonCodes: readonly string[];
};

export type RaceDepthFacts = {
  schemaVersion: 1;
  seedVersion: 'race-depth-v1';
  raceId: string;
  seed: string;
  season: number;
  week: number;
  trackId: string;
  trackType: TrackType;
  segmentCount: number;
  seriesRules: SeriesStageRules;
  segmentFacts: readonly SegmentFact[];
  stageFacts: readonly StageFact[];
  pitFacts: readonly PitServiceFact[];
  incidentFacts: readonly IncidentFact[];
  entryFacts: readonly EntryRaceFacts[];
  processedEventIds: readonly string[];
};
