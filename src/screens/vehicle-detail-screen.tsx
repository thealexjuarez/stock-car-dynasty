import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { RACE_READY_THRESHOLD, repairOptions } from '@/data/repair-config';
import { getTeamManufacturer } from '@/data/starter-game-state';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

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

  if (!vehicle) {
    return (
      <Screen>
        <AppText>Vehicle not found.</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">Repair Bay</AppText>
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
          <AppText variant="eyebrow" tone="accent">Repair Bay</AppText>
          <AppText variant="title">Choose the Shop Work</AppText>
        </View>
        <AppText tone="muted">
          The 75% race-readiness line is locked. Repair costs are provisional ERCA balance values.
        </AppText>
        {repairOptions.map((option) => {
          const restored = Math.min(
            option.conditionRestored,
            100 - vehicle.condition,
          );
          const disabled =
            restored <= 0 || state.game.team.cash < option.cost;

          return (
            <View
              key={option.id}
              style={{
                borderTopColor: theme.colors.border,
                borderTopWidth: 1,
                gap: theme.spacing.sm,
                paddingTop: theme.spacing.md,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: theme.spacing.md,
                }}>
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <AppText style={{ fontWeight: '800' }}>{option.label}</AppText>
                  <AppText variant="caption" tone="muted">
                    {option.description}
                  </AppText>
                </View>
                <StatusBadge label={`+${restored}%`} tone="blue" />
              </View>
              <AppButton
                disabled={disabled}
                label={`${option.label} · ${money.format(option.cost)}`}
                onPress={() => repairVehicle(vehicle.id, option.id)}
                variant={option.id === 'standard-repair' ? 'primary' : 'secondary'}
              />
            </View>
          );
        })}
        {state.game.team.cash < repairOptions[0].cost ? (
          <AppText tone="accent">
            The team does not have enough cash for shop work.
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
