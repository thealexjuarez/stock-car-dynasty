/// <reference types="node" />

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  archetypeDefinitions,
  archetypeTrackFit,
  getEffectiveDriverStats,
} from '@/data/archetype-config';
import {
  racePayoutTiers,
  resolveRacePayout,
  weekendEconomyConfig,
} from '@/data/economy-config';
import { manufacturerCatalog } from '@/data/manufacturer-data';
import {
  damageClassifications,
  getRepairQuote,
  getRepairQuotes,
} from '@/data/repair-config';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { postSettlementFlow } from '@/data/race-weekend-navigation';
import { starterGameState } from '@/data/starter-game-state';
import { tabs } from '@/data/app-shell';
import {
  applyWeekendEconomy,
  calculateWeekendSettlement,
  getSettlementTransactionId,
} from '@/simulation/economy';
import { applyRaceSettlement } from '@/simulation/race-weekend';
import { updateVehicleCondition } from '@/simulation/vehicle-repair';
import {
  normalizeGameSessionState,
  normalizeGameState,
} from '@/state/game-state-migration';
import {
  createInitialGameSessionState,
  gameSessionReducer,
} from '@/state/game-session-reducer';
import type {
  Driver,
  EconomyState,
  GameState,
  Vehicle,
} from '@/types/game';
import type {
  GameSessionAction,
  GameSessionState,
  RaceResult,
} from '@/types/race-weekend';

function runCompletedWeekend(gameState: GameState = starterGameState) {
  let state = createInitialGameSessionState(gameState);
  state = gameSessionReducer(state, {
    type: 'COMPLETE_PRACTICE',
    choiceId: 'long-run-balance',
  });
  state = gameSessionReducer(state, { type: 'BEGIN_QUALIFYING' });
  state = gameSessionReducer(state, { type: 'SHOW_GRID' });
  state = gameSessionReducer(state, { type: 'BEGIN_RACE' });
  state = gameSessionReducer(state, { type: 'SHOW_RESULTS' });
  return state;
}

function advanceAction(
  state: GameSessionState,
): Extract<GameSessionAction, { type: 'ADVANCE_EVENT' }> {
  return {
    type: 'ADVANCE_EVENT',
    actionId: getSettlementTransactionId(state.weekend.race!),
  };
}

function createSessionWithConditions(conditions: readonly [number, number]) {
  return createInitialGameSessionState({
    ...starterGameState,
    vehicles: starterGameState.vehicles.map((vehicle, index) =>
      updateVehicleCondition(
        vehicle,
        conditions[index],
        'Regression test fixture.',
      ),
    ),
  });
}

function withoutBudgetFixer(state: GameState = starterGameState): GameState {
  return {
    ...state,
    staff: state.staff.map((member) =>
      member.trait === 'Budget Fixer'
        ? { ...member, active: false }
        : { ...member },
    ),
  };
}

function emptyRaceResult(raceId = 'race-1'): RaceResult {
  return {
    raceId,
    seed: 'empty-result',
    entries: [],
    playerPayout: 0,
    playerExp: 0,
    playerConditionLoss: 0,
  };
}

test('canonical manufacturers contain only Fard, Chevrolat, and Toyoda', () => {
  assert.deepEqual(
    manufacturerCatalog.map((manufacturer) => manufacturer.displayName),
    ['Fard', 'Chevrolat', 'Toyoda'],
  );
  assert.equal(starterGameState.team.manufacturerId, 'chevrolat');
  assert.equal(
    JSON.stringify(manufacturerCatalog).includes('Ranger Performance'),
    false,
  );
});

