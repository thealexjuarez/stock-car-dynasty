import { Link } from 'expo-router';
import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { SectionHeader } from '@/components/shared/section-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { getTeamManufacturer, starterGameState } from '@/data/starter-game-state';
import { theme } from '@/theme';

export function TeamScreen() {
  const { team, drivers, vehicles } = starterGameState;
  const manufacturer = getTeamManufacturer();

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">Team Operations</AppText>
        <AppText variant="hero">{team.name}</AppText>
        <AppText tone="muted">
          Lower mid-pack ERCA team · {manufacturer.displayName} · two equal entries
        </AppText>
      </View>

      <AppCard>
        <SectionHeader title="Team Overview" subtitle="Where the program stands entering Week 1" />
        <AppRow label="Team Reputation" detail={`${team.reputation}`} />
        <AppRow label="Brand Power" detail={`${team.brandPower}`} />
        <AppRow label="Car Performance" detail={`${team.carPerformance}`} />
        <AppRow label="Team Morale" detail={`${team.morale}`} />
      </AppCard>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title="Drivers" subtitle="Tap a driver to review ratings, archetypes, and development" />
        {drivers.map((driver) => (
          <AppCard key={driver.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
              <View style={{ flex: 1, gap: theme.spacing.xs }}>
                <AppText variant="title">{driver.name}</AppText>
                <AppText tone="muted" variant="caption">
                  Car #{driver.carNumber} · {driver.archetypes.join(' / ')}
                </AppText>
              </View>
              <StatusBadge label={`OVR ${driver.overall}`} tone="blue" />
            </View>
            <Link href={{ pathname: '/drivers/[id]', params: { id: driver.id } }} asChild>
              <AppButton label="View Driver Profile" variant="secondary" />
            </Link>
          </AppCard>
        ))}
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title="Vehicles" subtitle="Car-specific condition and wear; upgrades apply evenly" />
        {vehicles.map((vehicle) => (
          <AppCard key={vehicle.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
              <AppText variant="title">Car #{vehicle.number}</AppText>
              <StatusBadge label={`${vehicle.condition}% condition`} tone={vehicle.condition >= 90 ? 'green' : 'yellow'} />
            </View>
            <AppRow label="Performance" detail={`${vehicle.performance}`} />
            <AppRow label="Assigned Driver" detail={drivers.find((driver) => driver.id === vehicle.assignedDriverId)?.name} />
            <Link href={{ pathname: '/vehicles/[number]', params: { number: vehicle.number } }} asChild>
              <AppButton label={`Open Car #${vehicle.number}`} variant="secondary" />
            </Link>
          </AppCard>
        ))}
      </View>
    </Screen>
  );
}
