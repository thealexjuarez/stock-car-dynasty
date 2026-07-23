import {
  getRecruitingAction,
  qualifyingRelationshipPaths,
  recruitingActions,
  recruitingTuning,
  scoutingBands,
} from '@/data/recruiting-config';
import { archetypeTrackFit } from '@/data/archetype-config';
import { getSeededVariance } from '@/simulation/seeded-variance';
import type { GameState, SponsorLead } from '@/types/game';
import type {
  ContractTermYears,
  OfferBreakdown,
  ProspectRecruitingProgress,
  ProspectRevealView,
  RecruitingActionCommand,
  RecruitingActionDefinition,
  RecruitingActionId,
  RecruitingOfferCommand,
  RecruitingProspect,
  ReserveDriver,
  ScoutingBandId,
} from '@/types/recruiting';
import type { RaceResult } from '@/types/race-weekend';

const clampMeter = (value: number) =>
  Math.max(recruitingTuning.meterMinimum, Math.min(recruitingTuning.meterMaximum, value));

const unique = <T,>(values: readonly T[]) => [...new Set(values)];

function getProspectParts(state: GameState, prospectId: string) {
  const prospect = state.recruiting.prospects.find((item) => item.id === prospectId);
  const progress = state.recruiting.campaigns[prospectId];
  if (!prospect || !progress) throw new Error(`Unknown recruiting prospect: ${prospectId}`);
  return { prospect, progress };
}

function completed(progress: ProspectRecruitingProgress, actionId: RecruitingActionId) {
  return (progress.completedActionUses[actionId] ?? 0) > 0;
}

function hasDevelopmentStaff(state: GameState) {
  return state.staff.some(
    (member) => member.active && member.trait === 'Development-Minded',
  );
}

function hasSocialStaff(state: GameState) {
  return state.staff.some(
    (member) => member.active && member.role === 'Social Media Manager',
  );
}

function hasDanaScouting(state: GameState) {
  return state.staff.some(
    (member) => member.active && member.trait === 'Short Track Network',
  );
}

export function getInterestLabel(interest: number) {
  if (interest >= 90) return 'Strong Lean';
  if (interest >= 75) return 'Interested';
  if (interest >= 55) return 'Open';
  if (interest >= 35) return 'Long Shot';
  return 'Unlikely';
}

export function getScoutingBand(confidence: number) {
  return scoutingBands.find(
    (band) => confidence >= band.minimum && confidence <= band.maximum,
  ) ?? scoutingBands[scoutingBands.length - 1];
}

export type ActionAvailability = {
  available: boolean;
  reasons: string[];
  uses: number;
  usesRemaining: number;
};

export function getActionAvailability(
  state: GameState,
  prospectId: string,
  actionId: RecruitingActionId,
): ActionAvailability {
  const { progress } = getProspectParts(state, prospectId);
  const definition = getRecruitingAction(actionId);
  const uses = progress.completedActionUses[actionId] ?? 0;
  const reasons: string[] = [];

  if (progress.signed) reasons.push('Prospect is already signed');
  if (state.recruiting.spendableRp < definition.rpCost) {
    reasons.push(`Needs ${definition.rpCost} RP`);
  }
  if (definition.cashCost > state.team.cash) {
    reasons.push(`Needs $${definition.cashCost.toLocaleString()} cash`);
  }
  if (progress.weeklyActionCount >= recruitingTuning.maximumActionsPerProspectPerWeekend) {
    reasons.push('Three-action weekend limit reached');
  }
  if (uses >= definition.maximumLifetimeUses) reasons.push('No lifetime uses remaining');
  if (!definition.repeatable && uses > 0) reasons.push('Already completed');
  if (definition.oncePerWeekend && progress.actionsUsedThisWeekend.includes(actionId)) {
    reasons.push('Already used this weekend');
  }

  const prerequisites = definition.prerequisites;
  if (prerequisites.completedAll?.some((required) => !completed(progress, required))) {
    reasons.push('Complete the required recruiting steps first');
  }
  if (
    prerequisites.completedAny &&
    !prerequisites.completedAny.some((required) => completed(progress, required))
  ) {
    reasons.push('Complete an Owner Call or Crew Chief Call first');
  }
  if (
    prerequisites.minimumScouting !== undefined &&
    progress.scoutingConfidence < prerequisites.minimumScouting
  ) {
    reasons.push(`Scouting confidence must reach ${prerequisites.minimumScouting}`);
  }
  if (
    prerequisites.minimumInterest !== undefined &&
    progress.interest < prerequisites.minimumInterest
  ) {
    reasons.push(`Team Interest must reach ${prerequisites.minimumInterest}`);
  }
  if (
    prerequisites.minimumEngagement !== undefined &&
    progress.engagement < prerequisites.minimumEngagement
  ) {
    reasons.push(`Engagement must reach ${prerequisites.minimumEngagement}`);
  }
  if (prerequisites.contactEstablished && !completed(progress, 'text-dm')) {
    reasons.push('Make contact first');
  }
  if (
    prerequisites.activeSponsor &&
    !state.sponsors.some((sponsor) => sponsor.active)
  ) {
    reasons.push('An active team sponsor is required');
  }
  if (prerequisites.openReserveSlot && state.recruiting.reserveDriver) {
    reasons.push('Reserve / Development slot is filled');
  }
  if (actionId === 'contract-offer' && progress.offerCooldown) {
    reasons.push('Offer window reopens after the next settled weekend');
  }

  return {
    available: reasons.length === 0,
    reasons: unique(reasons),
    uses,
    usesRemaining: Math.max(0, definition.maximumLifetimeUses - uses),
  };
}

