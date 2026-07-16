import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { theme } from '@/theme';
import type { PlaybackSpeed, RaceSessionKind } from '@/types/race-presentation';

const playbackSpeeds: readonly PlaybackSpeed[] = [1, 2, 4];

type SessionControlBarProps = {
  isComplete: boolean;
  isPaused: boolean;
  kind: RaceSessionKind;
  playbackSpeed: PlaybackSpeed;
  progress: number;
  progressLabel: string;
  statusMessage: string;
  onSetPaused: (paused: boolean) => void;
  onSetPlaybackSpeed: (speed: PlaybackSpeed) => void;
};

export function SessionControlBar({
  isComplete,
  isPaused,
  kind,
  playbackSpeed,
  progress,
  progressLabel,
  statusMessage,
  onSetPaused,
  onSetPlaybackSpeed,
}: SessionControlBarProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors.panelStrong,
        borderColor: theme.colors.border,
        borderCurve: 'continuous',
        borderRadius: theme.cards.radius,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 7,
        minHeight: 50,
        paddingHorizontal: 7,
        paddingVertical: 5,
      }}>
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
          <AppText numberOfLines={1} variant="caption" style={{ flexShrink: 1, fontSize: 9 }}>
            {progressLabel}
          </AppText>
          <AppText numberOfLines={1} variant="caption" tone="muted" style={{ flex: 1, fontSize: 8 }}>
            {statusMessage}
          </AppText>
        </View>
        <View
          style={{
            backgroundColor: theme.colors.pitWall,
            borderRadius: 999,
            height: 5,
            overflow: 'hidden',
          }}>
          <View
            style={{
              backgroundColor: isComplete ? theme.colors.victory : theme.colors.trackRed,
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
          borderRadius: 6,
          height: 32,
          justifyContent: 'center',
          opacity: pressed ? 0.78 : 1,
          width: 66,
        })}>
        <AppText variant="caption" style={{ color: theme.colors.white, fontSize: 9 }}>
          {isPaused ? 'Resume' : 'Pause'}
        </AppText>
      </Pressable>

      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 3 }}>
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
                borderRadius: 5,
                borderWidth: 1,
                height: 32,
                justifyContent: 'center',
                opacity: pressed ? 0.78 : 1,
                width: 34,
              })}>
              <AppText variant="caption" style={{ fontSize: 9 }}>{speed}x</AppText>
            </Pressable>
          );
        })}
      </View>

      {kind === 'qualifying' && isComplete ? (
        <Link href="/live-race" asChild>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: theme.colors.victory,
              borderRadius: 6,
              height: 32,
              justifyContent: 'center',
              opacity: pressed ? 0.78 : 1,
              paddingHorizontal: 9,
            })}>
            <AppText variant="caption" style={{ color: theme.colors.rubber, fontSize: 9 }}>
              Continue
            </AppText>
          </Pressable>
        </Link>
      ) : kind === 'qualifying' ? (
        <View
          accessibilityState={{ disabled: true }}
          style={{
            alignItems: 'center',
            backgroundColor: theme.colors.pitWall,
            borderColor: theme.colors.border,
            borderRadius: 6,
            borderWidth: 1,
            height: 32,
            justifyContent: 'center',
            paddingHorizontal: 8,
          }}>
          <AppText variant="caption" tone="soft" style={{ fontSize: 8 }}>Complete Runs</AppText>
        </View>
      ) : null}
    </View>
  );
}
