import type { StaffMember } from '@/types/game';

export const staffModifierConfig = {
  budgetFixer: {
    eligibleTrait: 'Budget Fixer',
    repairDiscountPercent: 10,
    operatingCostDiscountPercent: 10,
  },
} as const;

export function hasActiveBudgetFixer(staff: readonly StaffMember[]) {
  return staff.some(
    (member) =>
      member.active &&
      member.trait === staffModifierConfig.budgetFixer.eligibleTrait,
  );
}

function calculateSingleDiscount(
  amount: number,
  staff: readonly StaffMember[],
  percent: number,
) {
  return hasActiveBudgetFixer(staff)
    ? Math.round(amount * (percent / 100))
    : 0;
}

export function getRepairCostDiscount(
  amount: number,
  staff: readonly StaffMember[],
) {
  return calculateSingleDiscount(
    amount,
    staff,
    staffModifierConfig.budgetFixer.repairDiscountPercent,
  );
}

export function getOperatingCostDiscount(
  amount: number,
  staff: readonly StaffMember[],
) {
  return calculateSingleDiscount(
    amount,
    staff,
    staffModifierConfig.budgetFixer.operatingCostDiscountPercent,
  );
}
