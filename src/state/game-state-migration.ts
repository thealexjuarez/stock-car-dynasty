import {
  aidenVossCanon,
  aidenVossSponsorLead,
} from '@/data/driver-canon';
import { manufacturerCatalog } from '@/data/manufacturer-data';
import {
  createInitialRecruitingState,
  createProspectProgress,
} from '@/data/prospect-data';
import { createInitialRaceFieldState } from '@/data/erca-field-data';
import { getWeekendEntrants } from '@/data/race-presentation-data';
import { starterGameState } from '@/data/starter-game-state';
import { createRecommendedRacePlan } from '@/simulation/race-depth';
import { updateVehicleCondition } from '@/simulation/vehicle-repair';
import type {
  Driver,
  DriverArchetype,
  EconomyState,
  GameState,
  ManufacturerId,
} from '@/types/game';
import type { GameSessionState } from '@/types/race-weekend';
import type {
  ProspectRecruitingProgress,
  RecruitingState,
  ReserveDriver,
} from '@/types/recruiting';
import type { DriverStanding, RaceFieldState } from '@/types/race-field';

export const CURRENT_GAME_STATE_VERSION = 6;

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

function normalizeProgress(
  fallback: ProspectRecruitingProgress,
  progress: Partial<ProspectRecruitingProgress> | undefined,
): ProspectRecruitingProgress {
  const legacy = progress as
    | (Partial<ProspectRecruitingProgress> & { scoutingConfidence?: number })
    | undefined;
  const { scoutingConfidence: legacyScoutingKnowledge, ...progressWithoutLegacy } =
    legacy ?? {};
  return {
    ...fallback,
    ...progressWithoutLegacy,
    scoutingKnowledge:
      progress?.scoutingKnowledge ??
      legacyScoutingKnowledge ??
      fallback.scoutingKnowledge,
    signingThreshold: progress?.signingThreshold ?? fallback.signingThreshold,
    prospectTier: progress?.prospectTier ?? fallback.prospectTier,
    rivals: (progress?.rivals ?? fallback.rivals).map((rival) => ({ ...rival })),
    battleHistory: (progress?.battleHistory ?? []).map((entry) => ({
      ...entry,
      details: [...entry.details],
    })),
    completedActionUses: { ...(progress?.completedActionUses ?? {}) },
    actionsUsedThisWeekend: [...(progress?.actionsUsedThisWeekend ?? [])],
    actionHistory: (progress?.actionHistory ?? []).map((entry) => ({
      ...entry,
      reasons: [...entry.reasons],
    })),
    relationshipPaths: [...(progress?.relationshipPaths ?? [])],
    offerHistory: (progress?.offerHistory ?? []).map((entry) => ({
      ...entry,
      breakdown: {
        ...entry.breakdown,
        status:
          entry.breakdown.status ??
          (entry.accepted ? 'Will Sign' : 'Not Available'),
        willSign: entry.breakdown.willSign ?? entry.accepted,
        unmetDealbreakers: [...(entry.breakdown.unmetDealbreakers ?? [])],
        requirements: (entry.breakdown.requirements ?? []).map((requirement) => ({
          ...requirement,
        })),
      },
    })),
    recruitingCostToDate: {
      ...fallback.recruitingCostToDate,
      ...(progress?.recruitingCostToDate ?? {}),
    },
  };
}

function normalizeRecruiting(
  recruiting: Partial<RecruitingState> | undefined,
  recruitingPull: number,
  brandPower: number,
): RecruitingState {
  const initial = createInitialRecruitingState(recruitingPull, brandPower);
  const campaigns = Object.fromEntries(
    initial.prospects.map((prospect) => {
      const fallback =
        initial.campaigns[prospect.id] ??
        createProspectProgress(prospect, recruitingPull, initial.visibility);
      return [
        prospect.id,
        normalizeProgress(fallback, recruiting?.campaigns?.[prospect.id]),
      ];
    }),
  );
  const reserveDriver: ReserveDriver | undefined = recruiting?.reserveDriver
    ? {
        ...recruiting.reserveDriver,
        stats: { ...recruiting.reserveDriver.stats },
        archetypes: [
          recruiting.reserveDriver.archetypes[0],
          recruiting.reserveDriver.archetypes[1],
        ],
        developmentHistory: [...recruiting.reserveDriver.developmentHistory],
        sponsorLeads: recruiting.reserveDriver.sponsorLeads.map((lead) => ({
          ...lead,
          projectedRaceBacking: { ...lead.projectedRaceBacking },
        })),
        ...(recruiting.reserveDriver.sponsorPackage
          ? {
              sponsorPackage: {
                ...recruiting.reserveDriver.sponsorPackage,
                projectedRaceBacking: {
                  ...recruiting.reserveDriver.sponsorPackage
                    .projectedRaceBacking,
                },
                conditions: [
                  ...recruiting.reserveDriver.sponsorPackage.conditions,
                ],
              },
            }
          : {}),
      }
    : undefined;

  return {
    ...initial,
    ...recruiting,
    prospects: initial.prospects,
    campaigns,
    processedTransactionIds: [
      ...(recruiting?.processedTransactionIds ?? []),
    ],
    reserveDriver,
  };
}

