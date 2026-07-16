import { Pressable, type PressableProps, type ViewStyle, View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { theme } from '@/theme';

type AppButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
};

export function AppButton({
  disabled,
  label,
  variant = 'primary',
  style,
  ...props
}: AppButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={({ pressed }) => [
        {
          opacity: disabled ? 0.5 : pressed ? 0.78 : 1,
        },
        style,
      ]}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: isPrimary ? theme.colors.trackRed : theme.colors.panelStrong,
          borderColor: isPrimary ? theme.colors.trackRed : theme.colors.border,
          borderCurve: 'continuous',
          borderRadius: theme.buttons.radius,
          borderWidth: 1,
          justifyContent: 'center',
          minHeight: theme.buttons.minHeight,
          paddingHorizontal: theme.spacing.xl,
        }}>
        <AppText
          variant="caption"
          style={{ color: theme.colors.white, fontWeight: '900', textTransform: 'uppercase' }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}