test('Aiden Voss uses the approved overall, potential, and archetypes', () => {
  const aiden = starterGameState.drivers.find(
    (driver) => driver.id === 'driver-aiden-voss',
  )!;
  assert.equal(aiden.overall, 57);
  assert.equal(aiden.potential, 76);
  assert.deepEqual(aiden.archetypes, [
    'Development Prospect',
    'Aggressive Driver',
  ]);
  assert.deepEqual(aiden.stats, {
    Speed: 60,
    Cornering: 57,
    Braking: 54,
    'Throttle Control': 52,
    Racecraft: 55,
    Qualifying: 56,
    Restarts: 62,
    'Tire Management': 50,
    Consistency: 49,
    Awareness: 53,
  });
});

test('Aiden sponsor lead is dormant typed data and grants no automatic income', () => {
  const aiden = starterGameState.drivers.find(
    (driver) => driver.id === 'driver-aiden-voss',
  )!;
  assert.deepEqual(aiden.sponsorLeads, [
    {
      id: 'sponsor-lead-coastal-marine-supply',
      sponsorName: 'Coastal Marine Supply',
      projectedRaceBacking: { minimum: 3_000, maximum: 5_000 },
      activationCondition:
        'Aiden Voss must start seven races if the package is confirmed.',
      status: 'dormant',
    },
  ]);

  const stateWithoutActiveSponsors = {
    ...starterGameState,
    sponsors: starterGameState.sponsors.map((sponsor) => ({
      ...sponsor,
      active: false,
    })),
  };
  assert.equal(
    calculateWeekendSettlement(
      stateWithoutActiveSponsors,
      emptyRaceResult(),
    ).sponsorIncome,
    0,
  );
});

test('all eight archetypes and their locked stat boosts are represented', () => {
  assert.equal(archetypeDefinitions.length, 8);
  assert.deepEqual(
    archetypeDefinitions.map((definition) => definition.id),
    [
      'Complete Driver',
      'Road Course Specialist',
      'Short Track Specialist',
      'Superspeedway Specialist',
      'Long Run Driver',
      'Aggressive Driver',
      'Reliable Journeyman',
      'Development Prospect',
    ],
  );

  const expectedBoosts = {
    'Complete Driver': [
      { Speed: 5, Racecraft: 5, Consistency: 5, Awareness: 5, 'Tire Management': 5 },
      { Speed: 3, Racecraft: 3, Consistency: 3, Awareness: 3, 'Tire Management': 3 },
    ],
    'Road Course Specialist': [
      { Braking: 10, Cornering: 10, 'Throttle Control': 8, Racecraft: 5 },
      { Braking: 5, Cornering: 5, 'Throttle Control': 4, Racecraft: 3 },
    ],
    'Short Track Specialist': [
      { Cornering: 10, Restarts: 10, Racecraft: 8, Braking: 5 },
      { Cornering: 5, Restarts: 5, Racecraft: 4, Braking: 3 },
    ],
    'Superspeedway Specialist': [
      { Awareness: 10, Racecraft: 10, Restarts: 8, Speed: 5 },
      { Awareness: 5, Racecraft: 5, Restarts: 4, Speed: 3 },
    ],
    'Long Run Driver': [
      { 'Tire Management': 10, Consistency: 8, 'Throttle Control': 6, Racecraft: 5 },
      { 'Tire Management': 5, Consistency: 4, 'Throttle Control': 3, Racecraft: 3 },
    ],
    'Aggressive Driver': [
      { Restarts: 10, Racecraft: 8, Speed: 8, Cornering: 5 },
      { Restarts: 5, Racecraft: 4, Speed: 4, Cornering: 3 },
    ],
    'Reliable Journeyman': [
      { Consistency: 10, Awareness: 8, 'Tire Management': 6, Racecraft: 5 },
      { Consistency: 5, Awareness: 4, 'Tire Management': 3, Racecraft: 3 },
    ],
    'Development Prospect': [{}, {}],
  } as const;

  for (const definition of archetypeDefinitions) {
    assert.deepEqual(
      definition.primary.statBoosts,
      expectedBoosts[definition.id][0],
    );
    assert.deepEqual(
      definition.secondary.statBoosts,
      expectedBoosts[definition.id][1],
    );
  }

  const development = archetypeDefinitions.find(
    (definition) => definition.id === 'Development Prospect',
  )!;
  assert.equal(development.primary.developmentSpeedPercent, 15);
  assert.equal(development.secondary.developmentSpeedPercent, 8);
  assert.equal(development.primary.scoutingRevealAccuracyPercent, 10);
  assert.equal(development.secondary.scoutingRevealAccuracyPercent, 5);
});

