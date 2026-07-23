import { View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { theme } from '@/theme';
import type { BadgeTone } from '@/types/shell';

const toneColors: Record<BadgeTone, string> = {
  red: theme.colors.trackRed,
  yellow: theme.colors.caution,
  green: theme.colors.victory,
  blue: theme.colors.fuel,
  neutral: theme.colors.line,
};

type StatusBadgeProps = {
  label: string;
  tone?: BadgeTone;
  compact?: boolean;
};

export function StatusBadge({ compact = false, label, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: toneColors[tone],
        borderRadius: theme.badges.radius,
        minHeight: compact ? 18 : theme.badges.height,
        justifyContent: 'center',
        paddingHorizontal: compact ? 6 : theme.spacing.md,
      }}>
      <AppText
        variant="caption"
        style={{
          color: tone === 'yellow' ? theme.colors.rubber : theme.colors.white,
          fontSize: compact ? 8 : theme.typography.sizes.caption,
          lineHeight: compact ? 10 : theme.typography.lineHeights.caption,
          fontWeight: '900',
        }}>
        {label}
      </AppText>
    </View>
  );
}
