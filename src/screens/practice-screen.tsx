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

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          Race {race.round} of {state.game.calendar.length} · Practice
        </AppText>
        <AppText variant="hero">{track.name}</AppText>
        <AppText tone="muted">{race.name}</AppText>
      </View>

      <AppCard style={{ borderColor: theme.colors.trackRed }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.md,
            justifyContent: 'space-between',
          }}>
          <AppText variant="title">Weekend Setup</AppText>
          <StatusBadge label={track.type} tone="red" />
        </View>
        <AppText tone="muted">
          Choose one focus for both Apex Motorsports entries. The decision locks when practice
          resolves.
        </AppText>
      </AppCard>

      <AppCard>
        <SectionHeader title="Apex Motorsports Entries" subtitle="Both cars receive the same practice focus" />
        {state.game.vehicles.map((vehicle) => {
          const driver = state.game.drivers.find(
            (item) => item.id === vehicle.assignedDriverId,
          );
          return (
            <AppRow
              key={vehicle.id}
              label={`Car #${vehicle.number}`}
              detail={driver?.name ?? 'Driver unavailable'}
            />
          );
        })}
      </AppCard>

      <View accessibilityRole="radiogroup" style={{ gap: theme.spacing.md }}>
        <SectionHeader
          title="Select Practice Focus"
          subtitle="One choice applies to the entire weekend"
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

      {isConfirming && selectedChoice ? (
        <AppCard style={{ borderColor: theme.colors.caution }}>
          <AppText variant="eyebrow" tone="accent">Confirm Weekend Focus</AppText>
          <AppText variant="title">{selectedChoice.name}</AppText>
          <AppText tone="muted">
            Resolve practice with this focus? It cannot be changed after the result is generated.
          </AppText>
          <AppButton label="Resolve Practice" onPress={resolveSession} />
          <AppButton
            label="Change Selection"
            variant="secondary"
            onPress={() => setIsConfirming(false)}
          />
        </AppCard>
      ) : (
        <AppButton
          disabled={!selectedChoiceId}
          label={selectedChoiceId ? 'Review Practice Plan' : 'Select a Practice Focus'}
          onPress={() => setIsConfirming(true)}
        />
      )}
    </Screen>
  );
}
