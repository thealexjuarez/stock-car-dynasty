import type { RepairOptionId } from '@/types/game';

export const RACE_READY_THRESHOLD = 75;

/**
 * PROVISIONAL: this caution band is presentation/balance tuning, not a locked rule.
 * Cars at or above the locked 75% threshold remain eligible to race.
 */
export const PROVISIONAL_READY_THRESHOLD = 85;

/**
 * PROVISIONAL ECONOMY ASSUMPTION:
 * Current two-car ERCA payout tuning averages $19,750 per weekend.
 * Standard Repair is $3,500, or about 17.7% of that weekly income.
 */
export const PROVISIONAL_AVERAGE_WEEKLY_EARNINGS = 19_750;

export type RepairOption = {
  id: RepairOptionId;
  label: string;
  cost: number;
  conditionRestored: number;
  description: string;
};

export const repairOptions = [
  {
    id: 'quick-fix',
    label: 'Quick Fix',
    cost: 2_000,
    conditionRestored: 5,
    description: 'Budget patch for light race wear.',
  },
  {
    id: 'standard-repair',
    label: 'Standard Repair',
    cost: 3_500,
    conditionRestored: 12,
    description: 'Balanced shop work for a normal turnaround.',
  },
  {
    id: 'full-rebuild',
    label: 'Full Rebuild',
    cost: 7_000,
    conditionRestored: 30,
    description: 'Major teardown for the largest condition gain.',
  },
] as const satisfies readonly RepairOption[];

export function getRepairOption(optionId: RepairOptionId): RepairOption {
  const option = repairOptions.find((item) => item.id === optionId);
  if (!option) {
    throw new Error(`Unknown repair option: ${optionId}`);
  }
  return option;
}
