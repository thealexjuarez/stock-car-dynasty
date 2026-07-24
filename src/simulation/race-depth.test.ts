/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';

import { raceDepthTuning } from '@/data/race-depth-config';
import { getWeekendEntrants } from '@/data/race-presentation-data';
import { starterGameState } from '@/data/starter-game-state';
import {
  calculateSegmentFuelUse,
  getCriticalTirePacePenalty,
  getCenteredSeededVariance,
  getMajorIncidentRedFlagChance,
  getRaceDepthSegmentCount,
  getTireFailureChance,
  getTireLabel,
  getTireSpinRiskModifier,
  isQualifyingMajorMultiCarEvent,
  projectRacePlan,
} from '@/simulation/race-depth';
import { getSettlementTransactionId } from '@/simulation/economy';
import {
  createInitialGameSessionState,
  gameSessionReducer,
} from '@/state/game-session-reducer';
import {
  normalizeGameSessionState,
  normalizeGameState,
} from '@/state/game-state-migration';
import type { DriverArchetype, GameState, TrackType } from '@/types/game';
import type {
  FinalStagePitPlan,
  RacePlan,
  StageEndCall,
} from '@/types/race-depth';
import type { GameSessionState } from '@/types/race-weekend';

function stateForTrack(type: TrackType, wear?: 'Low' | 'Medium' | 'High') {
  const track = starterGameState.tracks.find(
    (item) => item.type === type && (!wear || item.tireWear === wear),
  );
  if (!track) throw new Error(`Missing ${type} ${wear ?? ''} fixture`);
  const event = starterGameState.calendar.find(
    (item) => item.trackId === track.id,
  )!;
  return normalizeGameState({
    ...starterGameState,
    week: event.week,
    nextRaceId: event.id,
  });
}

function prepareGrid(game: GameState = starterGameState) {
  let state = createInitialGameSessionState(game);
  state = gameSessionReducer(state, {
    type: 'COMPLETE_PRACTICE',
    choiceId: 'long-run-balance',
  });
  state = gameSessionReducer(state, { type: 'BEGIN_QUALIFYING' });
  state = gameSessionReducer(state, { type: 'SHOW_GRID' });
  return state;
}

function updateApexPlan(
  state: GameSessionState,
  carNumber: string,
  patch: Partial<RacePlan>,
) {
  const entry = state.weekend.qualifying!.entries.find(
    (item) => item.carNumber === carNumber,
  )!;
  const plan = state.weekend.racePlans[entry.id];
  return gameSessionReducer(state, {
    type: 'SET_RACE_PLAN',
    plan: { ...plan, ...patch },
  });
}

function resolvePrepared(state: GameSessionState) {
  return gameSessionReducer(state, { type: 'BEGIN_RACE' });
}

test('segment tables lock six, eight, and ten logical races', () => {
  assert.equal(getRaceDepthSegmentCount(40), 6);
  assert.equal(getRaceDepthSegmentCount(60), 6);
  assert.equal(getRaceDepthSegmentCount(61), 8);
  assert.equal(getRaceDepthSegmentCount(150), 8);
  assert.equal(getRaceDepthSegmentCount(151), 10);
  assert.deepEqual(raceDepthTuning.segments.tables[6].boundaries, [2, 4]);
  assert.deepEqual(raceDepthTuning.segments.tables[8].boundaries, [2, 4, 6]);
  assert.deepEqual(raceDepthTuning.segments.tables[10].boundaries, [2, 5, 7]);
});

test('decimal seeded variance remains centered inside the approved bound', () => {
  const samples = Array.from({ length: 500 }, (_, index) =>
    getCenteredSeededVariance(`race-depth-variance:${index}`, 0.04),
  );
  assert.equal(samples.every((value) => value >= -0.04 && value <= 0.04), true);
  assert.equal(
    getCenteredSeededVariance('repeatable', 2.5),
    getCenteredSeededVariance('repeatable', 2.5),
  );
  assert.equal(samples.some((value) => value < 0), true);
  assert.equal(samples.some((value) => value > 0), true);
});

