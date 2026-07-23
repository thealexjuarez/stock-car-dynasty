/// <reference types="node" />

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  prototypeProspects,
  getRecruitingPullAdjustment,
  getVisibilityAdjustment,
} from '@/data/prospect-data';
import { selectRecruitingFoundation } from '@/data/recruiting-foundation';
import {
  getRecruitingAction,
  recruitingActions,
  scoutingBands,
} from '@/data/recruiting-config';
import { starterGameState } from '@/data/starter-game-state';
import {
  applyRecruitingAction,
  applyRecruitingOffer,
  applyRecruitingWeekendSettlement,
  calculateRecruitingEffects,
  evaluateContractOffer,
  getActionAvailability,
  getOfferAvailability,
  getRelationshipDepth,
  getScoutingBand,
  getSigningBonus,
  selectProspectReveal,
} from '@/simulation/recruiting';
import { applyRaceSettlement } from '@/simulation/race-weekend';
import { normalizeGameState } from '@/state/game-state-migration';
import { createInitialGameSessionState, gameSessionReducer } from '@/state/game-session-reducer';
import type { GameState } from '@/types/game';
import type {
  ProspectRecruitingProgress,
  RecruitingActionId,
} from '@/types/recruiting';
import type { RaceResult } from '@/types/race-weekend';

const masonId = 'prospect-mason-riggs';
const tobinId = 'prospect-tobin-wells';

function freshGame(): GameState {
  return createInitialGameSessionState(starterGameState).game;
}

function withProgress(
  state: GameState,
  prospectId: string,
  patch: Partial<ProspectRecruitingProgress>,
): GameState {
  const current = state.recruiting.campaigns[prospectId];
  return {
    ...state,
    recruiting: {
      ...state.recruiting,
      campaigns: {
        ...state.recruiting.campaigns,
        [prospectId]: {
          ...current,
          ...patch,
          completedActionUses: {
            ...current.completedActionUses,
            ...(patch.completedActionUses ?? {}),
          },
          actionsUsedThisWeekend:
            patch.actionsUsedThisWeekend ?? [...current.actionsUsedThisWeekend],
          relationshipPaths:
            patch.relationshipPaths ?? [...current.relationshipPaths],
          offerHistory: patch.offerHistory ?? [...current.offerHistory],
        },
      },
    },
  };
}

function withResources(state: GameState, rp = 2_000, cash = 1_000_000): GameState {
  return {
    ...state,
    team: { ...state.team, cash },
    recruiting: { ...state.recruiting, spendableRp: rp },
  };
}

function command(
  actionId: Exclude<RecruitingActionId, 'contract-offer'>,
  prospectId = masonId,
  suffix = '1',
) {
  return {
    transactionId: `test:${prospectId}:${actionId}:${suffix}`,
    prospectId,
    actionId,
    season: 1,
    week: 1,
    raceId: 'race-1',
  } as const;
}

function emptyResult(seed = 'recruiting-settlement'): RaceResult {
  return {
    raceId: 'race-1',
    seed,
    entries: [],
    playerPayout: 0,
    playerExp: 0,
    playerConditionLoss: 0,
  };
}

function offerReady(state: GameState, prospectId = tobinId): GameState {
  return withResources(
    withProgress(state, prospectId, {
      scoutingConfidence: 76,
      interest: 80,
      completedActionUses: { 'pitch-seat': 1 },
      relationshipPaths: [
        'Direct Contact',
        'Evaluation',
        'Team Visit',
        'Development Path',
        'Social Campaign',
        'Sponsor Connection',
        'Seat Opportunity',
        'Team Stability',
        'Competitive Growth',
        'Manufacturer Fit',
      ],
    }),
  );
}

test('market starts with 100 spendable RP, separate Pull 45, Visibility 44, and 20 prospects', () => {
  assert.equal(starterGameState.recruiting.spendableRp, 100);
  assert.equal(starterGameState.team.recruitingPull, 45);
  assert.equal(starterGameState.recruiting.visibility, 44);
  assert.equal(starterGameState.recruiting.prospects.length, 20);
  assert.equal(getRecruitingPullAdjustment(45), -1);
  assert.equal(getVisibilityAdjustment(44), -1);
  assert.deepEqual(
    {
      spendableRp: selectRecruitingFoundation(starterGameState).spendableRp,
      availableProspects:
        selectRecruitingFoundation(starterGameState).availableProspects,
      reserveCapacity:
        selectRecruitingFoundation(starterGameState).reserveCapacity,
    },
    { spendableRp: 100, availableProspects: 20, reserveCapacity: 1 },
  );
});