test('archetype previews do not mutate permanent base stats', () => {
  const cole = starterGameState.drivers.find(
    (driver) => driver.id === 'driver-cole-mercer',
  )!;
  const baseBefore = { ...cole.stats };
  const effective = getEffectiveDriverStats(cole);

  assert.deepEqual(cole.stats, baseBefore);
  assert.equal(effective.Cornering, 76);
  assert.equal(effective.Restarts, 78);
  assert.equal(effective.Consistency, 74);
});

test('track fit records Aggressive Driver as a superspeedway risk', () => {
  assert.ok(
    archetypeTrackFit.Superspeedway.risks.includes('Aggressive Driver'),
  );
  assert.ok(
    archetypeTrackFit.Superspeedway.strengths.includes(
      'Superspeedway Specialist',
    ),
  );
});

test('the same event seed produces identical qualifying and race outcomes', () => {
  const first = runCompletedWeekend();
  const second = runCompletedWeekend();

  assert.deepEqual(first.weekend.qualifying, second.weekend.qualifying);
  assert.deepEqual(first.weekend.race, second.weekend.race);
  assert.equal(first.weekend.qualifying?.entries.length, 12);
  assert.equal(first.weekend.race?.entries.length, 12);
  assert.deepEqual(
    first.weekend.race?.entries
      .filter((entry) => entry.isPlayerTeam)
      .map((entry) => [entry.carNumber, entry.finishPosition]),
    [
      ['45', 2],
      ['46', 9],
    ],
  );
  assert.equal(first.weekend.race?.playerPayout, 46_000);
  assert.equal(first.weekend.race?.playerExp, 312);
  assert.equal(first.weekend.race?.playerConditionLoss, 5);
});

test('every finishing position through 36 uses the locked payout tier', () => {
  for (const tier of racePayoutTiers) {
    for (
      let position = tier.minimumPosition;
      position <= tier.maximumPosition;
      position += 1
    ) {
      assert.equal(resolveRacePayout(position), tier.amount);
    }
  }
  assert.throws(() => resolveRacePayout(0), /Invalid finishing position/);
  assert.throws(() => resolveRacePayout(37), /No ERCA payout/);
});

test('both Apex cars receive their correct payout tiers', () => {
  const completed = runCompletedWeekend();
  const settlement = calculateWeekendSettlement(
    completed.game,
    completed.weekend.race!,
  );
  assert.deepEqual(
    settlement.winningsByCar.map((line) => [
      line.carNumber,
      line.finishPosition,
      line.amount,
    ]),
    [
      ['45', 2, 28_000],
      ['46', 9, 18_000],
    ],
  );
  assert.equal(settlement.totalRaceWinnings, 46_000);
});

test('settlement posts sponsor income and operating cost exactly once', () => {
  const completed = runCompletedWeekend();
  const action = advanceAction(completed);
  const cashBefore = completed.game.team.cash;
  const advanced = gameSessionReducer(completed, action);
  const replayed = gameSessionReducer(advanced, action);
  const settlement = advanced.game.economy.settlementHistory.at(-1)!;

  assert.equal(settlement.sponsorIncome, 26_000);
  assert.equal(settlement.operatingCostBase, 18_000);
  assert.equal(settlement.budgetFixerDiscount, 1_800);
  assert.equal(settlement.operatingCostCharged, 16_200);
  assert.equal(settlement.settlementCashChange, 55_800);
  assert.equal(settlement.netWeekend, 55_800);
  assert.equal(advanced.game.team.cash, cashBefore + 55_800);
  assert.equal(
    advanced.game.economy.settlementHistory.filter(
      (record) => record.id === action.actionId,
    ).length,
    1,
  );
  assert.strictEqual(replayed, advanced);
});

