import { getEffectiveDriverStats } from '@/data/archetype-config';
import {
  ercaStageRules,
  raceDepthTuning as tuning,
} from '@/data/race-depth-config';
import { raceFieldTuning } from '@/data/race-field-config';
import { RACE_READY_THRESHOLD } from '@/data/repair-config';
import { getNextRace } from '@/data/starter-game-state';
import {
  getFieldDriver,
  getFieldOrganization,
} from '@/simulation/race-field';
import { getSeededUnit, getSeededVariance } from '@/simulation/seeded-variance';
import type {
  Driver,
  DriverArchetype,
  DriverStat,
  GameState,
  Track,
} from '@/types/game';
import type { PracticeResult } from '@/types/practice';
import type {
  BroadStagePlan,
  ClosingPace,
  DriverInstruction,
  EntryRaceFacts,
  ExpectationClassification,
  ExpectationContext,
  FinalStagePitPlan,
  IncidentFact,
  IncidentKind,
  IncidentSeverity,
  PitServiceFact,
  RaceDepthFacts,
  RacePlan,
  RacePlanProjection,
  RacePace,
  SegmentEntryFact,
  SegmentFact,
  StageEndCall,
  StageEntryFact,
  StageFact,
  TireLabel,
} from '@/types/race-depth';
import type {
  QualifyingResult,
  RaceEntryResult,
  WeekendEntrant,
} from '@/types/race-weekend';

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));
const round = (value: number, digits = 2) => {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
};
const average = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0) /
  Math.max(1, values.length);

export function getRaceDepthSegmentCount(laps: number) {
  if (laps <= tuning.segments.shortMaximumLaps) return 6;
  if (laps <= tuning.segments.mediumMaximumLaps) return 8;
  return 10;
}