test('approved tire labels, cliff penalties, spin bands, and failure curve are exact', () => {
  assert.equal(getTireLabel(100), 'Fresh');
  assert.equal(getTireLabel(80), 'Fresh');
  assert.equal(getTireLabel(79), 'Good');
  assert.equal(getTireLabel(40), 'Used');
  assert.equal(getTireLabel(25), 'Worn');
  assert.equal(getTireLabel(24), 'Critical');
  assert.equal(getCriticalTirePacePenalty(40), 0);
  assert.equal(getCriticalTirePacePenalty(25), -1.5);
  assert.ok(Math.abs(getCriticalTirePacePenalty(1) - -6) < 0.001);
  assert.equal(getTireSpinRiskModifier(24), 1.05);
  assert.equal(getTireSpinRiskModifier(19), 1.1);
  assert.equal(getTireSpinRiskModifier(14), 1.18);
  assert.equal(getTireSpinRiskModifier(9), 1.3);
  assert.equal(getTireFailureChance(12), 0);
  assert.ok(Math.abs(getTireFailureChance(11) - 0.0185) < 0.00001);
  assert.ok(Math.abs(getTireFailureChance(8) - 0.029) < 0.00001);
  assert.ok(Math.abs(getTireFailureChance(4) - 0.043) < 0.00001);
  assert.ok(Math.abs(getTireFailureChance(1) - 0.0535) < 0.00001);
});

test('track fuel totals and pace, instruction, stage, and caution multipliers are exact', () => {
  assert.deepEqual(raceDepthTuning.fuel.fullRace, {
    'Short Track': 230,
    Intermediate: 245,
    Superspeedway: 220,
    'Road Course': 250,
    'Long Oval': 240,
  });
  assert.equal(
    calculateSegmentFuelUse({
      trackType: 'Intermediate',
      segmentFraction: 1,
      pace: 'Balanced',
      instruction: 'Run Your Race',
      broadStagePlan: 'Balanced Race',
      caution: false,
    }),
    245,
  );
  assert.equal(
    calculateSegmentFuelUse({
      trackType: 'Intermediate',
      segmentFraction: 1,
      pace: 'Conserve',
      instruction: 'Protect the Car',
      broadStagePlan: 'Save for the Finish',
      caution: true,
    }),
    118.58,
  );
});

test('the ERCA race resolves six immutable segments, two stages, and 32 entry facts', () => {
  const resolved = resolvePrepared(prepareGrid());
  const facts = resolved.weekend.race!.depthFacts!;
  assert.equal(facts.segmentFacts.length, 6);
  assert.deepEqual(
    facts.segmentFacts.map((segment) => segment.segment),
    [1, 2, 3, 4, 5, 6],
  );
  assert.equal(facts.stageFacts.length, 2);
  assert.deepEqual(
    facts.stageFacts.map((stage) => stage.boundarySegment),
    [2, 4],
  );
  assert.equal(facts.entryFacts.length, 32);
  assert.equal(
    facts.segmentFacts.every((segment) => segment.entries.length === 32),
    true,
  );
  assert.equal(facts.seriesRules.stagePointsEnabled, false);
  assert.equal(
    facts.entryFacts.every((entry) => entry.stagePoints.every((points) => points === 0)),
    true,
  );
  assert.equal(Object.isFrozen(facts), true);
  assert.equal(Object.isFrozen(facts.entryFacts), true);
  assert.equal(Object.isFrozen(facts.segmentFacts[0]), true);
});

test('standard intermediate plans schedule three service cycles and high wear requires four', () => {
  let medium = prepareGrid(stateForTrack('Intermediate', 'Medium'));
  const mediumEntry = medium.weekend.qualifying!.entries.find(
    (entry) => entry.carNumber === '45',
  )!;
  medium = updateApexPlan(medium, '45', {
    basePace: 'Balanced',
    attackClosing: false,
    instruction: 'Run Your Race',
    broadStagePlan: 'Balanced Race',
    finalStagePitPlan: 'Balanced Final Stop',
  });
  assert.equal(
    projectRacePlan(
      medium.game,
      mediumEntry,
      medium.weekend.racePlans[mediumEntry.id],
    ).plannedStopCount,
    3,
  );

  let high = prepareGrid(stateForTrack('Intermediate', 'High'));
  const highEntry = high.weekend.qualifying!.entries.find(
    (entry) => entry.carNumber === '45',
  )!;
  high = updateApexPlan(high, '45', {
    basePace: 'Balanced',
    attackClosing: false,
    instruction: 'Run Your Race',
    broadStagePlan: 'Balanced Race',
    finalStagePitPlan: 'Balanced Final Stop',
  });
  const highProjection = projectRacePlan(
    high.game,
    highEntry,
    high.weekend.racePlans[highEntry.id],
  );
  assert.equal(highProjection.requiredMinimumStopCount, 4);
  assert.equal(highProjection.plannedStopCount, 4);
  assert.equal(highProjection.fourthStopClassification, 'Required');
});

