import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  broadStagePlanOptions,
  driverInstructionOptions,
  finalStagePitPlanOptions,
  finalStagePlanCopy,
  racePaceOptions,
  stageEndCallOptions,
} from '@/data/race-depth-config';
import { getWeekendEntrants } from '@/data/race-presentation-data';
import { projectRacePlan } from '@/simulation/race-depth';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';
import type { RacePlan } from '@/types/race-depth';

type CycleRowProps<T extends string> = {
  label: string;
  value: T;
  values: readonly T[];
  onChange: (value: T) => void;
};

const compactPlanLabel: Partial<Record<string, string>> = {
  'Protect the Car': 'Protect Car',
  'Defend Position': 'Defend',
  'Long-Run Setup': 'Long-Run',
  'Save for the Finish': 'Save for Finish',
  'Chase Stage Points': 'Chase Points',
  'Flip the Stage': 'Flip Stage',
  'Early Final Stop': 'Early Final',
  'Balanced Final Stop': 'Balanced Final',
  'Long Final Run': 'Long Final',
  'Short Run / Fresh Tires Late': 'Fresh Tires Late',
  'Caution Preference': 'Caution Call',
};

function getCompactPlanLabel(value: string) {
  return compactPlanLabel[value] ?? value;
}

function CycleRow<T extends string>({
  label,
  value,
  values,
  onChange,
}: CycleRowProps<T>) {
  const advance = () => {
    const index = values.indexOf(value);
    onChange(values[(index + 1) % values.length]);
  };
  return (
    <Pressable
      accessibilityHint="Tap to choose the next option"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="button"
      onPress={advance}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: theme.colors.panelStrong,
        borderColor: theme.colors.border,
        borderCurve: 'continuous',
        borderRadius: 6,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 6,
        minHeight: 40,
        opacity: pressed ? 0.78 : 1,
        paddingHorizontal: theme.spacing.sm,
      })}>
      <AppText
        variant="eyebrow"
        tone="soft"
        style={{ fontSize: 8, width: 60 }}>
        {label}
      </AppText>
      <AppText
        numberOfLines={1}
        variant="caption"
        style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>
        {getCompactPlanLabel(value)}
      </AppText>
      <AppText variant="caption" tone="accent">
        ›
      </AppText>
    </Pressable>
  );
}