function normalizeRaceField(
  raceField: Partial<RaceFieldState> | undefined,
): RaceFieldState {
  const initial = createInitialRaceFieldState();
  const priorOrganizations = new Map(
    (raceField?.organizations ?? []).map((organization) => [
      organization.id,
      organization,
    ]),
  );
  const priorDrivers = new Map(
    (raceField?.opponentDrivers ?? []).map((driver) => [driver.id, driver]),
  );
  const priorEntries = new Map(
    (raceField?.entries ?? []).map((entry) => [entry.id, entry]),
  );
  const priorStandings = new Map(
    (raceField?.standings ?? []).map((standing) => [
      standing.entryId,
      standing,
    ]),
  );
  const standings = initial.standings.map((fallback) => {
    const standing = priorStandings.get(fallback.entryId) as
      | Partial<DriverStanding>
      | undefined;
    return {
      ...fallback,
      ...standing,
      entryId: fallback.entryId,
      driverId: fallback.driverId,
    };
  });

  return {
    organizations: initial.organizations.map((fallback) => ({
      ...fallback,
      ...priorOrganizations.get(fallback.id),
      id: fallback.id,
      name: fallback.name,
      shortCode: fallback.shortCode,
      manufacturerId: fallback.manufacturerId,
      primaryColor: fallback.primaryColor,
      accentColor: fallback.accentColor,
      isPlayerTeam: fallback.isPlayerTeam,
    })),
    opponentDrivers: initial.opponentDrivers.map((fallback) => {
      const prior = priorDrivers.get(fallback.id);
      return {
        ...fallback,
        ...prior,
        id: fallback.id,
        name: fallback.name,
        teamId: fallback.teamId,
        carNumber: fallback.carNumber,
        manufacturerId: fallback.manufacturerId,
        active: fallback.active,
        archetypes: [
          prior?.archetypes[0] ?? fallback.archetypes[0],
          prior?.archetypes[1] ?? fallback.archetypes[1],
        ],
        stats: { ...fallback.stats, ...prior?.stats },
      };
    }),
    entries: initial.entries.map((fallback) => {
      const prior = priorEntries.get(fallback.id);
      return {
        ...fallback,
        ...prior,
        id: fallback.id,
        carNumber: fallback.carNumber,
        driverId: fallback.driverId,
        teamId: fallback.teamId,
        manufacturerId: fallback.manufacturerId,
        active: fallback.active,
        series: fallback.series,
        isPlayerTeam: fallback.isPlayerTeam,
      };
    }),
    standings,
    processedRaceIds: unique(raceField?.processedRaceIds ?? []),
  };
}

export function normalizeGameState(state: GameState): GameState {
  const legacyState = state as GameState & {
    stateVersion?: number;
    economy?: Partial<EconomyState>;
    recruiting?: Partial<RecruitingState>;
    raceField?: Partial<RaceFieldState>;
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
    staff: [
      ...state.staff.map((member) => {
        if (member.id === 'staff-dana-price' || member.name === 'Dana Price') {
          return {
            ...member,
            id: 'staff-dana-pierce',
            name: 'Dana Pierce',
            effect:
              '+10% scouting effectiveness on short-track and regional prospects.',
          };
        }
        if (member.id === 'staff-mia-torres' || member.name === 'Mia Torres') {
          return {
            ...member,
            id: 'staff-ava-larkin',
            name: 'Ava Larkin',
            effect: '+10% eligible prospect social actions.',
          };
        }
        return { ...member };
      }),
      ...(!state.staff.some(
        (member) =>
          member.id === 'staff-marco-desoto' || member.name === 'Marco DeSoto',
      )
        ? starterGameState.staff
            .filter((member) => member.id === 'staff-marco-desoto')
            .map((member) => ({ ...member }))
        : []),
    ],
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
    recruiting: normalizeRecruiting(
      legacyState.recruiting,
      state.team.recruitingPull,
      state.team.brandPower,
    ),
    raceField: normalizeRaceField(legacyState.raceField),
  };
}

export function normalizeGameSessionState(
  state: GameSessionState & { processedRepairActionIds?: string[] },
): GameSessionState {
  const game = normalizeGameState(state.game);
  const preservedPlans = { ...(state.weekend.racePlans ?? {}) };
  const racePlans =
    state.weekend.phase === 'grid' &&
    state.weekend.qualifying &&
    !state.weekend.race
      ? Object.fromEntries(
          getWeekendEntrants(game)
            .filter((entry) => entry.isPlayerTeam)
            .map((entry) => [
              entry.id,
              preservedPlans[entry.id] ??
                createRecommendedRacePlan(
                  game,
                  entry,
                  `${state.weekend.seed}:recommended`,
                ),
            ]),
        )
      : preservedPlans;
  return {
    game: {
      ...game,
      economy: normalizeEconomy(
        game.economy,
        state.processedRepairActionIds,
      ),
    },
    weekend: {
      ...state.weekend,
      racePlans,
      ...(state.weekend.race &&
      !state.weekend.race.depthFacts &&
      (state.weekend.phase === 'race' || state.weekend.phase === 'results')
        ? {
            race: {
              ...state.weekend.race,
              legacyRaceDepth: true as const,
            },
          }
        : {}),
    },
  };
}
