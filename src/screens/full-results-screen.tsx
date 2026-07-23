import { View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { getManufacturerById } from '@/data/manufacturer-data';
import { getNextRace } from '@/data/starter-game-state';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function FullResultsScreen() {
  const { state } = useGameSession();
  const { race, track } = getNextRace(state.game);
  const result = state.weekend.race;

  if (!race || !track || !result) {
    return (
      <Screen><AppText variant="title">Official results unavailable</AppText></Screen>
    );
  }

  return (
    <Screen compact>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">ERCA Official Classification</AppText>
        <AppText variant="hero">Full Results</AppText>
        <AppText tone="muted">{race.name} at {track.name} · 32 cars</AppText>
      </View>
      <AppCard style={{ gap: 0, padding: theme.spacing.sm }}>
        {result.entries.map((entry) => {
          const change = entry.startPosition - entry.finishPosition;
          return (
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
                {entry.finishPosition}
              </AppText>
              <View style={{ flex: 1 }}>
                <AppText>
                  #{entry.carNumber} · {entry.driverName}{entry.status === 'DNF' ? ' · DNF' : ''}
                </AppText>
                <AppText tone="soft" variant="caption">
                  {entry.teamName} · {getManufacturerById(entry.manufacturerId).presentation.compactName}
                </AppText>
                {entry.isPlayerTeam ? (
                  <AppText tone="accent" variant="caption">
                    Apex payout · {money.format(entry.payout)}
                  </AppText>
                ) : null}
              </View>
              <AppText
                tone={change > 0 ? 'accent' : 'muted'}
                variant="caption">
                {change > 0 ? `+${change}` : change} · S{entry.startPosition}
              </AppText>
            </View>
          );
        })}
      </AppCard>
    </Screen>
  );
}
