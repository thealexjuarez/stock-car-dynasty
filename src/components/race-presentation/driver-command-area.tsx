import { Pressable, View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { theme } from '@/theme';
import type { DriverPaceMode } from '@/types/race-presentation';

const paceModes: readonly DriverPaceMode[] = ['Conserve', 'Balanced', 'Push'];

type DriverCommandAreaProps = {
  compact: boolean;
  selectedMode: DriverPaceMode;
  onSelectMode: (mode: DriverPaceMode) => void;
};

export function DriverCommandArea({
  compact,
  selectedMode,
  onSelectMode,
}: DriverCommandAreaProps) {
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <AppText variant="eyebrow" tone="soft">Pace Command</AppText>
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        {paceModes.map((mode) => {
          const selected = mode === selectedMode;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={mode}
              onPress={() => onSelectMode(mode)}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: selected ? theme.colors.fuel : theme.colors.pitWall,
                borderColor: selected ? theme.colors.fuel : theme.colors.border,
                borderRadius: 6,
                borderWidth: 1,
                flex: 1,
                minHeight: 30,
                justifyContent: 'center',
                opacity: pressed ? 0.75 : 1,
                paddingHorizontal: 5,
              })}>
              <AppText variant="caption" style={{ fontSize: compact ? 9 : 10 }}>
                {mode}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
