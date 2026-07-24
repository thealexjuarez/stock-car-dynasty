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
  getRecruitingActionUsageTags,
  getRecruitingAction,
  recruitingActions,
  scoutingBands,
} from '@/data/recruiting-config';
import { recruitingActionCopy } from '@/data/recruiting-copy';
import { starterGameState } from '@/data/starter-game-state';
import {
  DEFAULT_COMPACT_ACTION_COUNT,
  getOrderedRecruitingActions,
  getRecruitingActionRowState,
  MINIMUM_VISIBLE_ACTION_ROWS,
  RECRUITING_ACTION_ROW_HEIGHT,
  toggleExpandedRecruitingAction,
} from '@/presentation/recruiting-actions';
import {
  applyRecruitingAction,
  applyRecruitingOffer,
  applyRecruitingWeekendSettlement,
  calculateRecruitingEffects,
  evaluateContractOffer,
  getActionAvailability,
  getFilmReviewScoutingGain,
  getImmediateRecruitingRiskWarnings,
  getInterestLabel,
  getOfferAvailability,
  getRecommendedRecruitingAction,
  getRecruitingRiskWarning,
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
      scoutingKnowledge: 76,
      interest: 100,
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

test('all 26 canonical actions remain centralized beside the Film Review fallback', () => {
  const canonicalActions = recruitingActions.filter((action) => action.id !== 'film-review');
  assert.equal(canonicalActions.length, 26);
  assert.equal(recruitingActions.length, 27);
  assert.deepEqual(
    canonicalActions.map((item) => item.rpCost),
    [10,20,25,35,50,60,60,65,75,75,75,80,90,90,100,100,110,125,125,140,150,175,175,200,250,300],
  );
  assert.deepEqual(
    {
      cost: getRecruitingAction('film-review').rpCost,
      lifetime: getRecruitingAction('film-review').maximumLifetimeUses,
      oncePerWeekend: getRecruitingAction('film-review').oncePerWeekend,
      repeatable: getRecruitingAction('film-review').repeatable,
    },
    { cost: 25, lifetime: null, oncePerWeekend: true, repeatable: true },
  );
  assert.equal(getRecruitingAction('private-test-day').cashCost, 20_000);
  assert.equal(getRecruitingAction('contract-offer').rpCost, 300);
  assert.equal(Object.keys(recruitingActionCopy).length, 27);
  assert.equal(
    recruitingActions.every((action) => recruitingActionCopy[action.id].purpose.length > 20),
    true,
  );
  assert.equal(
    recruitingActions.every((action) => getRecruitingActionUsageTags(action).length > 0),
    true,
  );
});

test('interest labels use the approved plain-language bands', () => {
  assert.deepEqual(
    [0, 19, 20, 39, 40, 59, 60, 74, 75, 89, 90, 100].map(getInterestLabel),
    [
      'Not Interested',
      'Not Interested',
      'Listening',
      'Listening',
      'Interested',
      'Interested',
      'Seriously Considering',
      'Seriously Considering',
      'Ready to Negotiate',
      'Ready to Negotiate',
      'Wants to Sign',
      'Wants to Sign',
    ],
  );
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

test('rival recruiting advances only once at authoritative weekend settlement', () => {
  const state = freshGame();
  const before = state.recruiting.campaigns[masonId];
  const revealBefore = selectProspectReveal(state, masonId);
  assert.deepEqual(
    selectProspectReveal(state, masonId).recruitingBattle,
    revealBefore.recruitingBattle,
  );

  const settled = applyRecruitingWeekendSettlement(state, emptyResult('rival-week'));
  const after = settled.recruiting.campaigns[masonId];
  assert.equal(
    after.rivals.every((rival) => rival.interest >= rival.previousInterest),
    true,
  );
  assert.equal(after.battleHistory.length, 1);
  assert.strictEqual(
    applyRecruitingWeekendSettlement(settled, emptyResult('rival-week')),
    settled,
  );
  assert.deepEqual(before.rivals, state.recruiting.campaigns[masonId].rivals);
});

test('competition count is prospect-specific and scouting controls rival detail', () => {
  const state = freshGame();
  const lowPressure = state.recruiting.campaigns['prospect-elias-crowe'];
  const highPressure = state.recruiting.campaigns['prospect-owen-lark'];
  assert.equal(lowPressure.rivals.length <= 1, true);
  assert.equal(highPressure.rivals.length >= 3 && highPressure.rivals.length <= 4, true);

  const basic = selectProspectReveal(state, 'prospect-owen-lark');
  assert.equal(
    basic.recruitingBattle.teams
      .filter((team) => !team.isApex)
      .every((team) => team.teamName === 'Unknown team' && team.interest === null),
    true,
  );
  const profile = selectProspectReveal(
    withProgress(state, 'prospect-owen-lark', { scoutingKnowledge: 26 }),
    'prospect-owen-lark',
  );
  assert.equal(
    profile.recruitingBattle.teams
      .filter((team) => !team.isApex)
      .every((team) => team.teamName !== 'Unknown team' && team.interestRange !== null),
    true,
  );
});

test('a rival reaching the persistent signing line makes the prospect unavailable', () => {
  const state = freshGame();
  const progress = state.recruiting.campaigns[masonId];
  const rival = progress.rivals[0];
  assert.ok(rival);
  const nearSigning = withProgress(state, masonId, {
    rivals: [
      {
        ...rival,
        interest: progress.signingThreshold - 1,
        previousInterest: progress.signingThreshold - 1,
      },
    ],
  });
  const settled = applyRecruitingWeekendSettlement(
    nearSigning,
    emptyResult('rival-signing'),
  );
  assert.equal(settled.recruiting.campaigns[masonId].signedByTeamId, rival.teamId);
  assert.equal(selectProspectReveal(settled, masonId).availability, 'Unavailable');
});

test('ten-week rival campaigns stay deterministic, bounded, and prospect-specific', () => {
  const run = () => {
    let state = freshGame();
    for (let week = 1; week <= 10; week += 1) {
      state = applyRecruitingWeekendSettlement(
        state,
        emptyResult(`ten-week-rival-${week}`),
      );
    }
    return state.recruiting;
  };
  const first = run();
  const second = run();
  assert.deepEqual(first, second);
  Object.values(first.campaigns).forEach((campaign) => {
    assert.equal(campaign.rivals.length <= 4, true);
    assert.equal(
      campaign.rivals.every(
        (rival) => rival.weeklyChange >= 0 && rival.weeklyChange <= 8,
      ),
      true,
    );
    assert.equal(campaign.battleHistory.length <= 10, true);
  });
});

test('race settlement integrates the RP award without changing settlement replay protection', () => {
  const start = withProgress(freshGame(), masonId, {
    scoutingKnowledge: 31,
    interest: 62,
    weeklyActionCount: 2,
  });
  const result = emptyResult('integrated-settlement');
  const settled = applyRaceSettlement(start, result);
  assert.equal(settled.recruiting.spendableRp, 200);
  assert.equal(settled.recruiting.campaigns[masonId].scoutingKnowledge, 31);
  assert.equal(settled.recruiting.campaigns[masonId].interest, 62);
  assert.equal(settled.recruiting.campaigns[masonId].weeklyActionCount, 0);
  assert.equal(settled.recruiting.campaigns[masonId].battleHistory[0].season, 1);
  assert.equal(settled.recruiting.campaigns[masonId].battleHistory[0].week, 1);
  assert.strictEqual(applyRaceSettlement(settled, result), settled);
});

test('successful action spends RP once and replay returns the same state', () => {
  const start = withResources(freshGame(), 100);
  const next = applyRecruitingAction(start, command('scout-report'));
  assert.equal(next.recruiting.spendableRp, 75);
  assert.equal(next.recruiting.campaigns[masonId].scoutingKnowledge > 0, true);
  assert.strictEqual(applyRecruitingAction(next, command('scout-report')), next);
});

test('every unsigned prospect retains a legal Film Review path in every scouting band', () => {
  const base = withResources(freshGame());
  for (const prospect of base.recruiting.prospects) {
    for (const scoutingKnowledge of [0, 26, 51, 76, 99]) {
      const state = withProgress(base, prospect.id, {
        scoutingKnowledge,
        weeklyActionCount: 0,
        actionsUsedThisWeekend: [],
      });
      assert.equal(
        getActionAvailability(state, prospect.id, 'film-review').available,
        true,
        `${prospect.id} should retain Film Review at ${scoutingKnowledge}`,
      );
    }
  }
});

test('Film Review uses exact 12, 10, 8, then 6-point gains with no interest gain', () => {
  let state = withResources(freshGame());
  const expectedGains = [12, 10, 8, 6, 6];
  expectedGains.forEach((expectedGain, index) => {
    const before = state.recruiting.campaigns[masonId];
    const action = command('film-review', masonId, `${index + 1}`);
    const next = applyRecruitingAction(state, action);
    const after = next.recruiting.campaigns[masonId];
    assert.equal(after.scoutingKnowledge - before.scoutingKnowledge, expectedGain);
    assert.equal(after.interest, before.interest);
    assert.equal(next.recruiting.spendableRp, state.recruiting.spendableRp - 25);
    assert.strictEqual(applyRecruitingAction(next, action), next);
    state = withProgress(next, masonId, {
      weeklyActionCount: 0,
      actionsUsedThisWeekend: [],
    });
  });
  assert.deepEqual([0, 1, 2, 3, 20].map(getFilmReviewScoutingGain), [12, 10, 8, 6, 6]);
});

test('Film Review is weekly-limited, lifetime-unlimited, and reaches exactly 100', () => {
  let state = withResources(freshGame(), 2_000);
  let uses = 0;
  while (state.recruiting.campaigns[masonId].scoutingKnowledge < 100) {
    const availability = getActionAvailability(state, masonId, 'film-review');
    assert.equal(availability.available, true);
    const next = applyRecruitingAction(
      state,
      command('film-review', masonId, `reach-100-${uses}`),
    );
    uses += 1;
    assert.equal(
      getActionAvailability(next, masonId, 'film-review').reasons[0],
      'Weekly use already spent',
    );
    state = withProgress(next, masonId, {
      weeklyActionCount: 0,
      actionsUsedThisWeekend: [],
    });
    assert.equal(uses < 25, true);
  }
  assert.equal(state.recruiting.campaigns[masonId].scoutingKnowledge, 100);
  const complete = getActionAvailability(state, masonId, 'film-review');
  assert.equal(complete.available, false);
  assert.equal(complete.completed, true);
  assert.equal(complete.reasons[0], 'Scouting report is complete');

  const deepHistory = withProgress(
    withResources(freshGame()),
    masonId,
    {
      scoutingKnowledge: 90,
      completedActionUses: { 'film-review': 50 },
      weeklyActionCount: 0,
      actionsUsedThisWeekend: [],
    },
  );
  assert.equal(getActionAvailability(deepHistory, masonId, 'film-review').available, true);
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
    scoutingKnowledge: 99,
    completedActionUses: { 'watch-race-tape': 1 },
  });
  state = applyRecruitingAction(state, command('watch-race-tape', masonId, 'clamp'));
  assert.equal(state.recruiting.campaigns[masonId].scoutingKnowledge, 100);

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

test('reveal selector keeps Apex Interest visible while gating scouting discoveries', () => {
  const state = freshGame();
  const basic = selectProspectReveal(state, masonId);
  assert.equal(basic.archetypes, null);
  assert.deepEqual(basic.stats, {});
  assert.equal(basic.interest, state.recruiting.campaigns[masonId].interest);
  assert.equal(basic.signingThreshold, null);
  assert.equal(basic.sponsorInformation, null);
  assert.equal(basic.dealbreakers, null);

  const profile = selectProspectReveal(withProgress(state, masonId, { scoutingKnowledge: 26 }), masonId);
  assert.notEqual(profile.archetypes, null);
  assert.notEqual(profile.salaryRange, null);
  assert.equal(profile.interest, state.recruiting.campaigns[masonId].interest);

  const evaluation = selectProspectReveal(withProgress(state, masonId, { scoutingKnowledge: 51 }), masonId);
  assert.equal(Object.keys(evaluation.statRanges).length, 10);
  assert.equal(evaluation.interest, state.recruiting.campaigns[masonId].interest);
  assert.equal(evaluation.dealbreakers, null);

  const exact = selectProspectReveal(withProgress(state, masonId, { scoutingKnowledge: 76 }), masonId);
  assert.equal(exact.overall, prototypeProspects[0].overall);
  assert.equal(Object.keys(exact.stats).length, 10);
  assert.notEqual(exact.dealbreakers, null);
  assert.equal(exact.signingThreshold, state.recruiting.campaigns[masonId].signingThreshold);
});

test('Development Prospect narrows ranges without revealing information early', () => {
  const state = freshGame();
  const primaryDevelopmentId = 'prospect-owen-lark';
  const ordinaryId = 'prospect-nico-salas';
  const dev = selectProspectReveal(state, primaryDevelopmentId);
  const ordinary = selectProspectReveal(state, ordinaryId);
  assert.equal(dev.archetypes, null);
  assert.equal(dev.interest, state.recruiting.campaigns[primaryDevelopmentId].interest);
  assert.equal((dev.overallRange![1] - dev.overallRange![0]) < (ordinary.overallRange![1] - ordinary.overallRange![0]), true);
});

test('social recruiting changes E and V, reveals no scouting data, and creates no cash', () => {
  const start = withResources(freshGame());
  const beforeCash = start.team.cash;
  const next = applyRecruitingAction(start, command('social-follow'));
  const progress = next.recruiting.campaigns[masonId];
  assert.equal(progress.engagement, 9);
  assert.equal(next.recruiting.visibility, 46);
  assert.equal(progress.scoutingKnowledge, 0);
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

test('signing thresholds are persistent, tier-bounded, and revealed only at Full Evaluation', () => {
  const first = freshGame();
  const second = freshGame();
  for (const prospect of first.recruiting.prospects) {
    const left = first.recruiting.campaigns[prospect.id];
    const right = second.recruiting.campaigns[prospect.id];
    const bounds = {
      Hidden: [55, 70],
      Ordinary: [65, 78],
      Strong: [75, 88],
      Elite: [85, 96],
    }[left.prospectTier];
    assert.equal(left.signingThreshold >= bounds[0] && left.signingThreshold <= bounds[1], true);
    assert.equal(left.signingThreshold, right.signingThreshold);
    assert.equal(selectProspectReveal(first, prospect.id).signingThreshold, null);
    assert.equal(
      selectProspectReveal(
        withProgress(first, prospect.id, { scoutingKnowledge: 76 }),
        prospect.id,
      ).signingThreshold,
      left.signingThreshold,
    );
  }
});

test('disabled recruiting reasons follow the approved player-facing priority', () => {
  const blocked = withProgress(
    withResources(freshGame(), 0),
    masonId,
    {
      weeklyActionCount: 3,
      completedActionUses: { 'watch-race-tape': 2 },
      actionsUsedThisWeekend: ['watch-race-tape'],
    },
  );
  const availability = getActionAvailability(blocked, masonId, 'watch-race-tape');
  assert.deepEqual(
    availability.reasons.slice(0, 4),
    [
      'Weekly action limit reached',
      'Weekly use already spent',
      'Lifetime uses exhausted',
      'Need 50 more RP',
    ],
  );
  assert.equal(
    availability.blockers.some(
      (blocker) => blocker.detail === 'Requires 50 RP; Apex has 0.',
    ),
    true,
  );
});

test('locked actions show exact requirements and deterministic collapsed-row states', () => {
  const state = withProgress(withResources(freshGame(), 30), masonId, {
    interest: 0,
  });
  const action = getActionAvailability(state, masonId, 'shop-tour');
  assert.equal(action.primaryReason, 'Need 60 more RP');
  assert.equal(getRecruitingActionRowState(action), 'Insufficient RP');
  assert.equal(
    action.reasons.includes('Requires Pitch Seat Opportunity'),
    true,
  );
  assert.equal(action.reasons.includes('Requires 35 Apex Interest'), true);

  const weekly = getActionAvailability(
    withProgress(withResources(freshGame()), masonId, {
      actionsUsedThisWeekend: ['film-review'],
    }),
    masonId,
    'film-review',
  );
  assert.equal(getRecruitingActionRowState(weekly), 'Used This Week');
  assert.equal(
    getRecruitingActionRowState(
      getActionAvailability(
        withProgress(withResources(freshGame()), masonId, {
          scoutingKnowledge: 100,
        }),
        masonId,
        'film-review',
      ),
    ),
    'Completed',
  );
});

test('compact action ordering is stable and one action expands at a time', () => {
  const state = withResources(freshGame());
  const first = getOrderedRecruitingActions(
    state,
    masonId,
    'All',
    'film-review',
  ).map((action) => action.id);
  const second = getOrderedRecruitingActions(
    state,
    masonId,
    'All',
    'film-review',
  ).map((action) => action.id);
  assert.deepEqual(first, second);
  assert.equal(first[0], 'film-review');
  assert.equal(toggleExpandedRecruitingAction(null, 'film-review'), 'film-review');
  assert.equal(
    toggleExpandedRecruitingAction('film-review', 'scout-report'),
    'scout-report',
  );
  assert.equal(
    toggleExpandedRecruitingAction('film-review', 'film-review'),
    null,
  );
  assert.equal(DEFAULT_COMPACT_ACTION_COUNT >= MINIMUM_VISIBLE_ACTION_ROWS, true);
  assert.equal(RECRUITING_ACTION_ROW_HEIGHT >= 48, true);
  assert.equal(RECRUITING_ACTION_ROW_HEIGHT <= 64, true);
});

test('recommended move follows scouting, relationship, and signing readiness', () => {
  assert.equal(getRecommendedRecruitingAction(freshGame(), masonId)?.id, 'scout-report');
  assert.equal(
    getRecommendedRecruitingAction(
      withProgress(withResources(freshGame()), masonId, {
        scoutingKnowledge: 51,
        interest: 55,
      }),
      masonId,
    )?.id,
    'pitch-development',
  );
  assert.equal(getRecommendedRecruitingAction(offerReady(freshGame()), tobinId)?.id, 'contract-offer');
});

test('contract evaluation is a visible pass-fail checklist with no hidden acceptance roll', () => {
  const state = offerReady(freshGame());
  const prospect = state.recruiting.prospects.find((item) => item.id === tobinId)!;
  const ready = evaluateContractOffer(state, tobinId, prospect.salaryDemand, 1);
  assert.equal(ready.status, 'Will Sign');
  assert.equal(ready.willSign, true);
  assert.equal(ready.threshold, state.recruiting.campaigns[tobinId].signingThreshold);
  assert.equal(ready.requirements.every((requirement) => requirement.met), true);
  assert.deepEqual(ready, evaluateContractOffer(state, tobinId, prospect.salaryDemand, 1));

  const salaryLow = evaluateContractOffer(state, tobinId, prospect.salaryDemand - 1, 1);
  assert.equal(salaryLow.status, 'Salary Too Low');
  assert.equal(salaryLow.willSign, false);
  const interestLow = evaluateContractOffer(
    withProgress(state, tobinId, { interest: 74 }),
    tobinId,
    prospect.salaryDemand,
    1,
  );
  assert.equal(interestLow.status, 'Needs More Interest');
});

test('contract checklist does not leak salary, term, role, or dealbreakers before Full Evaluation', () => {
  const state = withResources(freshGame());
  const prospect = state.recruiting.prospects.find((item) => item.id === masonId)!;
  const breakdown = evaluateContractOffer(
    state,
    masonId,
    prospect.salaryDemand,
    prospect.preferredTerm,
  );
  const protectedItems = breakdown.requirements.filter((requirement) =>
    ['interest', 'role', 'salary', 'term', 'dealbreakers'].includes(requirement.id),
  );
  assert.equal(protectedItems.every((requirement) => !requirement.met), true);
  const details = protectedItems.map((requirement) => requirement.detail).join(' ');
  assert.doesNotMatch(details, new RegExp(prospect.salaryDemand.toLocaleString()));
  assert.doesNotMatch(details, new RegExp(`${prospect.preferredTerm}-year preference`));
  assert.doesNotMatch(details, new RegExp(prospect.dealbreakers[0]));
});

test('term, role, dealbreaker, and roster checks block signing without staff score bonuses', () => {
  const jaceState = offerReady(freshGame(), 'prospect-jace-hollander');
  const jace = jaceState.recruiting.prospects.find((item) => item.id === 'prospect-jace-hollander')!;
  assert.equal(evaluateContractOffer(jaceState, jace.id, jace.salaryDemand, 1).termFit, -1);
  assert.equal(evaluateContractOffer(jaceState, jace.id, jace.salaryDemand, 3).termFit, 1);

  const theoState = offerReady(freshGame(), 'prospect-theo-barrett');
  const theo = theoState.recruiting.prospects.find((item) => item.id === 'prospect-theo-barrett')!;
  assert.equal(
    evaluateContractOffer(theoState, theo.id, theo.salaryDemand, 1).status,
    'Dealbreaker Not Met',
  );

  const staffless = {
    ...jaceState,
    staff: jaceState.staff.map((member) =>
      member.trait === 'Development-Minded' ? { ...member, active: false } : member,
    ),
  };
  assert.deepEqual(
    evaluateContractOffer(jaceState, jace.id, jace.salaryDemand, 3),
    evaluateContractOffer(staffless, jace.id, jace.salaryDemand, 3),
  );
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

test('blocked offer cannot be submitted and spends no RP, cash, or roster slot', () => {
  const start = offerReady(freshGame());
  const command = {
    transactionId:'offer:reject', prospectId:tobinId, annualSalary:1, termYears:1 as const,
    role:'Reserve / Development' as const, season:1, week:1, raceId:'race-1',
  };
  assert.throws(() => applyRecruitingOffer(start, command));
  assert.equal(start.recruiting.spendableRp, 2_000);
  assert.equal(start.team.cash, 1_000_000);
  assert.equal(start.recruiting.reserveDriver, undefined);
  assert.equal(start.recruiting.campaigns[tobinId].offerHistory.length, 0);
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
  assert.equal(normalized.stateVersion, 5);
  assert.equal(normalized.recruiting.spendableRp, 100);
  assert.equal(normalized.recruiting.processedTransactionIds.length, 0);
  assert.equal(normalized.team.cash, 123_456);
  assert.equal(normalized.drivers[0].exp, 77);
  assert.deepEqual(normalized.economy.processedTransactionIds, ['settlement:old']);
});

test('v4 recruiting migration preserves progress and initializes new competition once', () => {
  const legacy = structuredClone(starterGameState) as GameState & {
    stateVersion: number;
    recruiting: GameState['recruiting'] & {
      campaigns: Record<string, Record<string, unknown>>;
    };
  };
  legacy.stateVersion = 4;
  const campaign = legacy.recruiting.campaigns[masonId] as Record<string, unknown>;
  delete campaign.scoutingKnowledge;
  delete campaign.signingThreshold;
  delete campaign.prospectTier;
  delete campaign.rivals;
  delete campaign.battleHistory;
  campaign.scoutingConfidence = 42;
  campaign.interest = 67;
  legacy.recruiting.spendableRp = 345;
  legacy.team.cash = 456_789;

  const normalized = normalizeGameState(legacy);
  const progress = normalized.recruiting.campaigns[masonId];
  assert.equal(progress.scoutingKnowledge, 42);
  assert.equal(progress.interest, 67);
  assert.equal(progress.signingThreshold > 0, true);
  assert.equal(progress.rivals.length > 0, true);
  assert.equal(normalized.recruiting.spendableRp, 345);
  assert.equal(normalized.team.cash, 456_789);
  assert.deepEqual(normalizeGameState(normalized), normalized);
});

test('migration restores Film Review access without changing stuck prospect progress', () => {
  const legacy = structuredClone(starterGameState);
  const progress = legacy.recruiting.campaigns[masonId];
  progress.scoutingKnowledge = 82;
  progress.interest = 64;
  progress.completedActionUses = Object.fromEntries(
    recruitingActions
      .filter(
        (action) =>
          action.id !== 'film-review' &&
          action.effects.scouting > 0 &&
          action.maximumLifetimeUses !== null,
      )
      .map((action) => [action.id, action.maximumLifetimeUses]),
  );
  legacy.recruiting.spendableRp = 250;
  const normalized = normalizeGameState(legacy);
  assert.equal(normalized.recruiting.campaigns[masonId].scoutingKnowledge, 82);
  assert.equal(normalized.recruiting.campaigns[masonId].interest, 64);
  assert.equal(normalized.recruiting.spendableRp, 250);
  assert.equal(getActionAvailability(normalized, masonId, 'film-review').available, true);
  assert.deepEqual(normalizeGameState(normalized), normalized);
});

test('targeted prospects warn before a rival can cross the signing line', () => {
  const start = withProgress(freshGame(), masonId, {
    actionHistory: [
      {
        id: 'risk-target',
        season: 1,
        week: 1,
        raceId: 'race-1',
        actionId: 'film-review',
        actionName: 'Film Review',
        useIndex: 1,
        rpCost: 25,
        cashCost: 0,
        scoutingGain: 12,
        interestGain: 0,
        engagementGain: 0,
        visibilityGain: 0,
        reasons: [],
      },
    ],
    rivals: [
      {
        ...freshGame().recruiting.campaigns[masonId].rivals[0],
        interest: freshGame().recruiting.campaigns[masonId].signingThreshold - 8,
      },
    ],
  });
  const warning = getRecruitingRiskWarning(start, masonId);
  assert.notEqual(warning, null);
  assert.match(warning!.message, /week advances|close to signing elsewhere/);
  assert.equal(
    getImmediateRecruitingRiskWarnings(start).some(
      (item) => item.prospectId === masonId,
    ),
    true,
  );
  assert.equal(getRecruitingRiskWarning(freshGame(), masonId), null);
});

test('staff canon uses Ray Hollis, Ava Larkin, and Marco DeSoto after migration', () => {
  const legacy = structuredClone(starterGameState);
  legacy.staff = legacy.staff
    .filter((member) => member.id !== 'staff-marco-desoto')
    .map((member) =>
      member.id === 'staff-ava-larkin'
        ? { ...member, id: 'staff-mia-torres', name: 'Mia Torres' }
        : member,
    );
  const normalized = normalizeGameState(legacy);
  assert.equal(normalized.staff.some((member) => member.name === 'Ray Hollis'), true);
  assert.equal(normalized.staff.some((member) => member.name === 'Ava Larkin'), true);
  assert.equal(normalized.staff.some((member) => member.name === 'Marco DeSoto'), true);
  assert.equal(normalized.staff.some((member) => member.name === 'Mia Torres'), false);
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
  assert.equal(session.game.recruiting.campaigns[masonId].scoutingKnowledge, afterRecruiting.campaigns[masonId].scoutingKnowledge);
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

test('recruiting screens use plain-language meters, battle copy, and guaranteed signing copy', () => {
  const cwd = process.cwd();
  const market = readFileSync(`${cwd}/src/screens/market-screen.tsx`, 'utf8');
  const profile = readFileSync(`${cwd}/src/screens/prospect-profile-screen.tsx`, 'utf8');
  const offer = readFileSync(`${cwd}/src/screens/recruiting-offer-screen.tsx`, 'utf8');
  assert.match(market, /Scouting Knowledge/);
  assert.match(market, /Apex Interest/);
  assert.match(profile, /Recruiting Battle/);
  assert.match(profile, /Signing line/);
  assert.match(profile, /Best Next Move/);
  assert.match(profile, /Show All Recruiting Actions/);
  assert.match(profile, /accessibilityState=\{\{ expanded/);
  assert.match(
    readFileSync(`${cwd}/src/simulation/recruiting.ts`, 'utf8'),
    /Weekly use already spent/,
  );
  assert.match(
    readFileSync(`${cwd}/src/data/recruiting-config.ts`, 'utf8'),
    /Review more race footage to keep building the scouting report/,
  );
  assert.match(offer, /A valid offer signs the driver immediately/);
  assert.match(offer, /spends no Recruiting Points or cash/);
  assert.doesNotMatch(profile, />S \+/);
  assert.doesNotMatch(profile, />I \+/);
  assert.doesNotMatch(profile, />E \+/);
  assert.doesNotMatch(profile, />V \+/);
  assert.doesNotMatch(offer, /Acceptance Scorecard|Projected Score|Offer Declined/);
});

test('practice feedback uses the approved crew-chief voice without technical player copy', () => {
  const cwd = process.cwd();
  const practice = readFileSync(`${cwd}/src/simulation/practice.ts`, 'utf8');
  assert.match(practice, /Ray Hollis:/);
  assert.doesNotMatch(practice, /strongest .* signal/);
  assert.doesNotMatch(practice, /effective\) was/);
});
