import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import type { RacePresentationConfig } from '@/types/race-presentation';

type TrackEnvironmentProps = {
  config: RacePresentationConfig;
  height: number;
  motionMs: SharedValue<number>;
  sceneWidth: number;
};

type MovingBandProps = {
  children: ReactNode;
  motionMs: SharedValue<number>;
  sceneWidth: number;
  speedPixelsPerSecond: number;
  style: ComponentProps<typeof Animated.View>['style'];
  testID: string;
};

function MovingBand({
  children,
  motionMs,
  sceneWidth,
  speedPixelsPerSecond,
  style,
  testID,
}: MovingBandProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = (motionMs.value / 1000) * speedPixelsPerSecond;

    return {
      transform: [{ translateX: -(distance % Math.max(1, sceneWidth)) }],
    };
  }, [sceneWidth, speedPixelsPerSecond]);

  return (
    <Animated.View testID={testID} style={[style, { width: sceneWidth * 2 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export function TrackEnvironment({
  config,
  height,
  motionMs,
  sceneWidth,
}: TrackEnvironmentProps) {
  const trackTop = height * 0.36;
  const horizonMarkers = Array.from({ length: Math.ceil(sceneWidth / 54) * 2 + 2 });
  const wallMarkers = Array.from({ length: Math.ceil(sceneWidth / 42) * 2 + 2 });
  const roadMarkers = Array.from({ length: Math.ceil(sceneWidth / 46) * 2 + 2 });

  const bankingStyle = useAnimatedStyle(() => {
    const progress = (motionMs.value % config.ovalCycleMs) / config.ovalCycleMs;
    const signedTurn = Math.sin(progress * Math.PI * 2);

    return {
      transform: [
        { rotateZ: `${signedTurn * config.bankAngleDegrees}deg` },
        { scale: 1.04 },
      ],
    };
  }, [config.bankAngleDegrees, config.ovalCycleMs]);

  return (
    <View style={{ bottom: 0, left: 0, pointerEvents: 'none', position: 'absolute', right: 0, top: 0 }}>
      <View style={{ backgroundColor: '#8FA8B9', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <View style={{ backgroundColor: '#B9CAD3', height: height * 0.16, left: 0, position: 'absolute', right: 0, top: 0 }} />

      <Animated.View
        style={[
          { bottom: -16, left: -16, overflow: 'hidden', position: 'absolute', right: -16, top: height * 0.08 },
          bankingStyle,
        ]}>
        <View style={{ backgroundColor: '#326548', height: trackTop * 0.68, left: 0, position: 'absolute', right: 0, top: 0 }} />
        <MovingBand
          motionMs={motionMs}
          sceneWidth={sceneWidth}
          speedPixelsPerSecond={config.worldMotionPixelsPerSecond * 0.08}
          style={{ flexDirection: 'row', height: 28, left: 0, position: 'absolute', top: 4 }}
          testID="track-infield-motion">
          {horizonMarkers.map((_, index) => (
            <View
              key={index}
              style={{
                backgroundColor: index % 3 === 0 ? '#213A2B' : '#3D7351',
                borderTopLeftRadius: 9,
                borderTopRightRadius: 9,
                height: 16 + (index % 3) * 4,
                marginRight: 18,
                marginTop: 8 - (index % 3) * 4,
                width: 36,
              }}
            />
          ))}
        </MovingBand>

        <View style={{ backgroundColor: '#D9DDE0', borderBottomColor: '#737B82', borderBottomWidth: 3, height: 13, left: 0, position: 'absolute', right: 0, top: trackTop - 13 }} />
        <MovingBand
          motionMs={motionMs}
          sceneWidth={sceneWidth}
          speedPixelsPerSecond={config.worldMotionPixelsPerSecond * 0.24}
          style={{ flexDirection: 'row', height: 10, left: 0, position: 'absolute', top: trackTop - 12 }}
          testID="track-wall-motion">
          {wallMarkers.map((_, index) => (
            <View
              key={index}
              style={{
                backgroundColor: index % 2 === 0 ? '#F2F3F2' : '#B9BEC2',
                borderRightColor: '#737B82',
                borderRightWidth: 1,
                height: 10,
                width: 42,
              }}
            />
          ))}
        </MovingBand>

        <View style={{ backgroundColor: '#383D43', bottom: 0, left: 0, position: 'absolute', right: 0, top: trackTop }} />
        <MovingBand
          motionMs={motionMs}
          sceneWidth={sceneWidth}
          speedPixelsPerSecond={config.worldMotionPixelsPerSecond}
          style={{ bottom: 0, flexDirection: 'row', left: 0, position: 'absolute', top: trackTop }}
          testID="track-asphalt-motion">
          {roadMarkers.map((_, index) => (
            <View key={index} style={{ height: '100%', position: 'relative', width: 46 }}>
              <View style={{ backgroundColor: index % 3 === 0 ? '#2C3035' : '#42474D', height: 3, left: 6, opacity: 0.72, position: 'absolute', top: 22 + (index % 4) * 26, width: 18 }} />
              <View style={{ backgroundColor: '#555B62', height: 2, left: 29, opacity: 0.5, position: 'absolute', top: 54 + (index % 3) * 31, width: 10 }} />
            </View>
          ))}
        </MovingBand>

        {[1, 2].map((laneLine) => (
          <MovingBand
            key={laneLine}
            motionMs={motionMs}
            sceneWidth={sceneWidth}
            speedPixelsPerSecond={config.worldMotionPixelsPerSecond}
            style={{ flexDirection: 'row', height: 3, left: 0, position: 'absolute', top: trackTop + ((height - trackTop) / 3) * laneLine }}
            testID={`track-lane-${laneLine}`}>
            {roadMarkers.map((_, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: index % 2 === 0 ? 'rgba(240, 242, 242, 0.78)' : 'transparent',
                  height: 2,
                  width: 46,
                }}
              />
            ))}
          </MovingBand>
        ))}

        <View style={{ backgroundColor: '#D5D9D5', bottom: 7, height: 5, left: 0, position: 'absolute', right: 0 }} />
        <View style={{ backgroundColor: '#357148', bottom: 0, height: 7, left: 0, position: 'absolute', right: 0 }} />
      </Animated.View>
    </View>
  );
}
