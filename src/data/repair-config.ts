import { getRepairCostDiscount } from '@/data/staff-modifier-config';
import type {
  DamageClassification,
  RepairApproach,
  RepairOptionId,
  StaffMember,
  Vehicle,
} from '@/types/game';

export const RACE_READY_THRESHOLD = 75;

/**
 * PROVISIONAL: presentation-only caution band. Cars at or above the locked
 * 75% threshold remain eligible to race.
 */
export const PROVISIONAL_READY_THRESHOLD = 85;

export type DamageClassDefinition = {
  id: DamageClassification;
  label: string;
  recommendedLabel: string;
  minimumDamage: number;
  maximumDamage: number;
  lockedCostBand: { minimum: number; maximum: number };
  provisionalCosts: Record<RepairApproach, number>;
};

/**
 * Damage labels and cost bands are Bible-locked. Damage percentage boundaries
 * and the three exact approach prices are centralized provisional tuning.
 */
export const damageClassifications = [
  {
    id: 'clean-light',
    label: 'Clean / Light',
    recommendedLabel: 'Light Service',
    minimumDamage: 0,
    maximumDamage: 5,
    lockedCostBand: { minimum: 2_000, maximum: 5_000 },
    provisionalCosts: { minimum: 2_000, recommended: 3_500, full: 5_000 },
  },
  {
    id: 'minor',
    label: 'Minor',
    recommendedLabel: 'Minor Repair',
    minimumDamage: 6,
    maximumDamage: 15,
    lockedCostBand: { minimum: 6_000, maximum: 12_000 },
    provisionalCosts: { minimum: 6_000, recommended: 9_000, full: 12_000 },
  },
  {
    id: 'moderate',
    label: 'Moderate',
    recommendedLabel: 'Moderate Repair',
    minimumDamage: 16,
    maximumDamage: 30,
    lockedCostBand: { minimum: 13_000, maximum: 25_000 },
    provisionalCosts: {
      minimum: 13_000,
      recommended: 19_000,
      full: 25_000,
    },
  },
  {
    id: 'heavy',
    label: 'Heavy',
    recommendedLabel: 'Heavy Repair',
    minimumDamage: 31,
    maximumDamage: 50,
    lockedCostBand: { minimum: 26_000, maximum: 45_000 },
    provisionalCosts: {
      minimum: 26_000,
      recommended: 35_000,
      full: 45_000,
    },
  },
  {
    id: 'major',
    label: 'Major',
    recommendedLabel: 'Major Repair',
    minimumDamage: 51,
    maximumDamage: 75,
    lockedCostBand: { minimum: 46_000, maximum: 75_000 },
    provisionalCosts: {
      minimum: 46_000,
      recommended: 60_000,
      full: 75_000,
    },
  },
  {
    id: 'near-total',
    label: 'Near-Total',
    recommendedLabel: 'Near-Total Rebuild',
    minimumDamage: 76,
    maximumDamage: 100,
    lockedCostBand: { minimum: 80_000, maximum: 120_000 },
    provisionalCosts: {
      minimum: 80_000,
      recommended: 100_000,
      full: 120_000,
    },
  },
] as const satisfies readonly DamageClassDefinition[];

const approachPresentation: Record<
  RepairApproach,
  { label: string; description: string }
> = {
  minimum: {
    label: 'Minimum Repair',
    description: 'The least shop work appropriate for the current damage.',
  },
  recommended: {
    label: 'Recommended Repair',
    description: 'The crew-recommended balance of recovery and cost.',
  },
  full: {
    label: 'Full Repair',
    description: 'Complete the available restoration for this damage report.',
  },
};

export type RepairQuote = {
  id: RepairOptionId;
  approach: RepairApproach;
  label: string;
  description: string;
  damageClass: DamageClassification;
  damageClassLabel: string;
  baseCost: number;
  budgetFixerDiscount: number;
  cost: number;
  currentCondition: number;
  projectedCondition: number;
  conditionRestored: number;
  becomesRaceReady: boolean;
};

export function getDamageClassification(
  damage: number,
): DamageClassification {
  const normalizedDamage = Math.max(0, Math.min(100, Math.round(damage)));
  const classification = damageClassifications.find(
    (item) =>
      normalizedDamage >= item.minimumDamage &&
      normalizedDamage <= item.maximumDamage,
  );
  return classification?.id ?? 'near-total';
}

export function getDamageClassDefinition(
  damageClass: DamageClassification,
) {
  const definition = damageClassifications.find(
    (item) => item.id === damageClass,
  );
  if (!definition) {
    throw new Error(`Unknown damage classification: ${damageClass}`);
  }
  return definition;
}

function getProjectedCondition(
  condition: number,
  approach: RepairApproach,
) {
  if (approach === 'minimum') {
    return Math.min(
      100,
      Math.max(condition + 5, condition < RACE_READY_THRESHOLD ? 75 : 0),
    );
  }
  if (approach === 'recommended') {
    return Math.min(100, Math.max(condition + 10, 90));
  }
  return 100;
}

export function getRepairQuotes(
  vehicle: Pick<Vehicle, 'condition' | 'damage' | 'damageClass'>,
  staff: readonly StaffMember[],
): RepairQuote[] {
  if (vehicle.condition >= 100) {
    return [];
  }

  const authoritativeClass = getDamageClassification(vehicle.damage);
  const definition = getDamageClassDefinition(authoritativeClass);
  const seenTargets = new Set<number>();

  return (['minimum', 'recommended', 'full'] as const).flatMap(
    (approach) => {
      const projectedCondition = getProjectedCondition(
        vehicle.condition,
        approach,
      );
      if (
        projectedCondition <= vehicle.condition ||
        seenTargets.has(projectedCondition)
      ) {
        return [];
      }
      seenTargets.add(projectedCondition);

      const baseCost = definition.provisionalCosts[approach];
      const budgetFixerDiscount = getRepairCostDiscount(baseCost, staff);
      const presentation = approachPresentation[approach];

      return [
        {
          id: `${authoritativeClass}:${approach}`,
          approach,
          label:
            approach === 'recommended'
              ? definition.recommendedLabel
              : presentation.label,
          description: presentation.description,
          damageClass: authoritativeClass,
          damageClassLabel: definition.label,
          baseCost,
          budgetFixerDiscount,
          cost: baseCost - budgetFixerDiscount,
          currentCondition: vehicle.condition,
          projectedCondition,
          conditionRestored: projectedCondition - vehicle.condition,
          becomesRaceReady:
            vehicle.condition < RACE_READY_THRESHOLD &&
            projectedCondition >= RACE_READY_THRESHOLD,
        },
      ];
    },
  );
}

export function getRepairQuote(
  vehicle: Pick<Vehicle, 'condition' | 'damage' | 'damageClass'>,
  optionId: RepairOptionId,
  staff: readonly StaffMember[],
) {
  const quote = getRepairQuotes(vehicle, staff).find(
    (item) => item.id === optionId,
  );
  if (!quote) {
    throw new Error('That repair is not valid for the current damage report');
  }
  return quote;
}