export function RacePlanEditor() {
  const { state, setRacePlan } = useGameSession();
  const apexEntrants = useMemo(
    () => getWeekendEntrants(state.game).filter((entry) => entry.isPlayerTeam),
    [state.game],
  );
  const [selectedEntryId, setSelectedEntryId] = useState(
    apexEntrants[0]?.id ?? '',
  );
  const selectedEntrant =
    apexEntrants.find((entry) => entry.id === selectedEntryId) ??
    apexEntrants[0];
  const plan = selectedEntrant
    ? state.weekend.racePlans[selectedEntrant.id]
    : undefined;
  const teammatePlan = Object.values(state.weekend.racePlans).find(
    (item) => item.entryId !== selectedEntrant?.id,
  );
  const projection =
    selectedEntrant && plan
      ? projectRacePlan(state.game, selectedEntrant, plan, teammatePlan)
      : undefined;

  if (!selectedEntrant || !plan || !projection) {
    return (
      <AppCard>
        <AppText>Race plans are being prepared.</AppText>
      </AppCard>
    );
  }

  const update = (patch: Partial<RacePlan>) =>
    setRacePlan({ ...plan, ...patch, locked: true });
  const stageCopy =
    plan.stageCalls[1] === 'Chase Stage Points'
      ? 'Stay out for the stage finish, then pit at the break. Better stage result, but likely restart deeper.'
      : 'Pit before the stage ends and stay out at the break. Give up the stage result for next-stage track position.';
  const finalCopy = finalStagePlanCopy[plan.finalStagePitPlan];

  return (
    <AppCard
      style={{
        gap: 6,
        padding: theme.spacing.sm,
      }}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
        }}>
        <View style={{ flex: 1 }}>
          <AppText variant="eyebrow" tone="accent">
            Race Strategy
          </AppText>
          <AppText variant="caption" tone="muted">
            Plans lock before the green. Playback controls do not change them.
          </AppText>
        </View>
        <StatusBadge
          compact
          label={`${projection.plannedStopCount} Stops`}
          tone={projection.legal ? 'green' : 'red'}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {apexEntrants.map((entry) => {
          const selected = entry.id === selectedEntrant.id;
          const entryPlan = state.weekend.racePlans[entry.id];
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={entry.id}
              onPress={() => setSelectedEntryId(entry.id)}
              style={({ pressed }) => ({
                backgroundColor: selected
                  ? theme.colors.panelStrong
                  : theme.colors.garage,
                borderColor: selected
                  ? theme.colors.caution
                  : theme.colors.border,
                borderCurve: 'continuous',
                borderRadius: 6,
                borderWidth: 1,
                flex: 1,
                gap: 2,
                minHeight: 46,
                opacity: pressed ? 0.78 : 1,
                padding: 6,
              })}>
              <AppText variant="caption">
                #{entry.carNumber} · {entry.driverName}
              </AppText>
              <AppText numberOfLines={1} variant="caption" tone="soft">
                {entryPlan?.basePace} ·{' '}
                {getCompactPlanLabel(entryPlan?.finalStagePitPlan ?? '')}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 5 }}>
        <View style={{ flex: 1, gap: 5 }}>
          <CycleRow
            label="PACE"
            value={plan.basePace}
            values={racePaceOptions}
            onChange={(basePace) => update({ basePace })}
          />
          <CycleRow
            label="INSTRUCTION"
            value={plan.instruction}
            values={driverInstructionOptions}
            onChange={(instruction) => update({ instruction })}
          />
          <CycleRow
            label="RACE SHAPE"
            value={plan.broadStagePlan}
            values={broadStagePlanOptions}
            onChange={(broadStagePlan) => update({ broadStagePlan })}
          />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <CycleRow
            label="STAGE 1"
            value={plan.stageCalls[1]}
            values={stageEndCallOptions}
            onChange={(value) =>
              update({
                stageCalls: { ...plan.stageCalls, 1: value },
              })
            }
          />
          <CycleRow
            label="STAGE 2"
            value={plan.stageCalls[2]}
            values={stageEndCallOptions}
            onChange={(value) =>
              update({
                stageCalls: { ...plan.stageCalls, 2: value },
              })
            }
          />
          <CycleRow
            label="FINAL STOP"
            value={plan.finalStagePitPlan}
            values={finalStagePitPlanOptions}
            onChange={(finalStagePitPlan) => update({ finalStagePitPlan })}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: plan.attackClosing }}
        onPress={() => update({ attackClosing: !plan.attackClosing })}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: theme.colors.panelStrong,
          borderColor: plan.attackClosing
            ? theme.colors.caution
            : theme.colors.border,
          borderCurve: 'continuous',
          borderRadius: 6,
          borderWidth: 1,
          flexDirection: 'row',
          minHeight: 40,
          opacity: pressed ? 0.78 : 1,
          paddingHorizontal: theme.spacing.sm,
        })}>
        <AppText variant="eyebrow" tone="soft" style={{ flex: 1, fontSize: 8 }}>
          CLOSING ATTACK
        </AppText>
        <AppText variant="caption" tone={plan.attackClosing ? 'accent' : 'muted'}>
          {plan.attackClosing ? 'Authorized' : 'Balanced'}
        </AppText>
      </Pressable>

      <View
        style={{
          backgroundColor: theme.colors.garage,
          borderCurve: 'continuous',
          borderRadius: 6,
          gap: 3,
          padding: 6,
        }}>
        <AppText variant="caption" tone="accent">
          {projection.recommendation}
        </AppText>
        <AppText variant="caption" tone="muted">
          {stageCopy}
        </AppText>
        <AppText variant="caption" tone="soft">
          {finalCopy.benefit} {finalCopy.risk}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          <StatusBadge
            compact
            label={`Tires ${projection.projectedFinishTire}%`}
            tone={projection.projectedFinishTire < 25 ? 'red' : 'neutral'}
          />
          <StatusBadge
            compact
            label={`Fuel ${projection.projectedFinishFuel}%`}
            tone={
              projection.projectedMinimumFuel < 8 ? 'red' : 'neutral'
            }
          />
          <StatusBadge
            compact
            label={`${projection.fourthStopClassification} extra stop`}
            tone={
              projection.fourthStopClassification === 'Required'
                ? 'red'
                : 'neutral'
            }
          />
          {projection.doubleStackWarning ? (
            <StatusBadge compact label="Double-stack risk" tone="yellow" />
          ) : null}
        </View>
      </View>
    </AppCard>
  );
}