test('the rare low-wear two-stop plan is computed and requires a legal combined long final run', () => {
  let state = prepareGrid(stateForTrack('Superspeedway', 'Low'));
  const entry = state.weekend.qualifying!.entries.find(
    (item) => item.carNumber === '45',
  )!;
  state = updateApexPlan(state, '45', {
    basePace: 'Balanced',
    attackClosing: false,
    instruction: 'Run Your Race',
    broadStagePlan: 'Balanced Race',
    finalStagePitPlan: 'Long Final Run',
  });
  const projection = projectRacePlan(
    state.game,
    entry,
    state.weekend.racePlans[entry.id],
  );
  assert.equal(projection.requiredMinimumStopCount, 2);
  assert.equal(projection.plannedStopCount, 2);

  state = updateApexPlan(state, '45', {
    finalStagePitPlan: 'Balanced Final Stop',
  });
  assert.equal(
    projectRacePlan(
      state.game,
      entry,
      state.weekend.racePlans[entry.id],
    ).requiredMinimumStopCount,
    3,
  );
});

test('Chase and Flip place one required stage service on opposite sides of the boundary', () => {
  let state = prepareGrid(stateForTrack('Intermediate', 'Medium'));
  state = updateApexPlan(state, '45', {
    stageCalls: {
      ...state.weekend.racePlans['field-entry-45'].stageCalls,
      1: 'Flip the Stage',
      2: 'Chase Stage Points',
    },
  });
  state = updateApexPlan(state, '46', {
    stageCalls: {
      ...state.weekend.racePlans['field-entry-46'].stageCalls,
      1: 'Chase Stage Points',
      2: 'Flip the Stage',
    },
  });
  const facts = resolvePrepared(state).weekend.race!.depthFacts!;
  const assertCall = (
    entryId: string,
    stageNumber: number,
    call: StageEndCall,
    timing: number,
  ) => {
    const services = facts.pitFacts.filter(
      (pit) => pit.entryId === entryId && pit.stageNumber === stageNumber,
    );
    assert.equal(services.length, 1);
    assert.equal(services[0].stageCall, call);
    assert.equal(services[0].compressedTiming, timing);
    assert.equal(
      services[0].underCaution,
      call === 'Chase Stage Points',
    );
  };
  assertCall('field-entry-45', 1, 'Flip the Stage', 0.75);
  assertCall('field-entry-45', 2, 'Chase Stage Points', 1);
  assertCall('field-entry-46', 1, 'Chase Stage Points', 1);
  assertCall('field-entry-46', 2, 'Flip the Stage', 0.75);
});

test('all five final-stage plans retain their exact compressed service behavior', () => {
  const expected: Record<FinalStagePitPlan, readonly number[]> = {
    'Early Final Stop': [0.2],
    'Balanced Final Stop': [0.45],
    'Long Final Run': [0.7],
    'Short Run / Fresh Tires Late': [0.15, 0.72],
    'Caution Preference': [0.2, 0.7],
  };
  assert.deepEqual(raceDepthTuning.finalStagePit, expected);
  for (const option of Object.keys(expected) as FinalStagePitPlan[]) {
    let state = prepareGrid(stateForTrack('Intermediate', 'Medium'));
    state = updateApexPlan(state, '45', {
      finalStagePitPlan: option,
      basePace: 'Balanced',
      attackClosing: false,
      instruction: 'Run Your Race',
    });
    const facts = resolvePrepared(state).weekend.race!.depthFacts!;
    const entry = facts.entryFacts.find(
      (item) => item.entryId === 'field-entry-45',
    )!;
    if (option === 'Short Run / Fresh Tires Late') {
      assert.equal(entry.plannedStopCount, 4);
    } else {
      assert.ok(entry.plannedStopCount >= 3);
    }
    assert.ok(
      facts.pitFacts.some(
        (pit) =>
          pit.entryId === entry.entryId &&
          pit.finalStagePitPlan === option,
      ),
    );
  }
});

