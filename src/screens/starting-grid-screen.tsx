import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
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
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">Qualifying Complete · {track.type}</AppText>
        <AppText variant="hero">Starting Grid</AppText>
        <AppText tone="muted">{race.name} at {track.name}</AppText>
      </View>

      <AppCard style={{ borderColor: theme.colors.caution }}>
        <AppText variant="title">Apex Motorsports</AppText>
        {qualifying.entries.filter((entry) => entry.isPlayerTeam).map((entry) => (
          <AppRow
            key={entry.id}
            label={`P${entry.position} · Car #${entry.carNumber}`}
            detail={entry.driverName}
          />
        ))}
      </AppCard>

      <AppCard>
        <AppText variant="title">Prototype Field</AppText>
        <AppText tone="muted">
          The current Bible-aligned 12-car presentation field is ordered by the seeded qualifying simulation.
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

      <AppButton label="Start Race" onPress={startRace} />
    </Screen>
  );
}