type CalculatedEffects = {
  scouting: number;
  interest: number;
  engagement: number;
  visibility: number;
  reasons: string[];
  variancePercent: number;
};

function calculateMeterEffect(
  base: number,
  repeatMultiplier: number,
  variancePercent: number,
  groupedStaff: boolean,
  danaBoost: boolean,
  applyVariance: boolean,
) {
  if (base <= 0) return 0;
  let value = base * repeatMultiplier;
  if (applyVariance) value *= 1 + variancePercent / 100;
  let rounded = Math.max(1, Math.round(value));
  if (groupedStaff) {
    rounded = Math.max(
      rounded + 1,
      Math.round(value * (1 + recruitingTuning.staffEffectivenessPercent / 100)),
    );
    value = rounded;
  }
  if (danaBoost) {
    rounded = Math.max(
      rounded + 1,
      Math.round(value * (1 + recruitingTuning.danaScoutingPercent / 100)),
    );
  }
  return rounded;
}

export function calculateRecruitingEffects(
  state: GameState,
  prospect: RecruitingProspect,
  progress: ProspectRecruitingProgress,
  definition: RecruitingActionDefinition,
  seed: string,
): CalculatedEffects {
  const useIndex = progress.completedActionUses[definition.id] ?? 0;
  const repeatMultiplier = definition.repeatable
    ? recruitingTuning.repeatMultipliers[Math.min(useIndex, 2)]
    : 1;
  const variancePercent = getSeededVariance(seed, recruitingTuning.variancePercent);
  const groupedStaff =
    (definition.staffGroup === 'development' && hasDevelopmentStaff(state)) ||
    (definition.staffGroup === 'social' && hasSocialStaff(state));
  const danaBoost =
    definition.effects.scouting > 0 &&
    hasDanaScouting(state) &&
    (prospect.shortTrackProspect || prospect.regionalProspect);
  const reasons = [
    definition.repeatable
      ? `Repeat effect ${Math.round(repeatMultiplier * 100)}%`
      : 'Unique action at full effect',
    definition.effects.scouting > 0 || definition.effects.interest > 0
      ? `Deterministic variance ${variancePercent >= 0 ? '+' : ''}${variancePercent}%`
      : 'No scouting or interest variance',
  ];
  if (groupedStaff) reasons.push('Applicable staff effectiveness +10%');
  if (danaBoost) reasons.push('Dana Pierce scouting specialty +10%');

  return {
    scouting: calculateMeterEffect(
      definition.effects.scouting,
      repeatMultiplier,
      variancePercent,
      groupedStaff,
      danaBoost,
      true,
    ),
    interest: calculateMeterEffect(
      definition.effects.interest,
      repeatMultiplier,
      variancePercent,
      groupedStaff,
      false,
      true,
    ),
    engagement: calculateMeterEffect(
      definition.effects.engagement,
      repeatMultiplier,
      0,
      groupedStaff,
      false,
      false,
    ),
    visibility: calculateMeterEffect(
      definition.effects.visibility,
      repeatMultiplier,
      0,
      groupedStaff,
      false,
      false,
    ),
    reasons,
    variancePercent,
  };
}

