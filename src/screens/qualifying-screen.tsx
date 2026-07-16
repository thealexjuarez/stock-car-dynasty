import { View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { getNextRace, starterGameState } from '@/data/starter-game-state';
import { theme } from '@/theme';

export function QualifyingScreen() {
  const { race, track } = getNextRace();

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">Race Weekend · Next Session</AppText>
        <AppText variant="hero">Qualifying</AppText>
        <AppText tone="muted">
          {race?.name ?? 'Upcoming race'} · {track?.name ?? starterGameState.series}
        </AppText>
      </View>

      <AppCard style={{ borderColor: theme.colors.fuel }}>
        <AppText variant="title">Qualifying Handoff Ready</AppText>
        <AppText tone="muted">
          Practice is complete. Starting positions and the 3D qualifying presentation will be
          built separately.
        </AppText>
      </AppCard>
    </Screen>
  );
}