test('Tire Management directly reduces degradation without changing base stats', () => {
  const withArchetype = stateForTrack('Intermediate', 'High');
  const withoutArchetype: GameState = {
    ...withArchetype,
    drivers: withArchetype.drivers.map((driver) =>
      driver.id === 'driver-cole-mercer'
        ? {
            ...driver,
            archetypes: [
              'Complete Driver',
              'Development Prospect',
            ] as [DriverArchetype, DriverArchetype],
          }
        : driver,
    ),
  };
  const longRunState: GameState = {
    ...withArchetype,
    drivers: withArchetype.drivers.map((driver) =>
      driver.id === 'driver-cole-mercer'
        ? {
            ...driver,
            archetypes: [
              'Long Run Driver',
              'Development Prospect',
            ] as [DriverArchetype, DriverArchetype],
          }
        : driver,
    ),
  };
  const baseStats = {
    ...longRunState.drivers.find(
      (driver) => driver.id === 'driver-cole-mercer',
    )!.stats,
  };
  const withFacts = resolvePrepared(prepareGrid(longRunState)).weekend.race!
    .depthFacts!;
  const withoutFacts = resolvePrepared(prepareGrid(withoutArchetype)).weekend
    .race!.depthFacts!;
  const withEntry = withFacts.entryFacts.find(
    (entry) => entry.entryId === 'field-entry-45',
  )!;
  const withoutEntry = withoutFacts.entryFacts.find(
    (entry) => entry.entryId === 'field-entry-45',
  )!;
  assert.ok(withEntry.totalTireWear < withoutEntry.totalTireWear);
  assert.deepEqual(
    longRunState.drivers.find(
      (driver) => driver.id === 'driver-cole-mercer',
    )!.stats,
    baseStats,
  );
});

test('Reliable Journeyman records approved protection while Development Prospect adds no speed effect', () => {
  const state = resolvePrepared(prepareGrid()).weekend.race!.depthFacts!;
  const cole = state.entryFacts.find(
    (entry) => entry.entryId === 'field-entry-45',
  )!;
  const aiden = state.entryFacts.find(
    (entry) => entry.entryId === 'field-entry-46',
  )!;
  assert.ok(
    cole.archetypeReasonCodes.some((reason) =>
      reason.startsWith('Reliable Journeyman'),
    ),
  );
  assert.equal(
    aiden.archetypeReasonCodes.some((reason) =>
      reason.startsWith('Development Prospect'),
    ),
    false,
  );
  assert.equal(raceDepthTuning.incident.reliableVariance.primary, 0.08);
  assert.equal(raceDepthTuning.incident.reliableVariance.secondary, 0.04);
});

test('major multi-car and red-flag thresholds match the approved definition', () => {
  assert.equal(
    isQualifyingMajorMultiCarEvent({
      involvedCount: 3,
      conditionLosses: [21, 11, 2],
      sharedIncidentChain: true,
      onTrack: true,
    }),
    true,
  );
  assert.equal(
    isQualifyingMajorMultiCarEvent({
      involvedCount: 2,
      conditionLosses: [35, 20],
      sharedIncidentChain: true,
      onTrack: true,
    }),
    false,
  );
  assert.equal(
    isQualifyingMajorMultiCarEvent({
      involvedCount: 4,
      conditionLosses: [21, 11, 2, 2],
      sharedIncidentChain: false,
      onTrack: true,
    }),
    false,
  );
  assert.equal(getMajorIncidentRedFlagChance(2), 0);
  assert.equal(getMajorIncidentRedFlagChance(3), 0.5);
  assert.equal(getMajorIncidentRedFlagChance(5), 0.7);
  assert.equal(getMajorIncidentRedFlagChance(6), 0.9);
});

test('expectation and clean-race facts are authoritative and settlement remains exact once', () => {
  let state = resolvePrepared(prepareGrid());
  const race = state.weekend.race!;
  for (const fact of race.depthFacts!.entryFacts) {
    assert.equal(
      fact.expectationDelta,
      fact.expectedPosition - fact.finishPosition,
    );
    assert.ok(fact.expectedBand[0] >= 1);
    assert.ok(fact.expectedBand[1] <= 32);
    if (fact.dnf || fact.spin || fact.mechanicalFailure) {
      assert.equal(fact.cleanRace, false);
    }
  }
  state = gameSessionReducer(state, { type: 'SHOW_RESULTS' });
  const action = {
    type: 'ADVANCE_EVENT' as const,
    actionId: getSettlementTransactionId(race),
  };
  const settled = gameSessionReducer(state, action);
  const replayedGame = normalizeGameState(settled.game);
  assert.equal(
    replayedGame.economy.processedTransactionIds.filter(
      (id) => id === action.actionId,
    ).length,
    1,
  );
});

test('migration preserves completed legacy results and does not invent Race Depth history', () => {
  const completed = resolvePrepared(prepareGrid());
  const legacy: GameSessionState = {
    ...completed,
    weekend: {
      ...completed.weekend,
      phase: 'results',
      race: {
        ...completed.weekend.race!,
        depthFacts: undefined,
      },
      racePlans: {},
    },
  };
  const normalized = normalizeGameSessionState(legacy);
  assert.equal(normalized.weekend.race?.legacyRaceDepth, true);
  assert.equal(normalized.weekend.race?.depthFacts, undefined);
  assert.deepEqual(
    normalized.weekend.race?.entries,
    legacy.weekend.race?.entries,
  );
  assert.equal(normalized.game.stateVersion, 6);
});

