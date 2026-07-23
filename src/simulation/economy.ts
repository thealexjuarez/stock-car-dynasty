import {
  resolveRacePayout,
  weekendEconomyConfig,
} from '@/data/economy-config';
import { getOperatingCostDiscount } from '@/data/staff-modifier-config';
import type { GameState, WeekendSettlementRecord } from '@/types/game';
import type { RaceResult } from '@/types/race-weekend';

export function getSettlementTransactionId(
  result: Pick<RaceResult, 'raceId' | 'seed'>,
) {
  return `settlement:${result.raceId}:${result.seed}`;
}

export function calculateWeekendSettlement(
  state: GameState,
  result: RaceResult,
): WeekendSettlementRecord {
  const winningsByCar = result.entries
    .filter((entry) => entry.isPlayerTeam && entry.vehicleId)
    .map((entry) => ({
      vehicleId: entry.vehicleId!,
      carNumber: entry.carNumber,
      finishPosition: entry.finishPosition,
      amount: resolveRacePayout(entry.finishPosition),
    }));
  const totalRaceWinnings = winningsByCar.reduce(
    (total, line) => total + line.amount,
    0,
  );
  const sponsorIncome = state.sponsors.some((sponsor) => sponsor.active)
    ? weekendEconomyConfig.starterSponsorRaceIncome
    : 0;
  const operatingCostBase = weekendEconomyConfig.operatingCost;
  const budgetFixerDiscount = getOperatingCostDiscount(
    operatingCostBase,
    state.staff,
  );
  const discountedOperatingCost =
    operatingCostBase - budgetFixerDiscount;
  const availableForOperatingCost =
    state.team.cash + totalRaceWinnings + sponsorIncome;
  const operatingCostCharged = Math.min(
    discountedOperatingCost,
    availableForOperatingCost,
  );
  const operatingCostShortfall =
    discountedOperatingCost - operatingCostCharged;
  const repairSpending = state.economy.repairTransactions
    .filter((transaction) => transaction.raceId === result.raceId)
    .reduce((total, transaction) => total + transaction.chargedCost, 0);
  const settlementCashChange =
    totalRaceWinnings + sponsorIncome - operatingCostCharged;
  const netWeekend = settlementCashChange - repairSpending;
  const cashBeforeWeekend = state.team.cash + repairSpending;

  return {
    id: getSettlementTransactionId(result),
    raceId: result.raceId,
    season: state.season,
    week: state.week,
    winningsByCar,
    totalRaceWinnings,
    sponsorIncome,
    operatingCostBase,
    budgetFixerDiscount,
    operatingCostCharged,
    operatingCostShortfall,
    repairSpending,
    settlementCashChange,
    netWeekend,
    cashBeforeWeekend,
    cashAfter: Math.max(0, state.team.cash + settlementCashChange),
  };
}

export function applyWeekendEconomy(
  state: GameState,
  result: RaceResult,
): GameState {
  const settlement = calculateWeekendSettlement(state, result);

  if (state.economy.processedTransactionIds.includes(settlement.id)) {
    return state;
  }

  return {
    ...state,
    team: {
      ...state.team,
      cash: settlement.cashAfter,
    },
    economy: {
      ...state.economy,
      processedTransactionIds: [
        ...state.economy.processedTransactionIds,
        settlement.id,
      ],
      settlementHistory: [
        ...state.economy.settlementHistory,
        settlement,
      ],
    },
  };
}
