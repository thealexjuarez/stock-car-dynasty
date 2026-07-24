import type { Href } from 'expo-router';

import { weekendEconomyConfig } from '@/data/economy-config';
import { getRepairQuotes, RACE_READY_THRESHOLD } from '@/data/repair-config';
import { getNextRace } from '@/data/starter-game-state';
import { selectStandings } from '@/simulation/race-field';
import {
  getImmediateRecruitingRiskWarnings,
  getRecommendedRecruitingAction,
  selectProspectReveal,
} from '@/simulation/recruiting';
import { getRaceReadinessBlockers } from '@/simulation/vehicle-repair';
import type { GameState, VehicleReadiness } from '@/types/game';
import type {
  GameSessionState,
  RaceWeekendPhase,
} from '@/types/race-weekend';

export const HOME_ACTION_CENTER_LIMIT = 5;
export const HOME_ENTRY_ROW_HEIGHT = 72;

export type DashboardTone = 'red' | 'yellow' | 'green' | 'blue' | 'neutral';

export type HomeEntrySummary = {
  driverId: string;
  driverName: string;
  carNumber: string;
  overall: number;
  standingPosition: number;
  readiness: VehicleReadiness;
  condition: number;
  warning: string | null;
  href: Href;
};

export type HomeActionItem = {
  id: string;
  title: string;
  consequence: string;
  tone: DashboardTone;
  href: Href;
};

export type HomeRecruitingSummary = {
  prospectId: string;
  prospectName: string;
  apexRank: number;
  fieldSize: number;
  battleSummary: string;
  actionsRemaining: number;
  rpRemaining: number;
  riskMessage: string | null;
  recommendedAction: string;
  offerReady: boolean;
  targeted: boolean;
  href: Href;
};

const weekendRoutes: Record<
  RaceWeekendPhase,
  { label: string; href: Href; status: string }
> = {
  preview: {
    label: 'Start Race Weekend',
    href: '/race-preview',
    status: 'Race weekend is ready to begin',
  },
  'practice-result': {
    label: 'Review Practice',
    href: '/practice-result',
    status: 'Practice is complete',
  },
  qualifying: {
    label: 'Continue Qualifying',
    href: '/qualifying',
    status: 'Qualifying is in progress',
  },
  grid: {
    label: 'Review Starting Grid',
    href: '/starting-grid',
    status: 'The starting grid is set',
  },
  race: {
    label: 'Watch Race',
    href: '/live-race',
    status: 'The race is underway',
  },
  results: {
    label: 'Review Official Results',
    href: '/race-results',
    status: 'Official results are ready',
  },
};

function isTargeted(state: GameState, prospectId: string) {
  const progress = state.recruiting.campaigns[prospectId];
  return Boolean(
    progress &&
      (progress.actionHistory.length > 0 ||
        progress.recruitingCostToDate.rp > 0 ||
        progress.recruitingCostToDate.cash > 0),
  );
}

