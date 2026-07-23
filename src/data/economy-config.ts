export type RacePayoutTier = {
  minimumPosition: number;
  maximumPosition: number;
  amount: number;
};

export const racePayoutTiers = [
  { minimumPosition: 1, maximumPosition: 1, amount: 32_000 },
  { minimumPosition: 2, maximumPosition: 2, amount: 28_000 },
  { minimumPosition: 3, maximumPosition: 3, amount: 25_000 },
  { minimumPosition: 4, maximumPosition: 5, amount: 22_000 },
  { minimumPosition: 6, maximumPosition: 10, amount: 18_000 },
  { minimumPosition: 11, maximumPosition: 15, amount: 14_000 },
  { minimumPosition: 16, maximumPosition: 20, amount: 11_000 },
  { minimumPosition: 21, maximumPosition: 25, amount: 8_500 },
  { minimumPosition: 26, maximumPosition: 30, amount: 6_500 },
  { minimumPosition: 31, maximumPosition: 36, amount: 5_000 },
] as const satisfies readonly RacePayoutTier[];

export const weekendEconomyConfig = {
  operatingCost: 18_000,
  starterSponsorRaceIncome: 26_000,
  supportedPayoutPositions: 36,
} as const;

export function resolveRacePayout(position: number) {
  if (!Number.isInteger(position) || position < 1) {
    throw new Error(`Invalid finishing position: ${position}`);
  }

  const tier = racePayoutTiers.find(
    (item) =>
      position >= item.minimumPosition && position <= item.maximumPosition,
  );

  if (!tier) {
    throw new Error(
      `No ERCA payout is configured for finishing position ${position}`,
    );
  }

  return tier.amount;
}
