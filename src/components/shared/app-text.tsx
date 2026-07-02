import { Text, type TextProps } from 'react-native';

import { theme } from '@/theme';

type AppTextProps = TextProps & {
  variant?: 'eyebrow' | 'caption' | 'body' | 'title' | 'hero';
  tone?: 'primary' | 'muted' | 'soft' | 'accent';
};

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: AppTextProps) {
  const color = {
    primary: theme.colors.text,
    muted: theme.colors.textMuted,
    soft: theme.colors.textSoft,
    accent: theme.colors.caution,
  }[tone];

  return (
    <Text
      selectable
      style={[
        {
          color,
          fontFamily: theme.typography.family,
          letterSpacing: 0,
        },
        variant === 'eyebrow' && {
          fontSize: theme.typography.sizes.eyebrow,
          lineHeight: theme.typography.lineHeights.caption,
          fontWeight: '800',
          textTransform: 'uppercase',
        },
        variant === 'caption' && {
          fontSize: theme.typography.sizes.caption,
          lineHeight: theme.typography.lineHeights.caption,
          fontWeight: '700',
        },
        variant === 'body' && {
          fontSize: theme.typography.sizes.body,
          lineHeight: theme.typography.lineHeights.body,
          fontWeight: '600',
        },
        variant === 'title' && {
          fontSize: theme.typography.sizes.title,
          lineHeight: theme.typography.lineHeights.title,
          fontWeight: '800',
        },
        variant === 'hero' && {
          fontSize: theme.typography.sizes.hero,
          lineHeight: theme.typography.lineHeights.hero,
          fontWeight: '900',
        },
        style,
      ]}
      {...props}
    />
  );
}