function selectRecruitingSummary(
  state: GameState,
): HomeRecruitingSummary | null {
  const warnings = getImmediateRecruitingRiskWarnings(state);
  const warningByProspect = new Map(
    warnings.map((warning) => [warning.prospectId, warning]),
  );
  const prospects = state.recruiting.prospects
    .filter((prospect) => {
      const progress = state.recruiting.campaigns[prospect.id];
      return progress && !progress.signed && !progress.signedByTeamId;
    })
    .sort((left, right) => {
      const leftProgress = state.recruiting.campaigns[left.id];
      const rightProgress = state.recruiting.campaigns[right.id];
      const leftRisk = warningByProspect.has(left.id) ? 1 : 0;
      const rightRisk = warningByProspect.has(right.id) ? 1 : 0;
      const leftTargeted = isTargeted(state, left.id) ? 1 : 0;
      const rightTargeted = isTargeted(state, right.id) ? 1 : 0;
      return (
        rightRisk - leftRisk ||
        rightTargeted - leftTargeted ||
        rightProgress.interest - leftProgress.interest ||
        left.id.localeCompare(right.id)
      );
    });
  const prospect = prospects[0];
  if (!prospect) return null;

  const progress = state.recruiting.campaigns[prospect.id];
  const view = selectProspectReveal(state, prospect.id);
  const warning = warningByProspect.get(prospect.id);
  const recommended = getRecommendedRecruitingAction(state, prospect.id);
  const rivalLeader = [...progress.rivals].sort(
    (left, right) =>
      right.interest - left.interest || left.teamId.localeCompare(right.teamId),
  )[0];
  const gap = rivalLeader ? progress.interest - rivalLeader.interest : null;
  const battleSummary =
    gap === null
      ? 'No outside pressure'
      : gap >= 0
        ? `Apex leads by ${gap}`
        : `Apex trails by ${Math.abs(gap)}`;

  return {
    prospectId: prospect.id,
    prospectName: prospect.name,
    apexRank: view.recruitingBattle.apexRank,
    fieldSize: progress.rivals.length + 1,
    battleSummary,
    actionsRemaining: Math.max(0, 3 - progress.weeklyActionCount),
    rpRemaining: state.recruiting.spendableRp,
    riskMessage: warning?.message ?? null,
    recommendedAction:
      recommended?.contextualName ??
      recommended?.canonicalName ??
      'Review the driver market',
    offerReady: recommended?.id === 'contract-offer',
    targeted: isTargeted(state, prospect.id),
    href: {
      pathname: '/recruiting/[id]',
      params: { id: prospect.id },
    },
  };
}

function selectRepairEstimate(state: GameState) {
  return state.vehicles
    .filter((vehicle) => vehicle.active && vehicle.damage > 0)
    .reduce((total, vehicle) => {
      const quotes = getRepairQuotes(vehicle, state.staff);
      const quote =
        quotes.find((item) => item.approach === 'recommended') ?? quotes[0];
      return total + (quote?.cost ?? 0);
    }, 0);
}

