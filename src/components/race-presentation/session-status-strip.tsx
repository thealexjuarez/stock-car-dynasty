import { View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { StatusBadge } from '@/components/shared/status-badge';
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
        alignItems: 'center',
        backgroundColor: theme.colors.panelStrong,
        borderColor: theme.colors.border,
        borderCurve: 'continuous',
        borderRadius: theme.cards.radius,
        borderWidth: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        justifyContent: 'space-between',
        minHeight: 48,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}>
      <View style={{ flex: 1, minWidth: 130 }}>
        <AppText variant="eyebrow" tone="accent">{config.sessionLabel}</AppText>
        <AppText variant="caption">{trackName}</AppText>
      </View>
      <AppText variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
        {config.kind === 'qualifying' ? 'Attempt' : 'Lap'} {currentLap} / {config.totalLaps}
      </AppText>
      <AppText variant="caption" tone="muted">
        {config.weather} · {config.trackCondition} · {config.temperatureFahrenheit}°F
      </AppText>
      <StatusBadge
        label={config.cautionState}
        tone={config.cautionState === 'Green' ? 'green' : 'yellow'}
      />
    </View>
  );
}
