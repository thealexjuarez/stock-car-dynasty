import { theme } from '@/theme';

export { colors, spacing, typography, cards, buttons, badges, layout, theme } from '@/theme';

export const Colors = {
  light: {
    text: '#0D1117',
    background: '#F7FAFC',
    backgroundElement: '#E8EDF4',
    backgroundSelected: '#D9E2EC',
    textSecondary: '#46566D',
  },
  dark: {
    text: '#F7FAFC',
    background: '#07090D',
    backgroundElement: '#161C26',
    backgroundSelected: '#26313F',
    textSecondary: '#A8B3C4',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  sans: theme.typography.family,
  serif: theme.typography.family,
  rounded: theme.typography.family,
  mono: theme.typography.mono,
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = theme.layout.bottomTabInset;
export const MaxContentWidth = theme.layout.maxContentWidth;