test('all 26 canonical actions and locked high-end costs are centralized', () => {
  assert.equal(recruitingActions.length, 26);
  assert.deepEqual(
    recruitingActions.map((item) => item.rpCost),
    [10,20,25,35,50,60,60,65,75,75,75,80,90,90,100,100,110,125,125,140,150,175,175,200,250,300],
  );
  assert.equal(getRecruitingAction('private-test-day').cashCost, 20_000);
  assert.equal(getRecruitingAction('contract-offer').rpCost, 300);
});

test('staff action groupings match the approved matrix', () => {
  assert.deepEqual(
    recruitingActions.filter((item) => item.staffGroup === 'development').map((item) => item.id),
    ['crew-chief-call','pitch-development','sim-session','full-development-plan','contract-offer'],
  );
  assert.deepEqual(
    recruitingActions.filter((item) => item.staffGroup === 'social').map((item) => item.id),
    ['social-follow','driver-highlight','behind-scenes-feature','fan-poll','spotlight-video','sponsor-feature'],
  );
});

test('settlement adds 100 RP once, carries balance, resets weekly counters, and clears cooldown', () => {
  let state = withProgress(withResources(freshGame(), 235), masonId, {
    weeklyActionCount: 3,
    actionsUsedThisWeekend: ['text-dm'],
    offerCooldown: true,
  });
  state = applyRecruitingWeekendSettlement(state, emptyResult());
  assert.equal(state.recruiting.spendableRp, 335);
  assert.equal(state.recruiting.campaigns[masonId].weeklyActionCount, 0);
  assert.deepEqual(state.recruiting.campaigns[masonId].actionsUsedThisWeekend, []);
  assert.equal(state.recruiting.campaigns[masonId].offerCooldown, false);
  assert.strictEqual(applyRecruitingWeekendSettlement(state, emptyResult()), state);
});

test('race settlement integrates the RP award without changing settlement replay protection', () => {
  const start = withProgress(freshGame(), masonId, {
    scoutingConfidence: 31,
    interest: 62,
    weeklyActionCount: 2,
  });
  const result = emptyResult('integrated-settlement');
  const settled = applyRaceSettlement(start, result);
  assert.equal(settled.recruiting.spendableRp, 200);
  assert.equal(settled.recruiting.campaigns[masonId].scoutingConfidence, 31);
  assert.equal(settled.recruiting.campaigns[masonId].interest, 62);
  assert.equal(settled.recruiting.campaigns[masonId].weeklyActionCount, 0);
  assert.strictEqual(applyRaceSettlement(settled, result), settled);
});

test('successful action spends RP once and replay returns the same state', () => {
  const start = withResources(freshGame(), 100);
  const next = applyRecruitingAction(start, command('scout-report'));
  assert.equal(next.recruiting.spendableRp, 75);
  assert.equal(next.recruiting.campaigns[masonId].scoutingConfidence > 0, true);
  assert.strictEqual(applyRecruitingAction(next, command('scout-report')), next);
});

test('failed validation spends no RP or cash', () => {
  const start = freshGame();
  const beforeRp = start.recruiting.spendableRp;
  const beforeCash = start.team.cash;
  assert.throws(() => applyRecruitingAction(start, command('private-test-day')));
  assert.equal(start.recruiting.spendableRp, beforeRp);
  assert.equal(start.team.cash, beforeCash);
});

test('Private Test Day charges 250 RP and $20,000 exactly once without negative cash', () => {
  let state = withResources(freshGame(), 500, 20_000);
  state = withProgress(state, masonId, {
    interest: 75,
    completedActionUses: { 'sim-session': 1, 'race-weekend-visit': 1 },
  });
  const next = applyRecruitingAction(state, command('private-test-day'));
  assert.equal(next.recruiting.spendableRp, 250);
  assert.equal(next.team.cash, 0);
  assert.strictEqual(applyRecruitingAction(next, command('private-test-day')), next);

  const poor = { ...state, team: { ...state.team, cash: 19_999 } };
  assert.equal(getActionAvailability(poor, masonId, 'private-test-day').available, false);
  assert.throws(() => applyRecruitingAction(poor, command('private-test-day', masonId, 'poor')));
  assert.equal(poor.team.cash, 19_999);
});

