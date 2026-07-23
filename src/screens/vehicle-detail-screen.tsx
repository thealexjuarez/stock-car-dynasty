import { useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  getDamageClassDefinition,
  getRepairQuotes,
  RACE_READY_THRESHOLD,
} from '@/data/repair-config';
import { getTeamManufacturer } from '@/data/starter-game-state';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';
import type { RepairOptionId } from '@/types/game';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function VehicleDetailScreen({ number }: { number: string }) {
  const { state, repairVehicle } = useGameSession();
  const vehicle = state.game.vehicles.find((item) => item.number === number);
  const driver = state.game.drivers.find(
    (item) => item.id === vehicle?.assignedDriverId,
  );
  const manufacturer = getTeamManufacturer(state.game);
  const [selectedOptionId, setSelectedOptionId] =
    useState<RepairOptionId | null>(null);

  if (!vehicle) {
    return (
      <Screen>
        <AppText>Vehicle not found.</AppText>
      </Screen>
    );
  }

  const repairQuotes = getRepairQuotes(vehicle, state.game.staff);
  const selectedQuote =
    repairQuotes.find((quote) => quote.id === selectedOptionId) ??
    repairQuotes.find((quote) => quote.approach === 'recommended') ??
    repairQuotes[0];
  const damageClass = getDamageClassDefinition(vehicle.damageClass);
  const remainingCash = selectedQuote
    ? state.game.team.cash - selectedQuote.cost
    : state.game.team.cash;

  return (
    <Screen
      footer={
        selectedQuote ? (
          <>
            <View style={{ gap: 2 }}>
              <AppText variant="eyebrow" tone="accent">
                {selectedQuote.label}
              </AppText>
              <AppText variant="caption" tone="muted">
                {vehicle.condition}% → {selectedQuote.projectedCondition}% ·{' '}
                {money.format(Math.max(0, remainingCash))} remaining
              </AppText>
            </View>
            <AppButton
              disabled={remainingCash < 0}
              label={`Approve Shop Work · ${money.format(selectedQuote.cost)}`}
              onPress={() => repairVehicle(vehicle.id, selectedQuote.id)}
            />
          </>
        ) : undefined
      }>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          Repair Bay
        </AppText>
        <AppText variant="hero">Car #{vehicle.number}</AppText>
        <AppText tone="muted">
          Assigned to {driver?.name} · {money.format(state.game.team.cash)} available
        </AppText>
      </View>

      <AppCard>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: theme.spacing.md,
          }}>
          <AppText variant="title">Vehicle Status</AppText>
          <StatusBadge
            label={vehicle.readiness}
            tone={
              vehicle.readiness === 'Ready'
                ? 'green'
                : vehicle.readiness === 'At Risk'
                  ? 'yellow'
                  : 'red'
            }
          />
        </View>
        <AppRow label="Condition" detail={`${vehicle.condition}%`} />
        <AppRow label="Damage" detail={`${vehicle.damage}%`} />
        <AppRow label="Damage Report" detail={damageClass.label} />
        <AppRow
          label="Race Entry"
          detail={
            vehicle.condition >= RACE_READY_THRESHOLD
              ? 'Clear for the Weekend'
              : 'Needs Work'
          }
        />
        <AppRow label="Performance" detail={`${vehicle.performance}`} />
        <AppRow label="Chassis Wear" detail={vehicle.chassisWear} />
        <AppRow label="Engine Wear" detail={vehicle.engineWear} />
      </AppCard>

      <AppCard style={{ borderColor: theme.colors.caution }}>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="eyebrow" tone="accent">
            Damage Report
          </AppText>
          <AppText variant="title">{damageClass.label} Shop Work</AppText>
        </View>
        <AppText tone="muted">
          Select a shop plan. The purchase action stays pinned while you review
          the projected result.
        </AppText>

        {repairQuotes.map((quote) => {
          const selected = quote.id === selectedQuote?.id;
          return (
            <View
              key={quote.id}
              style={{
                backgroundColor: selected
                  ? theme.colors.panelStrong
                  : 'transparent',
                borderColor: selected
                  ? theme.colors.caution
                  : theme.colors.border,
                borderRadius: theme.cards.radius,
                borderWidth: 1,
                gap: theme.spacing.sm,
                padding: theme.spacing.md,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: theme.spacing.md,
                }}>
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <AppText style={{ fontWeight: '800' }}>
                    {quote.label}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {quote.description}
                  </AppText>
                </View>
                <StatusBadge
                  label={`+${quote.conditionRestored}%`}
                  tone={quote.becomesRaceReady ? 'green' : 'blue'}
                />
              </View>
              <AppRow
                compact
                label="Projected Condition"
                detail={`${quote.currentCondition}% → ${quote.projectedCondition}%`}
              />
              <AppRow
                compact
                label="Projected Readiness"
                detail={
                  quote.projectedCondition >= RACE_READY_THRESHOLD
                    ? 'Ready to Race'
                    : 'Still Below Entry Standard'
                }
              />
              {quote.budgetFixerDiscount > 0 ? (
                <>
                  <AppRow
                    compact
                    label="Shop Price"
                    detail={money.format(quote.baseCost)}
                  />
                  <AppRow
                    compact
                    label="Budget Fixer"
                    detail={`-${money.format(quote.budgetFixerDiscount)}`}
                  />
                </>
              ) : null}
              <AppRow
                compact
                label="Repair Cost"
                detail={money.format(quote.cost)}
              />
              <AppRow
                compact
                label="Cash After Repair"
                detail={money.format(
                  Math.max(0, state.game.team.cash - quote.cost),
                )}
              />
              <AppButton
                disabled={state.game.team.cash < quote.cost}
                label={
                  selected ? 'Selected Shop Plan' : `Choose ${quote.label}`
                }
                onPress={() => setSelectedOptionId(quote.id)}
                variant={selected ? 'primary' : 'secondary'}
              />
            </View>
          );
        })}

        {repairQuotes.length === 0 ? (
          <AppText tone="muted">
            Car #{vehicle.number} is already at full condition.
          </AppText>
        ) : repairQuotes.every((quote) => state.game.team.cash < quote.cost) ? (
          <AppText tone="accent">
            The team does not have enough cash for this damage report.
          </AppText>
        ) : null}
      </AppCard>

      <AppCard>
        <AppText variant="title">Garage Note</AppText>
        <AppText tone="muted">{vehicle.note}</AppText>
        <AppRow label="Manufacturer" detail={manufacturer.displayName} />
      </AppCard>
    </Screen>
  );
}
