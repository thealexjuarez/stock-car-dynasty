/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';

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

test('advancing applies settlement once and activates the next event', () => {
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
  assert.equal(advanced.game.team.cash, cashBefore + race.playerPayout);

  for (const entry of race.entries.filter((item) => item.isPlayerTeam)) {
    assert.equal(
      advanced.game.drivers.find((driver) => driver.id === entry.driverId)?.exp,
      expBefore.get(entry.driverId!)! + entry.exp,
    );
    assert.equal(
      advanced.game.vehicles.find((vehicle) => vehicle.id === entry.vehicleId)?.condition,
      conditionBefore.get(entry.vehicleId!)! - entry.conditionLoss,
    );
  }

  assert.throws(
    () => gameSessionReducer(advanced, { type: 'ADVANCE_EVENT' }),
    /Results must be reviewed/,
  );
});
