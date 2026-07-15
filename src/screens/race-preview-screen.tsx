import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  getNextRace,
  getTeamManufacturer,
  starterGameState,
} from '@/data/starter-game-state';
import { theme } from '@/theme';

export function RacePreviewScreen() {
  const { race, track } = getNextRace();
  const manufacturer = getTeamManufacturer();

  if (!race || !track) {
    return (
      <Screen>
        <AppText>Race preview unavailable.</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          Race {race.round} of 10 · Week {race.week}
        </AppText>
        <AppText variant="hero">{track.name}</AppText>
        <AppText tone="muted">Opening weekend for the {starterGameState.series}</AppText>
      </View>

      <AppCard style={{ borderColor: theme.colors.trackRed }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: theme.spacing.md,
          }}>
          <AppText variant="title">Race Preview</AppText>
          <StatusBadge label={track.type} tone="red" />
        </View>
        <AppRow label="Track Type" detail={track.type} />
        <AppRow label="Tire Wear" detail={track.tireWear} />
        <AppRow label="Caution Risk" detail={track.cautionRisk} />
      </AppCard>

      <AppCard>
        <AppText variant="title">Key Driver Stats</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {track.keyStats.map((stat) => (
            <StatusBadge key={stat} label={stat} tone="blue" />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="title">Strategy Note</AppText>
        <AppText tone="muted">{track.strategyNote}</AppText>
      </AppCard>

      <AppCard>
        <AppText variant="title">Garage Readiness</AppText>
        <AppRow label="Manufacturer" detail={manufacturer.displayName} />
        {starterGameState.vehicles.map((vehicle) => (
          <AppRow
            key={vehicle.id}
            label={`Car #${vehicle.number}`}
            detail={`${vehicle.condition}% · PERF ${vehicle.performance}`}
          />
        ))}
      </AppCard>

      <AppButton label="Begin Practice (Coming Next)" disabled />
      <AppText variant="caption" tone="soft">
        Practice and the race simulation remain outside this vertical slice.
      </AppText>
    </Screen>
  );
}
