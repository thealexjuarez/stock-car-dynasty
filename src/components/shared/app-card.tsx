import { View, type ViewProps } from 'react-native';

import { theme } from '@/theme';

export function AppCard({ style, ...props }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.garage,
          borderColor: theme.colors.border,
          borderCurve: 'continuous',
          borderRadius: theme.cards.radius,
          borderWidth: theme.cards.borderWidth,
          boxShadow: theme.cards.shadow,
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
        },
        style,
      ]}
      {...props}
    />
  );
}