export function applyRecruitingAction(
  state: GameState,
  command: RecruitingActionCommand,
): GameState {
  if (state.recruiting.processedTransactionIds.includes(command.transactionId)) return state;
  const { prospect, progress } = getProspectParts(state, command.prospectId);
  const definition = getRecruitingAction(command.actionId);
  const availability = getActionAvailability(state, command.prospectId, command.actionId);
  if (!availability.available) throw new Error(availability.reasons[0]);

  const effects = calculateRecruitingEffects(
    state,
    prospect,
    progress,
    definition,
    `${command.season}:${command.raceId}:${prospect.id}:${definition.id}:${availability.uses + 1}`,
  );
  const useIndex = availability.uses + 1;
  const nextProgress: ProspectRecruitingProgress = {
    ...progress,
    scoutingConfidence: clampMeter(progress.scoutingConfidence + effects.scouting),
    interest: clampMeter(progress.interest + effects.interest),
    engagement: clampMeter(progress.engagement + effects.engagement),
    completedActionUses: {
      ...progress.completedActionUses,
      [definition.id]: useIndex,
    },
    actionsUsedThisWeekend: [...progress.actionsUsedThisWeekend, definition.id],
    weeklyActionCount: progress.weeklyActionCount + 1,
    relationshipPaths: unique([...progress.relationshipPaths, ...definition.relationshipPaths]),
    actionHistory: [
      ...progress.actionHistory,
      {
        id: command.transactionId,
        season: command.season,
        week: command.week,
        raceId: command.raceId,
        actionId: definition.id,
        actionName: definition.contextualName ?? definition.canonicalName,
        useIndex,
        rpCost: definition.rpCost,
        cashCost: definition.cashCost,
        scoutingGain: effects.scouting,
        interestGain: effects.interest,
        engagementGain: effects.engagement,
        visibilityGain: effects.visibility,
        reasons: effects.reasons,
      },
    ],
    recruitingCostToDate: {
      rp: progress.recruitingCostToDate.rp + definition.rpCost,
      cash: progress.recruitingCostToDate.cash + definition.cashCost,
    },
  };

  return {
    ...state,
    team: { ...state.team, cash: state.team.cash - definition.cashCost },
    recruiting: {
      ...state.recruiting,
      spendableRp: state.recruiting.spendableRp - definition.rpCost,
      visibility: clampMeter(state.recruiting.visibility + effects.visibility),
      campaigns: {
        ...state.recruiting.campaigns,
        [prospect.id]: nextProgress,
      },
      processedTransactionIds: [
        ...state.recruiting.processedTransactionIds,
        command.transactionId,
      ],
    },
  };
}

export function getRelationshipDepth(progress: ProspectRecruitingProgress) {
  return Math.min(
    8,
    unique(
      progress.relationshipPaths.filter((path) =>
        qualifyingRelationshipPaths.includes(path),
      ),
    ).length,
  );
}

function salaryFit(offered: number, demand: number) {
  const ratio = offered / demand;
  if (ratio < 0.85) return -25;
  if (ratio < 0.95) return -12;
  if (ratio < 1.05) return 0;
  if (ratio < 1.15) return 8;
  return 15;
}

function termFit(offered: ContractTermYears, preferred: ContractTermYears) {
  if (offered < preferred) return (preferred - offered) * -8;
  if (offered === preferred) return 3;
  return 5;
}

function roleFit(prospect: RecruitingProspect) {
  if (prospect.roleExpectation === 'Reserve / Development') return 8;
  if (prospect.roleExpectation === 'Active Seat') return -20;
  return 0;
}

function pressureModifier(pressure: RecruitingProspect['competingPressure']) {
  return pressure === 'High' ? -10 : pressure === 'Medium' ? -5 : 0;
}

function staffBoostedPackage(value: number, enabled: boolean) {
  if (!enabled || value <= 0) return { value, bonus: 0 };
  const boosted = Math.max(value + 1, Math.round(value * 1.1));
  return { value: boosted, bonus: boosted - value };
}