test('reopening results and calculating its breakdown do not mutate settlement', () => {
  const completed = runCompletedWeekend();
  const before = structuredClone(completed.game);
  const first = calculateWeekendSettlement(
    completed.game,
    completed.weekend.race!,
  );
  const second = calculateWeekendSettlement(
    completed.game,
    completed.weekend.race!,
  );

  assert.deepEqual(first, second);
  assert.deepEqual(completed.game, before);
  assert.equal(completed.game.economy.settlementHistory.length, 0);
});

test('settlement preserves cash, EXP, damage, readiness, calendar, and navigation', () => {
  const completed = runCompletedWeekend();
  const race = completed.weekend.race!;
  const expBefore = new Map(
    completed.game.drivers.map((driver) => [driver.id, driver.exp]),
  );
  const conditionBefore = new Map(
    completed.game.vehicles.map((vehicle) => [
      vehicle.id,
      vehicle.condition,
    ]),
  );
  const advanced = gameSessionReducer(completed, advanceAction(completed));

  assert.equal(advanced.game.nextRaceId, 'race-2');
  assert.equal(advanced.game.week, 2);
  assert.equal(advanced.weekend.raceId, 'race-2');
  assert.equal(advanced.weekend.phase, 'preview');
  assert.equal(postSettlementFlow.route, '/home');
  assert.equal(postSettlementFlow.tab, 'home');
  assert.equal(postSettlementFlow.nextWeekendStartsAutomatically, false);
  assert.ok(tabs.some((tab) => tab.key === postSettlementFlow.tab));

  for (const entry of race.entries.filter((item) => item.isPlayerTeam)) {
    const expectedCondition =
      conditionBefore.get(entry.vehicleId!)! - entry.conditionLoss;
    const settledVehicle = advanced.game.vehicles.find(
      (vehicle) => vehicle.id === entry.vehicleId,
    );
    assert.equal(
      advanced.game.drivers.find(
        (driver) => driver.id === entry.driverId,
      )?.exp,
      expBefore.get(entry.driverId!)! + entry.exp,
    );
    assert.equal(settledVehicle?.condition, expectedCondition);
    assert.equal(settledVehicle?.damage, 100 - expectedCondition);
    assert.notEqual(settledVehicle?.readiness, undefined);
    assert.notEqual(settledVehicle?.damageClass, undefined);
  }
});

test('an unpaid operating cost records a shortfall without negative cash', () => {
  const state = {
    ...starterGameState,
    team: { ...starterGameState.team, cash: 1_000 },
    sponsors: starterGameState.sponsors.map((sponsor) => ({
      ...sponsor,
      active: false,
    })),
  };
  const result = emptyRaceResult();
  const settlement = calculateWeekendSettlement(state, result);
  const settled = applyWeekendEconomy(state, result);

  assert.equal(settlement.operatingCostCharged, 1_000);
  assert.equal(settlement.operatingCostShortfall, 15_200);
  assert.equal(settled.team.cash, 0);
  assert.equal(settled.economy.settlementHistory[0].operatingCostShortfall, 15_200);
});

