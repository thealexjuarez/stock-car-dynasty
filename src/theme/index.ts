import '@/global.css';

import { Platform } from 'react-native';

export const colors = {
  asphalt: '#07090D',
  pitWall: '#10151D',
  garage: '#161C26',
  panel: '#1D2530',
  panelStrong: '#26313F',
  border: '#334052',
  line: '#46566D',
  text: '#F7FAFC',
  textMuted: '#A8B3C4',
  textSoft: '#748197',
  trackRed: '#E63B2E',
  caution: '#F7C948',
  victory: '#20C997',
  fuel: '#2F80ED',
  rubber: '#050608',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const typography = {
  family: Platform.select({
    ios: 'system-ui',
    android: 'normal',
    web: 'var(--font-display)',
    default: 'normal',
  }),
  mono: Platform.select({
    ios: 'ui-monospace',
    android: 'monospace',
    web: 'var(--font-mono)',
    default: 'monospace',
  }),
  sizes: {
    eyebrow: 11,
    caption: 12,
    body: 15,
    title: 22,
    hero: 34,
  },
  lineHeights: {
    caption: 16,
    body: 22,
    title: 27,
    hero: 38,
  },
} as const;

export const cards = {
  radius: 8,
  borderWidth: 1,
  shadow: '0 12px 28px rgba(0, 0, 0, 0.22)',
} as const;

export const buttons = {
  radius: 8,
  minHeight: 48,
} as const;

export const badges = {
  radius: 999,
  height: 28,
} as const;

export const layout = {
  maxContentWidth: 760,
  bottomTabInset: Platform.select({ ios: 50, android: 80, default: 84 })!,
} as const;

export const theme = {
  colors,
  spacing,
  typography,
  cards,
  buttons,
  badges,
  layout,
} as const;