function unmetDealbreakers(state: GameState, prospect: RecruitingProspect) {
  const unmet: string[] = [];
  if (prospect.blockingDealbreaker === 'active-seat-only') {
    unmet.push('Requires an immediate active seat');
  }
  if (
    prospect.blockingDealbreaker === 'manufacturer-mismatch' &&
    !prospect.manufacturerFit.includes(state.team.manufacturerId)
  ) {
    unmet.push(`Will not sign with ${state.team.manufacturerId}`);
  }
  if (
    prospect.blockingDealbreaker === 'minimum-reputation' &&
    state.team.reputation < prospect.minimumReputation
  ) {
    unmet.push(`Requires team reputation ${prospect.minimumReputation}`);
  }
  return unmet;
}

export function getSigningBonus(annualSalary: number) {
  return Math.max(
    recruitingTuning.minimumSigningBonus,
    Math.round(annualSalary * recruitingTuning.signingBonusPercent / 100),
  );
}

export function evaluateContractOffer(
  state: GameState,
  prospectId: string,
  annualSalary: number,
  termYears: ContractTermYears,
): OfferBreakdown {
  const { prospect, progress } = getProspectParts(state, prospectId);
  const hasStaff = hasDevelopmentStaff(state);
  const salary = staffBoostedPackage(salaryFit(annualSalary, prospect.salaryDemand), hasStaff);
  const term = staffBoostedPackage(termFit(termYears, prospect.preferredTerm), hasStaff);
  const role = staffBoostedPackage(roleFit(prospect), hasStaff);
  const reputationFit = Math.max(
    -10,
    Math.min(10, Math.round((state.team.reputation - prospect.minimumReputation) / 2)),
  );
  const visibilityFit = Math.max(
    -3,
    Math.min(5, Math.round((state.recruiting.visibility - 50) / 10)),
  );
  const competingPressure = pressureModifier(prospect.competingPressure);
  const relationshipDepth = getRelationshipDepth(progress);
  const developmentStaffBonus = salary.bonus + term.bonus + role.bonus;
  const total =
    progress.interest +
    salary.value +
    term.value +
    role.value +
    relationshipDepth +
    reputationFit +
    visibilityFit +
    competingPressure;

  return {
    interest: progress.interest,
    salaryFit: salary.value,
    termFit: term.value,
    roleFit: role.value,
    relationshipDepth,
    reputationFit,
    visibilityFit,
    competingPressure,
    developmentStaffBonus,
    total,
    threshold: recruitingTuning.acceptanceThreshold,
    unmetDealbreakers: unmetDealbreakers(state, prospect),
  };
}

export function getOfferAvailability(
  state: GameState,
  prospectId: string,
  annualSalary: number,
  termYears: ContractTermYears,
) {
  const base = getActionAvailability(state, prospectId, 'contract-offer');
  const breakdown = evaluateContractOffer(state, prospectId, annualSalary, termYears);
  const signingBonus = getSigningBonus(annualSalary);
  const wouldAccept =
    breakdown.total >= recruitingTuning.acceptanceThreshold &&
    breakdown.unmetDealbreakers.length === 0;
  const reasons = [...base.reasons];
  if (!Number.isFinite(annualSalary) || annualSalary <= 0) reasons.push('Enter a valid annual salary');
  if (wouldAccept && state.team.cash < signingBonus) {
    reasons.push(`Needs $${signingBonus.toLocaleString()} signing cash`);
  }
  return {
    available: reasons.length === 0,
    reasons: unique(reasons),
    breakdown,
    signingBonus,
    wouldAccept,
  };
}

function reserveFromProspect(
  prospect: RecruitingProspect,
  command: RecruitingOfferCommand,
): ReserveDriver {
  const sponsorLeads: SponsorLead[] = prospect.sponsorPackage
    ? [{
        id: `prospect-sponsor-${prospect.id}`,
        sponsorName: prospect.sponsorPackage.label,
        projectedRaceBacking: { ...prospect.sponsorPackage.projectedRaceBacking },
        activationCondition: prospect.sponsorPackage.conditions.join(' '),
        status: 'dormant',
      }]
    : [];
  return {
    prospectId: prospect.id,
    name: prospect.name,
    age: prospect.age,
    hometown: prospect.hometown,
    overall: prospect.overall,
    potential: prospect.potential,
    stats: { ...prospect.stats },
    archetypes: [...prospect.archetypes],
    annualSalary: command.annualSalary,
    termYears: command.termYears,
    role: command.role,
    sponsorPackage: prospect.sponsorPackage
      ? {
          ...prospect.sponsorPackage,
          projectedRaceBacking: { ...prospect.sponsorPackage.projectedRaceBacking },
          conditions: [...prospect.sponsorPackage.conditions],
        }
      : undefined,
    personalFundingPackage: prospect.personalFundingPackage,
    developmentHistory: ['Signed to the Reserve / Development program.'],
    sponsorLeads,
  };
}