test('Budget Fixer affects only eligible costs and cannot stack', () => {
  const completed = runCompletedWeekend();
  const result = completed.weekend.race!;
  const withFixer = calculateWeekendSettlement(completed.game, result);
  const withoutFixer = calculateWeekendSettlement(
    withoutBudgetFixer(completed.game),
    result,
  );
  const duplicateFixerState = {
    ...completed.game,
    staff: [
      ...completed.game.staff,
      {
        ...completed.game.staff.find(
          (member) => member.trait === 'Budget Fixer',
        )!,
        id: 'duplicate-budget-fixer',
      },
    ],
  };
  const duplicateFixer = calculateWeekendSettlement(
    duplicateFixerState,
    result,
  );

  assert.equal(withFixer.budgetFixerDiscount, 1_800);
  assert.equal(withoutFixer.budgetFixerDiscount, 0);
  assert.equal(duplicateFixer.budgetFixerDiscount, 1_800);
  assert.equal(withFixer.totalRaceWinnings, withoutFixer.totalRaceWinnings);
  assert.equal(withFixer.sponsorIncome, withoutFixer.sponsorIncome);
});

test('damage classes expose only matching repair options', () => {
  const fixtures: [number, string][] = [
    [97, 'clean-light'],
    [90, 'minor'],
    [80, 'moderate'],
    [60, 'heavy'],
    [40, 'major'],
    [10, 'near-total'],
  ];

  for (const [condition, expectedClass] of fixtures) {
    const vehicle = updateVehicleCondition(
      starterGameState.vehicles[0],
      condition,
      'Damage fixture.',
    );
    const quotes = getRepairQuotes(vehicle, starterGameState.staff);
    assert.ok(quotes.length >= 1);
    assert.ok(
      quotes.every(
        (quote) =>
          quote.damageClass === expectedClass &&
          quote.id.startsWith(`${expectedClass}:`),
      ),
    );
  }
});

test('every provisional repair price remains in its locked Bible band', () => {
  for (const classification of damageClassifications) {
    for (const cost of Object.values(classification.provisionalCosts)) {
      assert.ok(cost >= classification.lockedCostBand.minimum);
      assert.ok(cost <= classification.lockedCostBand.maximum);
    }
  }
  assert.equal(
    damageClassifications.find((item) => item.id === 'clean-light')
      ?.provisionalCosts.recommended,
    3_500,
  );
  assert.equal(
    damageClassifications.find((item) => item.id === 'near-total')
      ?.provisionalCosts.recommended,
    100_000,
  );
});

test('Budget Fixer repair discount is calculated once', () => {
  const vehicle = updateVehicleCondition(
    starterGameState.vehicles[0],
    80,
    'Moderate fixture.',
  );
  const withFixer = getRepairQuote(
    vehicle,
    'moderate:recommended',
    starterGameState.staff,
  );
  const withoutFixer = getRepairQuote(
    vehicle,
    'moderate:recommended',
    withoutBudgetFixer().staff,
  );
  const duplicatedStaff = [
    ...starterGameState.staff,
    {
      ...starterGameState.staff.find(
        (member) => member.trait === 'Budget Fixer',
      )!,
      id: 'second-budget-fixer',
    },
  ];
  const duplicateFixer = getRepairQuote(
    vehicle,
    'moderate:recommended',
    duplicatedStaff,
  );

  assert.equal(withFixer.baseCost, 19_000);
  assert.equal(withFixer.budgetFixerDiscount, 1_900);
  assert.equal(withFixer.cost, 17_100);
  assert.equal(withoutFixer.cost, 19_000);
  assert.equal(duplicateFixer.cost, 17_100);
});

test('repair cost and condition changes apply exactly once', () => {
  const initial = createInitialGameSessionState();
  const vehicle = initial.game.vehicles[0];
  const cashBefore = initial.game.team.cash;
  const action = {
    type: 'REPAIR_VEHICLE',
    actionId: 'repair-once',
    vehicleId: vehicle.id,
    optionId: 'minor:recommended',
  } as const;
  const quote = getRepairQuote(
    vehicle,
    action.optionId,
    initial.game.staff,
  );

  const repaired = gameSessionReducer(initial, action);
  const replayed = gameSessionReducer(repaired, action);

  assert.equal(repaired.game.team.cash, cashBefore - quote.cost);
  assert.equal(
    repaired.game.vehicles.find((item) => item.id === vehicle.id)?.condition,
    quote.projectedCondition,
  );
  assert.equal(
    repaired.game.economy.repairTransactions.filter(
      (transaction) => transaction.id === action.actionId,
    ).length,
    1,
  );
  assert.strictEqual(replayed, repaired);
});