export function selectHomeDashboard(session: GameSessionState) {
  const state = session.game;
  const { race, track } = getNextRace(state);
  const standings = selectStandings(state);
  const standingByDriver = new Map(
    standings.map((standing) => [standing.driverId, standing]),
  );
  const blockers = getRaceReadinessBlockers(state);
  const recruiting = selectRecruitingSummary(state);
  const recruitingWarnings = getImmediateRecruitingRiskWarnings(state);
  const lastSettlement = state.economy.settlementHistory.at(-1);

  const entries: HomeEntrySummary[] = state.drivers
    .filter((driver) => driver.active)
    .map((driver) => {
      const vehicle = state.vehicles.find(
        (item) => item.active && item.assignedDriverId === driver.id,
      );
      if (!vehicle) {
        throw new Error(`Home dashboard requires a vehicle for ${driver.name}`);
      }
      const standing = standingByDriver.get(driver.id);
      if (!standing) {
        throw new Error(`Home dashboard requires standings for ${driver.name}`);
      }
      return {
        driverId: driver.id,
        driverName: driver.name,
        carNumber: driver.carNumber,
        overall: driver.overall,
        standingPosition: standing.position,
        readiness: vehicle.readiness,
        condition: vehicle.condition,
        warning:
          vehicle.readiness === 'Not Ready'
            ? 'Blocks the next weekend'
            : vehicle.readiness === 'At Risk'
              ? 'Needs work'
              : null,
        href: {
          pathname: '/drivers/[id]',
          params: { id: driver.id },
        },
      };
    });

  const firstBlocker = blockers[0];
  const weekendAction = weekendRoutes[session.weekend.phase];
  const primaryAction = firstBlocker
    ? {
        label: 'Finish Repairs',
        href: {
          pathname: '/vehicles/[number]',
          params: { number: firstBlocker.number },
        } as Href,
        status:
          blockers.length === 1
            ? `${
                state.drivers.find(
                  (driver) => driver.id === firstBlocker.assignedDriverId,
                )?.name ?? `Car #${firstBlocker.number}`
              } needs repairs before ${track?.name ?? 'the next race'}`
            : `Both cars need repairs before ${track?.name ?? 'the next race'}`,
      }
    : weekendAction;

  const actions: HomeActionItem[] = [];
  if (lastSettlement && lastSettlement.operatingCostShortfall > 0) {
    actions.push({
      id: 'operating-shortfall',
      title: 'Weekend books need attention',
      consequence: `$${lastSettlement.operatingCostShortfall.toLocaleString()} operating shortfall`,
      tone: 'red',
      href: '/(tabs)/team',
    });
  }
  blockers.forEach((vehicle) => {
    const driver = state.drivers.find(
      (item) => item.id === vehicle.assignedDriverId,
    );
    const raceReadyQuote = getRepairQuotes(vehicle, state.staff)
      .filter((quote) => quote.becomesRaceReady)
      .sort((left, right) => left.cost - right.cost)[0];
    actions.push({
      id: `repair-${vehicle.id}`,
      title: `Car #${vehicle.number} needs repairs`,
      consequence: `${driver?.name ?? 'Entry'} is ${vehicle.condition}% ready${
        raceReadyQuote ? ` · from $${raceReadyQuote.cost.toLocaleString()}` : ''
      }`,
      tone: 'red',
      href: {
        pathname: '/vehicles/[number]',
        params: { number: vehicle.number },
      },
    });
  });
  recruitingWarnings.forEach((warning) => {
    actions.push({
      id: `recruiting-risk-${warning.prospectId}`,
      title: `${warning.prospectName} may sign elsewhere`,
      consequence: 'Make a recruiting move before the week advances',
      tone: 'yellow',
      href: {
        pathname: '/recruiting/[id]',
        params: { id: warning.prospectId },
      },
    });
  });
  if (recruiting?.offerReady) {
    actions.push({
      id: `offer-${recruiting.prospectId}`,
      title: `${recruiting.prospectName} is ready for an offer`,
      consequence: 'Review the contract requirements',
      tone: 'green',
      href: recruiting.href,
    });
  } else if (
    recruiting?.targeted &&
    recruiting.actionsRemaining > 0 &&
    recruiting.rpRemaining > 0
  ) {
    actions.push({
      id: `recruiting-${recruiting.prospectId}`,
      title: `${recruiting.actionsRemaining} recruiting ${
        recruiting.actionsRemaining === 1 ? 'action remains' : 'actions remain'
      }`,
      consequence: `Best move: ${recruiting.recommendedAction}`,
      tone: 'blue',
      href: recruiting.href,
    });
  }

  const warningCount =
    entries.filter((entry) => entry.readiness !== 'Ready').length +
    recruitingWarnings.length +
    (lastSettlement && lastSettlement.operatingCostShortfall > 0 ? 1 : 0);

  return {
    teamName: state.team.name,
    seriesLabel: `ERCA Season ${state.season}`,
    week: state.week,
    currentDate: state.currentDate,
    cash: state.team.cash,
    rp: state.recruiting.spendableRp,
    exp: state.drivers
      .filter((driver) => driver.active)
      .reduce((total, driver) => total + driver.exp, 0),
    warningCount,
    race: {
      name: race?.name ?? 'Season complete',
      trackName: track?.name ?? 'No event scheduled',
      trackType: track?.type ?? 'Off week',
      week: race?.week ?? state.week,
      round: race?.round ?? state.calendar.length,
      totalRounds: state.calendar.length,
      eligibilityLabel: blockers.length === 0 ? 'Both cars are ready' : primaryAction.status,
      readinessRequirement: RACE_READY_THRESHOLD,
      bothCarsEligible: blockers.length === 0,
      primaryAction,
    },
    entries,
    recruiting,
    standings: {
      leader: standings[0],
      apex: standings.filter((standing) => standing.isPlayerTeam),
      href: '/(tabs)/league' as Href,
    },
    finances: {
      sponsorIncome: state.sponsors.some((sponsor) => sponsor.active)
        ? weekendEconomyConfig.starterSponsorRaceIncome
        : 0,
      knownRepairEstimate: selectRepairEstimate(state),
      href: '/(tabs)/team' as Href,
    },
    actionCenter: {
      items: actions.slice(0, HOME_ACTION_CENTER_LIMIT),
      hiddenCount: Math.max(0, actions.length - HOME_ACTION_CENTER_LIMIT),
    },
  };
}
