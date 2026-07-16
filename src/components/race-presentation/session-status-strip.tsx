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
        gap: 6,
        justifyContent: 'space-between',
        minHeight: 34,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
      }}>
      <View style={{ alignItems: 'center', flex: 1, flexDirection: 'row', gap: 6, minWidth: 0 }}>
        <AppText variant="eyebrow" tone="accent" style={{ fontSize: 9 }}>
          {config.sessionLabel}
        </AppText>
        <AppText numberOfLines={1} variant="caption" style={{ flexShrink: 1, fontSize: 10 }}>
          {trackName}
        </AppText>
      </View>
      <AppText variant="caption" style={{ fontSize: 10, fontVariant: ['tabular-nums'] }}>
        {config.kind === 'qualifying' ? 'Run' : 'Lap'} {currentLap}/{config.totalLaps}
      </AppText>
      <AppText numberOfLines={1} variant="caption" tone="muted" style={{ fontSize: 9 }}>
        {config.weather} · {config.trackCondition} · {config.temperatureFahrenheit}°F
      </AppText>
      <StatusBadge
        compact
        label={config.cautionState}
        tone={config.cautionState === 'Green' ? 'green' : 'yellow'}
      />
    </View>
  );
}
