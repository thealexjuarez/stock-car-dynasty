import { Link } from 'expo-router';
import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { appState } from '@/state/app-state';
import { theme } from '@/theme';

export function LoginScreen() {
  return (
    <Screen
      contentContainerStyle={{
        justifyContent: 'center',
      }}>
      <View style={{ gap: theme.spacing.md }}>
        <StatusBadge label={appState.seasonLabel} tone="red" />
        <AppText variant="hero">Stock Car Dynasty</AppText>
        <AppText tone="muted">
          Build the garage, guide the people, and chase the title one week at a time.
        </AppText>
      </View>

      <AppCard
        style={{
          backgroundColor: theme.colors.pitWall,
          gap: theme.spacing.lg,
        }}>
        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="title">{appState.teamName}</AppText>
          <AppText tone="muted">Owner profile and save selection land here later.</AppText>
        </View>

        <Link href="/home" asChild>
          <AppButton label="Enter garage" />
        </Link>
      </AppCard>
    </Screen>
  );
}
