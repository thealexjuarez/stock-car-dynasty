import { FlatList, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { theme } from '@/theme';
import type { RunningOrderEntry } from '@/types/race-presentation';

type TimingTowerProps = {
  compact: boolean;
  runningOrder: readonly RunningOrderEntry[];
  style?: StyleProp<ViewStyle>;
};

export function TimingTower({ compact, runningOrder, style }: TimingTowerProps) {
  const rowHeight = compact ? 34 : 38;

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.pitWall,
          borderColor: theme.colors.border,
          borderCurve: 'continuous',
          borderRadius: theme.cards.radius,
          borderWidth: 1,
          overflow: 'hidden',
        },
        style,
      ]}>
      <View
        style={{
          backgroundColor: theme.colors.panelStrong,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
        }}>
        <AppText variant="eyebrow" tone="accent">Timing Tower</AppText>
      </View>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={runningOrder}
        getItemLayout={(_, index) => ({ index, length: rowHeight, offset: rowHeight * index })}
        initialNumToRender={10}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={10}
        nestedScrollEnabled
        renderItem={({ item }) => (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: item.isPlayerTeam ? theme.colors.panelStrong : 'transparent',
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
              borderLeftColor: item.isPlayerTeam ? theme.colors.caution : 'transparent',
              borderLeftWidth: 3,
              flexDirection: 'row',
              gap: compact ? 3 : theme.spacing.xs,
              height: rowHeight,
              paddingHorizontal: compact ? 4 : theme.spacing.sm,
            }}>
            <AppText
              variant="caption"
              style={{ fontVariant: ['tabular-nums'], textAlign: 'center', width: compact ? 18 : 22 }}>
              {item.position}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: item.sprite.bodyColor, fontVariant: ['tabular-nums'], width: compact ? 24 : 30 }}>
              #{item.carNumber}
            </AppText>
            <AppText
              numberOfLines={1}
              variant="caption"
              style={{ flex: 1, fontSize: compact ? 9 : 11 }}>
              {compact ? item.driverName.split(' ').at(-1) : item.driverName}
            </AppText>
            <View
              accessibilityLabel={`${item.tireStatus} tires`}
              style={{
                backgroundColor: item.tirePercent >= 85 ? theme.colors.victory : theme.colors.caution,
                borderRadius: 999,
                height: 7,
                width: 7,
              }}
            />
            <AppText
              variant="caption"
              tone="soft"
              style={{ fontSize: compact ? 8 : 10, fontVariant: ['tabular-nums'], textAlign: 'right', width: compact ? 31 : 42 }}>
              {item.interval}
            </AppText>
          </View>
        )}
        windowSize={3}
      />
    </View>
  );
}
