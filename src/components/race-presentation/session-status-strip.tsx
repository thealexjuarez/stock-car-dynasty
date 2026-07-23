import { View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { theme } from '@/theme';
import type { RacePresentationConfig } from '@/types/race-presentation';

type SessionStatusStripProps = {
  config: RacePresentationConfig;
  currentLap: number;
  trackName: string;
};

export function SessionStatusStrip({
  config,
  currentLap,
  trackName,
}: SessionStatusStripProps) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.panelStrong,
        borderColor: theme.colors.border,
        borderCurve: 'continuous',
        borderRadius: theme.cards.radius,
        borderWidth: 1,
        gap: 3,
        minHeight: 46,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 5,
      }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
        <AppText variant="eyebrow" tone="accent" style={{ fontSize: 8 }}>
          {raceWeekendCopy.presentation.weekendStatus}
        </AppText>
        <AppText numberOfLines={1} variant="caption" style={{ flex: 1, fontSize: 10 }}>
          {trackName}
        </AppText>
        <StatusBadge
          compact
          label={config.cautionState}
          tone={config.cautionState === 'Green' ? 'green' : 'yellow'}
        />
      </View>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
        <AppText variant="caption" style={{ fontSize: 9 }}>
          {config.sessionLabel}
        </AppText>
        <AppText
          variant="caption"
          style={{ fontFamily: theme.typography.mono, fontSize: 9 }}>
          {config.kind === 'qualifying' ? 'RUN' : 'LAP'} {currentLap}/{config.totalLaps}
        </AppText>
        <AppText
          numberOfLines={1}
          variant="caption"
          tone="muted"
          style={{ flex: 1, fontSize: 8, textAlign: 'right' }}>
          {config.weather} · {config.trackCondition} · {config.temperatureFahrenheit}°F
        </AppText>
      </View>
    </View>
  );
}
