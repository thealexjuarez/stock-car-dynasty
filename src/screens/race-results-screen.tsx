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
import { RACE_READY_THRESHOLD } from '@/data/repair-config';
import { getNextRace } from '@/data/starter-game-state';
import { calculateWeekendSettlement } from '@/simulation/economy';
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

  const settlement = calculateWeekendSettlement(state.game, result);
  const winner = result.entries[0];
  const poleWinner = state.weekend.qualifying?.entries[0];

  const advance = () => {
    if (isClosingRef.current) return;
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
        <AppText tone="muted">{race.name} at {track.name} · Official</AppText>
      </View>

      <AppCard style={{ borderColor: theme.colors.victory, padding: theme.spacing.md }}>
        <AppText variant="eyebrow" tone="accent">Race Winner</AppText>
        <AppText variant="title">#{winner.carNumber} · {winner.driverName}</AppText>
        <AppText tone="muted">
          {winner.teamName} · started P{winner.startPosition}
        </AppText>
        {poleWinner ? (
          <AppText tone="soft" variant="caption">
            Pole: #{poleWinner.carNumber} {poleWinner.driverName}
          </AppText>
        ) : null}
      </AppCard>

      {result.entries.filter((entry) => entry.isPlayerTeam).map((entry) => {
        const vehicle = state.game.vehicles.find((item) => item.id === entry.vehicleId);
        const postRaceCondition = Math.max(
          0,
          (vehicle?.condition ?? 0) - entry.conditionLoss,
        );
        return (
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
            detail={money.format(
              settlement.winningsByCar.find(
                (line) => line.vehicleId === entry.vehicleId,
              )?.amount ?? 0,
            )}
          />
          <AppRow compact label={raceWeekendCopy.results.exp} detail={`+${entry.exp}`} />
            <AppRow compact label={raceWeekendCopy.results.damage} detail={`-${entry.conditionLoss}%`} />
            <AppRow
              compact
              label="Post-Race Readiness"
              detail={
                postRaceCondition >= RACE_READY_THRESHOLD
                  ? `${postRaceCondition}% · Race Ready`
                  : `${postRaceCondition}% · Needs Work`
              }
            />
          </AppCard>
        );
      })}

      <AppCard style={{ borderColor: theme.colors.victory, padding: theme.spacing.md }}>
        <AppText variant="eyebrow" tone="accent">Weekend Earnings</AppText>
        <AppRow compact label="Race Winnings" detail={money.format(settlement.totalRaceWinnings)} />
        <AppRow compact label="Sponsor Payment" detail={money.format(settlement.sponsorIncome)} />
        <AppRow compact label="Operating Cost" detail={`-${money.format(settlement.operatingCostBase)}`} />
        {settlement.budgetFixerDiscount > 0 ? (
          <AppRow compact label="Budget Fixer" detail={`+${money.format(settlement.budgetFixerDiscount)}`} />
        ) : null}
        <AppRow compact label="Net Weekend" detail={money.format(settlement.netWeekend)} />
        <AppRow compact label="Updated Team Cash" detail={money.format(settlement.cashAfter)} />
      </AppCard>

      {settlement.operatingCostShortfall > 0 ? (
        <AppCard style={{ borderColor: theme.colors.trackRed, padding: theme.spacing.md }}>
          <AppText variant="title">Operating Cost Shortfall</AppText>
          <AppText tone="muted">
            The team is short {money.format(settlement.operatingCostShortfall)}.
            Team cash stays at $0 until future earnings cover the gap.
          </AppText>
        </AppCard>
      ) : null}

      <AppButton
        label="View Full Official Results"
        onPress={() => router.push('/full-results' as Href)}
        variant="secondary"
      />
    </Screen>
  );
}