test('migration initializes plans only for an unresolved future grid', () => {
  const grid = prepareGrid();
  const legacyGrid: GameSessionState = {
    ...grid,
    game: {
      ...grid.game,
      team: { ...grid.game.team, cash: 412345 },
    },
    weekend: {
      ...grid.weekend,
      racePlans: {},
    },
  };
  const normalized = normalizeGameSessionState(legacyGrid);
  const apexEntries = normalized.weekend.qualifying!.entries.filter(
    (entry) => entry.isPlayerTeam,
  );

  assert.equal(normalized.weekend.phase, 'grid');
  assert.equal(normalized.game.team.cash, 412345);
  assert.deepEqual(normalized.weekend.qualifying, legacyGrid.weekend.qualifying);
  assert.deepEqual(
    Object.keys(normalized.weekend.racePlans).sort(),
    apexEntries.map((entry) => entry.id).sort(),
  );
  assert.equal(
    Object.values(normalized.weekend.racePlans).every(
      (plan) =>
        plan.raceId === normalized.weekend.raceId &&
        plan.locked &&
        !normalized.weekend.race,
    ),
    true,
  );
});

test('all 32 rivals use authoritative plans, fuel, tires, stages, and service facts', () => {
  const facts = resolvePrepared(
    prepareGrid(stateForTrack('Long Oval', 'Medium')),
  ).weekend.race!.depthFacts!;
  assert.equal(facts.entryFacts.length, 32);
  assert.equal(
    facts.entryFacts.every(
      (entry) =>
        entry.plan &&
        entry.tireConditionBySegment.length === 6 &&
        entry.fuelBySegment.length === 6 &&
        entry.stageFinishPositions.length === 2 &&
        entry.actualStopCount >= entry.requiredMinimumStopCount,
    ),
    true,
  );
  assert.equal(
    new Set(facts.entryFacts.map((entry) => entry.plan.finalStagePitPlan)).size >
      1,
    true,
  );
});

test('race-plan actions reject stale identity and playback cannot mutate strategy', () => {
  const state = prepareGrid();
  const plan = state.weekend.racePlans['field-entry-45'];
  assert.throws(
    () =>
      gameSessionReducer(state, {
        type: 'SET_RACE_PLAN',
        plan: { ...plan, raceId: 'race-stale' },
      }),
    /no longer matches/,
  );
  const resolved = resolvePrepared(state);
  assert.throws(
    () =>
      gameSessionReducer(resolved, {
        type: 'SET_RACE_PLAN',
        plan,
      }),
    /only be changed before/,
  );
});

test('Race Depth source keeps the approved caps and service ranges centralized', () => {
  assert.deepEqual(raceDepthTuning.track['Road Course'].plannedStops, [2, 3]);
  assert.deepEqual(raceDepthTuning.track.Superspeedway.plannedStops, [3, 4]);
  assert.deepEqual(raceDepthTuning.track.Intermediate.plannedStops, [3, 5]);
  assert.deepEqual(raceDepthTuning.track['Long Oval'].plannedStops, [4, 6]);
  assert.deepEqual(raceDepthTuning.track['Short Track'].plannedStops, [5, 7]);
  assert.equal(raceDepthTuning.tire.directArchetype.primary.degradationReduction, 0.15);
  assert.equal(raceDepthTuning.tire.directArchetype.secondary.degradationReduction, 0.08);
  assert.equal(raceDepthTuning.stress.reliableProtection.primary, 0.12);
  assert.equal(raceDepthTuning.stress.reliableProtection.secondary, 0.06);
});

test('all player plan identities match the active 32-car roster and reserve drivers stay out', () => {
  const state = prepareGrid();
  const entrants = getWeekendEntrants(state.game);
  assert.equal(entrants.length, 32);
  assert.equal(Object.keys(state.weekend.racePlans).length, 2);
  assert.equal(
    Object.values(state.weekend.racePlans).every((plan) =>
      entrants.some(
        (entry) =>
          entry.id === plan.entryId &&
          entry.driverId === plan.driverId &&
          entry.isPlayerTeam,
      ),
    ),
    true,
  );
  assert.equal(
    entrants.some(
      (entry) =>
        entry.driverId === state.game.recruiting.reserveDriver?.prospectId,
    ),
    false,
  );
});
