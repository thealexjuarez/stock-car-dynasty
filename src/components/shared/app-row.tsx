import { View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { theme } from '@/theme';

type AppRowProps = {
  label: string;
  detail?: string;
};

export function AppRow({ label, detail }: AppRowProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        borderColor: theme.colors.border,
        borderTopWidth: 1,
        flexDirection: 'row',
        gap: theme.spacing.md,
        justifyContent: 'space-between',
        minHeight: 44,
        paddingTop: theme.spacing.md,
      }}>
      <AppText>{label}</AppText>
      {detail ? (
        <AppText tone="soft" variant="caption">
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}
