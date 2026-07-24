import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PracticeChoiceCard } from '@/components/practice/practice-choice-card';
import { WeekendProgressStrip } from '@/components/race-presentation/weekend-progress-strip';
import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
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
      <View style={{ gap: 6 }}>
        <AppText variant="eyebrow" tone="accent">
          {raceWeekendCopy.practice.eyebrow} · Race {race.round} of {state.game.calendar.length}
        </AppText>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText variant="title">{raceWeekendCopy.practice.title}</AppText>
            <AppText numberOfLines={1} variant="caption" tone="muted">{race.name}</AppText>
          </View>
          <StatusBadge label={track.type} tone="red" />
        </View>
        <WeekendProgressStrip phase="preview" />
      </View>

      <AppCard style={{ borderColor: theme.colors.trackRed, gap: 6, padding: theme.spacing.sm }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title" style={{ fontSize: 18 }}>{track.name}</AppText>
          <AppText variant="caption" tone="soft">One plan · two cars</AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {state.game.vehicles.map((vehicle) => {
            const driver = state.game.drivers.find((item) => item.id === vehicle.assignedDriverId);
            return (
              <View key={vehicle.id} style={{ backgroundColor: theme.colors.panelStrong, borderRadius: 6, flex: 1, padding: 7 }}>
                <AppText variant="caption">#{vehicle.number} · {driver?.name}</AppText>
              </View>
            );
          })}
        </View>
      </AppCard>

      <View accessibilityRole="radiogroup" style={{ gap: theme.spacing.md }}>
        <View style={{ gap: 2 }}>
          <AppText variant="title" style={{ fontSize: 18 }}>{raceWeekendCopy.practice.selectionTitle}</AppText>
          <AppText variant="caption" tone="muted">{raceWeekendCopy.practice.selectionSubtitle}</AppText>
        </View>
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
