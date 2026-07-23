import {
  getDamageClassification,
  getRepairQuote,
  PROVISIONAL_READY_THRESHOLD,
  RACE_READY_THRESHOLD,
} from '@/data/repair-config';
import type {
  GameState,
  RepairOptionId,
  Vehicle,
  VehicleReadiness,
} from '@/types/game';

export type RepairCommand = {
  actionId: string;
  raceId: string;
  vehicleId: string;
  optionId: RepairOptionId;
};

const clampCondition = (condition: number) =>
  Math.max(0, Math.min(100, Math.round(condition)));

export function getVehicleReadiness(condition: number): VehicleReadiness {
  if (condition < RACE_READY_THRESHOLD) return 'Not Ready';
  if (condition < PROVISIONAL_READY_THRESHOLD) return 'At Risk';
  return 'Ready';
}

export function isVehicleRaceReady(vehicle: Vehicle) {
  return vehicle.condition >= RACE_READY_THRESHOLD;
}

export function getRaceReadinessBlockers(state: GameState) {
  return state.vehicles.filter(
    (vehicle) => vehicle.active && !isVehicleRaceReady(vehicle),
  );
}

export function canStartRaceWeekend(state: GameState) {
  return getRaceReadinessBlockers(state).length === 0;
}

function getWearLabel(condition: number): Vehicle['chassisWear'] {
  if (condition >= 90) return 'Light';
  if (condition >= RACE_READY_THRESHOLD) return 'Moderate';
  return 'Heavy';
}

export function updateVehicleCondition(
  vehicle: Vehicle,
  condition: number,
  note: string,
): Vehicle {
  const nextCondition = clampCondition(condition);
  return {
    ...vehicle,
    condition: nextCondition,
    damage: 100 - nextCondition,
    damageClass: getDamageClassification(100 - nextCondition),
    readiness: getVehicleReadiness(nextCondition),
    chassisWear: getWearLabel(nextCondition),
    note,
  };
}

export function applyVehicleRepair(
  state: GameState,
  command: RepairCommand,
): GameState {
  if (state.economy.processedTransactionIds.includes(command.actionId)) {
    return state;
  }

  const vehicle = state.vehicles.find((item) => item.id === command.vehicleId);
  if (!vehicle || !vehicle.active) {
    throw new Error('Repair requires an active team vehicle');
  }

  const quote = getRepairQuote(vehicle, command.optionId, state.staff);
  if (state.team.cash < quote.cost) {
    throw new Error(`Insufficient cash for ${quote.label}`);
  }
  if (vehicle.condition >= 100) {
    throw new Error(`Car #${vehicle.number} is already at full condition`);
  }

  const nextCondition = Math.min(100, quote.projectedCondition);
  if (nextCondition <= vehicle.condition) {
    throw new Error('Repairs cannot reduce vehicle condition');
  }
  const restored = nextCondition - vehicle.condition;

  return {
    ...state,
    team: {
      ...state.team,
      cash: state.team.cash - quote.cost,
    },
    vehicles: state.vehicles.map((item) =>
      item.id === vehicle.id
        ? updateVehicleCondition(
            item,
            nextCondition,
            `${quote.label} complete: +${restored}% condition.`,
          )
        : item,
    ),
    economy: {
      ...state.economy,
      processedTransactionIds: [
        ...state.economy.processedTransactionIds,
        command.actionId,
      ],
      repairTransactions: [
        ...state.economy.repairTransactions,
        {
          id: command.actionId,
          raceId: command.raceId,
          vehicleId: vehicle.id,
          vehicleNumber: vehicle.number,
          optionId: command.optionId,
          damageClass: quote.damageClass,
          baseCost: quote.baseCost,
          budgetFixerDiscount: quote.budgetFixerDiscount,
          chargedCost: quote.cost,
          conditionBefore: vehicle.condition,
          conditionAfter: nextCondition,
        },
      ],
    },
  };
}
