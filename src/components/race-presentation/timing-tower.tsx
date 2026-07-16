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
  const rowHeight = compact ? 27 : 31;

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
          paddingHorizontal: 6,
          paddingVertical: 4,
        }}>
        <AppText variant="eyebrow" tone="accent" style={{ fontSize: 9 }}>Timing Tower</AppText>
      </View>
      <FlatList
        contentInsetAdjustmentBehavior="never"
        data={runningOrder}
        getItemLayout={(_, index) => ({ index, length: rowHeight, offset: rowHeight * index })}
        initialNumToRender={10}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={10}
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
              gap: compact ? 2 : 4,
              height: rowHeight,
              paddingHorizontal: compact ? 3 : 6,
            }}>
            <AppText
              variant="caption"
              style={{ fontSize: compact ? 9 : 10, fontVariant: ['tabular-nums'], textAlign: 'center', width: compact ? 16 : 20 }}>
              {item.position}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: item.sprite.bodyColor, fontSize: compact ? 9 : 10, fontVariant: ['tabular-nums'], width: compact ? 23 : 28 }}>
              #{item.carNumber}
            </AppText>
            <AppText
              numberOfLines={1}
              variant="caption"
              style={{ flex: 1, fontSize: compact ? 8 : 10 }}>
              {compact ? item.driverName.split(' ').at(-1) : item.driverName}
            </AppText>
            <View
              accessibilityLabel={`${item.tireStatus} tires`}
              style={{
                backgroundColor: item.tirePercent >= 85 ? theme.colors.victory : theme.colors.caution,
                borderRadius: 999,
                height: 6,
                width: 6,
              }}
            />
            <AppText
              variant="caption"
              tone="soft"
              style={{ fontSize: compact ? 8 : 9, fontVariant: ['tabular-nums'], textAlign: 'right', width: compact ? 28 : 38 }}>
              {item.interval}
            </AppText>
          </View>
        )}
        windowSize={3}
      />
    </View>
  );
}
