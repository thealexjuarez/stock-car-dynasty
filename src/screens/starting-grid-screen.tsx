import { useRouter, type Href } from 'expo-router';
import { View } from 'react-native';

import { WeekendProgressStrip } from '@/components/race-presentation/weekend-progress-strip';
import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { getNextRace } from '@/data/starter-game-state';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

export function StartingGridScreen() {
  const router = useRouter();
  const { state, beginRace } = useGameSession();
  const { race, track } = getNextRace(state.game);
  const qualifying = state.weekend.qualifying;

  if (!race || !track || !qualifying) {
    return (
      <Screen>
        <AppText variant="title">Starting grid unavailable</AppText>
        <AppText tone="muted">Complete practice and qualifying to set the field.</AppText>
      </Screen>
    );
  }

  const apexEntries = qualifying.entries.filter((entry) => entry.isPlayerTeam);
  const apexPositions = apexEntries.map((entry) => entry.position);
  const focusedGrid = qualifying.entries.filter(
    (entry) =>
      entry.position === 1 ||
      entry.isPlayerTeam ||
      apexPositions.some((position) => Math.abs(entry.position - position) <= 1),
  );
  const poleWinner = qualifying.entries[0];

  const startRace = () => {
    beginRace();
    router.push('/live-race');
  };

  return (
    <Screen
      compact
      footer={
        <AppButton label={raceWeekendCopy.grid.primaryAction} onPress={startRace} />
      }>
      <View style={{ gap: 6 }}>
        <AppText variant="eyebrow" tone="accent">
          {raceWeekendCopy.grid.eyebrow} · {track.type}
        </AppText>
        <AppText variant="title">{raceWeekendCopy.grid.title}</AppText>
        <AppText numberOfLines={1} variant="caption" tone="muted">{race.name} at {track.name} · 32 cars</AppText>
        <WeekendProgressStrip phase="grid" />
      </View>

      <AppCard style={{ borderColor: theme.colors.caution, padding: theme.spacing.md }}>
        <AppText variant="eyebrow" tone="accent">Apex Motorsports</AppText>
        {apexEntries.map((entry) => (
          <AppRow
            compact
            key={entry.id}
            label={`P${entry.position} · Car #${entry.carNumber}`}
            detail={entry.driverName}
          />
        ))}
      </AppCard>

      <AppCard style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <AppText variant="title">Field Focus</AppText>
            <AppText tone="muted">Pole, Apex entries, and nearby traffic.</AppText>
          </View>
          <StatusBadge label="32 Cars" tone="neutral" />
        </View>
        {focusedGrid.map((entry) => (
          <View
            key={entry.id}
            style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
            <StatusBadge
              label={`P${entry.position}`}
              tone={entry.isPlayerTeam ? 'yellow' : entry.id === poleWinner.id ? 'green' : 'neutral'}
            />
            <View style={{ flex: 1 }}>
              <AppText>#{entry.carNumber} · {entry.driverName}</AppText>
              <AppText tone="soft" variant="caption">
                {entry.teamName} · {entry.manufacturerId}
              </AppText>
            </View>
          </View>
        ))}
        <AppButton
          label="View Full Starting Grid"
          onPress={() => router.push('/full-grid' as Href)}
          variant="secondary"
        />
      </AppCard>
    </Screen>
  );
}