test('repair restoration updates condition, damage, class, and readiness together', () => {
  const initial = createSessionWithConditions([72, 86]);
  const repaired = gameSessionReducer(initial, {
    type: 'REPAIR_VEHICLE',
    actionId: 'minimum-repair-72',
    vehicleId: 'vehicle-45',
    optionId: 'moderate:minimum',
  });
  const vehicle = repaired.game.vehicles.find(
    (item) => item.id === 'vehicle-45',
  );

  assert.equal(vehicle?.condition, 77);
  assert.equal(vehicle?.damage, 23);
  assert.equal(vehicle?.damageClass, 'moderate');
  assert.equal(vehicle?.readiness, 'At Risk');
});

test('repairs cap condition at 100 and never downgrade it', () => {
  const initial = createInitialGameSessionState();
  const repaired = gameSessionReducer(initial, {
    type: 'REPAIR_VEHICLE',
    actionId: 'cap-at-100',
    vehicleId: 'vehicle-45',
    optionId: 'minor:recommended',
  });
  assert.equal(
    repaired.game.vehicles.find((vehicle) => vehicle.id === 'vehicle-45')
      ?.condition,
    100,
  );

  const fullVehicle = updateVehicleCondition(
    starterGameState.vehicles[0],
    100,
    'Full condition.',
  );
  assert.deepEqual(
    getRepairQuotes(fullVehicle, starterGameState.staff),
    [],
  );
});

test('insufficient cash blocks repair and cash never drops below zero', () => {
  const base = createSessionWithConditions([80, 86]);
  const quote = getRepairQuote(
    base.game.vehicles[0],
    'moderate:minimum',
    base.game.staff,
  );
  const initial = {
    ...base,
    game: {
      ...base.game,
      team: { ...base.game.team, cash: quote.cost - 1 },
    },
  };

  assert.throws(
    () =>
      gameSessionReducer(initial, {
        type: 'REPAIR_VEHICLE',
        actionId: 'unaffordable-repair',
        vehicleId: 'vehicle-45',
        optionId: 'moderate:minimum',
      }),
    /Insufficient cash/,
  );
  assert.equal(initial.game.team.cash, quote.cost - 1);
  assert.equal(initial.game.economy.repairTransactions.length, 0);
});

test('cheap light service cannot repair severe damage', () => {
  const nearTotal = updateVehicleCondition(
    starterGameState.vehicles[0],
    10,
    'Near-total fixture.',
  );
  assert.throws(
    () =>
      getRepairQuote(
        nearTotal,
        'clean-light:recommended',
        starterGameState.staff,
      ),
    /not valid for the current damage report/,
  );
});

test('a car below the locked 75% line remains blocked until repaired', () => {
  const initial = createSessionWithConditions([74, 75]);

  assert.throws(
    () =>
      gameSessionReducer(initial, {
        type: 'COMPLETE_PRACTICE',
        choiceId: 'long-run-balance',
      }),
    /Car #45.*75% condition/,
  );
  assert.equal(initial.weekend.phase, 'preview');
});

test('both race entries at or above 75% allow normal progression', () => {
  const initial = createSessionWithConditions([75, 75]);
  const progressed = gameSessionReducer(initial, {
    type: 'COMPLETE_PRACTICE',
    choiceId: 'long-run-balance',
  });

  assert.equal(progressed.weekend.phase, 'practice-result');
  assert.equal(progressed.weekend.raceId, initial.weekend.raceId);
  assert.ok(progressed.weekend.practice);
});

