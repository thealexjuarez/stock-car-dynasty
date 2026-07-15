import { View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { starterGameState } from '@/data/starter-game-state';
import { theme } from '@/theme';

export function DriverProfileScreen({ driverId }: { driverId: string }) {
  const driver = starterGameState.drivers.find((item) => item.id === driverId);

  if (!driver) {
    return (
      <Screen>
        <AppText>Driver not found.</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          Car #{driver.carNumber} · {driver.hometown} (provisional)
        </AppText>
        <AppText variant="hero">{driver.name}</AppText>
        <AppText tone="muted">
          Age {driver.age} (provisional) · {driver.contract} contract (provisional) · $
          {driver.salary.toLocaleString()} salary (provisional)
        </AppText>
      </View>

      <AppCard>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          <StatusBadge label={`OVR ${driver.overall}`} tone="blue" />
          <StatusBadge label={`POT ${driver.potential}`} tone="green" />
          <StatusBadge label="EXP data provisional" tone="neutral" />
        </View>
        <ProgressBar
          value={driver.exp}
          max={driver.nextRatingExp}
          label="EXP to next rating"
        />
        <AppRow label="Development Trend (provisional)" detail={driver.developmentTrend} />
      </AppCard>

      <AppCard>
        <AppText variant="title">Locked Archetypes</AppText>
        <AppRow label="Primary Archetype" detail={driver.archetypes[0]} />
        <AppRow label="Secondary Archetype" detail={driver.archetypes[1]} />
      </AppCard>

      <AppCard>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="title">Driver Ratings</AppText>
          <AppText variant="caption" tone="soft">
            Provisional starter presentation data; individual ratings are not locked canon.
          </AppText>
        </View>
        {Object.entries(driver.stats).map(([key, value]) => (
          <AppRow key={key} label={key} detail={`${value}`} />
        ))}
      </AppCard>

      <AppCard>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="title">Growth Modifiers</AppText>
          <AppText variant="caption" tone="soft">
            Provisional profile assignments based on starter facilities and staff.
          </AppText>
        </View>
        {driver.growthModifiers.map((modifier) => (
          <AppRow key={modifier} label={modifier} />
        ))}
      </AppCard>
    </Screen>
  );
}