test('three-action weekend limit, unique actions, repeat limits, and once-per-weekend are enforced', () => {
  let state = withResources(freshGame());
  state = applyRecruitingAction(state, command('text-dm'));
  assert.equal(getActionAvailability(state, masonId, 'text-dm').available, false);
  state = applyRecruitingAction(state, command('scout-report'));
  assert.equal(getActionAvailability(state, masonId, 'scout-report').available, false);
  state = applyRecruitingAction(state, command('watch-race-tape'));
  assert.equal(getActionAvailability(state, masonId, 'social-follow').available, false);

  const lifetime = withProgress(withResources(freshGame()), masonId, {
    completedActionUses: { 'text-dm': 3, 'watch-race-tape': 2 },
  });
  assert.equal(getActionAvailability(lifetime, masonId, 'text-dm').available, false);
  assert.equal(getActionAvailability(lifetime, masonId, 'watch-race-tape').available, false);
});

test('diminishing returns use 100%, 60%, and 30% before deterministic variance', () => {
  const state = {
    ...withResources(freshGame()),
    staff: freshGame().staff.map((member) => ({ ...member, active: false })),
  };
  const prospect = state.recruiting.prospects.find((item) => item.id === masonId)!;
  const definition = getRecruitingAction('watch-race-tape');
  const base = state.recruiting.campaigns[masonId];
  const results = [0, 1, 2].map((uses) =>
    calculateRecruitingEffects(
      state,
      prospect,
      { ...base, completedActionUses: { 'watch-race-tape': uses } },
      definition,
      'same-seed',
    ),
  );
  const multipliers = [1, 0.6, 0.3];
  results.forEach((result, index) => {
    assert.equal(
      result.scouting,
      Math.max(1, Math.round(12 * multipliers[index] * (1 + result.variancePercent / 100))),
    );
  });
});

test('deterministic variance is stable, bounded, and staff applies afterward', () => {
  const state = withResources(freshGame());
  const prospect = state.recruiting.prospects.find((item) => item.id === masonId)!;
  const progress = state.recruiting.campaigns[masonId];
  const definition = getRecruitingAction('crew-chief-call');
  const first = calculateRecruitingEffects(state, prospect, progress, definition, 'stable');
  const second = calculateRecruitingEffects(state, prospect, progress, definition, 'stable');
  assert.deepEqual(first, second);
  assert.equal(first.variancePercent >= -10 && first.variancePercent <= 10, true);

  const noStaff = {
    ...state,
    staff: state.staff.map((member) =>
      member.trait === 'Development-Minded' ? { ...member, active: false } : member,
    ),
  };
  const baseline = calculateRecruitingEffects(noStaff, prospect, progress, definition, 'stable');
  assert.equal(first.scouting >= baseline.scouting + 1, true);
  assert.equal(first.interest >= baseline.interest + 1, true);
});

test('Dana Pierce boosts only qualifying scouting confidence', () => {
  const state = withResources(freshGame());
  const noDana = {
    ...state,
    staff: state.staff.map((member) =>
      member.trait === 'Short Track Network' ? { ...member, active: false } : member,
    ),
  };
  const regional = state.recruiting.prospects.find((item) => item.id === masonId)!;
  const national = state.recruiting.prospects.find((item) => item.id === 'prospect-nico-salas')!;
  const definition = getRecruitingAction('scout-report');
  const boosted = calculateRecruitingEffects(state, regional, state.recruiting.campaigns[masonId], definition, 'dana');
  const base = calculateRecruitingEffects(noDana, regional, state.recruiting.campaigns[masonId], definition, 'dana');
  const nationalResult = calculateRecruitingEffects(state, national, state.recruiting.campaigns[national.id], definition, 'dana');
  const nationalBase = calculateRecruitingEffects(noDana, national, state.recruiting.campaigns[national.id], definition, 'dana');
  assert.equal(boosted.scouting > base.scouting, true);
  assert.equal(boosted.interest, base.interest);
  assert.equal(boosted.engagement, base.engagement);
  assert.equal(nationalResult.scouting, nationalBase.scouting);
});

