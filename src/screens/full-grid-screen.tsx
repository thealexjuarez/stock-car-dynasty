import { View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { getManufacturerById } from '@/data/manufacturer-data';
import { getNextRace } from '@/data/starter-game-state';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

export function FullGridScreen() {
  const { state } = useGameSession();
  const { race, track } = getNextRace(state.game);
  const grid = state.weekend.qualifying?.entries;

  if (!race || !track || !grid) {
    return (
      <Screen><AppText variant="title">Full grid unavailable</AppText></Screen>
    );
  }

  return (
    <Screen compact>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">Official Starting Lineup</AppText>
        <AppText variant="hero">Full Grid</AppText>
        <AppText tone="muted">{race.name} at {track.name} · 32 cars</AppText>
      </View>
      <AppCard style={{ gap: 0, padding: theme.spacing.sm }}>
        {grid.map((entry) => (
          <View
            key={entry.id}
            style={{
              backgroundColor: entry.isPlayerTeam ? theme.colors.panelStrong : 'transparent',
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
              borderLeftColor: entry.isPlayerTeam ? theme.colors.caution : 'transparent',
              borderLeftWidth: 3,
              flexDirection: 'row',
              gap: theme.spacing.sm,
              padding: theme.spacing.sm,
            }}>
            <AppText style={{ fontFamily: theme.typography.mono, width: 30 }}>
              {entry.position}
            </AppText>
            <View style={{ flex: 1 }}>
              <AppText>#{entry.carNumber} · {entry.driverName}</AppText>
              <AppText tone="soft" variant="caption">{entry.teamName}</AppText>
            </View>
            <AppText tone="muted" variant="caption">
              {getManufacturerById(entry.manufacturerId).presentation.compactName}
            </AppText>
          </View>
        ))}
      </AppCard>
    </Screen>
  );
}
