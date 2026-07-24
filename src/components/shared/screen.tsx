import type { ReactNode, Ref } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

type ScreenProps = ScrollViewProps & {
  children: ReactNode;
  compact?: boolean;
  contentRef?: Ref<ScrollView>;
  footer?: ReactNode;
};

export function Screen({
  children,
  compact = false,
  contentRef,
  contentContainerStyle,
  footer,
  style,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[{ backgroundColor: theme.colors.asphalt, flex: 1 }, style]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        ref={contentRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          {
            flexGrow: 1,
            paddingBottom: footer ? theme.spacing.lg : insets.bottom + theme.spacing.xxxl,
            paddingHorizontal: compact ? theme.spacing.md : theme.spacing.lg,
            paddingTop: insets.top + (compact ? theme.spacing.md : theme.spacing.xl),
          },
          contentContainerStyle,
        ]}
        {...props}>
        <View
          style={{
            alignSelf: 'center',
            gap: compact ? theme.spacing.md : theme.spacing.lg,
            maxWidth: theme.layout.maxContentWidth,
            width: '100%',
          }}>
          {children}
        </View>
      </ScrollView>

      {footer ? (
        <View
          style={{
            backgroundColor: theme.colors.pitWall,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
            paddingHorizontal: theme.spacing.md,
            paddingTop: theme.spacing.sm,
          }}>
          <View
            style={{
              alignSelf: 'center',
              gap: theme.spacing.sm,
              maxWidth: theme.layout.maxContentWidth,
              width: '100%',
            }}>
            {footer}
          </View>
        </View>
      ) : null}
    </View>
  );
}
