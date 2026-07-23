import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PracticeChoiceCard } from '@/components/practice/practice-choice-card';
import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { SectionHeader } from '@/components/shared/section-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { getPracticeChoice, practiceChoices } from '@/data/practice-config';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { getNextRace } from '@/data/starter-game-state';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';
import type { PracticeChoiceId } from '@/types/practice';

export function PracticeScreen() {
  const router = useRouter();
  const { state, completePractice } = useGameSession();
  const { race, track } = getNextRace(state.game);
  const [selectedChoiceId, setSelectedChoiceId] = useState<PracticeChoiceId | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const selectedChoice = selectedChoiceId ? getPracticeChoice(selectedChoiceId) : undefined;

  if (!race || !track) {
    return (
      <Screen>
        <AppText>Practice is unavailable.</AppText>
      </Screen>
    );
  }

  const selectChoice = (choiceId: PracticeChoiceId) => {
    setSelectedChoiceId(choiceId);
    setIsConfirming(false);
  };

  const resolveSession = () => {
    if (!selectedChoiceId) {
      return;
    }

    completePractice(selectedChoiceId);
    router.push('/practice-result');
  };

  const footer = isConfirming && selectedChoice ? (
    <>
      <View style={{ gap: 2 }}>
        <AppText variant="eyebrow" tone="accent">
          {raceWeekendCopy.practice.confirmTitle}
        </AppText>
        <AppText numberOfLines={1} variant="caption" tone="muted">
          {selectedChoice.name} · {raceWeekendCopy.practice.confirmBody}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <AppButton
          label={raceWeekendCopy.practice.changeAction}
          onPress={() => setIsConfirming(false)}
          style={{ flex: 1 }}
          variant="secondary"
        />
        <AppButton
          label={raceWeekendCopy.practice.runAction}
          onPress={resolveSession}
          style={{ flex: 1.35 }}
        />
      </View>
    </>
  ) : (
    <AppButton
      disabled={!selectedChoiceId}
      label={
        selectedChoiceId
          ? raceWeekendCopy.practice.reviewAction
          : raceWeekendCopy.practice.selectAction
      }
      onPress={() => setIsConfirming(true)}
    />
  );

  return (
    <Screen compact footer={footer}>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          {raceWeekendCopy.practice.eyebrow} · Race {race.round} of{' '}
          {state.game.calendar.length}
        </AppText>
        <AppText variant="hero">{raceWeekendCopy.practice.title}</AppText>
        <AppText tone="muted">{race.name}</AppText>
      </View>

      <AppCard style={{ borderColor: theme.colors.trackRed, padding: theme.spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.md,
            justifyContent: 'space-between',
          }}>
          <AppText variant="title">{track.name}</AppText>
          <StatusBadge label={track.type} tone="red" />
        </View>
        <AppText tone="muted">
          One plan applies to both cars and carries through qualifying and the race.
        </AppText>
      </AppCard>

      <AppCard style={{ padding: theme.spacing.md }}>
        <SectionHeader
          title={state.game.team.name}
          subtitle="Both entries work from the same plan."
        />
        {state.game.vehicles.map((vehicle) => {
          const driver = state.game.drivers.find(
            (item) => item.id === vehicle.assignedDriverId,
          );
          return (
            <AppRow
              compact
              key={vehicle.id}
              label={`Car #${vehicle.number}`}
              detail={driver?.name ?? 'Driver unavailable'}
            />
          );
        })}
      </AppCard>

      <View accessibilityRole="radiogroup" style={{ gap: theme.spacing.md }}>
        <SectionHeader
          title={raceWeekendCopy.practice.selectionTitle}
          subtitle={raceWeekendCopy.practice.selectionSubtitle}
        />
        {practiceChoices.map((choice) => (
          <PracticeChoiceCard
            key={choice.id}
            choice={choice}
            selected={choice.id === selectedChoiceId}
            onSelect={() => selectChoice(choice.id)}
          />
        ))}
      </View>

    </Screen>
  );
}