export function allocateRaceDepthSegmentLaps(laps: number, segmentCount: number) {
  const base = Math.floor(laps / segmentCount);
  const remainder = laps % segmentCount;
  return Array.from(
    { length: segmentCount },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

export function getTireLabel(condition: number): TireLabel {
  if (condition >= 80) return 'Fresh';
  if (condition >= 60) return 'Good';
  if (condition >= 40) return 'Used';
  if (condition >= 25) return 'Worn';
  return 'Critical';
}

export function getCriticalTirePacePenalty(condition: number) {
  if (condition >= 40) return 0;
  if (condition >= 25) return -((40 - condition) / 15) * 1.5;
  if (condition > 0) {
    return -1.5 - ((25 - condition) / 24) * 4.5;
  }
  return -100;
}

export function getTireSpinRiskModifier(condition: number) {
  if (condition >= 25) return 1;
  if (condition >= 20) return 1.05;
  if (condition >= 15) return 1.1;
  if (condition >= 10) return 1.18;
  return 1.3;
}

export function getTireFailureChance(condition: number) {
  if (condition >= tuning.tire.criticalFailureThreshold) return 0;
  return clamp(
    tuning.tire.criticalFailureBase +
      (tuning.tire.criticalFailureThreshold - condition) *
        tuning.tire.criticalFailurePerPoint,
    0,
    tuning.tire.criticalFailureMaximum,
  );
}

export function isQualifyingMajorMultiCarEvent(input: {
  involvedCount: number;
  conditionLosses: readonly number[];
  sharedIncidentChain: boolean;
  onTrack: boolean;
}) {
  return (
    input.involvedCount >= 3 &&
    input.conditionLosses.filter((loss) => loss >= 11).length >= 2 &&
    input.conditionLosses.some((loss) => loss >= 21) &&
    input.sharedIncidentChain &&
    input.onTrack
  );
}

export function getMajorIncidentRedFlagChance(involvedCount: number) {
  if (involvedCount < 3) return 0;
  if (involvedCount === 3) return 0.5;
  if (involvedCount <= 5) return 0.7;
  return 0.9;
}

function getSegmentTable(segmentCount: number) {
  if (segmentCount === 8) return tuning.segments.tables[8];
  if (segmentCount === 10) return tuning.segments.tables[10];
  return tuning.segments.tables[6];
}

function getArchetypeSlot(
  driver: Pick<Driver, 'archetypes'>,
  archetype: DriverArchetype,
) {
  if (driver.archetypes[0] === archetype) return 'primary' as const;
  if (driver.archetypes[1] === archetype) return 'secondary' as const;
  return undefined;
}

function getDriver(state: GameState, entrant: WeekendEntrant) {
  const fieldEntry = state.raceField.entries.find((entry) => entry.id === entrant.id);
  if (!fieldEntry) throw new Error(`Missing field entry: ${entrant.id}`);
  return getFieldDriver(state, fieldEntry);
}

function getPracticeBonus(
  practice: PracticeResult,
  entrant: WeekendEntrant,
  key: 'racePaceBonus' | 'qualifyingPaceBonus',
) {
  if (!entrant.vehicleId) return 0;
  return (
    practice.entries.find((entry) => entry.vehicleId === entrant.vehicleId)?.[
      key
    ] ?? 0
  );
}

function getDriverTrackRating(
  driver: ReturnType<typeof getDriver>,
  track: Track,
) {
  const effectiveStats = getEffectiveDriverStats(driver);
  return (
    average(track.keyStats.map((stat) => effectiveStats[stat])) *
      raceFieldTuning.driverRatingWeights.trackStats +
    driver.overall * raceFieldTuning.driverRatingWeights.overall
  );
}

function getEquipmentRating(
  state: GameState,
  entrant: WeekendEntrant,
  vehicleCondition: number,
) {
  const organization = getFieldOrganization(state, entrant.teamId);
  if (!entrant.isPlayerTeam) {
    return (
      organization.teamPerformance *
        raceFieldTuning.teamRatingWeights.teamPerformance +
      organization.equipmentStrength *
        raceFieldTuning.teamRatingWeights.equipmentStrength
    );
  }
  const vehicle = state.vehicles.find((item) => item.id === entrant.vehicleId);
  if (!vehicle) throw new Error(`Missing Apex vehicle: ${entrant.vehicleId}`);
  return (
    organization.teamPerformance * 0.55 +
    vehicle.performance * 0.3 +
    vehicleCondition * 0.15
  );
}

function getPreRaceStrength(
  state: GameState,
  entrant: WeekendEntrant,
  track: Track,
  practice: PracticeResult,
) {
  const driver = getDriver(state, entrant);
  const condition = entrant.isPlayerTeam
    ? state.vehicles.find((vehicle) => vehicle.id === entrant.vehicleId)
        ?.condition ?? 100
    : 100;
  return (
    getDriverTrackRating(driver, track) *
      raceFieldTuning.contributionWeights.driver +
    getEquipmentRating(state, entrant, condition) *
      raceFieldTuning.contributionWeights.teamEquipment +
    getPracticeBonus(practice, entrant, 'racePaceBonus')
  );
}

function getExpectedFacts(
  qualifying: QualifyingResult,
  strengths: ReadonlyMap<string, number>,
  track: Track,
) {
  const abilityOrder = [...qualifying.entries].sort(
    (left, right) =>
      (strengths.get(right.id) ?? 0) - (strengths.get(left.id) ?? 0) ||
      left.id.localeCompare(right.id),
  );
  const rankByEntry = new Map(
    abilityOrder.map((entry, index) => [entry.id, index + 1]),
  );
  const qualifyingWeight = tuning.track[track.type].qualifyingWeight;
  return new Map(
    qualifying.entries.map((entry) => {
      const expectedPosition = clamp(
        Math.round(
          (1 - qualifyingWeight) * (rankByEntry.get(entry.id) ?? entry.position) +
            qualifyingWeight * entry.position,
        ),
        1,
        raceFieldTuning.fieldSize,
      );
      const context: ExpectationContext =
        expectedPosition <= 8
          ? 'Favorite'
          : expectedPosition <= 20
            ? 'On Target'
            : 'Underdog';
      return [
        entry.id,
        {
          expectedPosition,
          expectedBand: [
            Math.max(1, expectedPosition - 3),
            Math.min(raceFieldTuning.fieldSize, expectedPosition + 3),
          ] as const,
          context,
        },
      ];
    }),
  );
}

function classifyExpectation(delta: number): ExpectationClassification {
  if (delta >= 5) return 'Significantly Above Expectation';
  if (delta >= 2) return 'Above Expectation';
  if (delta >= -1) return 'On Expectation';
  if (delta >= -4) return 'Below Expectation';
  return 'Significantly Below Expectation';
}

function optionFromSeed<T extends readonly unknown[]>(seed: string, values: T) {
  return values[Math.floor(getSeededUnit(seed) * values.length)] as T[number];
}

export function createRecommendedRacePlan(
  state: GameState,
  entrant: WeekendEntrant,
  seed: string,
): RacePlan {
  const driver = getDriver(state, entrant);
  const longRun = getArchetypeSlot(driver, 'Long Run Driver');
  const aggressive = getArchetypeSlot(driver, 'Aggressive Driver');
  const reliable = getArchetypeSlot(driver, 'Reliable Journeyman');
  const basePace: RacePace = aggressive
    ? 'Push'
    : reliable || longRun
      ? 'Balanced'
      : optionFromSeed(`${seed}:${entrant.id}:pace`, [
          'Conserve',
          'Balanced',
          'Push',
        ] as const);
  const instruction: DriverInstruction = aggressive
    ? 'Take Chances'
    : reliable
      ? 'Protect the Car'
      : 'Run Your Race';
  const broadStagePlan: BroadStagePlan = longRun
    ? 'Long-Run Setup'
    : aggressive
      ? 'Track Position'
      : optionFromSeed(`${seed}:${entrant.id}:stage-plan`, [
          'Balanced Race',
          'Save for the Finish',
        ] as const);
  const stage1 = optionFromSeed(`${seed}:${entrant.id}:stage-1`, [
    'Chase Stage Points',
    'Flip the Stage',
  ] as const);
  const stage2 = optionFromSeed(`${seed}:${entrant.id}:stage-2`, [
    'Chase Stage Points',
    'Flip the Stage',
  ] as const);
  const finalStagePitPlan: FinalStagePitPlan = longRun
    ? 'Long Final Run'
    : aggressive
      ? 'Early Final Stop'
      : optionFromSeed(`${seed}:${entrant.id}:final-plan`, [
          'Balanced Final Stop',
          'Caution Preference',
        ] as const);

  return {
    id: `race-plan:${state.season}:${entrant.id}`,
    raceId: state.nextRaceId,
    entryId: entrant.id,
    driverId: entrant.driverId,
    vehicleId: entrant.vehicleId,
    basePace,
    attackClosing: broadStagePlan === 'Save for the Finish' || Boolean(aggressive),
    instruction,
    broadStagePlan,
    stageCalls: {
      1: stage1,
      2: stage2,
      3: 'Chase Stage Points',
    },
    finalStagePitPlan,
    locked: entrant.isPlayerTeam,
  };
}

function getDirectTireEffects(driver: ReturnType<typeof getDriver>) {
  const slot = getArchetypeSlot(driver, 'Long Run Driver');
  return slot ? tuning.tire.directArchetype[slot] : undefined;
}

function getReliableEffects(driver: ReturnType<typeof getDriver>) {
  const slot = getArchetypeSlot(driver, 'Reliable Journeyman');
  if (!slot) {
    return {
      stressProtection: 0,
      severityProtection: 0,
      varianceReduction: 0,
    };
  }
  return {
    stressProtection: tuning.stress.reliableProtection[slot],
    severityProtection: tuning.incident.reliableSeverity[slot],
    varianceReduction: tuning.incident.reliableVariance[slot],
  };
}

function getPaceForSegment(plan: RacePlan, segment: number, segmentCount: number) {
  if (
    segment === segmentCount &&
    plan.attackClosing &&
    plan.basePace !== 'Conserve'
  ) {
    return 'Attack' as const;
  }
  return plan.basePace;
}

function getStagePlanPhase(
  broadStagePlan: BroadStagePlan,
  segment: number,
  segmentCount: number,
) {
  const config = tuning.broadStagePlan[broadStagePlan];
  if (segment <= 2) return config.opening;
  if (segment >= segmentCount - 1) return config.closing;
  return config.middle;
}

function getStagePlanTireMultiplier(
  broadStagePlan: BroadStagePlan,
  segment: number,
  segmentCount: number,
) {
  const config = tuning.broadStagePlan[broadStagePlan];
  return segment >= segmentCount - 1 ? config.finalTire : config.openingTire;
}

export function calculateSegmentFuelUse(input: {
  trackType: Track['type'];
  segmentFraction: number;
  pace: ClosingPace;
  instruction: DriverInstruction;
  broadStagePlan: BroadStagePlan;
  caution: boolean;
}) {
  const combined = clamp(
    tuning.pace[input.pace].fuel *
      tuning.instruction[input.instruction].fuel *
      tuning.broadStagePlan[input.broadStagePlan].fuel,
    tuning.fuel.minimumCombinedMultiplier,
    tuning.fuel.maximumCombinedMultiplier,
  );
  return round(
    tuning.fuel.fullRace[input.trackType] *
      input.segmentFraction *
      combined *
      (input.caution ? tuning.fuel.cautionMultiplier : 1),
  );
}

function calculateSegmentTireWear(input: {
  driver: ReturnType<typeof getDriver>;
  effectiveStats: Record<DriverStat, number>;
  track: Track;
  segmentFraction: number;
  segment: number;
  segmentCount: number;
  pace: ClosingPace;
  instruction: DriverInstruction;
  broadStagePlan: BroadStagePlan;
  runningPosition: number;
  caution: boolean;
  seed: string;
}) {
  const tireSkill =
    input.effectiveStats['Tire Management'] *
      tuning.tire.driverSkillWeights['Tire Management'] +
    input.effectiveStats['Throttle Control'] *
      tuning.tire.driverSkillWeights['Throttle Control'] +
    input.effectiveStats.Consistency *
      tuning.tire.driverSkillWeights.Consistency;
  const driverMultiplier = clamp(
    1 - (tireSkill - 60) * tuning.tire.driverMultiplier.scale,
    tuning.tire.driverMultiplier.minimum,
    tuning.tire.driverMultiplier.maximum,
  );
  const trafficMultiplier =
    input.runningPosition === 1 || input.runningPosition >= 25
      ? tuning.tire.traffic.leaderAndBottomEight
      : 1 +
        tuning.tire.traffic.middleIntensityScale *
          tuning.track[input.track.type].trafficIntensity;
  const direct = getDirectTireEffects(input.driver);
  const reduction = clamp(
    direct?.degradationReduction ?? 0,
    0,
    tuning.tire.maximumDegradationReduction,
  );
  const variance =
    1 +
    getSeededVariance(
      `${input.seed}:wear`,
      tuning.tire.variance,
    );
  const totalMultiplier = clamp(
    tuning.pace[input.pace].tire *
      tuning.instruction[input.instruction].tire *
      getStagePlanTireMultiplier(
        input.broadStagePlan,
        input.segment,
        input.segmentCount,
      ) *
      driverMultiplier *
      trafficMultiplier *
      (input.caution ? tuning.tire.cautionMultiplier : 1) *
      variance *
      (1 - reduction),
    tuning.caps.tire[0],
    tuning.caps.tire[1],
  );
  return round(
    tuning.tire.raceWear[input.track.tireWear] *
      input.segmentFraction *
      tuning.tire.trackMultiplier[input.track.type] *
      totalMultiplier,
    1,
  );
}

function getMinimumStopCount(
  track: Track,
  segmentCount: number,
  plan: RacePlan,
) {
  const table = getSegmentTable(segmentCount);
  const fuelConsumption =
    tuning.fuel.fullRace[track.type] *
    clamp(
      tuning.pace[plan.basePace].fuel *
        tuning.instruction[plan.instruction].fuel *
        tuning.broadStagePlan[plan.broadStagePlan].fuel,
      tuning.fuel.minimumCombinedMultiplier,
      tuning.fuel.maximumCombinedMultiplier,
    );
  const fuelStops = Math.max(
    0,
    Math.ceil(fuelConsumption / (100 - tuning.fuel.legalReserve)) - 1,
  );
  const rareLowWear =
    segmentCount === 6 &&
    track.tireWear === 'Low' &&
    (plan.basePace === 'Conserve' || plan.basePace === 'Balanced') &&
    plan.instruction !== 'Take Chances' &&
    plan.finalStagePitPlan === 'Long Final Run' &&
    fuelStops <= 2;
  let minimum: number = rareLowWear ? table.lowWearStops : table.normalStops;
  if (track.tireWear === 'High') minimum = Math.max(minimum, table.highWearStops);
  return Math.max(minimum, fuelStops);
}

function getPlannedStopCount(
  track: Track,
  segmentCount: number,
  plan: RacePlan,
) {
  const minimum = getMinimumStopCount(track, segmentCount, plan);
  let planned = minimum;
  if (track.type === 'Long Oval') planned = Math.max(planned, 4);
  if (track.type === 'Short Track' && track.tireWear !== 'Low') {
    planned = Math.max(planned, 5);
  }
  if (plan.finalStagePitPlan === 'Short Run / Fresh Tires Late') {
    planned = Math.max(planned, getSegmentTable(segmentCount).normalStops + 1);
  }
  return Math.min(tuning.track[track.type].plannedStops[1], planned);
}

export function projectRacePlan(
  state: GameState,
  entrant: WeekendEntrant,
  plan: RacePlan,
  teammatePlan?: RacePlan,
): RacePlanProjection {
  const { track } = getNextRace(state);
  if (!track) throw new Error('Race plan projection requires a current track');
  const segmentCount = getRaceDepthSegmentCount(tuning.segments.currentErcaLaps);
  const minimum = getMinimumStopCount(track, segmentCount, plan);
  const planned = getPlannedStopCount(track, segmentCount, plan);
  const reasons: string[] = [];
  const averageStintFraction = 1 / (planned + 1);
  const projectedStintFuelUse = calculateSegmentFuelUse({
    trackType: track.type,
    segmentFraction: averageStintFraction,
    pace: plan.basePace,
    instruction: plan.instruction,
    broadStagePlan: plan.broadStagePlan,
    caution: false,
  });
  const projectedMinimumFuel = round(100 - projectedStintFuelUse);
  const driver = getDriver(state, entrant);
  const effectiveStats = getEffectiveDriverStats(driver);
  const projectedWear = calculateSegmentTireWear({
    driver,
    effectiveStats,
    track,
    segmentFraction: averageStintFraction,
    segment: segmentCount,
    segmentCount,
    pace: plan.attackClosing ? 'Attack' : plan.basePace,
    instruction: plan.instruction,
    broadStagePlan: plan.broadStagePlan,
    runningPosition: 16,
    caution: false,
    seed: `${plan.id}:projection`,
  });
  const projectedFinishTire = clamp(round(100 - projectedWear, 1), 0, 100);
  if (projectedMinimumFuel < tuning.fuel.legalReserve) {
    reasons.push(
      `Fuel projection falls below the ${tuning.fuel.legalReserve}-point reserve.`,
    );
  }
  if (projectedFinishTire < 12) {
    reasons.push('Projected tire condition falls below the 12-point safety line.');
  }
  if (plan.attackClosing && projectedFinishTire < 25) {
    reasons.push('Attack is unavailable because closing tires project below 25.');
  }
  if (planned < minimum) {
    reasons.push(`This race requires at least ${minimum} planned stops.`);
  }
  const likelyDoubleStack =
    Boolean(teammatePlan) &&
    (teammatePlan?.stageCalls[1] === plan.stageCalls[1] ||
      teammatePlan?.stageCalls[2] === plan.stageCalls[2] ||
      teammatePlan?.finalStagePitPlan === plan.finalStagePitPlan);
  const fourthStopClassification =
    track.tireWear === 'High' || projectedFinishTire < 12
      ? 'Required'
      : projectedFinishTire < 20
        ? 'Recommended'
        : 'Optional';
  return {
    legal: reasons.length === 0,
    reasons,
    requiredMinimumStopCount: minimum,
    plannedStopCount: planned,
    fourthStopClassification,
    projectedFinishTire,
    projectedMinimumFuel,
    projectedFinishFuel: Math.max(
      tuning.fuel.legalReserve,
      projectedMinimumFuel,
    ),
    projectedStagePosition: entrant.isPlayerTeam ? 16 : 18,
    projectedRestartPosition:
      plan.stageCalls[1] === 'Flip the Stage' ? 12 : 20,
    doubleStackWarning: likelyDoubleStack,
    riskLabel:
      plan.basePace === 'Push' ||
      plan.instruction === 'Take Chances' ||
      plan.attackClosing
        ? 'High'
        : plan.basePace === 'Conserve' &&
            plan.instruction === 'Protect the Car'
          ? 'Low'
          : 'Medium',
    recommendation:
      getArchetypeSlot(driver, 'Long Run Driver')
        ? 'Crew chief: lean on long-run pace and protect the final stint.'
        : getArchetypeSlot(driver, 'Aggressive Driver')
          ? 'Crew chief: attack restarts, but leave tire and contact margin.'
          : 'Crew chief: balanced service windows give us the clearest race.',
  };
}

type PlannedService = {
  cycleNumber: number;
  segment: number;
  timing: number;
  stopType: PitServiceFact['stopType'];
  stageNumber?: number;
  stageCall?: StageEndCall;
  finalStagePitPlan?: FinalStagePitPlan;
  classification: PitServiceFact['plannerClassification'];
};

function getPlannedServices(
  track: Track,
  segmentCount: number,
  plan: RacePlan,
): PlannedService[] {
  const boundaries = getSegmentTable(segmentCount).boundaries;
  const plannedCount = getPlannedStopCount(track, segmentCount, plan);
  const services: PlannedService[] = boundaries.map((segment, index) => ({
    cycleNumber: index + 1,
    segment,
    timing: plan.stageCalls[(index + 1) as 1 | 2 | 3] === 'Flip the Stage' ? 0.75 : 1,
    stopType:
      segmentCount === 6 && plannedCount === 2 && index === 1
        ? 'combined-stage2-final'
        : 'stage',
    stageNumber: index + 1,
    stageCall: plan.stageCalls[(index + 1) as 1 | 2 | 3],
    classification: 'Required',
  }));

  if (!(segmentCount === 6 && plannedCount === 2)) {
    const finalStart = boundaries.at(-1)! + 1;
    const finalLength = segmentCount - boundaries.at(-1)!;
    const timings =
      plan.finalStagePitPlan === 'Caution Preference'
        ? [0.7]
        : tuning.finalStagePit[plan.finalStagePitPlan];
    timings.forEach((timing, index) => {
      const exact = finalStart - 1 + timing * finalLength;
      services.push({
        cycleNumber: services.length + 1,
        segment: Math.min(segmentCount, Math.floor(exact) + 1),
        timing: round(exact - Math.floor(exact), 2) || 1,
        stopType: 'final',
        finalStagePitPlan: plan.finalStagePitPlan,
        classification:
          index === 0 ? 'Required' : 'Recommended',
      });
    });
  }

  const supplementalNeeded = plannedCount - services.length;
  const preferredSegments = Array.from(
    { length: segmentCount - 1 },
    (_, index) => index + 1,
  ).filter((segment) => !services.some((service) => service.segment === segment));
  for (let index = 0; index < supplementalNeeded; index += 1) {
    const segment =
      preferredSegments[index % Math.max(1, preferredSegments.length)] ??
      Math.max(1, Math.floor(segmentCount / 2));
    services.push({
      cycleNumber: services.length + 1,
      segment,
      timing: 0.5,
      stopType: 'supplemental-planned',
      classification: track.tireWear === 'High' ? 'Required' : 'Recommended',
    });
  }
  return services.sort(
    (left, right) =>
      left.segment - right.segment ||
      left.timing - right.timing ||
      left.cycleNumber - right.cycleNumber,
  );
}

type Runtime = {
  entrant: WeekendEntrant;
  driver: ReturnType<typeof getDriver>;
  effectiveStats: Record<DriverStat, number>;
  crewRating: number;
  organizationReliability: number;
  vehicleCondition: number;
  incidentTendencyMultiplier: number;
  plan: RacePlan;
  projection: RacePlanProjection;
  strength: number;
  score: number;
  position: number;
  tire: number;
  fuel: number;
  minimumTire: number;
  minimumFuel: number;
  totalWear: number;
  consecutiveGreenSegments: number;
  stress: number;
  incidentLoss: number;
  severeLoss: number;
  strategyLoss: number;
  dnf: boolean;
  dnfReason?: IncidentKind;
  driverIncidentUsed: boolean;
  pitMistakeUsed: boolean;
  servicePlan: PlannedService[];
  pitFacts: PitServiceFact[];
  incidentIds: string[];
  incidentKinds: IncidentKind[];
  segmentFacts: SegmentEntryFact[];
  tireHistory: number[];
  fuelHistory: number[];
  paceHistory: ClosingPace[];
  stageFinishes: number[];
  stageRestartPositions: number[];
  stageCycleDeltas: number[];
  meaningfulContact: boolean;
  harmlessContact: boolean;
  spin: boolean;
  offTrack: boolean;
  unsafeRelease: boolean;
  mechanicalFailure: boolean;
  redFlagInvolvement: boolean;
  archetypeReasons: string[];
  strategyReasons: string[];
};

function getCrewRating(runtime: Runtime) {
  return runtime.crewRating;
}

function createPitFact(
  trackType: Track['type'],
  runtime: Runtime,
  service: PlannedService,
  seed: string,
  underCaution: boolean,
  doubleStackDelaySeconds: number,
) {
  const crewRating = getCrewRating(runtime);
  const crewAdjustment = clamp(
    (crewRating - 50) * tuning.pit.crewAdjustmentScale,
    tuning.pit.crewAdjustmentMinimum,
    tuning.pit.crewAdjustmentMaximum,
  );
  const baseLoss = tuning.pit.greenLossSeconds[trackType];
  const mistakeChance = clamp(
    tuning.pit.mistakeBase +
      (50 - crewRating) * tuning.pit.mistakeCrewScale,
    tuning.pit.mistakeMinimum,
    tuning.pit.mistakeMaximum,
  );
  const pitMistake =
    !runtime.pitMistakeUsed &&
    getSeededUnit(`${seed}:mistake`) < mistakeChance;
  const mistakeSeconds = pitMistake
    ? Math.round(
        tuning.pit.mistakeSecondsMinimum +
          getSeededUnit(`${seed}:mistake-seconds`) *
            (tuning.pit.mistakeSecondsMaximum -
              tuning.pit.mistakeSecondsMinimum),
      )
    : 0;
  const unsafeRelease =
    pitMistake &&
    getSeededUnit(`${seed}:unsafe-release`) <
      tuning.pit.unsafeReleaseChance;
  const pitRoadTimeLossSeconds = round(
    baseLoss *
      (1 - crewAdjustment) *
      (underCaution ? tuning.pit.cautionLossMultiplier : 1) +
      mistakeSeconds +
      doubleStackDelaySeconds,
  );
  const fuelBefore = runtime.fuel;
  const tireBefore = runtime.tire;
  const fact: PitServiceFact = {
    id: `${seed}:service`,
    entryId: runtime.entrant.id,
    serviceCycleNumber: service.cycleNumber,
    plannedStopNumber: service.cycleNumber,
    actualStopNumber: runtime.pitFacts.length + 1,
    stopType: service.stopType,
    stageNumber: service.stageNumber,
    plannerClassification: service.classification,
    stageCall: service.stageCall,
    finalStagePitPlan: service.finalStagePitPlan,
    segment: service.segment,
    compressedTiming: service.timing,
    underCaution,
    fourTireService: true,
    fuelBefore: round(fuelBefore),
    fuelAdded: round(100 - fuelBefore),
    fuelAfter: 100,
    tireBefore: round(tireBefore, 1),
    tireAfter: 100,
    pitRoadTimeLossSeconds,
    doubleStackDelaySeconds,
    pitMistake,
    unsafeRelease,
    restartPosition: runtime.position,
    positionsDelta: 0,
    emergencyStop: service.stopType === 'emergency',
    damageStop: service.stopType === 'damage',
    reason:
      service.stageCall ??
      service.finalStagePitPlan ??
      (service.stopType === 'supplemental-planned'
        ? 'Track demand'
        : 'Required service'),
  };
  runtime.fuel = 100;
  runtime.tire = 100;
  runtime.consecutiveGreenSegments = 0;
  runtime.pitMistakeUsed ||= pitMistake;
  runtime.unsafeRelease ||= unsafeRelease;
  runtime.score -= pitRoadTimeLossSeconds * tuning.pit.scoreCostPerSecond;
  runtime.score += tuning.pit.reentryPenalty[trackType];
  runtime.pitFacts.push(fact);
  return fact;
}

function applyRoutineSegmentState(
  track: Track,
  runtime: Runtime,
  segment: number,
  segmentCount: number,
  segmentFraction: number,
  pace: ClosingPace,
  caution: boolean,
  seed: string,
) {
  const tireBefore = runtime.tire;
  const fuelBefore = runtime.fuel;
  const wear = calculateSegmentTireWear({
    driver: runtime.driver,
    effectiveStats: runtime.effectiveStats,
    track,
    segmentFraction,
    segment,
    segmentCount,
    pace,
    instruction: runtime.plan.instruction,
    broadStagePlan: runtime.plan.broadStagePlan,
    runningPosition: runtime.position,
    caution,
    seed,
  });
  const fuelUsed = calculateSegmentFuelUse({
    trackType: track.type,
    segmentFraction,
    pace,
    instruction: runtime.plan.instruction,
    broadStagePlan: runtime.plan.broadStagePlan,
    caution,
  });
  runtime.tire = clamp(round(runtime.tire - wear, 1), 0, 100);
  runtime.fuel = clamp(round(runtime.fuel - fuelUsed), 0, 100);
  runtime.minimumTire = Math.min(runtime.minimumTire, runtime.tire);
  runtime.minimumFuel = Math.min(runtime.minimumFuel, runtime.fuel);
  runtime.totalWear = round(runtime.totalWear + wear, 1);
  if (!caution) runtime.consecutiveGreenSegments += 1;

  const direct = getDirectTireEffects(runtime.driver);
  const skillRelief = clamp(
    (runtime.effectiveStats['Tire Management'] - 60) * 0.015,
    0,
    0.3,
  );
  const criticalRelief = clamp(
    skillRelief + (direct?.criticalPenaltyReduction ?? 0),
    0,
    tuning.tire.maximumCriticalPenaltyReduction,
  );
  let tirePenalty = getCriticalTirePacePenalty(runtime.tire);
  if (runtime.tire < 25) tirePenalty *= 1 - criticalRelief;
  if (runtime.consecutiveGreenSegments >= 3) {
    tirePenalty -= (runtime.consecutiveGreenSegments - 2) * 0.5;
  }
  const stageDelta = getStagePlanPhase(
    runtime.plan.broadStagePlan,
    segment,
    segmentCount,
  );
  let overtake =
    tuning.pace[pace].overtake *
    tuning.instruction[runtime.plan.instruction].overtake;
  let defense =
    tuning.pace[pace].defense *
    tuning.instruction[runtime.plan.instruction].defense;
  const aggressiveSlot = getArchetypeSlot(runtime.driver, 'Aggressive Driver');
  if (aggressiveSlot) {
    overtake += aggressiveSlot === 'primary' ? 0.06 : 0.03;
    if (runtime.plan.instruction === 'Take Chances') {
      overtake += aggressiveSlot === 'primary' ? 0.03 : 0.015;
    }
  }
  if (
    runtime.plan.instruction === 'Protect the Car' &&
    (pace === 'Push' || pace === 'Attack')
  ) {
    overtake = 1 + (overtake - 1) / 2;
  }
  if (runtime.plan.instruction === 'Defend Position' && pace === 'Conserve') {
    defense = 1 + (defense - 1) / 2;
  }
  overtake = clamp(overtake, tuning.caps.overtake[0], tuning.caps.overtake[1]);
  defense = clamp(defense, tuning.caps.defense[0], tuning.caps.defense[1]);
  const passing =
    (overtake - 1) *
    10 *
    (1 - tuning.track[track.type].passingDifficulty);
  const defending =
    (defense - 1) *
    6 *
    tuning.track[track.type].passingDifficulty;
  const restart =
    segment > 1
      ? clamp(
          (runtime.effectiveStats.Restarts - 60) *
            0.04 *
            tuning.track[track.type].restartImportance,
          -tuning.caps.restart,
          tuning.caps.restart,
        )
      : 0;
  const reliable = getReliableEffects(runtime.driver);
  const variance = getSeededVariance(
    `${seed}:segment-variance`,
    tuning.segments.varianceAmplitude * (1 - reliable.varianceReduction),
  );
  const confidence =
    'confidence' in runtime.driver
      ? runtime.driver.confidence === 'Hot'
        ? 0.5
        : runtime.driver.confidence === 'Shaken'
          ? -0.5
          : 0
      : 0;
  const phaseWeight = segmentFraction * segmentCount;
  const delta =
    (
    tuning.pace[pace].pace +
    stageDelta +
    tirePenalty +
    restart +
    passing +
    defending +
    variance +
    confidence
    ) * phaseWeight;

  const conditionFactor =
    1 + (100 - runtime.vehicleCondition) / 100;
  const reliabilityFactor = clamp(
    1 - (runtime.organizationReliability - 50) * 0.005,
    0.8,
    1.2,
  );
  const tireStress =
    runtime.tire < 25
      ? 1.15 + ((25 - Math.max(1, runtime.tire)) / 24) * 0.6
      : runtime.tire < 40
        ? tuning.tire.wornStressMultiplier
        : 1;
  const stressAdded =
    tuning.track[track.type].baseStress *
    segmentFraction *
    tuning.pace[pace].stress *
    tuning.instruction[runtime.plan.instruction].stress *
    conditionFactor *
    reliabilityFactor *
    tireStress *
    (1 - reliable.stressProtection);
  runtime.stress = round(runtime.stress + stressAdded);
  runtime.score += delta;
  return {
    tireBefore,
    fuelBefore,
    delta: round(delta),
  };
}

function getSeverity(
  track: Track,
  pace: ClosingPace,
  vehicleCondition: number,
  driver: Runtime['driver'],
  seed: string,
) {
  const trackAdjustment: Record<Track['type'], number> = {
    'Short Track': 0.03,
    Intermediate: 0,
    Superspeedway: 0.08,
    'Road Course': 0,
    'Long Oval': -0.02,
  };
  const reliable = getReliableEffects(driver);
  const roll = clamp(
    getSeededUnit(`${seed}:severity`) +
      trackAdjustment[track.type] +
      (pace === 'Push' ? 0.03 : pace === 'Attack' ? 0.06 : 0) +
      Math.min(0.05, Math.max(0, 85 - vehicleCondition) * 0.002) +
      reliable.severityProtection,
    0,
    1,
  );
  if (roll < 0.35) return { severity: 'harmless' as const, roll };
  if (roll < 0.55) return { severity: 'spin' as const, roll };
  if (roll < 0.75) return { severity: 'minor' as const, roll };
  if (roll < 0.9) return { severity: 'moderate' as const, roll };
  if (roll < 0.975) return { severity: 'major' as const, roll };
  return { severity: 'race-ending' as const, roll };
}

function getSeverityConsequence(severity: IncidentSeverity, seed: string) {
  const unit = getSeededUnit(`${seed}:consequence`);
  const range = (minimum: number, maximum: number) =>
    minimum + Math.floor(unit * (maximum - minimum + 1));
  switch (severity) {
    case 'harmless':
      return { positionLoss: range(0, 1), conditionLoss: range(0, 2), dnf: false };
    case 'spin':
      return { positionLoss: range(2, 6), conditionLoss: range(2, 5), dnf: false };
    case 'minor':
      return { positionLoss: range(3, 7), conditionLoss: range(6, 10), dnf: false };
    case 'moderate':
      return { positionLoss: range(5, 10), conditionLoss: range(11, 20), dnf: false };
    case 'major':
      return { positionLoss: range(8, 15), conditionLoss: range(21, 35), dnf: false };
    case 'race-ending':
      return { positionLoss: 32, conditionLoss: range(36, 60), dnf: true };
  }
}

function getIncidentKind(
  track: Track,
  severity: IncidentSeverity,
  contact: boolean,
  seed: string,
): IncidentKind {
  if (severity === 'race-ending') return 'race-ending-damage';
  if (severity === 'major') return 'major-damage';
  if (severity === 'moderate') return 'moderate-damage';
  if (severity === 'minor') return 'minor-damage';
  if (severity === 'spin') {
    if (
      track.type === 'Road Course' &&
      getSeededUnit(`${seed}:off-track`) < 0.45
    ) {
      return 'off-track';
    }
    return 'spin';
  }
  return contact ? 'harmless-contact' : 'solo-mistake';
}

function incidentCreatesCaution(
  track: Track,
  severity: IncidentSeverity,
  involvedCount: number,
  seed: string,
) {
  if (
    severity === 'moderate' ||
    severity === 'major' ||
    severity === 'race-ending'
  ) {
    return true;
  }
  if (severity === 'minor') {
    return getSeededUnit(`${seed}:minor-caution`) < 0.45;
  }
  if (severity === 'spin') {
    const chance =
      track.type === 'Road Course'
        ? 0.35
        : track.type === 'Superspeedway'
          ? 0.8
          : 0.7;
    return getSeededUnit(`${seed}:spin-caution`) < chance;
  }
  return involvedCount >= 3;
}

function getIncidentProbability(
  track: Track,
  runtime: Runtime,
  segment: number,
  segmentCount: number,
  pace: ClosingPace,
) {
  const positionTraffic =
    runtime.position === 1 || runtime.position >= 25
      ? 0.85
      : tuning.track[track.type].trafficIntensity;
  const safetySkill =
    runtime.effectiveStats.Awareness * 0.45 +
    runtime.effectiveStats.Consistency * 0.35 +
    runtime.effectiveStats.Racecraft * 0.2;
  const driverFactor = clamp(1 + (60 - safetySkill) * 0.012, 0.7, 1.35);
  const conditionFactor = clamp(
    1 + (100 - runtime.vehicleCondition) * 0.006,
    1,
    1.3,
  );
  const aggressiveSlot = getArchetypeSlot(runtime.driver, 'Aggressive Driver');
  const aggressive = aggressiveSlot
    ? tuning.incident.aggressive[aggressiveSlot]
    : 1;
  const shaken =
    'confidence' in runtime.driver &&
    runtime.driver.confidence === 'Shaken' &&
    (pace === 'Push' || pace === 'Attack')
      ? 1.1
      : 1;
  const tireRisk =
    runtime.tire < 25
      ? getTireSpinRiskModifier(runtime.tire)
      : runtime.tire < 40
        ? tuning.tire.wornIncidentMultiplier
        : 1;
  const stageIncident =
    segment <= 2
      ? tuning.broadStagePlan[runtime.plan.broadStagePlan].openingIncident
      : tuning.broadStagePlan[runtime.plan.broadStagePlan].laterIncident;
  const combined = clamp(
    tuning.pace[pace].incident *
      tuning.instruction[runtime.plan.instruction].incident *
      driverFactor *
      runtime.incidentTendencyMultiplier *
      conditionFactor *
      aggressive *
      shaken *
      tireRisk *
      stageIncident,
    tuning.caps.incident[0],
    tuning.caps.incident[1],
  );
  const lateIntensity = segment === segmentCount ? 1.12 : 1;
  return clamp(
    tuning.incident.base[track.cautionRisk] *
      tuning.track[track.type].incidentMultiplier *
      positionTraffic *
      combined *
      lateIntensity,
    tuning.incident.minimumProbability,
    tuning.incident.maximumProbability,
  );
}

function applyIncident(
  state: GameState,
  track: Track,
  ordered: Runtime[],
  initiator: Runtime,
  segment: number,
  segmentCount: number,
  laps: readonly number[],
  seed: string,
  raceEndingCount: number,
  redFlagUsed: boolean,
): IncidentFact {
  const pace = getPaceForSegment(initiator.plan, segment, segmentCount);
  const contactChance =
    track.type === 'Superspeedway'
      ? 0.75
      : track.type === 'Road Course'
        ? 0.35
        : 0.6;
  const contact = getSeededUnit(`${seed}:contact-kind`) < contactChance;
  const condition = initiator.vehicleCondition;
  let { severity } = getSeverity(
    track,
    pace,
    condition,
    initiator.driver,
    seed,
  );
  if (
    severity === 'race-ending' &&
    raceEndingCount >= tuning.incident.maximumRaceEnding
  ) {
    severity = 'major';
  }
  const initiatorIndex = ordered.indexOf(initiator);
  const adjacent =
    ordered[initiatorIndex + 1] ?? ordered[initiatorIndex - 1];
  const involved = contact && adjacent ? [initiator, adjacent] : [initiator];
  if (
    track.type === 'Superspeedway' &&
    contact &&
    severity === 'race-ending' &&
    getSeededUnit(`${seed}:cascade`) < 0.3
  ) {
    const cascadeSize = 3 + Math.floor(getSeededUnit(`${seed}:cascade-size`) * 4);
    for (let offset = 2; offset < cascadeSize; offset += 1) {
      const candidate = ordered[initiatorIndex + offset];
      if (candidate && !involved.includes(candidate)) involved.push(candidate);
    }
  }
  const consequences = involved.map((runtime, index) => {
    const memberSeverity =
      index === 0
        ? severity
        : getSeverity(
            track,
            pace,
            condition,
            runtime.driver,
            `${seed}:involved:${runtime.entrant.id}`,
          ).severity;
    const consequence = getSeverityConsequence(
      memberSeverity,
      `${seed}:${runtime.entrant.id}`,
    );
    runtime.score -=
      consequence.positionLoss * tuning.segments.incidentPositionRatingCost;
    runtime.incidentLoss += consequence.conditionLoss;
    runtime.stress += tuning.stress.incident[memberSeverity];
    runtime.dnf ||= consequence.dnf;
    if (consequence.dnf) runtime.dnfReason = 'race-ending-damage';
    runtime.spin ||= memberSeverity === 'spin';
    runtime.offTrack ||= getIncidentKind(
      track,
      memberSeverity,
      contact,
      seed,
    ) === 'off-track';
    runtime.meaningfulContact ||=
      contact &&
      (consequence.conditionLoss >= 3 ||
        consequence.positionLoss >= 2 ||
        memberSeverity === 'moderate' ||
        memberSeverity === 'major' ||
        memberSeverity === 'race-ending');
    runtime.harmlessContact ||= contact && !runtime.meaningfulContact;
    return {
      entryId: runtime.entrant.id,
      positionLoss: consequence.positionLoss,
      conditionLoss: consequence.conditionLoss,
      dnf: consequence.dnf,
    };
  });
  const qualifyingMajorMultiCar = isQualifyingMajorMultiCarEvent({
    involvedCount: involved.length,
    conditionLosses: consequences.map((item) => item.conditionLoss),
    sharedIncidentChain: true,
    onTrack: true,
  });
  const caution = incidentCreatesCaution(
    track,
    severity,
    involved.length,
    seed,
  );
  const redChance = getMajorIncidentRedFlagChance(involved.length);
  const redFlag =
    qualifyingMajorMultiCar &&
    !redFlagUsed &&
    getSeededUnit(`${seed}:red-flag`) < redChance;
  const kind = getIncidentKind(track, severity, contact, seed);
  const fact: IncidentFact = {
    id: `${seed}:incident`,
    seedNamespace: seed,
    segment,
    representativeLap:
      laps.slice(0, segment - 1).reduce((sum, value) => sum + value, 0) +
      Math.max(1, Math.ceil(laps[segment - 1] / 2)),
    initiatorEntryId: initiator.entrant.id,
    involvedEntryIds: involved.map((runtime) => runtime.entrant.id),
    kind,
    severity,
    causeReasonCodes: [
      pace,
      initiator.plan.instruction,
      runtimeTireReason(initiator.tire),
    ],
    caution,
    redFlag,
    qualifyingMajorMultiCar,
    consequences,
  };
  involved.forEach((runtime) => {
    runtime.incidentIds.push(fact.id);
    runtime.incidentKinds.push(kind);
    runtime.redFlagInvolvement ||= redFlag;
  });
  if (severity !== 'harmless') initiator.driverIncidentUsed = true;
  return fact;
}

function runtimeTireReason(tire: number) {
  return tire < 25 ? 'Critical tires' : tire < 40 ? 'Worn tires' : 'Tires in range';
}

function getRoutineConditionLoss(stress: number, seed: string) {
  if (stress < 10) return Math.floor(getSeededUnit(`${seed}:routine`) * 2);
  if (stress < 20) return 2;
  if (stress < 30) return 3;
  if (stress < 40) return 4;
  if (stress < 55) return 6;
  if (stress < 70) return 9;
  if (stress < 85) return 13;
  return 18;
}

function getReadinessImpact(condition: number) {
  if (condition >= RACE_READY_THRESHOLD) return 'Ready' as const;
  if (condition >= 60) return 'At Risk' as const;
  return 'Not Ready' as const;
}

function freezeRaceDepthFacts(facts: RaceDepthFacts) {
  facts.segmentFacts.forEach((fact) => {
    fact.entries.forEach(Object.freeze);
    Object.freeze(fact.entries);
    Object.freeze(fact);
  });
  facts.stageFacts.forEach((fact) => {
    fact.entries.forEach(Object.freeze);
    Object.freeze(fact.entries);
    Object.freeze(fact);
  });
  facts.pitFacts.forEach(Object.freeze);
  facts.incidentFacts.forEach((fact) => {
    fact.consequences.forEach(Object.freeze);
    Object.freeze(fact.consequences);
    Object.freeze(fact);
  });
  facts.entryFacts.forEach((fact) => {
    Object.freeze(fact.plan.stageCalls);
    Object.freeze(fact.plan);
    Object.freeze(fact);
  });
  Object.freeze(facts.segmentFacts);
  Object.freeze(facts.stageFacts);
  Object.freeze(facts.pitFacts);
  Object.freeze(facts.incidentFacts);
  Object.freeze(facts.entryFacts);
  Object.freeze(facts.processedEventIds);
  return Object.freeze(facts);
}

export type RaceDepthResolution = {
  entries: RaceEntryResult[];
  facts: RaceDepthFacts;
};

export function resolveRaceDepth(input: {
  state: GameState;
  qualifying: QualifyingResult;
  practice: PracticeResult;
  seed: string;
  playerPlans: Readonly<Record<string, RacePlan>>;
  resolvePayout: (finishPosition: number) => number;
  resolveExp: (finishPosition: number, finished: boolean) => number;
}): RaceDepthResolution {
  const { race, track } = getNextRace(input.state);
  if (!race || !track || race.id !== input.qualifying.raceId) {
    throw new Error('Cannot resolve Race Depth without the matching ERCA event');
  }
  const segmentCount = getRaceDepthSegmentCount(tuning.segments.currentErcaLaps);
  const segmentLaps = allocateRaceDepthSegmentLaps(
    tuning.segments.currentErcaLaps,
    segmentCount,
  );
  const segmentTable = getSegmentTable(segmentCount);
  const stageBoundaries = segmentTable.boundaries as readonly number[];
  const finalStageStart = stageBoundaries.at(-1)! + 1;
  const segmentFraction = 1 / segmentCount;
  const strengths = new Map(
    input.qualifying.entries.map((entrant) => [
      entrant.id,
      getPreRaceStrength(input.state, entrant, track, input.practice),
    ]),
  );
  const expectedFacts = getExpectedFacts(input.qualifying, strengths, track);
  const generatedPlans = Object.fromEntries(
    input.qualifying.entries.map((entrant) => [
      entrant.id,
      input.playerPlans[entrant.id] ??
        createRecommendedRacePlan(input.state, entrant, input.seed),
    ]),
  );
  const playerEntries = input.qualifying.entries.filter(
    (entry) => entry.isPlayerTeam,
  );
  const organizationById = new Map(
    input.state.raceField.organizations.map((organization) => [
      organization.id,
      organization,
    ]),
  );
  const vehicleConditionById = new Map(
    input.state.vehicles.map((vehicle) => [vehicle.id, vehicle.condition]),
  );
  const opponentDriverById = new Map(
    input.state.raceField.opponentDrivers.map((driver) => [driver.id, driver]),
  );
  for (const entrant of playerEntries) {
    const plan = generatedPlans[entrant.id];
    if (!plan || plan.raceId !== race.id || plan.entryId !== entrant.id) {
      throw new Error(`Car #${entrant.carNumber} requires a current race plan`);
    }
    const teammate = playerEntries.find((entry) => entry.id !== entrant.id);
    const projection = projectRacePlan(
      input.state,
      entrant,
      plan,
      teammate ? generatedPlans[teammate.id] : undefined,
    );
    if (!projection.legal) {
      throw new Error(
        `Car #${entrant.carNumber} plan is not race legal: ${projection.reasons.join(' ')}`,
      );
    }
  }
  const runtimes: Runtime[] = input.qualifying.entries.map((entrant) => {
    const driver = getDriver(input.state, entrant);
    const organization = organizationById.get(entrant.teamId);
    const opponentDriver = opponentDriverById.get(entrant.driverId);
    if (!organization) {
      throw new Error(`Unknown ERCA organization: ${entrant.teamId}`);
    }
    const teammate = playerEntries.find(
      (entry) => entry.id !== entrant.id,
    );
    const plan = generatedPlans[entrant.id];
    const projection = projectRacePlan(
      input.state,
      entrant,
      plan,
      teammate ? generatedPlans[teammate.id] : undefined,
    );
    const gridEffect =
      (raceFieldTuning.fieldSize + 1 - entrant.position) *
      tuning.segments.gridRatingPerPosition;
    return {
      entrant,
      driver,
      effectiveStats: getEffectiveDriverStats(driver),
      crewRating: entrant.isPlayerTeam
        ? input.state.team.pitCrewQuality
        : average([
            organization.teamPerformance,
            organization.reliability,
          ]),
      organizationReliability: organization.reliability,
      vehicleCondition: entrant.isPlayerTeam
        ? vehicleConditionById.get(entrant.vehicleId ?? '') ?? 100
        : 100,
      incidentTendencyMultiplier:
        opponentDriver?.incidentTendency === 'Low'
          ? 0.85
          : opponentDriver?.incidentTendency === 'High'
            ? 1.2
            : 1,
      plan,
      projection,
      strength: strengths.get(entrant.id) ?? entrant.baselineRating,
      score: (strengths.get(entrant.id) ?? entrant.baselineRating) + gridEffect,
      position: entrant.position,
      tire: 100,
      fuel: 100,
      minimumTire: 100,
      minimumFuel: 100,
      totalWear: 0,
      consecutiveGreenSegments: 0,
      stress: 0,
      incidentLoss: 0,
      severeLoss: 0,
      strategyLoss: 0,
      dnf: false,
      driverIncidentUsed: false,
      pitMistakeUsed: false,
      servicePlan: getPlannedServices(track, segmentCount, plan),
      pitFacts: [],
      incidentIds: [],
      incidentKinds: [],
      segmentFacts: [],
      tireHistory: [],
      fuelHistory: [],
      paceHistory: [],
      stageFinishes: [],
      stageRestartPositions: [],
      stageCycleDeltas: [],
      meaningfulContact: false,
      harmlessContact: false,
      spin: false,
      offTrack: false,
      unsafeRelease: false,
      mechanicalFailure: false,
      redFlagInvolvement: false,
      archetypeReasons: [],
      strategyReasons: [],
    };
  });
  const runtimeById = new Map(
    runtimes.map((runtime) => [runtime.entrant.id, runtime]),
  );
  const segmentFacts: SegmentFact[] = [];
  const stageFacts: StageFact[] = [];
  const pitFacts: PitServiceFact[] = [];
  const incidentFacts: IncidentFact[] = [];
  let order = [...runtimes];
  let cautionCount = 0;
  let raceEndingCount = 0;
  let redFlagUsed = false;
  let lapStart = 1;

  const sortOrder = () => {
    order.sort(
      (left, right) =>
        Number(left.dnf) - Number(right.dnf) ||
        right.score - left.score ||
        left.position - right.position ||
        left.entrant.id.localeCompare(right.entrant.id),
    );
    order.forEach((runtime, index) => {
      runtime.position = index + 1;
    });
  };

  for (let segment = 1; segment <= segmentCount; segment += 1) {
    const startOrder = order.map((runtime) => runtime.entrant.id);
    const startPositions = new Map(
      order.map((runtime) => [runtime.entrant.id, runtime.position]),
    );
    const interiorServices = order
      .flatMap((runtime) =>
        runtime.servicePlan
          .filter(
            (service) =>
              service.segment === segment &&
              service.timing < 1 &&
              !runtime.pitFacts.some(
                (fact) =>
                  fact.serviceCycleNumber === service.cycleNumber,
              ) &&
              !(
                service.finalStagePitPlan === 'Caution Preference' &&
                segment !== segmentCount
              ),
          )
          .map((service) => ({ runtime, service })),
      )
      .sort(
        (left, right) =>
          left.service.timing - right.service.timing ||
          left.runtime.position - right.runtime.position ||
          left.runtime.entrant.id.localeCompare(right.runtime.entrant.id),
      );
    const interiorServicesByEntry = new Map<string, typeof interiorServices>();
    const leadingInteriorServiceByGroup = new Map<string, string>();
    for (const item of interiorServices) {
      const entryServices =
        interiorServicesByEntry.get(item.runtime.entrant.id) ?? [];
      entryServices.push(item);
      interiorServicesByEntry.set(item.runtime.entrant.id, entryServices);
      const groupKey = `${item.service.segment}:${item.service.timing}:${item.runtime.entrant.teamId}`;
      if (!leadingInteriorServiceByGroup.has(groupKey)) {
        leadingInteriorServiceByGroup.set(groupKey, item.runtime.entrant.id);
      }
    }
    const segmentEntries: SegmentEntryFact[] = [];
    for (const runtime of order) {
      const pace = getPaceForSegment(runtime.plan, segment, segmentCount);
      runtime.paceHistory.push(pace);
      const entryServices =
        interiorServicesByEntry.get(runtime.entrant.id) ?? [];
      let previousTiming = 0;
      let tireBefore = runtime.tire;
      let fuelBefore = runtime.fuel;
      let totalDelta = 0;
      const entryPitStopIds: string[] = [];
      for (const item of entryServices) {
        const phaseFraction =
          segmentFraction * Math.max(0, item.service.timing - previousTiming);
        const phase = applyRoutineSegmentState(
          track,
          runtime,
          segment,
          segmentCount,
          phaseFraction,
          pace,
          false,
          `${input.seed}:${segment}:${runtime.entrant.id}:${previousTiming}`,
        );
        totalDelta += phase.delta;
        const groupKey = `${item.service.segment}:${item.service.timing}:${runtime.entrant.teamId}`;
        const delay =
          leadingInteriorServiceByGroup.get(groupKey) !== runtime.entrant.id
            ? tuning.pit.doubleStackGreenSeconds
            : 0;
        const pitFact = createPitFact(
          track.type,
          runtime,
          item.service,
          `${input.seed}:${segment}:${runtime.entrant.id}:${item.service.cycleNumber}`,
          false,
          delay,
        );
        pitFacts.push(pitFact);
        entryPitStopIds.push(pitFact.id);
        previousTiming = item.service.timing;
      }
      const remainingFraction =
        segmentFraction * Math.max(0, 1 - previousTiming);
      const remainder = applyRoutineSegmentState(
        track,
        runtime,
        segment,
        segmentCount,
        remainingFraction,
        pace,
        false,
        `${input.seed}:${segment}:${runtime.entrant.id}:remainder`,
      );
      totalDelta += remainder.delta;
      if (runtime.fuel <= 0 && entryServices.length === 0) {
        runtime.dnf = true;
        runtime.dnfReason = 'fuel-starvation';
        runtime.incidentKinds.push('fuel-starvation');
      }
      if (runtime.tire <= 0) {
        runtime.dnf = true;
        runtime.dnfReason = 'tire-abuse';
        runtime.incidentKinds.push('tire-abuse');
      }
      segmentEntries.push({
        entryId: runtime.entrant.id,
        startPosition: startPositions.get(runtime.entrant.id) ?? runtime.position,
        finishPosition: runtime.position,
        tireBefore: round(tireBefore, 1),
        tireAfter: runtime.tire,
        tireLabel: getTireLabel(runtime.tire),
        fuelBefore: round(fuelBefore),
        fuelAfter: runtime.fuel,
        pace,
        instruction: runtime.plan.instruction,
        broadStagePlan: runtime.plan.broadStagePlan,
        pitStopIds: entryPitStopIds,
        incidentIds: [],
        segmentDelta: round(totalDelta),
        cumulativeEquipmentStress: runtime.stress,
        damageConditionLoss: runtime.incidentLoss,
        dnf: runtime.dnf,
      });
    }
    sortOrder();

    const segmentIncidentFacts: IncidentFact[] = [];
    for (const runtime of [...order]) {
      if (
        runtime.dnf ||
        runtime.driverIncidentUsed ||
        segmentIncidentFacts.length >= tuning.incident.maximumPerSegment ||
        incidentFacts.length >= tuning.track[track.type].incidentCap
      ) {
        continue;
      }
      const pace = getPaceForSegment(runtime.plan, segment, segmentCount);
      const probability = getIncidentProbability(
        track,
        runtime,
        segment,
        segmentCount,
        pace,
      );
      const checkSeed = `${input.seed}:${race.id}:${segment}:${runtime.entrant.id}:incident-check`;
      if (getSeededUnit(checkSeed) >= probability) continue;
      const fact = applyIncident(
        input.state,
        track,
        order,
        runtime,
        segment,
        segmentCount,
        segmentLaps,
        checkSeed,
        raceEndingCount,
        redFlagUsed,
      );
      segmentIncidentFacts.push(fact);
      incidentFacts.push(fact);
      raceEndingCount += fact.consequences.filter((item) => item.dnf).length;
      if (fact.caution && cautionCount < tuning.incident.maximumCautions) {
        cautionCount += 1;
      }
      if (fact.redFlag) redFlagUsed = true;
    }
    sortOrder();
    const incidentCaution =
      segmentIncidentFacts.some((fact) => fact.caution) &&
      cautionCount <= tuning.incident.maximumCautions;

    const cautionPreferenceServices = order.flatMap((runtime) =>
      runtime.servicePlan
        .filter(
          (service) =>
            service.finalStagePitPlan === 'Caution Preference' &&
            segment >= finalStageStart &&
            segment < segmentCount &&
            incidentCaution,
        )
        .map((service) => ({ runtime, service })),
    );
    for (const { runtime, service } of cautionPreferenceServices) {
      if (runtime.pitFacts.some((fact) => fact.serviceCycleNumber === service.cycleNumber)) {
        continue;
      }
      const pitFact = createPitFact(
        track.type,
        runtime,
        {
          ...service,
          segment,
          timing:
            (segment - finalStageStart + 0.5) /
            (segmentCount - finalStageStart + 1),
        },
        `${input.seed}:${segment}:${runtime.entrant.id}:caution-preference`,
        true,
        0,
      );
      pitFacts.push(pitFact);
    }
    sortOrder();

    const boundaryIndex = stageBoundaries.indexOf(segment);
    const scheduledStageBreak = boundaryIndex >= 0;
    let officialStageOrder: string[] | undefined;
    let stageEntryFacts: StageEntryFact[] = [];
    if (scheduledStageBreak) {
      officialStageOrder = order.map((runtime) => runtime.entrant.id);
      order.forEach((runtime) => {
        runtime.stageFinishes.push(runtime.position);
      });
      const chaseServices = order
        .flatMap((runtime) =>
          runtime.servicePlan
            .filter(
              (service) =>
                service.segment === segment &&
                service.timing === 1 &&
                service.stageCall === 'Chase Stage Points',
            )
            .map((service) => ({ runtime, service })),
        )
        .sort(
          (left, right) =>
            left.runtime.position - right.runtime.position ||
            left.runtime.entrant.id.localeCompare(right.runtime.entrant.id),
        );
      const grouped = new Map<string, typeof chaseServices>();
      for (const item of chaseServices) {
        const group = grouped.get(item.runtime.entrant.teamId) ?? [];
        group.push(item);
        grouped.set(item.runtime.entrant.teamId, group);
      }
      for (const { runtime, service } of chaseServices) {
        const teammateGroup = grouped.get(runtime.entrant.teamId) ?? [];
        const delay =
          teammateGroup[0]?.runtime !== runtime
            ? tuning.pit.doubleStackCautionSeconds
            : 0;
        const pitFact = createPitFact(
          track.type,
          runtime,
          service,
          `${input.seed}:${segment}:${runtime.entrant.id}:stage-break`,
          true,
          delay,
        );
        pitFacts.push(pitFact);
      }
      // Restart order is the actual pit-cycle order after both sides have paid
      // their service, re-entry, traffic, crew, and double-stack costs. Flip
      // receives no canned partition or position award.
      sortOrder();
      stageEntryFacts = order.map((runtime) => {
        const call =
          runtime.plan.stageCalls[(boundaryIndex + 1) as 1 | 2 | 3];
        const officialPosition =
          (officialStageOrder?.indexOf(runtime.entrant.id) ?? -1) + 1;
        const cyclePit = runtime.pitFacts.find(
          (fact) => fact.stageNumber === boundaryIndex + 1,
        );
        const positionsDelta = officialPosition - runtime.position;
        runtime.stageRestartPositions.push(runtime.position);
        runtime.stageCycleDeltas.push(positionsDelta);
        if (cyclePit) {
          cyclePit.restartPosition = runtime.position;
          cyclePit.positionsDelta = positionsDelta;
        }
        return {
          entryId: runtime.entrant.id,
          call,
          finishPosition: officialPosition,
          points: 0,
          flipped: call === 'Flip the Stage',
          preStagePitSegment:
            call === 'Flip the Stage' ? segment : undefined,
          stageBreakPit: call === 'Chase Stage Points',
          restartPosition: runtime.position,
          positionsDeltaThroughCycle: positionsDelta,
          doubleStackDelaySeconds: cyclePit?.doubleStackDelaySeconds ?? 0,
        };
      });
      stageFacts.push({
        id: `${input.seed}:stage:${boundaryIndex + 1}`,
        stageNumber: boundaryIndex + 1,
        boundarySegment: segment,
        scheduledCautionId: `${input.seed}:stage-break-caution:${boundaryIndex + 1}`,
        officialOrder: officialStageOrder,
        stagePointsEnabled: false,
        entries: stageEntryFacts,
        restartOrder: order.map((runtime) => runtime.entrant.id),
      });
    }

    for (const runtime of order) {
      if (runtime.dnf) continue;
      const tireSlot = getDirectTireEffects(runtime.driver);
      const tireChance =
        getTireFailureChance(runtime.tire) *
        tuning.pace[getPaceForSegment(runtime.plan, segment, segmentCount)]
          .incident *
        tuning.instruction[runtime.plan.instruction].incident *
        tuning.track[track.type].incidentMultiplier *
        (1 - (tireSlot?.failureRiskReduction ?? 0));
      if (
        tireChance > 0 &&
        getSeededUnit(
          `${input.seed}:${segment}:${runtime.entrant.id}:tire-failure`,
        ) < clamp(tireChance, 0, tuning.tire.criticalFailureMaximum)
      ) {
        runtime.dnf = true;
        runtime.dnfReason = 'tire-abuse';
        runtime.incidentKinds.push('tire-abuse');
        runtime.severeLoss += 18;
      }
      const mechanicalChance =
        clamp(
          0.001 + Math.max(0, runtime.stress - 35) * 0.00008,
          0.001,
          0.01,
        ) *
        clamp(
          1 + (60 - runtime.organizationReliability) * 0.01,
          0.75,
          1.35,
        ) *
        clamp(1 + (100 - runtime.vehicleCondition) * 0.01, 1, 1.4);
      if (
        getSeededUnit(
          `${input.seed}:${segment}:${runtime.entrant.id}:mechanical`,
        ) < mechanicalChance
      ) {
        runtime.dnf = true;
        runtime.dnfReason = 'mechanical-failure';
        runtime.mechanicalFailure = true;
        runtime.incidentKinds.push('mechanical-failure');
        runtime.severeLoss +=
          12 +
          Math.floor(
            getSeededUnit(
              `${input.seed}:${segment}:${runtime.entrant.id}:mechanical-loss`,
            ) * 14,
          );
      }
    }
    sortOrder();
    const endOrder = order.map((runtime) => runtime.entrant.id);
    segmentEntries.forEach((entry) => {
      const runtime = runtimeById.get(entry.entryId)!;
      entry.finishPosition = runtime.position;
      entry.tireAfter = runtime.tire;
      entry.tireLabel = getTireLabel(runtime.tire);
      entry.fuelAfter = runtime.fuel;
      entry.pitStopIds = runtime.pitFacts
        .filter((fact) => fact.segment === segment)
        .map((fact) => fact.id);
      entry.incidentIds = runtime.incidentIds.filter((id) =>
        segmentIncidentFacts.some((fact) => fact.id === id),
      );
      entry.cumulativeEquipmentStress = runtime.stress;
      entry.damageConditionLoss = runtime.incidentLoss + runtime.severeLoss;
      entry.dnf = runtime.dnf;
      runtime.segmentFacts.push(entry);
      runtime.tireHistory.push(runtime.tire);
      runtime.fuelHistory.push(runtime.fuel);
    });
    const segmentHasCaution = incidentCaution || scheduledStageBreak;
    segmentFacts.push({
      id: `${input.seed}:segment:${segment}`,
      segment,
      role:
        segment === segmentCount && incidentCaution
          ? 'Final Restart'
          : tuning.segments.roles[segment - 1],
      stageNumber: scheduledStageBreak
        ? boundaryIndex + 1
        : segment <= 2
          ? 1
          : segment <= 4
            ? 2
            : 3,
      startLap: lapStart,
      endLap: lapStart + segmentLaps[segment - 1] - 1,
      startOrder,
      endOrder,
      caution: segmentHasCaution,
      scheduledStageBreakCaution: scheduledStageBreak,
      redFlag: segmentIncidentFacts.some((fact) => fact.redFlag),
      restart: segment > 1 && segmentFacts.at(-1)?.caution === true,
      pitStopIds: pitFacts
        .filter((fact) => fact.segment === segment)
        .map((fact) => fact.id),
      incidentIds: segmentIncidentFacts.map((fact) => fact.id),
      entries: segmentEntries,
      ledEntryIds: [endOrder[0]].filter(Boolean),
    });
    lapStart += segmentLaps[segment - 1];
  }

  sortOrder();
  const qualifyingById = new Map(
    input.qualifying.entries.map((entry) => [entry.id, entry]),
  );
  const entries: RaceEntryResult[] = order.map((runtime, index) => {
    const finishPosition = index + 1;
    return {
      ...runtime.entrant,
      startPosition:
        qualifyingById.get(runtime.entrant.id)?.position ?? finishPosition,
      finishPosition,
      score: round(runtime.score - (runtime.dnf ? 100 : 0)),
      status: runtime.dnf ? 'DNF' : 'Running',
      payout: runtime.entrant.isPlayerTeam
        ? input.resolvePayout(finishPosition)
        : 0,
      exp: runtime.entrant.isPlayerTeam
        ? input.resolveExp(finishPosition, !runtime.dnf)
        : 0,
      conditionLoss: 0,
    };
  });
  const incidentById = new Map(
    incidentFacts.map((incident) => [incident.id, incident]),
  );
  const entryFacts: EntryRaceFacts[] = entries.map((entry) => {
    const runtime = runtimeById.get(entry.id)!;
    const expected = expectedFacts.get(entry.id)!;
    const delta = expected.expectedPosition - entry.finishPosition;
    const routineLoss = getRoutineConditionLoss(
      runtime.stress,
      `${input.seed}:${entry.id}`,
    );
    const totalLoss = clamp(
      routineLoss +
        runtime.strategyLoss +
        runtime.incidentLoss +
        runtime.severeLoss,
      0,
      tuning.stress.maximumConditionLoss,
    );
    entry.conditionLoss = totalLoss;
    const startingCondition = runtime.vehicleCondition;
    const finalCondition = clamp(startingCondition - totalLoss, 0, 100);
    const disqualifyingIds = runtime.incidentIds.filter((id) => {
      const incident = incidentById.get(id);
      return Boolean(
        incident &&
          (incident.kind === 'spin' ||
            incident.kind === 'mechanical-failure' ||
            incident.kind === 'major-damage' ||
            incident.kind === 'race-ending-damage' ||
            incident.kind === 'fuel-starvation' ||
            incident.kind === 'tire-abuse'),
      );
    });
    if (runtime.meaningfulContact) {
      disqualifyingIds.push(`${entry.id}:meaningful-contact`);
    }
    if (runtime.unsafeRelease) {
      disqualifyingIds.push(`${entry.id}:unsafe-release`);
    }
    const cleanRace =
      !runtime.dnf &&
      !runtime.spin &&
      !runtime.meaningfulContact &&
      !runtime.unsafeRelease &&
      !runtime.mechanicalFailure &&
      runtime.incidentLoss < 21 &&
      disqualifyingIds.length === 0;
    const longRunSlot = getArchetypeSlot(runtime.driver, 'Long Run Driver');
    if (longRunSlot) {
      runtime.archetypeReasons.push(
        `Long Run Driver — tire wear reduced at ${longRunSlot} strength`,
      );
    }
    const reliableSlot = getArchetypeSlot(runtime.driver, 'Reliable Journeyman');
    if (reliableSlot) {
      runtime.archetypeReasons.push(
        `Reliable Journeyman — equipment stress and variance reduced`,
      );
    }
    const aggressiveSlot = getArchetypeSlot(runtime.driver, 'Aggressive Driver');
    if (aggressiveSlot) {
      runtime.archetypeReasons.push(
        `Aggressive Driver — stronger passing with higher contact risk`,
      );
    }
    return {
      entryId: entry.id,
      driverId: entry.driverId,
      teamId: entry.teamId,
      vehicleId: entry.vehicleId,
      manufacturerId: entry.manufacturerId,
      officialStart: true,
      classifiedFinish: !runtime.dnf,
      startPosition: entry.startPosition,
      finishPosition: entry.finishPosition,
      expectedPosition: expected.expectedPosition,
      expectedBand: expected.expectedBand,
      expectationContext: expected.context,
      expectationDelta: delta,
      expectationClassification: classifyExpectation(delta),
      positionsGained: entry.startPosition - entry.finishPosition,
      dnf: runtime.dnf,
      dnfReason: runtime.dnfReason,
      stageFinishPositions: runtime.stageFinishes,
      stagePoints: runtime.stageFinishes.map(() => 0),
      plan: runtime.plan,
      paceUsage: runtime.paceHistory,
      plannedStopCount: runtime.servicePlan.length,
      actualStopCount: runtime.pitFacts.length,
      requiredMinimumStopCount: runtime.projection.requiredMinimumStopCount,
      serviceIds: runtime.pitFacts.map((fact) => fact.id),
      startingTireCondition: 100,
      finishingTireCondition: runtime.tire,
      minimumTireCondition: runtime.minimumTire,
      tireConditionBySegment: runtime.tireHistory,
      totalTireWear: runtime.totalWear,
      tireCliffExposure: runtime.minimumTire < 25,
      falloffPenalty: round(
        Math.abs(getCriticalTirePacePenalty(runtime.minimumTire)),
      ),
      tireFailure: runtime.dnfReason === 'tire-abuse',
      startingFuel: 100,
      finishingFuel: runtime.fuel,
      minimumFuel: runtime.minimumFuel,
      fuelBySegment: runtime.fuelHistory,
      fuelStarvation: runtime.dnfReason === 'fuel-starvation',
      incidentIds: runtime.incidentIds,
      incidentTypes: runtime.incidentKinds,
      harmlessContact: runtime.harmlessContact,
      meaningfulContact: runtime.meaningfulContact,
      spin: runtime.spin,
      offTrack: runtime.offTrack,
      penalty: runtime.unsafeRelease,
      unsafeRelease: runtime.unsafeRelease,
      mechanicalFailure: runtime.mechanicalFailure,
      redFlagInvolvement: runtime.redFlagInvolvement,
      majorDamage: runtime.incidentLoss >= 21,
      cooked:
        finalCondition < 40 ||
        runtime.stress >= 85 ||
        runtime.mechanicalFailure,
      cleanRace,
      cleanRaceDefinition: 'clean-race-v1',
      cleanRaceDisqualifyingIds: [...new Set(disqualifyingIds)],
      equipmentStress: runtime.stress,
      routineConditionLoss: routineLoss,
      strategyConditionLoss: runtime.strategyLoss,
      incidentConditionLoss: runtime.incidentLoss,
      severeEventConditionLoss: runtime.severeLoss,
      totalConditionLoss: totalLoss,
      finalCondition,
      readinessImpact: getReadinessImpact(finalCondition),
      top20: entry.finishPosition <= 20,
      top10: entry.finishPosition <= 10,
      topFive: entry.finishPosition <= 5,
      win: entry.finishPosition === 1,
      confidenceInput:
        'confidence' in runtime.driver ? runtime.driver.confidence : 'Steady',
      archetypeReasonCodes: runtime.archetypeReasons,
      strategyReasonCodes: [
        `${runtime.plan.stageCalls[1]} — Stage 1 restart P${runtime.stageRestartPositions[0] ?? '—'}`,
        `${runtime.plan.stageCalls[2]} — Stage 2 restart P${runtime.stageRestartPositions[1] ?? '—'}`,
        `${runtime.plan.finalStagePitPlan} — ${runtime.pitFacts.length} total stops`,
      ],
    };
  });
  const facts: RaceDepthFacts = {
    schemaVersion: 1,
    seedVersion: 'race-depth-v1',
    raceId: race.id,
    seed: input.seed,
    season: input.state.season,
    week: input.state.week,
    trackId: track.id,
    trackType: track.type,
    segmentCount,
    seriesRules: ercaStageRules,
    segmentFacts,
    stageFacts,
    pitFacts,
    incidentFacts,
    entryFacts,
    processedEventIds: [
      ...segmentFacts.map((fact) => fact.id),
      ...stageFacts.map((fact) => fact.id),
      ...pitFacts.map((fact) => fact.id),
      ...incidentFacts.map((fact) => fact.id),
    ],
  };
  return { entries, facts: freezeRaceDepthFacts(facts) };
}
