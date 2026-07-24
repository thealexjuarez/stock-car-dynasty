import type { TrackRisk, TrackType } from '@/types/game';
import type {
  BroadStagePlan,
  DriverInstruction,
  FinalStagePitPlan,
  RacePace,
  SeriesStageRules,
} from '@/types/race-depth';

export const raceDepthTuning = {
  schemaVersion: 1,
  seedVersion: 'race-depth-v1',
  segments: {
    shortMaximumLaps: 60,
    mediumMaximumLaps: 150,
    maximum: 10,
    currentErcaLaps: 40,
    roles: [
      'Opening Run',
      'Early Run',
      'Mid-Race Run',
      'Long Run',
      'Late Run',
      'Closing Run',
    ],
    tables: {
      6: { boundaries: [2, 4], normalStops: 3, lowWearStops: 2, highWearStops: 4 },
      8: { boundaries: [2, 4, 6], normalStops: 4, lowWearStops: 3, highWearStops: 5 },
      10: { boundaries: [2, 5, 7], normalStops: 5, lowWearStops: 4, highWearStops: 6 },
    },
    varianceAmplitude: 2.5,
    gridRatingPerPosition: 0.12,
    incidentPositionRatingCost: 0.35,
  },
  pace: {
    Conserve: {
      pace: -2.5,
      tire: 0.78,
      fuel: 0.94,
      incident: 0.75,
      stress: 0.75,
      overtake: 0.9,
      defense: 0.95,
    },
    Balanced: {
      pace: 0,
      tire: 1,
      fuel: 1,
      incident: 1,
      stress: 1,
      overtake: 1,
      defense: 1,
    },
    Push: {
      pace: 2,
      tire: 1.18,
      fuel: 1.04,
      incident: 1.25,
      stress: 1.25,
      overtake: 1.08,
      defense: 1.03,
    },
    Attack: {
      pace: 3.5,
      tire: 1.38,
      fuel: 1.07,
      incident: 1.55,
      stress: 1.55,
      overtake: 1.15,
      defense: 1.05,
    },
  },
  instruction: {
    'Protect the Car': {
      overtake: 0.85,
      defense: 0.95,
      incident: 0.75,
      tire: 0.95,
      fuel: 0.98,
      stress: 0.8,
    },
    'Run Your Race': {
      overtake: 1,
      defense: 1,
      incident: 1,
      tire: 1,
      fuel: 1,
      stress: 1,
    },
    'Defend Position': {
      overtake: 0.95,
      defense: 1.15,
      incident: 1.12,
      tire: 1.05,
      fuel: 1.02,
      stress: 1.08,
    },
    'Take Chances': {
      overtake: 1.2,
      defense: 0.95,
      incident: 1.35,
      tire: 1.1,
      fuel: 1.04,
      stress: 1.15,
    },
  },
  tire: {
    raceWear: { Low: 70, Medium: 90, High: 115 },
    trackMultiplier: {
      'Short Track': 1.05,
      Intermediate: 1,
      Superspeedway: 0.85,
      'Road Course': 1,
      'Long Oval': 1.1,
    },
    traffic: { leaderAndBottomEight: 1, middleIntensityScale: 0.05 },
    cautionMultiplier: 0.7,
    variance: 0.04,
    driverSkillWeights: {
      'Tire Management': 0.6,
      'Throttle Control': 0.25,
      Consistency: 0.15,
    },
    driverMultiplier: { scale: 0.004, minimum: 0.84, maximum: 1.16 },
    wornIncidentMultiplier: 1.1,
    wornStressMultiplier: 1.08,
    criticalFailureThreshold: 12,
    criticalFailureBase: 0.015,
    criticalFailurePerPoint: 0.0035,
    criticalFailureMaximum: 0.08,
    directArchetype: {
      primary: {
        degradationReduction: 0.15,
        criticalPenaltyReduction: 0.25,
        spinRiskReduction: 0.2,
        failureRiskReduction: 0.25,
      },
      secondary: {
        degradationReduction: 0.08,
        criticalPenaltyReduction: 0.125,
        spinRiskReduction: 0.1,
        failureRiskReduction: 0.125,
      },
    },
    maximumDegradationReduction: 0.25,
    maximumCriticalPenaltyReduction: 0.35,
  },
  fuel: {
    fullRace: {
      'Short Track': 230,
      Intermediate: 245,
      Superspeedway: 220,
      'Road Course': 250,
      'Long Oval': 240,
    },
    legalReserve: 8,
    cautionMultiplier: 0.55,
    minimumCombinedMultiplier: 0.88,
    maximumCombinedMultiplier: 1.15,
  },
  broadStagePlan: {
    'Track Position': {
      opening: 1.5,
      middle: 0,
      closing: -0.75,
      openingTire: 1.1,
      finalTire: 1,
      fuel: 1.02,
      openingIncident: 1.05,
      laterIncident: 1,
    },
    'Balanced Race': {
      opening: 0,
      middle: 0,
      closing: 0,
      openingTire: 1,
      finalTire: 1,
      fuel: 1,
      openingIncident: 1,
      laterIncident: 1,
    },
    'Long-Run Setup': {
      opening: -1,
      middle: 1,
      closing: 1.5,
      openingTire: 0.92,
      finalTire: 0.92,
      fuel: 0.99,
      openingIncident: 1,
      laterIncident: 0.95,
    },
    'Save for the Finish': {
      opening: -1.5,
      middle: -0.5,
      closing: 2.5,
      openingTire: 0.88,
      finalTire: 1.15,
      fuel: 0.95,
      openingIncident: 1,
      laterIncident: 1,
    },
  },
  finalStagePit: {
    'Early Final Stop': [0.2],
    'Balanced Final Stop': [0.45],
    'Long Final Run': [0.7],
    'Short Run / Fresh Tires Late': [0.15, 0.72],
    'Caution Preference': [0.2, 0.7],
  },
  pit: {
    greenLossSeconds: {
      'Short Track': 20,
      Intermediate: 24,
      Superspeedway: 28,
      'Road Course': 34,
      'Long Oval': 26,
    },
    cautionLossMultiplier: 0.3,
    scoreCostPerSecond: 0.15,
    crewAdjustmentScale: 0.002,
    crewAdjustmentMinimum: -0.08,
    crewAdjustmentMaximum: 0.08,
    mistakeBase: 0.02,
    mistakeCrewScale: 0.0006,
    mistakeMinimum: 0.01,
    mistakeMaximum: 0.05,
    mistakeSecondsMinimum: 4,
    mistakeSecondsMaximum: 9,
    unsafeReleaseChance: 0.15,
    doubleStackGreenSeconds: 6,
    doubleStackCautionSeconds: 3,
    reentryPenalty: {
      'Short Track': -1.5,
      Intermediate: -1,
      Superspeedway: -0.5,
      'Road Course': -2,
      'Long Oval': -1.25,
    },
  },
  track: {
    'Short Track': {
      passingDifficulty: 0.7,
      trafficIntensity: 1.2,
      incidentMultiplier: 1.1,
      strategySensitivity: 1,
      qualifyingWeight: 0.35,
      restartImportance: 1.25,
      incidentCap: 5,
      plannedStops: [5, 7],
      baseStress: 12,
    },
    Intermediate: {
      passingDifficulty: 0.45,
      trafficIntensity: 1,
      incidentMultiplier: 0.95,
      strategySensitivity: 1.1,
      qualifyingWeight: 0.3,
      restartImportance: 1,
      incidentCap: 4,
      plannedStops: [3, 5],
      baseStress: 10,
    },
    Superspeedway: {
      passingDifficulty: 0.25,
      trafficIntensity: 1.3,
      incidentMultiplier: 1.2,
      strategySensitivity: 0.8,
      qualifyingWeight: 0.2,
      restartImportance: 1.2,
      incidentCap: 4,
      plannedStops: [3, 4],
      baseStress: 8,
    },
    'Road Course': {
      passingDifficulty: 0.75,
      trafficIntensity: 0.85,
      incidentMultiplier: 1,
      strategySensitivity: 1,
      qualifyingWeight: 0.4,
      restartImportance: 0.8,
      incidentCap: 4,
      plannedStops: [2, 3],
      baseStress: 14,
    },
    'Long Oval': {
      passingDifficulty: 0.5,
      trafficIntensity: 0.95,
      incidentMultiplier: 0.9,
      strategySensitivity: 1.2,
      qualifyingWeight: 0.3,
      restartImportance: 1,
      incidentCap: 3,
      plannedStops: [4, 6],
      baseStress: 12,
    },
  },
  incident: {
    base: { Low: 0.006, Medium: 0.009, High: 0.013 },
    minimumProbability: 0.002,
    maximumProbability: 0.04,
    maximumPerSegment: 2,
    maximumCautions: 3,
    maximumRaceEnding: 2,
    maximumRedFlags: 1,
    aggressive: { primary: 1.2, secondary: 1.1 },
    reliableSeverity: { primary: -0.1, secondary: -0.05 },
    reliableVariance: { primary: 0.08, secondary: 0.04 },
  },
  stress: {
    incident: {
      harmless: 3,
      spin: 8,
      minor: 12,
      moderate: 25,
      major: 45,
      'race-ending': 70,
    },
    reliableProtection: { primary: 0.12, secondary: 0.06 },
    maximumProtection: 0.2,
    maximumConditionLoss: 60,
  },
  caps: {
    overtake: [0.8, 1.3],
    defense: [0.85, 1.25],
    incident: [0.65, 1.75],
    tire: [0.7, 1.4],
    severityProtection: -0.15,
    restart: 1.6,
  },
} as const satisfies {
  pace: Record<RacePace | 'Attack', Record<string, number>>;
  instruction: Record<DriverInstruction, Record<string, number>>;
  broadStagePlan: Record<BroadStagePlan, Record<string, number>>;
  finalStagePit: Record<FinalStagePitPlan, readonly number[]>;
  fuel: {
    fullRace: Record<TrackType, number>;
    legalReserve: number;
    cautionMultiplier: number;
    minimumCombinedMultiplier: number;
    maximumCombinedMultiplier: number;
  };
  tire: {
    raceWear: Record<TrackRisk, number>;
    trackMultiplier: Record<TrackType, number>;
    [key: string]: unknown;
  };
  track: Record<TrackType, Record<string, unknown>>;
  [key: string]: unknown;
};

