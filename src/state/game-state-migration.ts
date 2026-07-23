import {
  aidenVossCanon,
  aidenVossSponsorLead,
} from '@/data/driver-canon';
import { manufacturerCatalog } from '@/data/manufacturer-data';
import { starterGameState } from '@/data/starter-game-state';
import { updateVehicleCondition } from '@/simulation/vehicle-repair';
import type {
  Driver,
  DriverArchetype,
  EconomyState,
  GameState,
  ManufacturerId,
} from '@/types/game';
import type { GameSessionState } from '@/types/race-weekend';

export const CURRENT_GAME_STATE_VERSION = 2;

const canonicalArchetypes = new Set<DriverArchetype>([
  'Complete Driver',
  'Road Course Specialist',
  'Short Track Specialist',
  'Superspeedway Specialist',
  'Long Run Driver',
  'Aggressive Driver',
  'Reliable Journeyman',
  'Development Prospect',
]);

function unique(values: readonly string[]) {
  return [...new Set(values)];
}

export function normalizeManufacturerId(
  manufacturerId: string | undefined,
): ManufacturerId {
  if (
    manufacturerId === 'fard' ||
    manufacturerId === 'chevrolat' ||
    manufacturerId === 'toyoda'
  ) {
    return manufacturerId;
  }

  if (
    manufacturerId === 'ranger' ||
    manufacturerId === 'ranger-performance'
  ) {
    return 'chevrolat';
  }

  return starterGameState.team.manufacturerId;
}

function normalizeArchetypes(
  driver: Driver,
  fallback: Driver,
): [DriverArchetype, DriverArchetype] {
  const legacyArchetypes = driver.archetypes as unknown as string[];
  const valid = legacyArchetypes.filter(
    (archetype): archetype is DriverArchetype =>
      canonicalArchetypes.has(archetype as DriverArchetype),
  );

  return [
    valid[0] ?? fallback.archetypes[0],
    valid[1] ?? fallback.archetypes[1],
  ];
}

function normalizeDriver(driver: Driver): Driver {
  const fallback =
    starterGameState.drivers.find((item) => item.id === driver.id) ?? driver;
  const legacyDriver = driver as Driver & {
    sponsorLeads?: Driver['sponsorLeads'];
  };
  const normalized: Driver = {
    ...fallback,
    ...driver,
    archetypes: normalizeArchetypes(driver, fallback),
    stats: { ...fallback.stats, ...driver.stats },
    growthModifiers: [...(driver.growthModifiers ?? [])],
    sponsorLeads: [...(legacyDriver.sponsorLeads ?? [])],
  };

  if (driver.id !== aidenVossCanon.id) {
    return normalized;
  }

  return {
    ...normalized,
    ...aidenVossCanon,
    sponsorLeads: [
      ...normalized.sponsorLeads.filter(
        (lead) => lead.id !== aidenVossSponsorLead.id,
      ),
      aidenVossSponsorLead,
    ],
  };
}

function normalizeEconomy(
  economy: Partial<EconomyState> | undefined,
  legacyRepairActionIds: readonly string[] = [],
): EconomyState {
  return {
    processedTransactionIds: unique([
      ...(economy?.processedTransactionIds ?? []),
      ...legacyRepairActionIds,
    ]),
    repairTransactions: [...(economy?.repairTransactions ?? [])],
    settlementHistory: [...(economy?.settlementHistory ?? [])],
  };
}

export function normalizeGameState(state: GameState): GameState {
  const legacyState = state as GameState & {
    stateVersion?: number;
    economy?: Partial<EconomyState>;
    team: GameState['team'] & { manufacturerId?: string };
  };

  return {
    ...starterGameState,
    ...state,
    stateVersion: CURRENT_GAME_STATE_VERSION,
    team: {
      ...starterGameState.team,
      ...state.team,
      manufacturerId: normalizeManufacturerId(
        legacyState.team?.manufacturerId,
      ),
    },
    drivers: state.drivers.map(normalizeDriver),
    vehicles: state.vehicles.map((vehicle) =>
      updateVehicleCondition(
        vehicle,
        vehicle.condition,
        vehicle.note ?? 'Vehicle state restored.',
      ),
    ),
    staff: state.staff.map((member) => ({ ...member })),
    sponsors: state.sponsors.map((sponsor) => ({ ...sponsor })),
    manufacturers: manufacturerCatalog.map((manufacturer) => ({
      ...manufacturer,
      presentation: { ...manufacturer.presentation },
    })),
    facilities: state.facilities.map((facility) => ({ ...facility })),
    tracks: state.tracks.map((track) => ({
      ...track,
      keyStats: [...track.keyStats],
    })),
    calendar: state.calendar.map((event) => ({ ...event })),
    economy: normalizeEconomy(legacyState.economy),
  };
}

export function normalizeGameSessionState(
  state: GameSessionState & { processedRepairActionIds?: string[] },
): GameSessionState {
  const game = normalizeGameState(state.game);
  return {
    game: {
      ...game,
      economy: normalizeEconomy(
        game.economy,
        state.processedRepairActionIds,
      ),
    },
    weekend: { ...state.weekend },
  };
}
