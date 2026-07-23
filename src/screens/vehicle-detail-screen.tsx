import { View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { getTeamManufacturer } from '@/data/starter-game-state';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

export function VehicleDetailScreen({ number }: { number: string }) {
  const { state } = useGameSession();
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
        <AppText variant="eyebrow" tone="accent">
          {state.game.team.name}
        </AppText>
        <AppText variant="hero">Car #{vehicle.number}</AppText>
        <AppText tone="muted">
          Assigned to {driver?.name}. Both active cars receive equal upgrade treatment.
        </AppText>
      </View>

      <AppCard>
        <AppText variant="title">Manufacturer</AppText>
        <AppRow label="Program" detail={manufacturer.displayName} />
      </AppCard>

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
            label={`${vehicle.condition}% condition`}
            tone={vehicle.condition >= 90 ? 'green' : 'yellow'}
          />
        </View>
        <AppRow label="Performance" detail={`${vehicle.performance}`} />
        <AppRow label="Chassis Wear" detail={vehicle.chassisWear} />
        <AppRow label="Engine Wear" detail={vehicle.engineWear} />
      </AppCard>

      <AppCard>
        <AppText variant="title">Garage Note</AppText>
        <AppText tone="muted">{vehicle.note}</AppText>
      </AppCard>

      <AppCard>
        <AppText variant="title">Next Action</AppText>
        <AppText tone="muted">
          Review condition after each race. Repairs are car-specific; performance upgrades apply
          evenly to both entries.
        </AppText>
      </AppCard>
    </Screen>
  );
}
