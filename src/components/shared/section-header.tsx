import { View } from 'react-native';
import { AppText } from './app-text';
import { theme } from '@/theme';

export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={{ gap:theme.spacing.xs }}><AppText variant="title">{title}</AppText><AppText tone="soft" variant="caption">{subtitle}</AppText></View>;
}
