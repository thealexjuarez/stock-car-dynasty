/// <reference types="node" />

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { tabs } from '@/data/app-shell';
import {
  PROVISIONAL_AVERAGE_WEEKLY_EARNINGS,
  repairOptions,
} from '@/data/repair-config';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { postSettlementFlow } from '@/data/race-weekend-navigation';
import { starterGameState } from '@/data/starter-game-state';
import { updateVehicleCondition } from '@/simulation/vehicle-repair';
import {
  createInitialGameSessionState,
  gameSessionReducer,
} from '@/state/game-session-reducer';

function runCompletedWeekend() {
  let state = createInitialGameSessionState();
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

function createSessionWithConditions(conditions: readonly [number, number]) {
  return createInitialGameSessionState({
    ...starterGameState,
    vehicles: starterGameState.vehicles.map((vehicle, index) =>
      updateVehicleCondition(vehicle, conditions[index], 'Regression test fixture.'),
    ),
  });
}

test('the same event seed produces identical qualifying and race outcomes', () => {
  const first = runCompletedWeekend();
  const second = runCompletedWeekend();

  assert.deepEqual(first.weekend.qualifying, second.weekend.qualifying);
  assert.deepEqual(first.weekend.race, second.weekend.race);
  assert.equal(first.weekend.qualifying?.entries.length, 12);
  assert.equal(first.weekend.race?.entries.length, 12);
  assert.deepEqual(
    first.weekend.qualifying?.entries
      .filter((entry) => entry.isPlayerTeam)
      .map((entry) => [entry.carNumber, entry.position]),
    [['45', 2], ['46', 4]],
  );
  assert.deepEqual(
    first.weekend.race?.entries
      .filter((entry) => entry.isPlayerTeam)
      .map((entry) => [entry.carNumber, entry.finishPosition]),
    [['45', 2], ['46', 9]],
  );
  assert.equal(first.weekend.race?.playerPayout, 21_250);
  assert.equal(first.weekend.race?.playerExp, 312);
  assert.equal(first.weekend.race?.playerConditionLoss, 5);
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

test('settlement posts once and leaves the next weekend ready at Home', () => {
  const completed = runCompletedWeekend();
  const race = completed.weekend.race!;
  const cashBefore = completed.game.team.cash;
  const expBefore = new Map(completed.game.drivers.map((driver) => [driver.id, driver.exp]));
  const conditionBefore = new Map(
    completed.game.vehicles.map((vehicle) => [vehicle.id, vehicle.condition]),
  );
  const advanced = gameSessionReducer(completed, { type: 'ADVANCE_EVENT' });

  assert.equal(advanced.game.nextRaceId, 'race-2');
  assert.equal(advanced.game.week, 2);
  assert.equal(advanced.weekend.raceId, 'race-2');
  assert.equal(advanced.weekend.phase, 'preview');
  assert.equal(advanced.weekend.practice, undefined);
  assert.equal(advanced.weekend.qualifying, undefined);
  assert.equal(advanced.weekend.race, undefined);
  assert.equal(advanced.game.team.cash, cashBefore + race.playerPayout);
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
      advanced.game.drivers.find((driver) => driver.id === entry.driverId)?.exp,
      expBefore.get(entry.driverId!)! + entry.exp,
    );
    assert.equal(settledVehicle?.condition, expectedCondition);
    assert.equal(settledVehicle?.damage, 100 - expectedCondition);
    assert.notEqual(settledVehicle?.readiness, undefined);
  }

  assert.throws(
    () => gameSessionReducer(advanced, { type: 'ADVANCE_EVENT' }),
    /Results must be reviewed/,
  );
});

test('the app is locked to portrait for phone race weekends', () => {
  const appConfig = JSON.parse(readFileSync('app.json', 'utf8')) as {
    expo: { orientation?: string };
  };

  assert.equal(appConfig.expo.orientation, 'portrait');
});

test('race-weekend progression uses the revised player-facing labels', () => {
  assert.equal(raceWeekendCopy.practice.runAction, 'Run Practice');
  assert.equal(raceWeekendCopy.practiceResult.primaryAction, 'Send Them Out');
  assert.equal(raceWeekendCopy.qualifying.gridAction, 'Set the Grid');
  assert.equal(raceWeekendCopy.grid.primaryAction, 'Go Racing');
  assert.equal(raceWeekendCopy.race.resultsAction, 'Official Results');
  assert.equal(raceWeekendCopy.results.primaryAction, 'Return to the Shop');

  const allCopy = JSON.stringify(raceWeekendCopy);
  for (const retiredLabel of [
    'Resolve Practice',
    'Begin Practice',
    'Start Race',
    'View Results',
    'Apply Results & Advance',
    'Simulation Complete',
  ]) {
    assert.equal(allCopy.includes(retiredLabel), false);
  }
});

test('repair costs deduct exactly once when the same action is replayed', () => {
  const initial = createInitialGameSessionState();
  const vehicle = initial.game.vehicles[0];
  const cashBefore = initial.game.team.cash;
  const action = {
    type: 'REPAIR_VEHICLE',
    actionId: 'repair-once',
    vehicleId: vehicle.id,
    optionId: 'standard-repair',
  } as const;

  const repaired = gameSessionReducer(initial, action);
  const replayed = gameSessionReducer(repaired, action);

  assert.equal(repaired.game.team.cash, cashBefore - 3_500);
  assert.equal(repaired.processedRepairActionIds.length, 1);
  assert.strictEqual(replayed, repaired);
});

test('repair restoration updates condition, damage, and readiness together', () => {
  const initial = createSessionWithConditions([72, 86]);
  const repaired = gameSessionReducer(initial, {
    type: 'REPAIR_VEHICLE',
    actionId: 'quick-fix-72',
    vehicleId: 'vehicle-45',
    optionId: 'quick-fix',
  });
  const vehicle = repaired.game.vehicles.find((item) => item.id === 'vehicle-45');

  assert.equal(vehicle?.condition, 77);
  assert.equal(vehicle?.damage, 23);
  assert.equal(vehicle?.readiness, 'At Risk');
});

test('a repair cannot drive team cash below zero', () => {
  const initial = createInitialGameSessionState({
    ...starterGameState,
    team: { ...starterGameState.team, cash: 1_999 },
  });

  assert.throws(
    () =>
      gameSessionReducer(initial, {
        type: 'REPAIR_VEHICLE',
        actionId: 'unaffordable-repair',
        vehicleId: 'vehicle-45',
        optionId: 'quick-fix',
      }),
    /Insufficient cash/,
  );
  assert.equal(initial.game.team.cash, 1_999);
  assert.equal(initial.processedRepairActionIds.length, 0);
});

test('a car below the locked 75% line blocks the next weekend', () => {
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
    optionId: 'standard-repair',
  });

  assert.strictEqual(repaired.weekend, weekendBefore);
  assert.equal(repaired.game.nextRaceId, initial.game.nextRaceId);
  assert.equal(postSettlementFlow.route, '/home');
  assert.equal(postSettlementFlow.nextWeekendStartsAutomatically, false);
});

test('the provisional normal repair remains inside the weekly earnings target', () => {
  const standardRepair = repairOptions.find(
    (option) => option.id === 'standard-repair',
  )!;
  const share = standardRepair.cost / PROVISIONAL_AVERAGE_WEEKLY_EARNINGS;

  assert.ok(share >= 0.15);
  assert.ok(share <= 0.2);
});
