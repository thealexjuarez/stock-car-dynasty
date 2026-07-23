import { Link, useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

export function PracticeResultScreen() {
  const router = useRouter();
  const { state, beginQualifying } = useGameSession();
  const result = state.weekend.practice;

  if (!result) {
    return (
      <Screen>
        <AppText variant="title">Practice result unavailable</AppText>
        <AppText tone="muted">Return to Practice and confirm a weekend focus.</AppText>
        <Link href="/practice" asChild>
          <AppButton label="Return to Practice" />
        </Link>
      </Screen>
    );
  }

  const continueToQualifying = () => {
    beginQualifying();
    router.push('/qualifying');
  };

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">Practice Complete · {result.trackType}</AppText>
        <AppText variant="hero">Practice Result</AppText>
        <AppText tone="muted">{result.raceName} at {result.trackName}</AppText>
      </View>

      <AppCard style={{ borderColor: theme.colors.caution }}>
        <AppText variant="eyebrow" tone="accent">Selected Focus</AppText>
        <AppText variant="title">{result.selectedChoice.name}</AppText>
        <AppText tone="muted">{result.selectedChoice.description}</AppText>
        <AppText variant="caption">{result.selectedChoice.effectSummary}</AppText>
      </AppCard>

      {result.entries.map((entry) => (
        <AppCard key={entry.carNumber}>
          <View
            style={{
              alignItems: 'flex-start',
              flexDirection: 'row',
              gap: theme.spacing.md,
              justifyContent: 'space-between',
            }}>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <AppText variant="title">Car #{entry.carNumber}</AppText>
              <AppText tone="muted">{entry.driverName}</AppText>
            </View>
            <StatusBadge label={`${entry.setupConfidence} confidence`} tone="blue" />
          </View>
          <AppRow label="Setup Confidence" detail={`${entry.setupConfidence} / 100`} />
          <AppText>{entry.crewFeedback}</AppText>
          <View style={{ gap: theme.spacing.xs }}>
            <AppText variant="eyebrow" tone="soft">Insight Learned</AppText>
            <AppText tone="muted">{entry.insight}</AppText>
          </View>
          <AppRow label="Qualifying" detail={entry.qualifyingEffect} />
          <AppRow label="Race" detail={entry.raceEffect} />
        </AppCard>
      ))}

      <AppButton label="Continue to Qualifying" onPress={continueToQualifying} />
    </Screen>
  );
}
