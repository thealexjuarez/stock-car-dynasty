import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { StockCarSprite } from '@/components/race-presentation/stock-car-sprite';
import { TrackEnvironment } from '@/components/race-presentation/track-environment';
import { AppText } from '@/components/shared/app-text';
import { theme } from '@/theme';
import type {
  OvalPresentationPhase,
  PlaybackSpeed,
  RacePresentationConfig,
  SceneCar,
} from '@/types/race-presentation';

type RaceSceneProps = {
  cars: readonly SceneCar[];
  config: RacePresentationConfig;
  focusedCarNumber: string;
  isPaused: boolean;
  ovalPhase: OvalPresentationPhase;
  playbackSpeed: PlaybackSpeed;
  style?: StyleProp<ViewStyle>;
};

export function RaceScene({
  cars,
  config,
  focusedCarNumber,
  isPaused,
  ovalPhase,
  playbackSpeed,
  style,
}: RaceSceneProps) {
  const [sceneSize, setSceneSize] = useState({ height: 220, width: 420 });
  const motionMs = useSharedValue(0);
  const pausedValue = useSharedValue(isPaused);
  const speedValue = useSharedValue(playbackSpeed);

  useEffect(() => {
    pausedValue.value = isPaused;
  }, [isPaused, pausedValue]);

  useEffect(() => {
    speedValue.value = playbackSpeed;
  }, [playbackSpeed, speedValue]);

  useFrameCallback((frameInfo) => {
    if (!pausedValue.value) {
      motionMs.value += (frameInfo.timeSincePreviousFrame ?? 0) * speedValue.value;
    }
  });

  const trackTop = sceneSize.height * 0.36;
  const laneStep = (sceneSize.height - trackTop) / 3;

  return (
    <View
      accessibilityLabel={`Fixed elevated race view during ${ovalPhase}. Car #${focusedCarNumber} is centered with ${cars.length - 1} nearby cars visible.`}
      onLayout={(event) => {
        const { height, width } = event.nativeEvent.layout;
        setSceneSize((current) =>
          current.height === height && current.width === width ? current : { height, width },
        );
      }}
      style={[
        {
          backgroundColor: '#8FA8B9',
          borderColor: theme.colors.border,
          borderCurve: 'continuous',
          borderRadius: theme.cards.radius,
          borderWidth: 1,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
        },
        style,
      ]}>
      <TrackEnvironment
        config={config}
        height={sceneSize.height}
        motionMs={motionMs}
        sceneWidth={sceneSize.width}
      />

      {cars.map(({ entrant, relativeTrackPosition }) => {
        const normalized = relativeTrackPosition / config.cameraWindow;
        const sceneX = sceneSize.width / 2 + normalized * sceneSize.width * 0.42;
        const scale = 0.72 + entrant.lane * 0.09;
        const sceneY = trackTop + laneStep * (entrant.lane + 0.55);

        return (
          <StockCarSprite
            key={entrant.id}
            carNumber={entrant.carNumber}
            interpolationMs={config.visualInterpolationMs}
            metadata={entrant.sprite}
            motionMs={motionMs}
            ovalCycleMs={config.ovalCycleMs}
            scale={scale}
            sceneX={sceneX}
            sceneY={sceneY}
            turnCarAngleDegrees={config.turnCarAngleDegrees}
            zIndex={10 + entrant.lane}
          />
        );
      })}

      <View
        style={{
          backgroundColor: 'rgba(7, 9, 13, 0.82)',
          borderBottomRightRadius: theme.cards.radius,
          left: 0,
          paddingHorizontal: 7,
          paddingVertical: 3,
          position: 'absolute',
          top: 0,
          zIndex: 30,
        }}>
        <AppText variant="eyebrow" style={{ color: theme.colors.white, fontSize: 9 }}>
          {ovalPhase} · {cars.length} Cars
        </AppText>
      </View>
    </View>
  );
}