test('meters clamp to 100 and positive successful effects remain at least one', () => {
  let state = withProgress(withResources(freshGame()), masonId, {
    interest: 100,
    scoutingConfidence: 99,
    completedActionUses: { 'watch-race-tape': 1 },
  });
  state = applyRecruitingAction(state, command('watch-race-tape', masonId, 'clamp'));
  assert.equal(state.recruiting.campaigns[masonId].scoutingConfidence, 100);

  const definition = getRecruitingAction('text-dm');
  const prospect = state.recruiting.prospects.find((item) => item.id === masonId)!;
  const effects = calculateRecruitingEffects(
    state,
    prospect,
    { ...state.recruiting.campaigns[masonId], completedActionUses: { 'text-dm': 2 } },
    definition,
    'minimum',
  );
  assert.equal(effects.interest >= 1, true);
});

test('the exact four scouting bands are enforced at boundaries', () => {
  assert.equal(scoutingBands.length, 4);
  assert.deepEqual([0,25,26,50,51,75,76,100].map((value) => getScoutingBand(value).id), [
    'basic','basic','profile','profile','evaluation','evaluation','exact','exact',
  ]);
});

test('reveal selector gates archetypes, stats, interest, sponsors, and dealbreakers', () => {
  const state = freshGame();
  const basic = selectProspectReveal(state, masonId);
  assert.equal(basic.archetypes, null);
  assert.deepEqual(basic.stats, {});
  assert.equal(basic.interest, null);
  assert.equal(basic.sponsorInformation, null);
  assert.equal(basic.dealbreakers, null);

  const profile = selectProspectReveal(withProgress(state, masonId, { scoutingConfidence: 26 }), masonId);
  assert.notEqual(profile.archetypes, null);
  assert.notEqual(profile.salaryRange, null);
  assert.equal(profile.interest, null);

  const evaluation = selectProspectReveal(withProgress(state, masonId, { scoutingConfidence: 51 }), masonId);
  assert.equal(Object.keys(evaluation.statRanges).length, 10);
  assert.notEqual(evaluation.interest, null);
  assert.equal(evaluation.dealbreakers, null);

  const exact = selectProspectReveal(withProgress(state, masonId, { scoutingConfidence: 76 }), masonId);
  assert.equal(exact.overall, prototypeProspects[0].overall);
  assert.equal(Object.keys(exact.stats).length, 10);
  assert.notEqual(exact.dealbreakers, null);
});

test('Development Prospect narrows ranges without revealing information early', () => {
  const state = freshGame();
  const primaryDevelopmentId = 'prospect-owen-lark';
  const ordinaryId = 'prospect-nico-salas';
  const dev = selectProspectReveal(state, primaryDevelopmentId);
  const ordinary = selectProspectReveal(state, ordinaryId);
  assert.equal(dev.archetypes, null);
  assert.equal(dev.interest, null);
  assert.equal((dev.overallRange![1] - dev.overallRange![0]) < (ordinary.overallRange![1] - ordinary.overallRange![0]), true);
});

test('social recruiting changes E and V, reveals no scouting data, and creates no cash', () => {
  const start = withResources(freshGame());
  const beforeCash = start.team.cash;
  const next = applyRecruitingAction(start, command('social-follow'));
  const progress = next.recruiting.campaigns[masonId];
  assert.equal(progress.engagement, 9);
  assert.equal(next.recruiting.visibility, 46);
  assert.equal(progress.scoutingConfidence, 0);
  assert.equal(selectProspectReveal(next, masonId).archetypes, null);
  assert.equal(next.team.cash, beforeCash);
  assert.equal(getActionAvailability(next, masonId, 'driver-highlight').available, true);
});

test('relationship depth rewards distinct paths and caps at eight', () => {
  const progress = freshGame().recruiting.campaigns[masonId];
  assert.equal(getRelationshipDepth({ ...progress, relationshipPaths: ['Direct Contact','Direct Contact','Evaluation'] }), 2);
  assert.equal(getRelationshipDepth({
    ...progress,
    relationshipPaths: [
      'Direct Contact','Evaluation','Team Visit','Development Path','Social Campaign',
      'Sponsor Connection','Seat Opportunity','Team Stability','Competitive Growth','Manufacturer Fit',
    ],
  }), 8);
});

