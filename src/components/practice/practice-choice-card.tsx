import { Pressable, View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { theme } from '@/theme';
import type { PracticeChoice } from '@/types/practice';

type PracticeChoiceCardProps = {
  choice: PracticeChoice;
  selected: boolean;
  onSelect: () => void;
};

export function PracticeChoiceCard({ choice, selected, onSelect }: PracticeChoiceCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onSelect}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <AppCard
        style={{
          backgroundColor: selected ? theme.colors.panelStrong : theme.colors.garage,
          borderColor: selected ? theme.colors.caution : theme.colors.border,
        }}>
        <View
          style={{
            alignItems: 'flex-start',
            flexDirection: 'row',
            gap: theme.spacing.md,
            justifyContent: 'space-between',
          }}>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <AppText variant="title">{choice.name}</AppText>
            <AppText variant="caption" tone="accent">
              {choice.intent}
            </AppText>
          </View>
          {selected ? <StatusBadge label="Selected" tone="yellow" /> : null}
        </View>
        <AppText tone="muted">{choice.description}</AppText>
        <AppText variant="caption">{choice.effectSummary}</AppText>
      </AppCard>
    </Pressable>
  );
}
