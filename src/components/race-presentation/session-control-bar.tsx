import { Pressable, View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { theme } from '@/theme';
import type { PlaybackSpeed } from '@/types/race-presentation';

const playbackSpeeds: readonly PlaybackSpeed[] = [1, 2, 4];

type SessionControlBarProps = {
  isPaused: boolean;
  playbackSpeed: PlaybackSpeed;
  progress: number;
  progressLabel: string;
  strategyMessage: string;
  onSetPaused: (paused: boolean) => void;
  onSetPlaybackSpeed: (speed: PlaybackSpeed) => void;
};

export function SessionControlBar({
  isPaused,
  playbackSpeed,
  progress,
  progressLabel,
  strategyMessage,
  onSetPaused,
  onSetPlaybackSpeed,
}: SessionControlBarProps) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.panelStrong,
        borderColor: theme.colors.border,
        borderCurve: 'continuous',
        borderRadius: theme.cards.radius,
        borderWidth: 1,
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
      }}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
          justifyContent: 'space-between',
        }}>
        <View style={{ flex: 1, minWidth: 150 }}>
          <AppText variant="caption">{progressLabel}</AppText>
          <View
            style={{
              backgroundColor: theme.colors.pitWall,
              borderRadius: 999,
              height: 7,
              marginTop: theme.spacing.xs,
              overflow: 'hidden',
            }}>
            <View
              style={{
                backgroundColor: theme.colors.trackRed,
                height: '100%',
                width: `${Math.max(2, progress)}%`,
              }}
            />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSetPaused(!isPaused)}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: isPaused ? theme.colors.victory : theme.colors.trackRed,
            borderRadius: theme.buttons.radius,
            justifyContent: 'center',
            minHeight: 38,
            minWidth: 82,
            opacity: pressed ? 0.78 : 1,
            paddingHorizontal: theme.spacing.md,
          })}>
          <AppText variant="caption" style={{ color: theme.colors.white }}>
            {isPaused ? 'Resume' : 'Pause'}
          </AppText>
        </Pressable>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          {playbackSpeeds.map((speed) => {
            const selected = speed === playbackSpeed;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={speed}
                onPress={() => onSetPlaybackSpeed(speed)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: selected ? theme.colors.fuel : theme.colors.pitWall,
                  borderColor: selected ? theme.colors.fuel : theme.colors.border,
                  borderRadius: 6,
                  borderWidth: 1,
                  height: 38,
                  justifyContent: 'center',
                  opacity: pressed ? 0.78 : 1,
                  width: 42,
                })}>
                <AppText variant="caption">{speed}x</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
      <AppText variant="caption" tone="muted">{strategyMessage}</AppText>
    </View>
  );
}