test('offer score uses deterministic salary, term, role, reputation, visibility, and pressure modifiers', () => {
  const staffless = {
    ...freshGame(),
    staff: freshGame().staff.map((member) =>
      member.trait === 'Development-Minded' ? { ...member, active: false } : member,
    ),
  };
  const state = offerReady(staffless);
  const demand = state.recruiting.prospects.find((item) => item.id === tobinId)!.salaryDemand;
  const evaluateSalary = (ratio: number) =>
    evaluateContractOffer(state, tobinId, Math.round(demand * ratio), 1).salaryFit;
  assert.deepEqual(
    [evaluateSalary(0.84), evaluateSalary(0.9), evaluateSalary(1), evaluateSalary(1.1), evaluateSalary(1.15)],
    [-25, -12, 0, 8, 15],
  );
  const low = evaluateContractOffer(state, tobinId, demand, 1);
  const longer = evaluateContractOffer(state, tobinId, demand, 2);
  assert.equal(low.termFit, 3);
  assert.equal(longer.termFit, 5);
  assert.equal(low.roleFit, 0);
  assert.equal(low.relationshipDepth, 8);
  assert.equal(low.reputationFit, 4);
  assert.equal(low.visibilityFit, -1);
  assert.equal(low.competingPressure, 0);
  assert.equal(low.threshold, 75);
  assert.deepEqual(evaluateContractOffer(state, tobinId, demand, 1), evaluateContractOffer(state, tobinId, demand, 1));
});

test('term, role, reputation, visibility, pressure, and staff offer rules match the approved formula', () => {
  const staffless = {
    ...freshGame(),
    staff: freshGame().staff.map((member) =>
      member.trait === 'Development-Minded' ? { ...member, active: false } : member,
    ),
  };
  const jaceState = offerReady(staffless, 'prospect-jace-hollander');
  const jace = jaceState.recruiting.prospects.find((item) => item.id === 'prospect-jace-hollander')!;
  assert.equal(evaluateContractOffer(jaceState, jace.id, jace.salaryDemand, 1).termFit, -16);
  assert.equal(evaluateContractOffer(jaceState, jace.id, jace.salaryDemand, 2).termFit, -8);
  assert.equal(evaluateContractOffer(jaceState, jace.id, jace.salaryDemand, 3).termFit, 3);
  assert.equal(evaluateContractOffer(jaceState, jace.id, jace.salaryDemand, 3).roleFit, 8);

  const theoState = offerReady(staffless, 'prospect-theo-barrett');
  const theo = theoState.recruiting.prospects.find((item) => item.id === 'prospect-theo-barrett')!;
  assert.equal(evaluateContractOffer(theoState, theo.id, theo.salaryDemand, 1).roleFit, -20);

  const highFits = {
    ...jaceState,
    team: { ...jaceState.team, reputation: 100 },
    recruiting: { ...jaceState.recruiting, visibility: 100 },
  };
  const lowFits = {
    ...jaceState,
    team: { ...jaceState.team, reputation: 0 },
    recruiting: { ...jaceState.recruiting, visibility: 0 },
  };
  assert.equal(evaluateContractOffer(highFits, jace.id, jace.salaryDemand, 3).reputationFit, 10);
  assert.equal(evaluateContractOffer(lowFits, jace.id, jace.salaryDemand, 3).reputationFit, -10);
  assert.equal(evaluateContractOffer(highFits, jace.id, jace.salaryDemand, 3).visibilityFit, 5);
  assert.equal(evaluateContractOffer(lowFits, jace.id, jace.salaryDemand, 3).visibilityFit, -3);
  assert.equal(getVisibilityAdjustment(0), -3);
  assert.equal(getVisibilityAdjustment(100), 5);
  assert.equal(evaluateContractOffer(jaceState, jace.id, jace.salaryDemand, 3).competingPressure, -5);

  const staffed = offerReady(freshGame(), jace.id);
  const staffedResult = evaluateContractOffer(staffed, jace.id, Math.ceil(jace.salaryDemand * 1.15), 3);
  const unstaffedResult = evaluateContractOffer(jaceState, jace.id, Math.ceil(jace.salaryDemand * 1.15), 3);
  assert.equal(staffedResult.interest, unstaffedResult.interest);
  assert.equal(staffedResult.reputationFit, unstaffedResult.reputationFit);
  assert.equal(staffedResult.visibilityFit, unstaffedResult.visibilityFit);
  assert.equal(staffedResult.salaryFit > unstaffedResult.salaryFit, true);
  assert.equal(staffedResult.termFit > unstaffedResult.termFit, true);
  assert.equal(staffedResult.roleFit > unstaffedResult.roleFit, true);
  assert.equal(staffedResult.developmentStaffBonus, staffedResult.total - unstaffedResult.total);
});