export function applyRecruitingOffer(
  state: GameState,
  command: RecruitingOfferCommand,
): GameState {
  if (state.recruiting.processedTransactionIds.includes(command.transactionId)) return state;
  const { prospect, progress } = getProspectParts(state, command.prospectId);
  const availability = getOfferAvailability(
    state,
    prospect.id,
    command.annualSalary,
    command.termYears,
  );
  if (!availability.available) throw new Error(availability.reasons[0]);

  const accepted = availability.wouldAccept;
  const cashCharged = accepted ? availability.signingBonus : 0;
  const offerRpCost = getRecruitingAction('contract-offer').rpCost;
  const nextProgress: ProspectRecruitingProgress = {
    ...progress,
    completedActionUses: {
      ...progress.completedActionUses,
      'contract-offer': (progress.completedActionUses['contract-offer'] ?? 0) + 1,
    },
    actionsUsedThisWeekend: [...progress.actionsUsedThisWeekend, 'contract-offer'],
    weeklyActionCount: progress.weeklyActionCount + 1,
    relationshipPaths: unique([...progress.relationshipPaths, 'Contract']),
    offerCooldown: !accepted,
    signed: accepted,
    recruitingCostToDate: {
      rp: progress.recruitingCostToDate.rp + offerRpCost,
      cash: progress.recruitingCostToDate.cash + cashCharged,
    },
    offerHistory: [
      ...progress.offerHistory,
      {
        id: command.transactionId,
        season: command.season,
        week: command.week,
        raceId: command.raceId,
        annualSalary: command.annualSalary,
        termYears: command.termYears,
        role: command.role,
        signingBonus: availability.signingBonus,
        accepted,
        breakdown: availability.breakdown,
      },
    ],
  };

  return {
    ...state,
    team: { ...state.team, cash: state.team.cash - cashCharged },
    recruiting: {
      ...state.recruiting,
      spendableRp: state.recruiting.spendableRp - offerRpCost,
      campaigns: {
        ...state.recruiting.campaigns,
        [prospect.id]: nextProgress,
      },
      processedTransactionIds: [
        ...state.recruiting.processedTransactionIds,
        command.transactionId,
      ],
      reserveDriver: accepted
        ? reserveFromProspect(prospect, command)
        : state.recruiting.reserveDriver,
    },
  };
}

export function getRecruitingSettlementId(result: Pick<RaceResult, 'raceId' | 'seed'>) {
  return `recruiting-rp:${result.raceId}:${result.seed}`;
}

export function applyRecruitingWeekendSettlement(
  state: GameState,
  result: RaceResult,
): GameState {
  const transactionId = getRecruitingSettlementId(result);
  if (state.recruiting.processedTransactionIds.includes(transactionId)) return state;
  return {
    ...state,
    recruiting: {
      ...state.recruiting,
      spendableRp: state.recruiting.spendableRp + recruitingTuning.rpPerSettledWeekend,
      processedTransactionIds: [
        ...state.recruiting.processedTransactionIds,
        transactionId,
      ],
      campaigns: Object.fromEntries(
        Object.entries(state.recruiting.campaigns).map(([id, progress]) => [
          id,
          {
            ...progress,
            weeklyActionCount: 0,
            actionsUsedThisWeekend: [],
            offerCooldown: false,
          },
        ]),
      ),
    },
  };
}

function estimateRange(value: number, width: number): [number, number] {
  return [
    Math.max(0, Math.round((value - width) * 10) / 10),
    Math.min(100, Math.round((value + width) * 10) / 10),
  ];
}

function revealAccuracy(prospect: RecruitingProspect) {
  if (prospect.archetypes[0] === 'Development Prospect') return 10;
  if (prospect.archetypes[1] === 'Development Prospect') return 5;
  return 0;
}

function getKnownTrackFit(prospect: RecruitingProspect, exactKnown: boolean) {
  if (exactKnown) return [...prospect.trackStrengths];
  return Object.entries(archetypeTrackFit)
    .filter(([, fit]) =>
      prospect.archetypes.some((archetype) => fit.strengths.includes(archetype)),
    )
    .map(([trackType]) => trackType as RecruitingProspect['trackStrengths'][number]);
}