export const ercaStageRules: SeriesStageRules = {
  seriesId: 'ERCA Stock Series',
  stageCount: 3,
  stageBoundaries: [2, 4],
  stagePointsEnabled: false,
  pointsPayingPositions: [],
  pointValues: [],
  playoffPointBehavior: 'none',
  scheduledStageBreakCaution: true,
  stageFinishRecorded: true,
  chaseFlipEnabled: true,
};

export const racePaceOptions = ['Conserve', 'Balanced', 'Push'] as const;
export const driverInstructionOptions = [
  'Protect the Car',
  'Run Your Race',
  'Defend Position',
  'Take Chances',
] as const;
export const broadStagePlanOptions = [
  'Track Position',
  'Balanced Race',
  'Long-Run Setup',
  'Save for the Finish',
] as const;
export const stageEndCallOptions = [
  'Chase Stage Points',
  'Flip the Stage',
] as const;
export const finalStagePitPlanOptions = [
  'Early Final Stop',
  'Balanced Final Stop',
  'Long Final Run',
  'Short Run / Fresh Tires Late',
  'Caution Preference',
] as const;

export const finalStagePlanCopy: Record<
  FinalStagePitPlan,
  { benefit: string; risk: string }
> = {
  'Early Final Stop': {
    benefit: 'Maximum undercut opportunity on fresh tires.',
    risk: 'Longest closing run and the greatest late falloff.',
  },
  'Balanced Final Stop': {
    benefit: 'Splits the final stage into balanced runs.',
    risk: 'Lowest risk, but little undercut or overcut leverage.',
  },
  'Long Final Run': {
    benefit: 'Protect track position and create an overcut.',
    risk: 'Stay exposed on worn tires before the stop.',
  },
  'Short Run / Fresh Tires Late': {
    benefit: 'Two stops create the strongest closing tire condition.',
    risk: 'Extra pit-road and traffic exposure.',
  },
  'Caution Preference': {
    benefit: 'Targets reduced time loss under an eligible caution.',
    risk: 'Falls back to the latest legal green-flag stop.',
  },
};