test('prototype salaries stay inside the approved overall bands', () => {
  const bounds = (overall: number) => {
    if (overall <= 54) return [30_000, 45_000];
    if (overall <= 59) return [40_000, 60_000];
    if (overall <= 64) return [55_000, 80_000];
    if (overall <= 68) return [75_000, 105_000];
    return [100_000, 140_000];
  };
  prototypeProspects.forEach((prospect) => {
    const [minimum, maximum] = bounds(prospect.overall);
    assert.equal(prospect.salaryDemand >= minimum && prospect.salaryDemand <= maximum, true);
  });
});

test('offer availability blocks insufficient RP, accepted signing cash, occupied slot, and prerequisites', () => {
  const ready = offerReady(freshGame());
  const demand = ready.recruiting.prospects.find((item) => item.id === tobinId)!.salaryDemand;
  const noRp = { ...ready, recruiting: { ...ready.recruiting, spendableRp: 299 } };
  assert.equal(getOfferAvailability(noRp, tobinId, demand * 2, 2).available, false);
  const noCash = { ...ready, team: { ...ready.team, cash: 1 } };
  assert.equal(getOfferAvailability(noCash, tobinId, demand * 2, 2).available, false);
  const occupied = {
    ...ready,
    recruiting: {
      ...ready.recruiting,
      reserveDriver: {
        prospectId:'x',name:'Signed Driver',age:20,hometown:'Test',overall:50,potential:60,
        stats:{...prototypeProspects[0].stats},archetypes:[
          prototypeProspects[0].archetypes[0],
          prototypeProspects[0].archetypes[1],
        ] as [typeof prototypeProspects[0]['archetypes'][0], typeof prototypeProspects[0]['archetypes'][1]],
        annualSalary:50_000,termYears:1 as const,role:'Reserve / Development' as const,
        developmentHistory:[],sponsorLeads:[],
      },
    },
  };
  assert.equal(getOfferAvailability(occupied, tobinId, demand, 1).available, false);
  assert.equal(getOfferAvailability(withResources(freshGame()), tobinId, demand, 1).available, false);
});

test('rejected offer spends 300 RP, no cash, creates cooldown, and replay cannot charge twice', () => {
  const start = offerReady(freshGame());
  const command = {
    transactionId:'offer:reject', prospectId:tobinId, annualSalary:1, termYears:1 as const,
    role:'Reserve / Development' as const, season:1, week:1, raceId:'race-1',
  };
  const next = applyRecruitingOffer(start, command);
  assert.equal(next.recruiting.spendableRp, start.recruiting.spendableRp - 300);
  assert.equal(next.team.cash, start.team.cash);
  assert.equal(next.recruiting.campaigns[tobinId].offerCooldown, true);
  assert.equal(next.recruiting.reserveDriver, undefined);
  assert.strictEqual(applyRecruitingOffer(next, command), next);
  assert.equal(getOfferAvailability(next, tobinId, 100_000, 1).available, false);

  const exhausted = withProgress(offerReady(freshGame()), tobinId, {
    completedActionUses: { 'contract-offer': 3 },
  });
  assert.equal(getOfferAvailability(exhausted, tobinId, 100_000, 1).available, false);
});

test('accepted offer spends RP and signing bonus once, fills one reserve slot, and marks prospect signed', () => {
  const start = offerReady(freshGame());
  const demand = start.recruiting.prospects.find((item) => item.id === tobinId)!.salaryDemand;
  const command = {
    transactionId:'offer:accept', prospectId:tobinId, annualSalary:demand * 2, termYears:2 as const,
    role:'Reserve / Development' as const, season:1, week:1, raceId:'race-1',
  };
  const next = applyRecruitingOffer(start, command);
  const bonus = getSigningBonus(command.annualSalary);
  assert.equal(next.recruiting.spendableRp, start.recruiting.spendableRp - 300);
  assert.equal(next.team.cash, start.team.cash - bonus);
  assert.equal(next.recruiting.reserveDriver?.prospectId, tobinId);
  assert.equal(next.recruiting.reserveDriver?.annualSalary, command.annualSalary);
  assert.equal(next.recruiting.campaigns[tobinId].signed, true);
  assert.equal(selectProspectReveal(next, tobinId).availability, 'Signed');
  assert.strictEqual(applyRecruitingOffer(next, command), next);
});

