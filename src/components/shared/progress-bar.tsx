import { View } from 'react-native';
import { AppText } from './app-text';
import { theme } from '@/theme';

export function ProgressBar({
  value,
  max,
  label,
  color = theme.colors.caution,
  marker,
  markerLabel,
}: {
  value: number;
  max: number;
  label: string;
  color?: string;
  marker?: number;
  markerLabel?: string;
}) {
  const percent = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const markerPercent = marker === undefined
    ? null
    : Math.min(100, Math.max(0, Math.round((marker / max) * 100)));
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
        <AppText variant="caption">{label}</AppText>
        <AppText variant="caption" tone="soft" style={{ fontVariant: ['tabular-nums'] }}>
          {value.toLocaleString()} / {max.toLocaleString()}
        </AppText>
      </View>
      <View style={{ backgroundColor: theme.colors.panel, borderRadius: 999, height: 12 }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: 999,
            height: '100%',
            width: `${percent}%`,
          }}
        />
        {markerPercent !== null ? (
          <View
            accessibilityLabel={markerLabel}
            style={{
              backgroundColor: theme.colors.white,
              height: 18,
              left: `${markerPercent}%`,
              position: 'absolute',
              top: -3,
              width: 2,
            }}
          />
        ) : null}
      </View>
      {markerLabel ? (
        <AppText variant="caption" tone="soft">{markerLabel}</AppText>
      ) : null}
    </View>
  );
}
