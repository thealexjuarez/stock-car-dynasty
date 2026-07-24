import { Pressable, View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
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
  onContinue: () => void;
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
  onContinue,
}: SessionControlBarProps) {
  const continueLabel =
    kind === 'qualifying'
      ? raceWeekendCopy.qualifying.gridAction
      : raceWeekendCopy.race.resultsAction;

  return (
    <View
      style={{
        backgroundColor: theme.colors.panelStrong,
        borderColor: theme.colors.border,
        borderCurve: 'continuous',
        borderRadius: theme.cards.radius,
        borderWidth: 1,
        gap: 5,
        minHeight: 76,
        padding: 6,
      }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
        <AppText
          numberOfLines={1}
          variant="caption"
          style={{
            flexShrink: 0,
            fontFamily: theme.typography.mono,
            fontSize: 9,
          }}>
          {isComplete ? raceWeekendCopy.presentation.sessionComplete : progressLabel}
        </AppText>
        <AppText
          numberOfLines={1}
          variant="caption"
          tone="muted"
          style={{ flex: 1, fontSize: 8, textAlign: 'right' }}>
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

      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSetPaused(!isPaused)}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: isPaused ? theme.colors.victory : theme.colors.pitWall,
            borderColor: isPaused ? theme.colors.victory : theme.colors.border,
            borderRadius: 6,
            borderWidth: 1,
            height: 40,
            justifyContent: 'center',
            opacity: pressed ? 0.78 : 1,
            width: 64,
          })}>
          <AppText variant="caption" style={{ color: theme.colors.white, fontSize: 9 }}>
            {isPaused
              ? raceWeekendCopy.presentation.resume
              : raceWeekendCopy.presentation.pause}
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
                  height: 40,
                  justifyContent: 'center',
                  opacity: pressed ? 0.78 : 1,
                  width: 32,
                })}>
                <AppText
                  variant="caption"
                  style={{ fontFamily: theme.typography.mono, fontSize: 9 }}>
                  {speed}x
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {isComplete ? (
          <Pressable
            accessibilityRole="button"
            onPress={onContinue}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: theme.colors.victory,
              borderRadius: 6,
              flex: 1,
              height: 40,
              justifyContent: 'center',
              opacity: pressed ? 0.78 : 1,
              paddingHorizontal: 6,
            })}>
            <AppText
              numberOfLines={1}
              variant="caption"
              style={{
                color: theme.colors.rubber,
                fontSize: 9,
                fontWeight: '900',
                textTransform: 'uppercase',
              }}>
              {continueLabel}
            </AppText>
          </Pressable>
        ) : (
          <View
            style={{
              alignItems: 'center',
              flex: 1,
              height: 40,
              justifyContent: 'center',
            }}>
            <AppText numberOfLines={1} variant="caption" tone="soft" style={{ fontSize: 8 }}>
              {kind === 'qualifying'
                ? raceWeekendCopy.qualifying.underway
                : raceWeekendCopy.presentation.greenFlagRun}
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}
