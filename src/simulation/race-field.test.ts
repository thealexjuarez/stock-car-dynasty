/// <reference types="node" />

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { tabs } from '@/data/app-shell';
import { createInitialRaceFieldState } from '@/data/erca-field-data';
import { manufacturerCatalog } from '@/data/manufacturer-data';
import { raceFieldTuning, resolveFieldPoints } from '@/data/race-field-config';
import {
  getRacePresentationConfig,
  getRacePresentationEntrants,
  getWeekendEntrants,
} from '@/data/race-presentation-data';
import { starterGameState } from '@/data/starter-game-state';
import {
  applyRaceFieldSettlement,
  calculateFieldEntryRating,
  getStandingsTransactionId,
  selectFocusedTimingTower,
  selectStandings,
} from '@/simulation/race-field';
import { createRacePresentationModel } from '@/simulation/race-presentation';
import { updateVehicleCondition } from '@/simulation/vehicle-repair';
import {
  createInitialGameSessionState,
  gameSessionReducer,
} from '@/state/game-session-reducer';
import { normalizeGameState } from '@/state/game-state-migration';
import type { GameState } from '@/types/game';
import type { RunningOrderEntry } from '@/types/race-presentation';
import type { RaceResult } from '@/types/race-weekend';

function completeWeekend(gameState: GameState = starterGameState) {
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

test('the persistent ERCA field contains exactly 32 unique active entries', () => {
  const field = createInitialRaceFieldState();
  const active = field.entries.filter((entry) => entry.active);
  const organizationIds = new Set(field.organizations.map((team) => team.id));
  const manufacturerIds = new Set(
    manufacturerCatalog.map((manufacturer) => manufacturer.id),
  );

  assert.equal(active.length, 32);
  assert.equal(active.filter((entry) => entry.isPlayerTeam).length, 2);
  assert.equal(field.opponentDrivers.filter((driver) => driver.active).length, 30);
  assert.equal(new Set(active.map((entry) => entry.id)).size, 32);
  assert.equal(new Set(active.map((entry) => entry.driverId)).size, 32);
  assert.equal(new Set(active.map((entry) => entry.carNumber)).size, 32);
  assert.equal(active.every((entry) => organizationIds.has(entry.teamId)), true);
  assert.equal(
    active.every((entry) => manufacturerIds.has(entry.manufacturerId)),
    true,
  );
  assert.deepEqual(
    active.filter((entry) => entry.isPlayerTeam).map((entry) => [
      entry.carNumber,
      entry.driverId,
    ]),
    [
      ['45', 'driver-cole-mercer'],
      ['46', 'driver-aiden-voss'],
    ],
  );
  const marketIds = new Set(
    starterGameState.recruiting.prospects.map((prospect) => prospect.id),
  );
  assert.equal(active.some((entry) => marketIds.has(entry.driverId)), false);
});

test('field manufacturer distribution is 12 Chevrolat, 11 Fard, and 9 Toyoda', () => {
  const field = createInitialRaceFieldState();
  const entries = field.entries;
  const counts = Object.fromEntries(
    ['chevrolat', 'fard', 'toyoda'].map((manufacturerId) => [
      manufacturerId,
      entries.filter((entry) => entry.manufacturerId === manufacturerId).length,
    ]),
  );
  assert.deepEqual(counts, { chevrolat: 12, fard: 11, toyoda: 9 });

  for (const manufacturerId of ['chevrolat', 'fard', 'toyoda'] as const) {
    const opponentOveralls = entries
      .filter(
        (entry) =>
          entry.manufacturerId === manufacturerId && !entry.isPlayerTeam,
      )
      .map(
        (entry) =>
          field.opponentDrivers.find(
            (driver) => driver.id === entry.driverId,
          )!.overall,
      );
    assert.ok(Math.max(...opponentOveralls) >= 68);
    assert.ok(Math.min(...opponentOveralls) <= 56);
  }
});

test('weekend adapter includes only active race-field entries with persistent identity', () => {
  const state = structuredClone(starterGameState);
  state.recruiting.reserveDriver = {
    prospectId: 'prospect-not-an-entry',
    name: 'Reserve Driver',
    age: 20,
    hometown: 'Somewhere, USA',
    overall: 50,
    potential: 65,
    stats: { ...state.drivers[0].stats },
    archetypes: ['Development Prospect', 'Reliable Journeyman'],
    annualSalary: 30_000,
    termYears: 1,
    role: 'Reserve / Development',
    developmentHistory: [],
    sponsorLeads: [],
  };

  const entrants = getWeekendEntrants(state);
  assert.equal(entrants.length, raceFieldTuning.fieldSize);
  assert.equal(entrants.some((entry) => entry.driverId === 'reserve-not-an-entry'), false);
  entrants.forEach((entrant) => {
    const persistent = state.raceField.entries.find((entry) => entry.id === entrant.id);
    assert.ok(persistent);
    assert.equal(entrant.teamId, persistent.teamId);
    assert.equal(entrant.manufacturerId, persistent.manufacturerId);
  });
});

test('qualifying and race produce stable complete 32-car classifications', () => {
  const first = completeWeekend();
  const second = completeWeekend();
  assert.deepEqual(first.weekend.qualifying, second.weekend.qualifying);
  assert.deepEqual(first.weekend.race, second.weekend.race);
  assert.equal(first.weekend.qualifying?.entries.length, 32);
  assert.equal(first.weekend.race?.entries.length, 32);
  assert.deepEqual(
    first.weekend.race?.entries.map((entry) => entry.finishPosition),
    Array.from({ length: 32 }, (_, index) => index + 1),
  );
});

test('entry rating responds to both driver and team equipment inputs', () => {
  const state = structuredClone(starterGameState);
  const track = state.tracks[0];
  const entry = state.raceField.entries.find((item) => !item.isPlayerTeam)!;
  const base = calculateFieldEntryRating(state, entry, track);
  const driver = state.raceField.opponentDrivers.find(
    (item) => item.id === entry.driverId,
  )!;
  driver.overall += 10;
  Object.keys(driver.stats).forEach((stat) => {
    driver.stats[stat as keyof typeof driver.stats] += 10;
  });
  const driverImproved = calculateFieldEntryRating(state, entry, track);
  assert.equal(Math.round((driverImproved - base) * 10) / 10, 6);

  const organization = state.raceField.organizations.find(
    (item) => item.id === entry.teamId,
  )!;
  organization.teamPerformance += 10;
  organization.equipmentStrength += 10;
  const teamImproved = calculateFieldEntryRating(state, entry, track);
  assert.equal(Math.round((teamImproved - driverImproved) * 10) / 10, 4);
});

test('standings award 32 through 1 points and settle each race exactly once', () => {
  const complete = completeWeekend();
  const result = complete.weekend.race!;
  const settled = applyRaceFieldSettlement(complete.game, result);
  const replayed = applyRaceFieldSettlement(settled, result);
  const standings = selectStandings(settled);

  assert.strictEqual(replayed, settled);
  assert.equal(standings[0].points, 32);
  assert.equal(standings.at(-1)?.points, 1);
  assert.equal(settled.raceField.processedRaceIds.length, 1);
  assert.equal(
    settled.raceField.processedRaceIds[0],
    getStandingsTransactionId(result),
  );
  assert.equal(resolveFieldPoints(1), 32);
  assert.equal(resolveFieldPoints(32), 1);
});

test('normal weekend settlement advances calendar and preserves standings state', () => {
  const complete = completeWeekend();
  const actionId = `settlement:${complete.weekend.race!.raceId}:${complete.weekend.race!.seed}`;
  const advanced = gameSessionReducer(complete, {
    type: 'ADVANCE_EVENT',
    actionId,
  });

  assert.equal(advanced.game.week, 2);
  assert.equal(advanced.weekend.phase, 'preview');
  assert.equal(advanced.game.raceField.standings.every((row) => row.starts === 1), true);
  assert.equal(advanced.game.raceField.processedRaceIds.length, 1);
});

test('field identity and accumulated standings persist through a second weekend', () => {
  const originalEntries = structuredClone(starterGameState.raceField.entries);
  const first = completeWeekend();
  const firstAdvanced = gameSessionReducer(first, {
    type: 'ADVANCE_EVENT',
    actionId: `settlement:${first.weekend.race!.raceId}:${first.weekend.race!.seed}`,
  });
  const second = completeWeekend(firstAdvanced.game);
  const secondAdvanced = gameSessionReducer(second, {
    type: 'ADVANCE_EVENT',
    actionId: `settlement:${second.weekend.race!.raceId}:${second.weekend.race!.seed}`,
  });

  assert.deepEqual(secondAdvanced.game.raceField.entries, originalEntries);
  assert.equal(
    secondAdvanced.game.raceField.standings.every((standing) => standing.starts === 2),
    true,
  );
  assert.equal(secondAdvanced.game.raceField.processedRaceIds.length, 2);
});

test('state v3 migration adds the field without resetting existing career progress', () => {
  const legacy = structuredClone(starterGameState);
  delete (legacy as unknown as { raceField?: GameState['raceField'] }).raceField;
  legacy.stateVersion = 3;
  legacy.team.cash = 321_000;
  legacy.week = 4;
  legacy.drivers[0].exp = 88;
  const normalized = normalizeGameState(legacy as GameState);

  assert.equal(normalized.stateVersion, 5);
  assert.equal(normalized.raceField.entries.length, 32);
  assert.equal(normalized.raceField.standings.every((row) => row.starts === 0), true);
  assert.equal(normalized.team.cash, 321_000);
  assert.equal(normalized.week, 4);
  assert.equal(normalized.drivers[0].exp, 88);
  const renormalized = normalizeGameState(normalized);
  assert.deepEqual(renormalized.raceField, normalized.raceField);
});

test('race-field migration restores canonical identity without resetting progress', () => {
  const state = structuredClone(starterGameState);
  const canonical = createInitialRaceFieldState();
  const entry = state.raceField.entries[0];
  const opponent = state.raceField.opponentDrivers[0];
  const organization = state.raceField.organizations[0];

  Object.assign(entry, {
    carNumber: '2',
    driverId: opponent.id,
    teamId: 'team-ironwood-racing',
    manufacturerId: 'fard',
    active: false,
    isPlayerTeam: false,
  });
  Object.assign(opponent, {
    name: 'Stale Driver Name',
    teamId: 'team-apex-motorsports',
    carNumber: '45',
    manufacturerId: 'toyoda',
    active: false,
    overall: 79,
  });
  Object.assign(organization, {
    name: 'Stale Team Name',
    shortCode: 'OLD',
    manufacturerId: 'fard',
    isPlayerTeam: false,
    teamPerformance: 61,
  });
  state.raceField.standings[0].points = 81;
  state.raceField.standings[0].starts = 4;
  state.raceField.processedRaceIds = ['standings:erca-1'];

  const normalized = normalizeGameState(state);
  const canonicalEntries = new Map(
    canonical.entries.map((canonicalEntry) => [canonicalEntry.id, canonicalEntry]),
  );
  const canonicalDrivers = new Map(
    canonical.opponentDrivers.map((driver) => [driver.id, driver]),
  );
  const canonicalOrganizations = new Map(
    canonical.organizations.map((team) => [team.id, team]),
  );

  normalized.raceField.entries.forEach((normalizedEntry) => {
    assert.deepEqual(normalizedEntry, canonicalEntries.get(normalizedEntry.id));
  });
  normalized.raceField.opponentDrivers.forEach((driver) => {
    const canonicalDriver = canonicalDrivers.get(driver.id)!;
    assert.equal(driver.name, canonicalDriver.name);
    assert.equal(driver.teamId, canonicalDriver.teamId);
    assert.equal(driver.carNumber, canonicalDriver.carNumber);
    assert.equal(driver.manufacturerId, canonicalDriver.manufacturerId);
    assert.equal(driver.active, canonicalDriver.active);
  });
  normalized.raceField.organizations.forEach((team) => {
    const canonicalTeam = canonicalOrganizations.get(team.id)!;
    assert.equal(team.name, canonicalTeam.name);
    assert.equal(team.shortCode, canonicalTeam.shortCode);
    assert.equal(team.manufacturerId, canonicalTeam.manufacturerId);
    assert.equal(team.isPlayerTeam, canonicalTeam.isPlayerTeam);
  });

  assert.equal(normalized.raceField.opponentDrivers[0].overall, 79);
  assert.equal(normalized.raceField.organizations[0].teamPerformance, 61);
  assert.equal(normalized.raceField.standings[0].points, 81);
  assert.equal(normalized.raceField.standings[0].starts, 4);
  assert.deepEqual(normalized.raceField.processedRaceIds, ['standings:erca-1']);
  assert.equal(new Set(normalized.raceField.entries.map((item) => item.carNumber)).size, 32);
  assert.deepEqual(
    normalized.raceField.entries
      .filter((item) => item.isPlayerTeam)
      .map((item) => [item.carNumber, item.driverId]),
    [
      ['45', 'driver-cole-mercer'],
      ['46', 'driver-aiden-voss'],
    ],
  );
});

test('checkered playback order exactly matches the authoritative official results', () => {
  const complete = completeWeekend();
  const config = getRacePresentationConfig('race');
  const entrants = getRacePresentationEntrants(complete.game, complete.weekend);
  const model = createRacePresentationModel(
    entrants,
    config,
    config.sessionDurationMs,
    'driver-cole-mercer',
  );
  const officialOrder = [...complete.weekend.race!.entries]
    .sort(
      (left, right) =>
        left.finishPosition - right.finishPosition ||
        left.id.localeCompare(right.id),
    )
    .map((entry) => entry.id);

  assert.equal(model.isComplete, true);
  assert.deepEqual(
    model.runningOrder.map((entry) => entry.id),
    officialOrder,
  );
  assert.deepEqual(
    model.runningOrder.map((entry) => entry.position),
    Array.from({ length: 32 }, (_, index) => index + 1),
  );
  model.runningOrder.forEach((entry) => {
    assert.equal(entry.position, entry.authoritativeFinishPosition);
  });
});

test('mobile web shell keeps all five tabs in one non-overlapping row', () => {
  const webTabsSource = readFileSync(
    path.resolve(process.cwd(), 'src/components/app-tabs.web.tsx'),
    'utf8',
  );

  assert.equal(tabs.length, 5);
  assert.match(webTabsSource, /TabSlot style=\{\{ flex: 1, minHeight: 0 \}\}/);
  assert.match(webTabsSource, /flexWrap: 'nowrap'/);
  assert.match(webTabsSource, /flexShrink: 0/);
  assert.doesNotMatch(webTabsSource, /position: 'absolute'/);
});

test('compact timing tower keeps readable text and the ten-row portrait cap', () => {
  const timingTowerSource = readFileSync(
    path.resolve(
      process.cwd(),
      'src/components/race-presentation/timing-tower.tsx',
    ),
    'utf8',
  );

  assert.match(timingTowerSource, /compact \? 10 : 11/);
  assert.match(timingTowerSource, /initialNumToRender=\{10\}/);
  assert.match(timingTowerSource, /maxToRenderPerBatch=\{10\}/);
});

test('focused timing tower pins leader and Apex cars within the portrait cap', () => {
  const baseEntrant = {
    driverName: 'Driver',
    driverId: 'driver',
    teamId: 'team',
    teamName: 'Team',
    manufacturerId: 'chevrolat' as const,
    lane: 0 as const,
    qualifyingOnTrack: true,
    qualifyingStartDistance: 0,
    raceStartDistance: 0,
    paceFactor: 1,
    tireStatus: 'Good' as const,
    tirePercent: 90,
    fuelPercent: 70,
    sprite: {
      bodyColor: '#fff',
      accentColor: '#000',
      numberColor: '#fff',
      logicalWidth: 108,
      logicalHeight: 44,
    },
  };
  const order: RunningOrderEntry[] = Array.from({ length: 32 }, (_, index) => ({
    ...baseEntrant,
    id: `entry-${index + 1}`,
    carNumber: String(index + 1),
    isPlayerTeam: index === 14 || index === 23,
    playerDriverId: index === 14 || index === 23 ? `player-${index}` : undefined,
    position: index + 1,
    distance: 32 - index,
    interval: index === 0 ? 'Leader' : `+${index}`,
  }));
  const focused = selectFocusedTimingTower(order);

  assert.ok(focused.length <= 10);
  assert.ok(focused.some((entry) => entry.position === 1));
  assert.ok(focused.some((entry) => entry.position === 15));
  assert.ok(focused.some((entry) => entry.position === 24));
  assert.ok(focused.some((entry) => entry.position === 14));
  assert.ok(focused.some((entry) => entry.position === 16));
  assert.ok(focused.some((entry) => entry.position === 23));
  assert.ok(focused.some((entry) => entry.position === 25));
  assert.equal(new Set(focused.map((entry) => entry.id)).size, focused.length);
  assert.deepEqual(
    [...focused].sort((left, right) => left.position - right.position),
    focused,
  );

  const withNearApex = order.map((entry) => ({
    ...entry,
    isPlayerTeam: entry.position === 10 || entry.position === 12,
  }));
  const nearFocused = selectFocusedTimingTower(withNearApex);
  assert.ok(nearFocused.length <= 10);
  assert.equal(new Set(nearFocused.map((entry) => entry.id)).size, nearFocused.length);
  assert.ok(nearFocused.some((entry) => entry.position === 1));
  assert.ok(nearFocused.some((entry) => entry.position === 10));
  assert.ok(nearFocused.some((entry) => entry.position === 12));

  const withApexLeadingAndLast = order.map((entry) => ({
    ...entry,
    isPlayerTeam: entry.position === 1 || entry.position === 32,
  }));
  const edgeFocused = selectFocusedTimingTower(withApexLeadingAndLast);
  assert.ok(edgeFocused.length <= 10);
  assert.ok(edgeFocused.some((entry) => entry.position === 1));
  assert.ok(edgeFocused.some((entry) => entry.position === 32));
  assert.ok(edgeFocused.some((entry) => entry.position === 31));
});

test('standings transaction supports explicit full-field results', () => {
  const field = createInitialRaceFieldState();
  const result: RaceResult = {
    raceId: 'race-explicit',
    seed: 'seed-explicit',
    entries: field.entries.map((entry, index) => ({
      id: entry.id,
      carNumber: entry.carNumber,
      driverName: entry.driverId,
      driverId: entry.driverId,
      teamId: entry.teamId,
      teamName: entry.teamId,
      manufacturerId: entry.manufacturerId,
      isPlayerTeam: entry.isPlayerTeam,
      baselineRating: 50,
      startPosition: index + 1,
      finishPosition: index + 1,
      score: 50,
      status: 'Running',
      payout: 0,
      exp: 0,
      conditionLoss: 0,
    })),
    playerPayout: 0,
    playerExp: 0,
    playerConditionLoss: 0,
  };
  const settled = applyRaceFieldSettlement(starterGameState, result);
  assert.equal(settled.raceField.standings.every((row) => row.starts === 1), true);
  const winner = settled.raceField.standings.find(
    (standing) => standing.entryId === field.entries[0].id,
  )!;
  const sixth = settled.raceField.standings.find(
    (standing) => standing.entryId === field.entries[5].id,
  )!;
  assert.deepEqual(
    [winner.wins, winner.topFives, winner.topTens, winner.averageFinish],
    [1, 1, 1, 1],
  );
  assert.deepEqual(
    [sixth.wins, sixth.topFives, sixth.topTens, sixth.averageFinish],
    [0, 0, 1, 6],
  );
});

test('readiness behavior remains intact with the 32-car field', () => {
  const damaged = {
    ...starterGameState,
    vehicles: starterGameState.vehicles.map((vehicle, index) =>
      index === 0
        ? updateVehicleCondition(vehicle, 74, 'Field regression fixture.')
        : { ...vehicle },
    ),
  };
  const session = createInitialGameSessionState(damaged);
  assert.throws(
    () =>
      gameSessionReducer(session, {
        type: 'COMPLETE_PRACTICE',
        choiceId: 'long-run-balance',
      }),
    /must reach 75% condition/,
  );
});
