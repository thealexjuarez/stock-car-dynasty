import { useRouter } from 'expo-router';
import { View } from 'react-native';

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
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          {raceWeekendCopy.grid.eyebrow} · {track.type}
        </AppText>
        <AppText variant="hero">{raceWeekendCopy.grid.title}</AppText>
        <AppText tone="muted">{race.name} at {track.name}</AppText>
      </View>

      <AppCard style={{ borderColor: theme.colors.caution, padding: theme.spacing.md }}>
        <AppText variant="title">{state.game.team.name}</AppText>
        {qualifying.entries.filter((entry) => entry.isPlayerTeam).map((entry) => (
          <AppRow
            compact
            key={entry.id}
            label={`P${entry.position} · Car #${entry.carNumber}`}
            detail={entry.driverName}
          />
        ))}
      </AppCard>

      <AppCard style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
        <AppText variant="title">{raceWeekendCopy.grid.fieldTitle}</AppText>
        <AppText tone="muted">
          {raceWeekendCopy.grid.fieldNote}
        </AppText>
        {qualifying.entries.map((entry) => (
          <View
            key={entry.id}
            style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
            <StatusBadge
              label={`P${entry.position}`}
              tone={entry.isPlayerTeam ? 'yellow' : 'neutral'}
            />
            <View style={{ flex: 1 }}>
              <AppText>#{entry.carNumber} · {entry.driverName}</AppText>
            </View>
          </View>
        ))}
      </AppCard>

    </Screen>
  );
}
