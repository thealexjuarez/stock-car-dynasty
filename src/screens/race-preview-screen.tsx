import { Link } from 'expo-router';
import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import {
  getNextRace,
  getTeamManufacturer,
} from '@/data/starter-game-state';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

export function RacePreviewScreen() {
  const { state } = useGameSession();
  const { race, track } = getNextRace(state.game);
  const manufacturer = getTeamManufacturer(state.game);

  if (!race || !track) {
    return (
      <Screen>
        <AppText>Race preview unavailable.</AppText>
      </Screen>
    );
  }

  return (
    <Screen
      compact
      footer={
        <Link href="/practice" asChild>
          <AppButton label={raceWeekendCopy.preview.primaryAction} />
        </Link>
      }>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          {raceWeekendCopy.preview.eyebrow} · Race {race.round} of{' '}
          {state.game.calendar.length} · Week {race.week}
        </AppText>
        <AppText variant="hero">{track.name}</AppText>
        <AppText tone="muted">{race.name} · Season {state.game.season}</AppText>
      </View>

      <AppCard style={{ borderColor: theme.colors.trackRed, padding: theme.spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: theme.spacing.md,
          }}>
          <AppText variant="title">{raceWeekendCopy.preview.title}</AppText>
          <StatusBadge label={track.type} tone="red" />
        </View>
        <AppRow compact label="Track Type" detail={track.type} />
        <AppRow compact label="Tire Wear" detail={track.tireWear} />
        <AppRow compact label="Caution Risk" detail={track.cautionRisk} />
      </AppCard>

      <AppCard style={{ padding: theme.spacing.md }}>
        <AppText variant="title">Key Driver Stats</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {track.keyStats.map((stat) => (
            <StatusBadge key={stat} label={stat} tone="blue" />
          ))}
        </View>
      </AppCard>

      <AppCard style={{ padding: theme.spacing.md }}>
        <AppText variant="title">Crew Chief Note</AppText>
        <AppText tone="muted">{track.strategyNote}</AppText>
      </AppCard>

      <AppCard style={{ padding: theme.spacing.md }}>
        <AppText variant="title">{raceWeekendCopy.preview.garageTitle}</AppText>
        <AppRow compact label="Manufacturer" detail={manufacturer.displayName} />
        {state.game.vehicles.map((vehicle) => (
          <AppRow
            compact
            key={vehicle.id}
            label={`Car #${vehicle.number}`}
            detail={`${vehicle.condition}% · PERF ${vehicle.performance}`}
          />
        ))}
      </AppCard>

    </Screen>
  );
}
