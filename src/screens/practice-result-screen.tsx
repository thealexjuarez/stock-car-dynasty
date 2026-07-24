import { Link, useRouter } from 'expo-router';
import { View } from 'react-native';

import { WeekendProgressStrip } from '@/components/race-presentation/weekend-progress-strip';
import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
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
    <Screen
      compact
      footer={
        <AppButton
          label={raceWeekendCopy.practiceResult.primaryAction}
          onPress={continueToQualifying}
        />
      }>
      <View style={{ gap: 6 }}>
        <AppText variant="eyebrow" tone="accent">
          {raceWeekendCopy.practiceResult.eyebrow} · {result.trackType}
        </AppText>
        <AppText variant="title">{raceWeekendCopy.practiceResult.title}</AppText>
        <AppText numberOfLines={1} variant="caption" tone="muted">{result.raceName} at {result.trackName}</AppText>
        <WeekendProgressStrip phase="practice-result" />
      </View>

      <AppCard style={{ borderColor: theme.colors.caution, gap: 4, padding: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          {raceWeekendCopy.practiceResult.selectedPlan}
        </AppText>
        <AppText variant="title" style={{ fontSize: 18 }}>
          {result.selectedChoice.name}
        </AppText>
        <AppText variant="caption">{result.selectedChoice.effectSummary}</AppText>
      </AppCard>

      {result.entries.map((entry) => (
        <AppCard key={entry.carNumber} style={{ gap: 6, padding: theme.spacing.sm }}>
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
          <AppText variant="caption">{entry.crewFeedback}</AppText>
          <AppText variant="caption" tone="muted">{entry.insight}</AppText>
          <AppRow
            compact
            label={raceWeekendCopy.practiceResult.qualifying}
            detail={entry.qualifyingEffect}
          />
          <AppRow
            compact
            label={raceWeekendCopy.practiceResult.race}
            detail={entry.raceEffect}
          />
        </AppCard>
      ))}
    </Screen>
  );
}
