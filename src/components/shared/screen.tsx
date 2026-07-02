import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

type ScreenProps = ScrollViewProps & {
  children: React.ReactNode;
};

export function Screen({ children, contentContainerStyle, style, ...props }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[{ backgroundColor: theme.colors.asphalt, flex: 1 }, style]}
      contentContainerStyle={[
        {
          flexGrow: 1,
          paddingBottom: insets.bottom + theme.spacing.xxxl,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: insets.top + theme.spacing.xl,
        },
        contentContainerStyle,
      ]}
      {...props}>
      <View
        style={{
          alignSelf: 'center',
          gap: theme.spacing.lg,
          maxWidth: theme.layout.maxContentWidth,
          width: '100%',
        }}>
        {children}
      </View>
    </ScrollView>
  );
}
