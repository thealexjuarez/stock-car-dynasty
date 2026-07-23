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
            detail={money.format(
              settlement.winningsByCar.find(
                (line) => line.vehicleId === entry.vehicleId,
              )?.amount ?? 0,
            )}
          />
          <AppRow compact label={raceWeekendCopy.results.exp} detail={`+${entry.exp}`} />
          <AppRow
            compact
            label={raceWeekendCopy.results.damage}
            detail={`-${entry.conditionLoss}%`}
          />
        </AppCard>
      ))}

      <AppCard style={{ borderColor: theme.colors.victory, padding: theme.spacing.md }}>
        <AppText variant="eyebrow" tone="accent">Weekend Earnings</AppText>
        <AppText variant="title">{raceWeekendCopy.results.closeoutTitle}</AppText>
        {settlement.winningsByCar.map((line) => (
          <AppRow
            compact
            key={line.vehicleId}
            label={`Car #${line.carNumber} · P${line.finishPosition}`}
            detail={money.format(line.amount)}
          />
        ))}
        <AppRow
          compact
          label="Total Race Winnings"
          detail={money.format(settlement.totalRaceWinnings)}
        />
        <AppRow
          compact
          label="Sponsor Payment"
          detail={money.format(settlement.sponsorIncome)}
        />
        <AppRow
          compact
          label="Operating Cost"
          detail={`-${money.format(settlement.operatingCostBase)}`}
        />
        {settlement.budgetFixerDiscount > 0 ? (
          <AppRow
            compact
            label="Budget Fixer"
            detail={`+${money.format(settlement.budgetFixerDiscount)}`}
          />
        ) : null}
        <AppRow
          compact
          label="Repair Spending · Paid in Repair Bay"
          detail={`-${money.format(settlement.repairSpending)}`}
        />
        <AppRow
          compact
          label="Net Weekend"
          detail={money.format(settlement.netWeekend)}
        />
        <AppRow
          compact
          label="Updated Team Cash"
          detail={money.format(settlement.cashAfter)}
        />
        <AppText tone="muted">
          Repairs stay player-controlled. Returning to the shop posts this
          settlement once, then advances the calendar.
        </AppText>
      </AppCard>

      {settlement.operatingCostShortfall > 0 ? (
        <AppCard style={{ borderColor: theme.colors.trackRed, padding: theme.spacing.md }}>
          <AppText variant="title">Operating Cost Shortfall</AppText>
          <AppText tone="muted">
            The team is short {money.format(settlement.operatingCostShortfall)}.
            Cash will remain at $0 and the shortfall will be recorded without
            corrupting the weekend settlement.
          </AppText>
        </AppCard>
      ) : null}

      <AppCard style={{ padding: theme.spacing.md }}>
        <AppText variant="title">Race Development</AppText>
        <AppRow compact label={raceWeekendCopy.results.exp} detail={`+${result.playerExp}`} />
        <AppRow
          compact
          label={raceWeekendCopy.results.damage}
          detail={`-${result.playerConditionLoss}%`}
        />
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