test('repairs preserve race-weekend and post-settlement navigation state', () => {
  const initial = createSessionWithConditions([70, 86]);
  const weekendBefore = initial.weekend;
  const repaired = gameSessionReducer(initial, {
    type: 'REPAIR_VEHICLE',
    actionId: 'preserve-weekend',
    vehicleId: 'vehicle-45',
    optionId: 'moderate:minimum',
  });

  assert.strictEqual(repaired.weekend, weekendBefore);
  assert.equal(repaired.game.nextRaceId, initial.game.nextRaceId);
  assert.equal(postSettlementFlow.route, '/home');
  assert.equal(postSettlementFlow.nextWeekendStartsAutomatically, false);
});

test('repair spending is reported separately in the next settlement', () => {
  const initial = createSessionWithConditions([70, 86]);
  const repaired = gameSessionReducer(initial, {
    type: 'REPAIR_VEHICLE',
    actionId: 'weekend-repair',
    vehicleId: 'vehicle-45',
    optionId: 'moderate:minimum',
  });
  let completed = repaired;
  completed = gameSessionReducer(completed, {
    type: 'COMPLETE_PRACTICE',
    choiceId: 'long-run-balance',
  });
  completed = gameSessionReducer(completed, { type: 'BEGIN_QUALIFYING' });
  completed = gameSessionReducer(completed, { type: 'SHOW_GRID' });
  completed = gameSessionReducer(completed, { type: 'BEGIN_RACE' });
  completed = gameSessionReducer(completed, { type: 'SHOW_RESULTS' });
  const settlement = calculateWeekendSettlement(
    completed.game,
    completed.weekend.race!,
  );

  assert.equal(
    settlement.repairSpending,
    repaired.game.economy.repairTransactions[0].chargedCost,
  );
  assert.equal(
    settlement.netWeekend,
    settlement.settlementCashChange - settlement.repairSpending,
  );
});

test('older state normalizes canon and new fields without resetting progress', () => {
  const legacy = structuredClone(starterGameState);
  const legacyShape = legacy as unknown as {
    stateVersion?: number;
    economy?: EconomyState;
    team: Omit<GameState['team'], 'manufacturerId'> & {
      manufacturerId: string;
    };
    drivers: (Omit<Driver, 'sponsorLeads'> & {
      sponsorLeads?: Driver['sponsorLeads'];
    })[];
    vehicles: (Omit<Vehicle, 'damageClass'> & {
      damageClass?: Vehicle['damageClass'];
    })[];
  };
  delete legacyShape.stateVersion;
  delete legacyShape.economy;
  legacyShape.team.manufacturerId = 'ranger-performance';
  legacyShape.team.cash = 412_345;
  legacy.week = 3;
  legacy.nextRaceId = 'race-3';
  const aiden = legacyShape.drivers.find(
    (driver) => driver.id === 'driver-aiden-voss',
  )!;
  aiden.overall = 58;
  aiden.archetypes = [
    'Development Prospect',
    'Road Course Specialist',
  ];
  delete aiden.sponsorLeads;
  delete legacyShape.vehicles[0].damageClass;

  const normalized = normalizeGameState(legacy as GameState);
  const normalizedAiden = normalized.drivers.find(
    (driver) => driver.id === 'driver-aiden-voss',
  )!;

  assert.equal(normalized.stateVersion, 3);
  assert.equal(normalized.team.manufacturerId, 'chevrolat');
  assert.equal(normalized.team.cash, 412_345);
  assert.equal(normalized.week, 3);
  assert.equal(normalized.nextRaceId, 'race-3');
  assert.equal(normalizedAiden.overall, 57);
  assert.deepEqual(normalizedAiden.archetypes, [
    'Development Prospect',
    'Aggressive Driver',
  ]);
  assert.equal(normalizedAiden.sponsorLeads.length, 1);
  assert.equal(normalized.vehicles[0].damageClass, 'minor');
  assert.deepEqual(normalized.economy.processedTransactionIds, []);
});

