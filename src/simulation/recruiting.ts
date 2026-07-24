import {
  filmReviewScoutingGains,
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
  OfferDecisionStatus,
  OfferRequirement,
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

function stableNumber(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

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
  if (interest >= 90) return 'Wants to Sign';
  if (interest >= 75) return 'Ready to Negotiate';
  if (interest >= 60) return 'Seriously Considering';
  if (interest >= 40) return 'Interested';
  if (interest >= 20) return 'Listening';
  return 'Not Interested';
}

export function getScoutingBand(confidence: number) {
  return scoutingBands.find(
    (band) => confidence >= band.minimum && confidence <= band.maximum,
  ) ?? scoutingBands[scoutingBands.length - 1];
}

export type ActionAvailability = {
  available: boolean;
  blockers: RecruitingActionBlocker[];
  completed: boolean;
  primaryReason: string | null;
  reasons: string[];
  uses: number;
  usesRemaining: number | null;
};

export type RecruitingActionBlockerCode =
  | 'prospect-status'
  | 'weekly-limit'
  | 'used-this-week'
  | 'lifetime-limit'
  | 'resources'
  | 'scouting'
  | 'interest'
  | 'pathway'
  | 'engagement'
  | 'recruiting-rank'
  | 'contract-roster';

export type RecruitingActionBlocker = {
  code: RecruitingActionBlockerCode;
  detail: string;
  priority: number;
  reason: string;
};

export function getActionAvailability(
  state: GameState,
  prospectId: string,
  actionId: RecruitingActionId,
): ActionAvailability {
  const { progress } = getProspectParts(state, prospectId);
  const definition = getRecruitingAction(actionId);
  const uses = progress.completedActionUses[actionId] ?? 0;
  const blockers: RecruitingActionBlocker[] = [];
  let blockerSequence = 0;
  const addBlocker = (
    code: RecruitingActionBlockerCode,
    priority: number,
    reason: string,
    detail = reason,
  ) => {
    blockers.push({
      code,
      detail,
      priority: priority * 100 + blockerSequence,
      reason,
    });
    blockerSequence += 1;
  };

  if (progress.signed) {
    addBlocker(
      'prospect-status',
      1,
      'Prospect already signed with Apex',
      'This prospect is already signed to the Apex development roster.',
    );
  }
  if (progress.signedByTeamId) {
    const teamName =
      state.raceField.organizations.find(
        (organization) => organization.id === progress.signedByTeamId,
      )?.name ?? 'another team';
    addBlocker(
      'prospect-status',
      1,
      `Prospect signed with ${teamName}`,
      `This prospect is no longer available after signing with ${teamName}.`,
    );
  }

  if (progress.weeklyActionCount >= recruitingTuning.maximumActionsPerProspectPerWeekend) {
    addBlocker(
      'weekly-limit',
      2,
      'Weekly action limit reached',
      'Available after one more week; all three recruiting moves for this prospect are spent.',
    );
  }
  if (definition.oncePerWeekend && progress.actionsUsedThisWeekend.includes(actionId)) {
    addBlocker(
      'used-this-week',
      3,
      'Weekly use already spent',
      'Available after one more week; this action may be used once per prospect per week.',
    );
  }
  if (
    definition.maximumLifetimeUses !== null &&
    uses >= definition.maximumLifetimeUses
  ) {
    addBlocker(
      'lifetime-limit',
      4,
      definition.repeatable
        ? 'Lifetime uses exhausted'
        : 'One-time action already completed',
      definition.repeatable
        ? `All ${definition.maximumLifetimeUses} lifetime uses have been completed.`
        : 'This one-time recruiting action has already been completed.',
    );
  }
  if (actionId === 'film-review' && progress.scoutingKnowledge >= 100) {
    addBlocker(
      'lifetime-limit',
      4,
      'Scouting report is complete',
      'Film Review is no longer needed because Scouting Knowledge has reached 100.',
    );
  }
  if (state.recruiting.spendableRp < definition.rpCost) {
    const shortfall = definition.rpCost - state.recruiting.spendableRp;
    addBlocker(
      'resources',
      5,
      `Need ${shortfall} more RP`,
      `Requires ${definition.rpCost} RP; Apex has ${state.recruiting.spendableRp}.`,
    );
  }
  if (definition.cashCost > state.team.cash) {
    const shortfall = definition.cashCost - state.team.cash;
    addBlocker(
      'resources',
      5,
      `Need $${shortfall.toLocaleString()} more cash`,
      `Requires $${definition.cashCost.toLocaleString()} cash; Apex has $${state.team.cash.toLocaleString()}.`,
    );
  }

  const prerequisites = definition.prerequisites;
  const missingAll = prerequisites.completedAll?.filter(
    (required) => !completed(progress, required),
  );
  if (missingAll?.length) {
    const names = missingAll.map(
      (required) =>
        getRecruitingAction(required).contextualName ??
        getRecruitingAction(required).canonicalName,
    );
    addBlocker(
      'pathway',
      8,
      `Requires ${names.join(' and ')}`,
      `Complete ${names.join(' and ')} to open this pathway.`,
    );
  }
  if (
    prerequisites.completedAny &&
    !prerequisites.completedAny.some((required) => completed(progress, required))
  ) {
    const names = prerequisites.completedAny.map(
      (required) =>
        getRecruitingAction(required).contextualName ??
        getRecruitingAction(required).canonicalName,
    );
    addBlocker(
      'pathway',
      8,
      `Requires ${names.join(' or ')}`,
      `Complete ${names.join(' or ')} to open this pathway.`,
    );
  }
  if (
    prerequisites.minimumScouting !== undefined &&
    progress.scoutingKnowledge < prerequisites.minimumScouting
  ) {
    addBlocker(
      'scouting',
      6,
      `Unlocks at ${prerequisites.minimumScouting} Scouting Knowledge`,
      `Requires ${prerequisites.minimumScouting} Scouting Knowledge; current knowledge is ${progress.scoutingKnowledge}.`,
    );
  }
  if (
    prerequisites.minimumInterest !== undefined &&
    progress.interest < prerequisites.minimumInterest
  ) {
    addBlocker(
      'interest',
      7,
      `Requires ${prerequisites.minimumInterest} Apex Interest`,
      `Requires ${prerequisites.minimumInterest} Apex Interest; current interest is ${progress.interest}.`,
    );
  }
  if (
    prerequisites.minimumEngagement !== undefined &&
    progress.engagement < prerequisites.minimumEngagement
  ) {
    addBlocker(
      'engagement',
      9,
      `Requires Prospect Engagement ${prerequisites.minimumEngagement}`,
      `Requires Prospect Engagement ${prerequisites.minimumEngagement}; current engagement is ${progress.engagement}.`,
    );
  }
  if (prerequisites.contactEstablished && !completed(progress, 'text-dm')) {
    addBlocker(
      'pathway',
      8,
      'Requires Direct Contact pathway',
      'Complete Text / DM to establish the Direct Contact pathway.',
    );
  }
  if (
    prerequisites.activeSponsor &&
    !state.sponsors.some((sponsor) => sponsor.active)
  ) {
    addBlocker(
      'pathway',
      8,
      'Requires an active team sponsor',
      'An active Apex team sponsor is required for this sponsor pathway.',
    );
  }
  if (prerequisites.openReserveSlot && state.recruiting.reserveDriver) {
    addBlocker(
      'contract-roster',
      11,
      'Requires an open reserve slot',
      'The Reserve / Development roster slot is currently filled.',
    );
  }

  const orderedBlockers = [...blockers]
    .sort((left, right) => left.priority - right.priority)
    .filter(
      (blocker, index, values) =>
        values.findIndex((candidate) => candidate.detail === blocker.detail) === index,
    );
  const reasons = orderedBlockers.map((blocker) => blocker.reason);
  const completedAction =
    (definition.maximumLifetimeUses !== null &&
      uses >= definition.maximumLifetimeUses) ||
    (actionId === 'film-review' && progress.scoutingKnowledge >= 100);

  return {
    available: reasons.length === 0,
    blockers: orderedBlockers,
    completed: completedAction,
    primaryReason: reasons[0] ?? null,
    reasons,
    uses,
    usesRemaining:
      definition.maximumLifetimeUses === null
        ? null
        : Math.max(0, definition.maximumLifetimeUses - uses),
  };
}

export type CalculatedEffects = {
  scouting: number;
  interest: number;
  engagement: number;
  visibility: number;
  reasons: string[];
  variancePercent: number;
};

export function getFilmReviewScoutingGain(completedUses: number) {
  return filmReviewScoutingGains[
    Math.min(completedUses, filmReviewScoutingGains.length - 1)
  ];
}

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
  if (definition.id === 'film-review') {
    const scouting = getFilmReviewScoutingGain(useIndex);
    return {
      scouting,
      interest: 0,
      engagement: 0,
      visibility: 0,
      reasons: [
        `Film Review use ${useIndex + 1}: +${scouting} Scouting Knowledge`,
        'Repeatable once per prospect per week until fully scouted',
        'No random variance or staff modifier',
      ],
      variancePercent: 0,
    };
  }
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

function clampRecruitingEffects(
  progress: ProspectRecruitingProgress,
  effects: CalculatedEffects,
  visibility: number,
): CalculatedEffects {
  return {
    ...effects,
    scouting: Math.min(effects.scouting, 100 - progress.scoutingKnowledge),
    interest: Math.min(effects.interest, 100 - progress.interest),
    engagement: Math.min(effects.engagement, 100 - progress.engagement),
    visibility: Math.min(effects.visibility, 100 - visibility),
  };
}

export function previewRecruitingActionEffects(
  state: GameState,
  prospectId: string,
  actionId: RecruitingActionId,
  raceId: string,
) {
  const { prospect, progress } = getProspectParts(state, prospectId);
  const definition = getRecruitingAction(actionId);
  const availability = getActionAvailability(state, prospectId, actionId);
  return clampRecruitingEffects(
    progress,
    calculateRecruitingEffects(
      state,
      prospect,
      progress,
      definition,
      `${state.season}:${raceId}:${prospect.id}:${definition.id}:${availability.uses + 1}`,
    ),
    state.recruiting.visibility,
  );
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

  const effects = clampRecruitingEffects(
    progress,
    calculateRecruitingEffects(
      state,
      prospect,
      progress,
      definition,
      `${command.season}:${command.raceId}:${prospect.id}:${definition.id}:${availability.uses + 1}`,
    ),
    state.recruiting.visibility,
  );
  const useIndex = availability.uses + 1;
  const nextProgress: ProspectRecruitingProgress = {
    ...progress,
    scoutingKnowledge: clampMeter(progress.scoutingKnowledge + effects.scouting),
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
  const dealbreakers = unmetDealbreakers(state, prospect);
  const fullEvaluation = progress.scoutingKnowledge >= 76;
  const seatPitchMet = completed(progress, 'pitch-seat');
  const developmentPromiseNeeded = prospect.dealbreakers.some((item) =>
    /development|review|sim access/i.test(item),
  );
  const developmentPromiseMet =
    !developmentPromiseNeeded ||
    completed(progress, 'pitch-development') ||
    completed(progress, 'full-development-plan');
  const roleMet =
    prospect.roleExpectation !== 'Active Seat' && developmentPromiseMet;
  const validSalary = Number.isFinite(annualSalary) && annualSalary >= prospect.salaryDemand;
  const termMet = termYears >= prospect.preferredTerm;
  const signingBonus = getSigningBonus(annualSalary);
  const requirements: OfferRequirement[] = [
    {
      id: 'availability',
      label: 'Prospect available',
      met:
        prospect.availability === 'Available' &&
        !progress.signed &&
        !progress.signedByTeamId,
      detail: progress.signed
        ? 'Already signed by Apex.'
        : progress.signedByTeamId
          ? 'This driver signed with another team.'
          : 'Still available to recruit.',
    },
    {
      id: 'scouting',
      label: 'Full Evaluation',
      met: progress.scoutingKnowledge >= 76,
      detail: `${progress.scoutingKnowledge}/76 Scouting Knowledge`,
    },
    {
      id: 'interest',
      label: 'Contract Readiness',
      met:
        fullEvaluation &&
        progress.interest >= 75 &&
        progress.interest >= progress.signingThreshold,
      detail: fullEvaluation
        ? `${progress.interest}/${progress.signingThreshold} Apex Interest`
        : `${progress.interest} Apex Interest; signing line revealed at Full Evaluation`,
    },
    {
      id: 'seat-pitch',
      label: 'Seat path explained',
      met: seatPitchMet,
      detail: seatPitchMet ? 'Reserve / Development path recorded.' : 'Complete Pitch Seat Opportunity.',
    },
    {
      id: 'role',
      label: 'Role accepted',
      met: fullEvaluation && roleMet,
      detail: !fullEvaluation
        ? 'Complete the Full Evaluation to confirm role expectations.'
        : prospect.roleExpectation === 'Active Seat'
        ? 'This driver requires an active seat.'
        : developmentPromiseMet
          ? 'Reserve / Development role is acceptable.'
          : 'A development promise must be made first.',
    },
    {
      id: 'salary',
      label: 'Salary demand met',
      met: fullEvaluation && validSalary,
      detail: fullEvaluation
        ? `$${Math.max(0, annualSalary).toLocaleString()} offered · $${prospect.salaryDemand.toLocaleString()} required`
        : 'Complete the Full Evaluation to learn the salary demand.',
    },
    {
      id: 'term',
      label: 'Term preference met',
      met: fullEvaluation && termMet,
      detail: fullEvaluation
        ? `${termYears}-year offer · ${prospect.preferredTerm}-year preference`
        : 'Complete the Full Evaluation to learn the preferred term.',
    },
    {
      id: 'dealbreakers',
      label: 'Dealbreakers cleared',
      met: fullEvaluation && dealbreakers.length === 0,
      detail: fullEvaluation
        ? dealbreakers[0] ?? 'No hard dealbreaker blocks this offer.'
        : 'Complete the Full Evaluation to uncover dealbreakers.',
    },
    {
      id: 'roster',
      label: 'Roster path open',
      met: !state.recruiting.reserveDriver,
      detail: state.recruiting.reserveDriver
        ? 'The Reserve / Development slot is already filled.'
        : 'One Reserve / Development slot is open.',
    },
    {
      id: 'cash',
      label: 'Signing cash available',
      met: state.team.cash >= signingBonus,
      detail: `$${signingBonus.toLocaleString()} signing bonus`,
    },
    {
      id: 'rp',
      label: 'Recruiting Points available',
      met: state.recruiting.spendableRp >= getRecruitingAction('contract-offer').rpCost,
      detail: `${getRecruitingAction('contract-offer').rpCost} RP required`,
    },
    {
      id: 'weekly-limit',
      label: 'Weekend action available',
      met: progress.weeklyActionCount < recruitingTuning.maximumActionsPerProspectPerWeekend &&
        !progress.actionsUsedThisWeekend.includes('contract-offer'),
      detail: 'Contract offers use one recruiting action.',
    },
  ];
  const failed = new Set(requirements.filter((item) => !item.met).map((item) => item.id));
  let status: OfferDecisionStatus = 'Will Sign';
  if (failed.has('availability')) status = 'Not Available';
  else if (failed.has('scouting')) status = 'Needs Full Evaluation';
  else if (failed.has('dealbreakers')) status = 'Dealbreaker Not Met';
  else if (failed.has('role')) status = 'Role Unacceptable';
  else if (failed.has('salary')) status = 'Salary Too Low';
  else if (failed.has('term')) status = 'Terms Unacceptable';
  else if (failed.has('roster')) status = 'Roster Slot Unavailable';
  else if (failed.has('seat-pitch')) status = 'Needs Seat Pitch';
  else if (failed.has('interest')) status = 'Needs More Interest';
  else if (failed.has('cash')) status = 'Needs Signing Cash';
  else if (failed.has('rp')) status = 'Needs Recruiting Points';
  else if (failed.has('weekly-limit')) status = 'Weekend Limit Reached';
  else if (requirements.some((item) => !item.met)) status = 'Not Available';
  const willSign = requirements.every((item) => item.met);
  const relationshipDepth = getRelationshipDepth(progress);

  return {
    interest: progress.interest,
    salaryFit: validSalary ? 1 : -1,
    termFit: termMet ? 1 : -1,
    roleFit: roleMet ? 1 : -1,
    relationshipDepth,
    reputationFit: 0,
    visibilityFit: 0,
    competingPressure: 0,
    developmentStaffBonus: 0,
    total: progress.interest,
    threshold: progress.signingThreshold,
    unmetDealbreakers: dealbreakers,
    status,
    willSign,
    requirements,
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
  const reasons = unique([
    ...base.reasons,
    ...breakdown.requirements.filter((item) => !item.met).map((item) => item.detail),
  ]);
  return {
    available: base.available && breakdown.willSign,
    reasons: unique(reasons),
    breakdown,
    signingBonus,
    wouldAccept: breakdown.willSign,
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

  const accepted = true;
  const cashCharged = availability.signingBonus;
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
    offerCooldown: false,
    signed: true,
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
      reserveDriver: reserveFromProspect(prospect, command),
    },
  };
}

export function getRecruitingSettlementId(result: Pick<RaceResult, 'raceId' | 'seed'>) {
  return `recruiting-rp:${result.raceId}:${result.seed}`;
}

function advanceRivalCampaign(
  state: GameState,
  prospect: RecruitingProspect,
  progress: ProspectRecruitingProgress,
  transactionId: string,
  settlementSeason: number,
  settlementWeek: number,
): ProspectRecruitingProgress {
  if (progress.signed || progress.signedByTeamId) return progress;
  const organizations = new Map(
    state.raceField.organizations.map((organization) => [organization.id, organization]),
  );
  let rivals = progress.rivals.map((rival) => {
    const organization = organizations.get(rival.teamId);
    const tierGain =
      organization?.tier === 'Elite' ? 4 :
      organization?.tier === 'Strong' ? 3 :
      organization?.tier === 'Midfield' ? 2 : 1;
    const manufacturerGain = organization &&
      prospect.manufacturerFit.includes(organization.manufacturerId) ? 1 : 0;
    const weeklyChange = Math.max(
      1,
      Math.min(
        recruitingTuning.rivalMaximumWeeklyGain,
        tierGain +
          manufacturerGain +
          getSeededVariance(`${transactionId}:${prospect.id}:${rival.teamId}`, 2),
      ),
    );
    return {
      ...rival,
      previousInterest: rival.interest,
      weeklyChange,
      interest: clampMeter(rival.interest + weeklyChange),
    };
  });

  const maximumRivals =
    prospect.competingPressure === 'High' ? 4 :
    prospect.competingPressure === 'Medium' ? 3 : 1;
  const shouldEnter =
    rivals.length < maximumRivals &&
    stableNumber(`${transactionId}:${prospect.id}:new-rival`) % 4 === 0;
  let entrantName: string | null = null;
  if (shouldEnter) {
    const existing = new Set(rivals.map((rival) => rival.teamId));
    const entrant = state.raceField.organizations
      .filter((organization) => !organization.isPlayerTeam && !existing.has(organization.id))
      .sort(
        (left, right) =>
          stableNumber(`${prospect.id}:${left.id}:entrant`) -
          stableNumber(`${prospect.id}:${right.id}:entrant`),
      )[0];
    if (entrant) {
      const interest = Math.max(18, Math.min(50, progress.interest - 12));
      rivals = [
        ...rivals,
        {
          teamId: entrant.id,
          interest,
          previousInterest: interest,
          weeklyChange: 0,
          enteredSeason: settlementSeason,
          enteredWeek: settlementWeek,
        },
      ];
      entrantName = entrant.name;
    }
  }

  const leader = [...rivals].sort(
    (left, right) =>
      right.interest - left.interest || left.teamId.localeCompare(right.teamId),
  )[0];
  const signedByTeamId =
    leader && leader.interest >= progress.signingThreshold ? leader.teamId : undefined;
  const leaderName = leader ? organizations.get(leader.teamId)?.name ?? 'Another team' : null;
  const headline = signedByTeamId
    ? `${leaderName} closed the deal with ${prospect.name}.`
    : entrantName
      ? `${entrantName} joined the chase for ${prospect.name}.`
      : leaderName
        ? `${leaderName} leads the outside interest in ${prospect.name}.`
        : `${prospect.name} remains an open recruiting opportunity.`;

  return {
    ...progress,
    rivals,
    signedByTeamId,
    battleHistory: [
      ...progress.battleHistory,
      {
        id: `${transactionId}:${prospect.id}:battle`,
        season: settlementSeason,
        week: settlementWeek,
        headline,
        details: rivals.map((rival) => {
          const name = organizations.get(rival.teamId)?.name ?? rival.teamId;
          return `${name} ${rival.weeklyChange > 0 ? `+${rival.weeklyChange}` : 'held steady'}`;
        }),
      },
    ].slice(-10),
  };
}

export function applyRecruitingWeekendSettlement(
  state: GameState,
  result: RaceResult,
  settlementContext: { season: number; week: number } = {
    season: state.season,
    week: state.week,
  },
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
        Object.entries(state.recruiting.campaigns).map(([id, progress]) => {
          const prospect = state.recruiting.prospects.find((item) => item.id === id);
          const advanced = prospect
            ? advanceRivalCampaign(
                state,
                prospect,
                progress,
                transactionId,
                settlementContext.season,
                settlementContext.week,
              )
            : progress;
          return [
            id,
            {
              ...advanced,
              weeklyActionCount: 0,
              actionsUsedThisWeekend: [],
              offerCooldown: false,
            },
          ];
        }),
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

function selectRecruitingBattle(
  state: GameState,
  progress: ProspectRecruitingProgress,
  knowledge: number,
) {
  const organizationNames = new Map(
    state.raceField.organizations.map((organization) => [
      organization.id,
      organization.name,
    ]),
  );
  const exactTeams = [
    {
      id: 'apex',
      teamId: state.team.id,
      teamName: state.team.name,
      isApex: true,
      interest: progress.interest,
      weeklyChange: 0,
    },
    ...progress.rivals.map((rival) => ({
      id: rival.teamId,
      teamId: rival.teamId,
      teamName: organizationNames.get(rival.teamId) ?? 'Outside team',
      isApex: false,
      interest: rival.interest,
      weeklyChange: rival.weeklyChange,
    })),
  ].sort(
    (left, right) =>
      right.interest - left.interest || left.id.localeCompare(right.id),
  );
  const apexRank = exactTeams.findIndex((team) => team.isApex) + 1;
  const leader = exactTeams[0];
  const publicTeams = knowledge < 26
    ? [
        {
          id: 'apex',
          teamId: state.team.id,
          teamName: state.team.name,
          isApex: true,
          interest: progress.interest,
          interestRange: null,
          rank: null,
          weeklyChange: 0,
          status: 'Unknown' as const,
        },
        ...progress.rivals.slice(0, 4).map((_, index) => ({
          id: `unknown-${index}`,
          teamId: null,
          teamName: 'Unknown team',
          isApex: false,
          interest: null,
          interestRange: null,
          rank: null,
          weeklyChange: null,
          status: 'Unknown' as const,
        })),
      ]
    : exactTeams.slice(0, 5).map((team, index) => {
        const gap = leader.interest - team.interest;
        return {
          id: team.id,
          teamId: team.teamId,
          teamName: team.teamName,
          isApex: team.isApex,
          interest: knowledge >= 51 || team.isApex ? team.interest : null,
          interestRange: knowledge >= 51 || team.isApex
            ? null
            : [
                Math.max(0, team.interest - 6),
                Math.min(100, team.interest + 6),
              ] as [number, number],
          rank: knowledge >= 51 || team.isApex ? index + 1 : null,
          weeklyChange: knowledge >= 51 || team.isApex ? team.weeklyChange : null,
          status:
            index === 0 ? 'Leading' as const :
            gap <= 5 ? 'Close' as const :
            gap > 15 ? 'Falling Behind' as const : 'Interested' as const,
        };
      });

  return {
    leaderName: knowledge >= 26 ? leader.teamName : null,
    apexRank,
    competitionSummary: progress.rivals.length === 0
      ? 'No outside team is pressing yet.'
      : knowledge < 26
        ? `${progress.rivals.length} outside ${progress.rivals.length === 1 ? 'team is' : 'teams are'} showing interest.`
        : `${progress.rivals.length} outside ${progress.rivals.length === 1 ? 'team is' : 'teams are'} in the recruiting battle.`,
    teams: publicTeams,
    latestHeadline: knowledge >= 51
      ? progress.battleHistory.at(-1)?.headline ?? null
      : null,
  };
}

export function selectProspectReveal(
  state: GameState,
  prospectId: string,
): ProspectRevealView {
  const { prospect, progress } = getProspectParts(state, prospectId);
  const band = getScoutingBand(progress.scoutingKnowledge);
  const bandId = band.id as ScoutingBandId;
  const profileKnown = progress.scoutingKnowledge >= 26;
  const evaluationKnown = progress.scoutingKnowledge >= 51;
  const exactKnown = progress.scoutingKnowledge >= 76;
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
    availability: progress.signed
      ? 'Signed'
      : progress.signedByTeamId
        ? 'Unavailable'
        : prospect.availability,
    scoutingKnowledge: progress.scoutingKnowledge,
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
    interest: progress.interest,
    interestLabel: getInterestLabel(progress.interest),
    signingThreshold: exactKnown ? progress.signingThreshold : null,
    signingThresholdKnown: exactKnown,
    contractReadiness: evaluateContractOffer(
      state,
      prospectId,
      prospect.salaryDemand,
      prospect.preferredTerm,
    ).status,
    recruitingBattle: selectRecruitingBattle(
      state,
      progress,
      progress.scoutingKnowledge,
    ),
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

export type RecruitingRiskWarning = {
  prospectId: string;
  prospectName: string;
  rivalTeamName: string;
  message: string;
};

export function getRecruitingRiskWarning(
  state: GameState,
  prospectId: string,
): RecruitingRiskWarning | null {
  const { prospect, progress } = getProspectParts(state, prospectId);
  const targeted =
    progress.actionHistory.length > 0 ||
    progress.recruitingCostToDate.rp > 0 ||
    progress.recruitingCostToDate.cash > 0;
  if (!targeted || progress.signed || progress.signedByTeamId) return null;
  const leader = [...progress.rivals].sort(
    (left, right) =>
      right.interest - left.interest || left.teamId.localeCompare(right.teamId),
  )[0];
  if (
    !leader ||
    leader.interest + recruitingTuning.rivalMaximumWeeklyGain <
      progress.signingThreshold
  ) {
    return null;
  }
  const rivalTeamName =
    state.raceField.organizations.find(
      (organization) => organization.id === leader.teamId,
    )?.name ?? 'Another team';
  const apexTrails = progress.interest < leader.interest;
  return {
    prospectId,
    prospectName: prospect.name,
    rivalTeamName,
    message: apexTrails
      ? 'Warning: Apex trails in this recruiting battle. Another team may sign him when the week advances.'
      : 'Warning: This prospect is close to signing elsewhere.',
  };
}

export function getImmediateRecruitingRiskWarnings(state: GameState) {
  return state.recruiting.prospects
    .map((prospect) => getRecruitingRiskWarning(state, prospect.id))
    .filter((warning): warning is RecruitingRiskWarning => warning !== null);
}

export function getRecommendedRecruitingAction(state: GameState, prospectId: string) {
  const { prospect, progress } = getProspectParts(state, prospectId);
  if (progress.signed || progress.signedByTeamId) return undefined;
  const offer = evaluateContractOffer(
    state,
    prospectId,
    prospect.salaryDemand,
    prospect.preferredTerm,
  );
  if (offer.willSign) return getRecruitingAction('contract-offer');
  const preferredGroups: RecruitingActionId[][] = progress.scoutingKnowledge < 51
    ? [
        ['scout-report', 'film-review', 'watch-race-tape', 'background-check', 'film-session'],
        ['text-dm', 'crew-chief-call', 'owner-call'],
      ]
    : progress.interest < progress.signingThreshold
      ? [
          ['pitch-development', 'pitch-stability', 'shop-tour', 'pitch-growth'],
          ['driver-highlight', 'behind-scenes-feature', 'spotlight-video'],
        ]
      : [
          ['pitch-seat', 'full-development-plan', 'manufacturer-pitch'],
          ['sim-session', 'race-weekend-visit', 'private-test-day'],
        ];
  for (const actionIds of preferredGroups) {
    const match = actionIds
      .map((actionId) => getRecruitingAction(actionId))
      .find((definition) =>
        definition.id !== 'contract-offer' &&
        getActionAvailability(state, prospectId, definition.id).available,
      );
    if (match) return match;
  }
  return recruitingActions.find(
    (definition) =>
      definition.id !== 'contract-offer' &&
      getActionAvailability(state, prospectId, definition.id).available,
  );
}
