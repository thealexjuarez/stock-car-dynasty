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

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function RaceResultsScreen() {
  const router = useRouter();
  const { state, advanceEvent } = useGameSession();
  const { race, track } = getNextRace(state.game);
  const result = state.weekend.race;

  if (!race || !track || !result) {
    return (
      <Screen>
        <AppText variant="title">Race results unavailable</AppText>
        <AppText tone="muted">Complete the current race to review its results.</AppText>
      </Screen>
    );
  }

  const advance = () => {
    advanceEvent();
    router.dismissAll();
    router.replace('/race-preview');
  };

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">Race Complete · {track.type}</AppText>
        <AppText variant="hero">Race Results</AppText>
        <AppText tone="muted">{race.name} at {track.name}</AppText>
      </View>

      {result.entries.filter((entry) => entry.isPlayerTeam).map((entry) => (
        <AppCard key={entry.id} style={{ borderColor: theme.colors.caution }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <AppText variant="title">P{entry.finishPosition} · Car #{entry.carNumber}</AppText>
              <AppText tone="muted">{entry.driverName} · started P{entry.startPosition}</AppText>
            </View>
            <StatusBadge label={entry.status} tone={entry.status === 'DNF' ? 'red' : 'green'} />
          </View>
          <AppRow label="Payout" detail={money.format(entry.payout)} />
          <AppRow label="Driver EXP" detail={`+${entry.exp}`} />
          <AppRow label="Condition" detail={`-${entry.conditionLoss}%`} />
        </AppCard>
      ))}

      <AppCard>
        <AppText variant="title">Weekend Settlement</AppText>
        <AppRow label="Team payout" detail={money.format(result.playerPayout)} />
        <AppRow label="Driver EXP" detail={`+${result.playerExp}`} />
        <AppRow label="Total condition loss" detail={`-${result.playerConditionLoss}%`} />
        <AppText tone="muted">
          These changes apply once when you advance. The next event then becomes the active weekend.
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="title">Finishing Order</AppText>
        {result.entries.map((entry) => (
          <AppRow
            key={entry.id}
            label={`P${entry.finishPosition} · #${entry.carNumber}`}
            detail={`${entry.driverName}${entry.status === 'DNF' ? ' · DNF' : ''}`}
          />
        ))}
      </AppCard>

      <AppButton label="Apply Results & Advance" onPress={advance} />
    </Screen>
  );
}