test('migration preserves processed actions and does not replay them', () => {
  const game = {
    ...starterGameState,
    economy: {
      ...starterGameState.economy,
      processedTransactionIds: ['legacy-repair', 'legacy-repair'],
    },
  };
  const legacySession = {
    game,
    weekend: {
      raceId: 'race-1',
      seed: 'legacy',
      phase: 'preview',
    },
    processedRepairActionIds: ['older-session-repair'],
  } as GameSessionState & { processedRepairActionIds?: string[] };
  const normalized = normalizeGameSessionState(legacySession);
  const replayed = gameSessionReducer(normalized, {
    type: 'REPAIR_VEHICLE',
    actionId: 'legacy-repair',
    vehicleId: 'vehicle-45',
    optionId: 'minor:minimum',
  });

  assert.deepEqual(normalized.game.economy.processedTransactionIds, [
    'legacy-repair',
    'older-session-repair',
  ]);
  assert.strictEqual(replayed, normalized);
});

test('direct settlement replay is idempotent after state restoration', () => {
  const completed = runCompletedWeekend();
  const settled = applyRaceSettlement(
    completed.game,
    completed.weekend.race!,
  );
  const replayed = applyRaceSettlement(
    settled,
    completed.weekend.race!,
  );
  assert.strictEqual(replayed, settled);
});

test('final-race settlement remains idempotent after the season counter advances', () => {
  const completed = runCompletedWeekend({
    ...starterGameState,
    week: 10,
    nextRaceId: 'race-10',
  });
  const settled = applyRaceSettlement(
    completed.game,
    completed.weekend.race!,
  );
  const replayed = applyRaceSettlement(
    settled,
    completed.weekend.race!,
  );

  assert.equal(settled.season, 2);
  assert.strictEqual(replayed, settled);
});

test('the reducer enforces the complete weekend phase order', () => {
  const initial = createInitialGameSessionState();
  assert.throws(
    () => gameSessionReducer(initial, { type: 'BEGIN_QUALIFYING' }),
    /Practice must be completed/,
  );

  const completed = runCompletedWeekend();
  assert.equal(completed.weekend.phase, 'results');
  assert.equal(completed.weekend.raceId, 'race-1');
});

test('the app is locked to portrait and keeps racing-language actions', () => {
  const appConfig = JSON.parse(readFileSync('app.json', 'utf8')) as {
    expo: { orientation?: string };
  };
  assert.equal(appConfig.expo.orientation, 'portrait');
  assert.equal(raceWeekendCopy.practice.runAction, 'Run Practice');
  assert.equal(raceWeekendCopy.results.primaryAction, 'Return to the Shop');

  const vehicleScreen = readFileSync(
    'src/screens/vehicle-detail-screen.tsx',
    'utf8',
  );
  const resultsScreen = readFileSync(
    'src/screens/race-results-screen.tsx',
    'utf8',
  );
  const repairConfig = readFileSync('src/data/repair-config.ts', 'utf8');
  for (const requiredLabel of [
    'Damage Report',
    'Minimum Repair',
    'Recommended Repair',
    'Full Repair',
    'Ready to Race',
    'Still Below Entry Standard',
  ]) {
    const combined = `${vehicleScreen}\n${resultsScreen}\n${repairConfig}`;
    assert.ok(combined.includes(requiredLabel));
  }
  for (const retiredLabel of [
    'Resolve Economy',
    'Process Financial State',
    'Execute Repair Mutation',
    'Submit Vehicle Update',
  ]) {
    assert.equal(`${vehicleScreen}\n${resultsScreen}`.includes(retiredLabel), false);
  }
});

test('locked weekly economy values remain centralized', () => {
  assert.equal(weekendEconomyConfig.operatingCost, 18_000);
  assert.equal(weekendEconomyConfig.starterSponsorRaceIncome, 26_000);
  assert.equal(weekendEconomyConfig.supportedPayoutPositions, 36);
});
