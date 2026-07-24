import { useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { WeekendProgressStrip } from '@/components/race-presentation/weekend-progress-strip';
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
import { getImmediateRecruitingRiskWarnings } from '@/simulation/recruiting';
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
  const [showLedger, setShowLedger] = useState(false);
  const [expandedStrategyEntryId, setExpandedStrategyEntryId] =
    useState<string>();

  if (!race || !track || !result) {
    return (
      <Screen>
        <AppText variant="title">Race results unavailable</AppText>
        <AppText tone="muted">Complete the current race to review its results.</AppText>
      </Screen>
    );
  }

  const settlement = calculateWeekendSettlement(state.game, result);
  const recruitingRisks = getImmediateRecruitingRiskWarnings(state.game);
  const winner = result.entries[0];
  const poleWinner = state.weekend.qualifying?.entries[0];
  const apexEntries = result.entries.filter((entry) => entry.isPlayerTeam);

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
          label={isClosing ? raceWeekendCopy.results.returningAction : raceWeekendCopy.results.primaryAction}
          onPress={advance}
        />
      }>
      <View style={{ gap: 6 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" tone="accent">Official Results · {track.type}</AppText>
            <AppText numberOfLines={1} variant="title">{race.name}</AppText>
            <AppText variant="caption" tone="muted">{track.name} · 32 cars classified</AppText>
          </View>
          <StatusBadge compact label="Official" tone="green" />
        </View>
        <WeekendProgressStrip phase="results" />
      </View>

      <AppCard style={{ borderColor: theme.colors.victory, gap: 6, padding: theme.spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" tone="accent">RACE WINNER</AppText>
            <AppText numberOfLines={1} variant="title" style={{ fontSize: 19 }}>#{winner.carNumber} · {winner.driverName}</AppText>
            <AppText numberOfLines={1} variant="caption" tone="muted">
              {winner.teamName} · from P{winner.startPosition}
            </AppText>
          </View>
          {poleWinner ? <StatusBadge compact label={`Pole #${poleWinner.carNumber}`} tone="blue" /> : null}
        </View>
      </AppCard>

      <AppCard style={{ gap: 0, padding: theme.spacing.sm }}>
        <AppText variant="caption" tone="accent" style={{ padding: 4 }}>APEX SCORECARD</AppText>
        {apexEntries.map((entry) => {
          const vehicle = state.game.vehicles.find((item) => item.id === entry.vehicleId);
          const postRaceCondition = Math.max(0, (vehicle?.condition ?? 0) - entry.conditionLoss);
          const payout = settlement.winningsByCar.find((line) => line.vehicleId === entry.vehicleId)?.amount ?? 0;
          const depth = result.depthFacts?.entryFacts.find(
            (fact) => fact.entryId === entry.id,
          );
          const expanded = expandedStrategyEntryId === entry.id;
          return (
            <View
              key={entry.id}
              style={{ borderTopColor: theme.colors.border, borderTopWidth: 1, gap: 4, padding: theme.spacing.sm }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ width: 48 }}>
                  <AppText variant="title" style={{ fontSize: 20 }}>P{entry.finishPosition}</AppText>
                  <AppText variant="caption" tone="soft">from P{entry.startPosition}</AppText>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText numberOfLines={1}>#{entry.carNumber} · {entry.driverName}</AppText>
                  <AppText variant="caption" tone="muted">{money.format(payout)} · +{entry.exp} EXP</AppText>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <StatusBadge compact label={entry.status} tone={entry.status === 'DNF' ? 'red' : 'green'} />
                  <AppText
                    variant="caption"
                    style={{ color: postRaceCondition >= RACE_READY_THRESHOLD ? theme.colors.victory : theme.colors.trackRed }}>
                    {postRaceCondition}% · {postRaceCondition >= RACE_READY_THRESHOLD ? 'Ready' : 'Needs Work'}
                  </AppText>
                </View>
              </View>
              <AppText variant="caption" tone="soft">Condition impact: −{entry.conditionLoss}%</AppText>
              {depth ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    onPress={() =>
                      setExpandedStrategyEntryId((current) =>
                        current === entry.id ? undefined : entry.id,
                      )
                    }
                    style={{ gap: 2, minHeight: 40, justifyContent: 'center' }}>
                    <AppText numberOfLines={1} variant="caption" tone="accent">
                      S1 {depth.plan.stageCalls[1] === 'Flip the Stage' ? 'Flip' : 'Chase'} ·
                      S2 {depth.plan.stageCalls[2] === 'Flip the Stage' ? 'Flip' : 'Chase'} ·
                      {' '}{depth.actualStopCount} stops · {depth.cleanRace ? 'Clean Race' : 'Eventful'}
                    </AppText>
                    <AppText numberOfLines={1} variant="caption" tone="soft">
                      {depth.plan.finalStagePitPlan} · P{depth.expectedPosition} expected → P{depth.finishPosition}
                    </AppText>
                  </Pressable>
                  {expanded ? (
                    <View
                      style={{
                        backgroundColor: theme.colors.garage,
                        borderCurve: 'continuous',
                        borderRadius: 6,
                        gap: 3,
                        padding: 6,
                      }}>
                      {depth.strategyReasonCodes.map((reason) => (
                        <AppText key={reason} variant="caption" tone="muted">
                          {reason}
                        </AppText>
                      ))}
                      <AppText variant="caption" tone="soft">
                        Tires finished {depth.finishingTireCondition}% (low {depth.minimumTireCondition}%)
                        {' · '}Fuel {depth.finishingFuel}% (low {depth.minimumFuel}%)
                      </AppText>
                      <AppText variant="caption" tone="soft">
                        Equipment stress {depth.equipmentStress} · Routine wear −{depth.routineConditionLoss}
                        {' · '}Incident damage −{depth.incidentConditionLoss + depth.severeEventConditionLoss}
                      </AppText>
                      {depth.archetypeReasonCodes.map((reason) => (
                        <AppText key={reason} variant="caption" tone="accent">
                          {reason}
                        </AppText>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : result.legacyRaceDepth ? (
                <AppText variant="caption" tone="muted">
                  Detailed pit and stage history is unavailable for this legacy race.
                </AppText>
              ) : null}
            </View>
          );
        })}
      </AppCard>

      <AppCard style={{ gap: 6, padding: theme.spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <AppText variant="caption" tone="accent">WEEKEND NET</AppText>
            <AppText variant="title" style={{ fontSize: 20 }}>{money.format(settlement.netWeekend)}</AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="caption" tone="soft">Cash after settlement</AppText>
            <AppText>{money.format(settlement.cashAfter)}</AppText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showLedger }}
          onPress={() => setShowLedger((current) => !current)}
          style={{ paddingVertical: 3 }}>
          <AppText variant="caption" tone="accent">{showLedger ? 'Hide settlement ledger' : 'Show settlement ledger'}</AppText>
        </Pressable>
        {showLedger ? (
          <View style={{ borderTopColor: theme.colors.border, borderTopWidth: 1, paddingTop: 5 }}>
            <AppRow compact label="Race Winnings" detail={money.format(settlement.totalRaceWinnings)} />
            <AppRow compact label="Sponsor Payment" detail={money.format(settlement.sponsorIncome)} />
            <AppRow compact label="Operating Cost" detail={`-${money.format(settlement.operatingCostBase)}`} />
            {settlement.budgetFixerDiscount > 0 ? (
              <AppRow compact label="Budget Fixer" detail={`+${money.format(settlement.budgetFixerDiscount)}`} />
            ) : null}
          </View>
        ) : null}
      </AppCard>

      {settlement.operatingCostShortfall > 0 ? (
        <AppCard style={{ borderColor: theme.colors.trackRed, padding: theme.spacing.md }}>
          <AppText variant="title" style={{ fontSize: 18 }}>Operating Cost Shortfall</AppText>
          <AppText variant="caption" tone="muted">
            Apex is short {money.format(settlement.operatingCostShortfall)}. Cash remains at $0 until earnings cover the gap.
          </AppText>
        </AppCard>
      ) : null}

      {recruitingRisks.length > 0 ? (
        <AppCard style={{ borderColor: theme.colors.caution, gap: 4, padding: theme.spacing.md }}>
          <AppText variant="caption" tone="accent">RECRUITING WATCH</AppText>
          {recruitingRisks.slice(0, 2).map((warning) => (
            <AppText key={warning.prospectId} variant="caption" tone="muted">
              {warning.prospectName}: {warning.message}
            </AppText>
          ))}
        </AppCard>
      ) : null}

      <AppButton label="View Full Official Results" onPress={() => router.push('/full-results' as Href)} variant="secondary" />
    </Screen>
  );
}
