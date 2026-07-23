import { useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { postSettlementFlow } from '@/data/race-weekend-navigation';
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
  const isClosingRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!race || !track || !result) {
    return (
      <Screen>
        <AppText variant="title">Race results unavailable</AppText>
        <AppText tone="muted">Complete the current race to review its results.</AppText>
      </Screen>
    );
  }

  const advance = () => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    setIsClosing(true);
    advanceEvent();
    router.dismissAll();
    router.replace(postSettlementFlow.route as Href);
  };

  return (
    <Screen
      compact
      footer={
        <AppButton
          disabled={isClosing}
          label={
            isClosing
              ? raceWeekendCopy.results.returningAction
              : raceWeekendCopy.results.primaryAction
          }
          onPress={advance}
        />
      }>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          {raceWeekendCopy.results.eyebrow} · {track.type}
        </AppText>
        <AppText variant="hero">{raceWeekendCopy.results.title}</AppText>
        <AppText tone="muted">{race.name} at {track.name}</AppText>
      </View>

      {result.entries.filter((entry) => entry.isPlayerTeam).map((entry) => (
        <AppCard
          key={entry.id}
          style={{ borderColor: theme.colors.caution, gap: theme.spacing.sm, padding: theme.spacing.md }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <AppText variant="title">P{entry.finishPosition} · Car #{entry.carNumber}</AppText>
              <AppText tone="muted">{entry.driverName} · started P{entry.startPosition}</AppText>
            </View>
            <StatusBadge label={entry.status} tone={entry.status === 'DNF' ? 'red' : 'green'} />
          </View>
          <AppRow
            compact
            label={raceWeekendCopy.results.payout}
            detail={money.format(entry.payout)}
          />
          <AppRow compact label={raceWeekendCopy.results.exp} detail={`+${entry.exp}`} />
          <AppRow
            compact
            label={raceWeekendCopy.results.damage}
            detail={`-${entry.conditionLoss}%`}
          />
        </AppCard>
      ))}

      <AppCard style={{ padding: theme.spacing.md }}>
        <AppText variant="title">{raceWeekendCopy.results.closeoutTitle}</AppText>
        <AppRow
          compact
          label={raceWeekendCopy.results.payout}
          detail={money.format(result.playerPayout)}
        />
        <AppRow compact label={raceWeekendCopy.results.exp} detail={`+${result.playerExp}`} />
        <AppRow
          compact
          label={raceWeekendCopy.results.damage}
          detail={`-${result.playerConditionLoss}%`}
        />
        <AppText tone="muted">
          {raceWeekendCopy.results.settlementNote}
        </AppText>
      </AppCard>

      <AppCard style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
        <AppText variant="title">{raceWeekendCopy.results.finishingOrder}</AppText>
        {result.entries.map((entry) => (
          <AppRow
            compact
            key={entry.id}
            label={`P${entry.finishPosition} · #${entry.carNumber}`}
            detail={`${entry.driverName}${entry.status === 'DNF' ? ' · DNF' : ''}`}
          />
        ))}
      </AppCard>

    </Screen>
  );
}