test('active-seat and manufacturer dealbreakers block acceptance', () => {
  const activeSeat = offerReady(freshGame(), 'prospect-theo-barrett');
  const theo = activeSeat.recruiting.prospects.find((item) => item.id === 'prospect-theo-barrett')!;
  assert.equal(evaluateContractOffer(activeSeat, theo.id, theo.salaryDemand * 2, 3).unmetDealbreakers.length, 1);
  const mismatch = offerReady(freshGame(), 'prospect-finn-dalton');
  const finn = mismatch.recruiting.prospects.find((item) => item.id === 'prospect-finn-dalton')!;
  assert.equal(evaluateContractOffer(mismatch, finn.id, finn.salaryDemand * 2, 3).unmetDealbreakers.length, 1);
});

test('migration adds recruiting defaults without retroactive RP or replaying settlements', () => {
  const legacy = structuredClone(starterGameState) as Omit<GameState, 'recruiting'> & {
    recruiting?: GameState['recruiting'];
  };
  delete legacy.recruiting;
  legacy.stateVersion = 2;
  legacy.team.cash = 123_456;
  legacy.drivers[0].exp = 77;
  legacy.economy.processedTransactionIds = ['settlement:old'];
  const normalized = normalizeGameState(legacy as GameState);
  assert.equal(normalized.stateVersion, 4);
  assert.equal(normalized.recruiting.spendableRp, 100);
  assert.equal(normalized.recruiting.processedTransactionIds.length, 0);
  assert.equal(normalized.team.cash, 123_456);
  assert.equal(normalized.drivers[0].exp, 77);
  assert.deepEqual(normalized.economy.processedTransactionIds, ['settlement:old']);
});

test('recruiting persists through reducer navigation and repairs do not reset it', () => {
  let session = createInitialGameSessionState(withResources(freshGame()));
  session = gameSessionReducer(session, {
    type:'COMPLETE_RECRUITING_ACTION',
    transactionId:'reducer:scout',
    prospectId:masonId,
    recruitingActionId:'scout-report',
  });
  const afterRecruiting = session.game.recruiting;
  session = gameSessionReducer(session, {
    type:'REPAIR_VEHICLE',
    actionId:'repair:recruiting-persistence',
    raceId:session.weekend.raceId,
    vehicleId:'vehicle-45',
    optionId:'minor:minimum',
  } as never);
  assert.equal(session.game.recruiting.spendableRp, afterRecruiting.spendableRp);
  assert.equal(session.game.recruiting.campaigns[masonId].scoutingConfidence, afterRecruiting.campaigns[masonId].scoutingConfidence);
});

test('Market routes remain while full-field race and repair routes are present', () => {
  const cwd = process.cwd();
  assert.match(readFileSync(`${cwd}/src/screens/market-screen.tsx`, 'utf8'), /Driver Market/);
  assert.match(readFileSync(`${cwd}/src/app/recruiting\/[id].tsx`, 'utf8'), /ProspectProfileScreen/);
  assert.match(readFileSync(`${cwd}/src/app/recruiting/compare.tsx`, 'utf8'), /ProspectComparisonScreen/);
  assert.match(readFileSync(`${cwd}/src/app/recruiting/offer\/[id].tsx`, 'utf8'), /RecruitingOfferScreen/);
  const layout = readFileSync(`${cwd}/src/app/_layout.tsx`, 'utf8');
  assert.match(layout, /race-preview/);
  assert.match(layout, /full-grid/);
  assert.match(layout, /full-results/);
  assert.match(layout, /vehicles\/\[number\]/);
  assert.match(layout, /recruiting\/offer\/\[id\]/);
  assert.match(
    readFileSync(`${cwd}/src/screens/league-screen.tsx`, 'utf8'),
    /Driver Standings/,
  );
});