export function selectProspectReveal(
  state: GameState,
  prospectId: string,
): ProspectRevealView {
  const { prospect, progress } = getProspectParts(state, prospectId);
  const band = getScoutingBand(progress.scoutingConfidence);
  const bandId = band.id as ScoutingBandId;
  const profileKnown = progress.scoutingConfidence >= 26;
  const evaluationKnown = progress.scoutingConfidence >= 51;
  const exactKnown = progress.scoutingConfidence >= 76;
  const accuracy = revealAccuracy(prospect);
  const accuracyMultiplier = 1 - accuracy / 100;
  const overallWidth = Math.max(1, 5 * accuracyMultiplier);
  const potentialWidth = Math.max(1, 4 * accuracyMultiplier);
  const statWidth = Math.max(1, 5 * accuracyMultiplier);
  const salaryWidth =
    Math.round(prospect.salaryDemand * 0.2 * accuracyMultiplier / 100) * 100;

  return {
    id: prospect.id,
    name: prospect.name,
    age: prospect.age,
    racingBackground: prospect.racingBackground,
    availability: progress.signed ? 'Signed' : prospect.availability,
    scoutingConfidence: progress.scoutingConfidence,
    scoutingBand: bandId,
    overall: exactKnown ? prospect.overall : null,
    overallRange: exactKnown ? null : estimateRange(prospect.overall, overallWidth),
    potential: exactKnown ? prospect.potential : null,
    potentialRange: evaluationKnown && !exactKnown
      ? estimateRange(prospect.potential, potentialWidth)
      : null,
    stats: exactKnown ? { ...prospect.stats } : {},
    statRanges: evaluationKnown && !exactKnown
      ? Object.fromEntries(
          Object.entries(prospect.stats).map(([stat, value]) => [
            stat,
            estimateRange(value, statWidth),
          ]),
        )
      : {},
    archetypes: profileKnown ? [...prospect.archetypes] : null,
    currentSeries: profileKnown ? prospect.currentSeries : null,
    salaryDemand: exactKnown ? prospect.salaryDemand : null,
    salaryRange: profileKnown && !exactKnown
      ? [
          Math.max(0, prospect.salaryDemand - salaryWidth),
          prospect.salaryDemand + salaryWidth,
        ]
      : null,
    preferredTerm: exactKnown ? prospect.preferredTerm : null,
    interest: evaluationKnown ? progress.interest : null,
    interestLabel: evaluationKnown ? getInterestLabel(progress.interest) : null,
    knownInterestFactors: evaluationKnown
      ? [
          `Recruiting Pull ${state.team.recruitingPull}`,
          `Recruiting Visibility ${state.recruiting.visibility}`,
          ...progress.relationshipPaths.map((path) => `${path} established`),
        ]
      : [],
    sponsorInformation: exactKnown
      ? prospect.sponsorPackage
        ? `${prospect.sponsorPackage.label}: $${prospect.sponsorPackage.projectedRaceBacking.minimum.toLocaleString()}–$${prospect.sponsorPackage.projectedRaceBacking.maximum.toLocaleString()} per race`
        : prospect.personalFundingPackage
          ? `Personal Funding Package: $${prospect.personalFundingPackage.toLocaleString()}`
          : 'No confirmed backing'
      : evaluationKnown
        ? prospect.sponsorPackage || prospect.personalFundingPackage
          ? 'Sponsor backing rumors present'
          : 'No sponsor rumors'
        : null,
    roleExpectation: exactKnown ? prospect.roleExpectation : null,
    dealbreakers: exactKnown ? [...prospect.dealbreakers] : null,
    competingPressure: evaluationKnown ? prospect.competingPressure : null,
    developmentOutlook: evaluationKnown
      ? prospect.developmentOutlook
      : 'Complete more scouting to evaluate the development outlook.',
    trackStrengths: profileKnown
      ? getKnownTrackFit(prospect, exactKnown)
      : [],
    engagement: progress.engagement,
    relationshipPaths: [...progress.relationshipPaths],
    recruitingCostToDate: { ...progress.recruitingCostToDate },
  };
}

export function getRecommendedRecruitingAction(state: GameState, prospectId: string) {
  return recruitingActions.find(
    (definition) =>
      definition.id !== 'contract-offer' &&
      getActionAvailability(state, prospectId, definition.id).available,
  );
}
