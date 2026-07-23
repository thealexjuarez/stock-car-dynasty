import type { Track } from '@/types/game';

export const raceWeekendTuning = {
  qualifyingVariance: 5,
  raceVariance: 8,
  aiBaselineCenter: 58,
  aiPaceFactorScale: 400,
  payout: {
    winner: 14_000,
    positionStep: 750,
    minimum: 2_500,
  },
  exp: {
    base: 180,
    positionStep: 8,
    minimum: 60,
    finishBonus: 20,
  },
  cautionDnfRisk: {
    Low: 0.03,
    Medium: 0.06,
    High: 0.11,
  },
} as const satisfies {
  qualifyingVariance: number;
  raceVariance: number;
  aiBaselineCenter: number;
  aiPaceFactorScale: number;
  payout: Record<string, number>;
  exp: Record<string, number>;
  cautionDnfRisk: Record<Track['cautionRisk'], number>;
};
