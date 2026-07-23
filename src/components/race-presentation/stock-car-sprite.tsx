import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { CarSpriteMetadata } from '@/types/race-presentation';

type StockCarSpriteProps = {
  carNumber: string;
  metadata: CarSpriteMetadata;
  sceneX: number;
  sceneY: number;
  scale: number;
  zIndex: number;
  interpolationMs: number;
  motionMs: SharedValue<number>;
  ovalCycleMs: number;
  turnCarAngleDegrees: number;
};

export function StockCarSprite({
  carNumber,
  metadata,
  sceneX,
  sceneY,
  scale,
  zIndex,
  interpolationMs,
  motionMs,
  ovalCycleMs,
  turnCarAngleDegrees,
}: StockCarSpriteProps) {
  const targetX = useSharedValue(sceneX - metadata.logicalWidth / 2);
  const targetY = useSharedValue(sceneY - metadata.logicalHeight / 2);

  useEffect(() => {
    const timing = { duration: interpolationMs, easing: Easing.linear };
    targetX.value = withTiming(sceneX - metadata.logicalWidth / 2, timing);
    targetY.value = withTiming(sceneY - metadata.logicalHeight / 2, timing);
  }, [
    interpolationMs,
    metadata.logicalHeight,
    metadata.logicalWidth,
    sceneX,
    sceneY,
    targetX,
    targetY,
  ]);

  const phaseSeed = Number.parseInt(carNumber, 10) || 0;
  const animatedStyle = useAnimatedStyle(() => {
    const progress = (motionMs.value % ovalCycleMs) / ovalCycleMs;
    const signedTurn = Math.sin(progress * Math.PI * 2);
    const laneDrift = Math.sin(motionMs.value / 1400 + phaseSeed) * 1.1;

    return {
      transform: [
        { translateX: targetX.value },
        { translateY: targetY.value + laneDrift },
        { scale: scale * (1 + Math.abs(signedTurn) * 0.015) },
        { rotateZ: `${signedTurn * turnCarAngleDegrees}deg` },
      ],
    };
  }, [ovalCycleMs, phaseSeed, scale, turnCarAngleDegrees]);

  return (
    <Animated.View
      testID={`car-sprite-${carNumber}`}
      style={[
        {
          height: metadata.logicalHeight,
          left: 0,
          position: 'absolute',
          pointerEvents: 'none',
          top: 0,
          width: metadata.logicalWidth,
          zIndex,
        },
        animatedStyle,
      ]}>
      <View
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.32)',
          borderRadius: 999,
          bottom: 1,
          height: 8,
          left: 5,
          position: 'absolute',
          width: 99,
        }}
      />
      <View
        style={{
          backgroundColor: '#0A0D12',
          borderColor: '#5D6670',
          borderRadius: 999,
          borderWidth: 2,
          bottom: 0,
          height: 18,
          left: 18,
          position: 'absolute',
          width: 18,
        }}
      />
      <View
        style={{
          backgroundColor: '#1B222A',
          borderColor: '#7E8790',
          borderRadius: 999,
          borderWidth: 1,
          bottom: 5,
          height: 8,
          left: 23,
          position: 'absolute',
          width: 8,
        }}
      />
      <View
        style={{
          backgroundColor: '#0A0D12',
          borderColor: '#5D6670',
          borderRadius: 999,
          borderWidth: 2,
          bottom: 0,
          height: 18,
          position: 'absolute',
          right: 15,
          width: 18,
        }}
      />
      <View
        style={{
          backgroundColor: '#1B222A',
          borderColor: '#7E8790',
          borderRadius: 999,
          borderWidth: 1,
          bottom: 5,
          height: 8,
          position: 'absolute',
          right: 20,
          width: 8,
        }}
      />
      <View
        style={{
          backgroundColor: metadata.bodyColor,
          borderColor: '#090C10',
          borderCurve: 'continuous',
          borderRadius: 10,
          borderWidth: 1,
          bottom: 6,
          height: 21,
          left: 3,
          position: 'absolute',
          width: 101,
        }}
      />
      <View
        style={{
          backgroundColor: metadata.bodyColor,
          borderTopRightRadius: 10,
          height: 16,
          position: 'absolute',
          right: 0,
          top: 17,
          transform: [{ rotateZ: '-4deg' }],
          width: 31,
        }}
      />
      <View
        style={{
          backgroundColor: metadata.bodyColor,
          borderColor: '#090C10',
          borderTopLeftRadius: 9,
          borderTopRightRadius: 5,
          borderWidth: 1,
          height: 18,
          left: 35,
          position: 'absolute',
          top: 7,
          transform: [{ skewX: '-12deg' }],
          width: 42,
        }}
      />
      <View
        style={{
          backgroundColor: '#172531',
          borderColor: '#90A7B4',
          borderWidth: 1,
          height: 11,
          left: 39,
          position: 'absolute',
          top: 10,
          transform: [{ skewX: '-12deg' }],
          width: 15,
        }}
      />
      <View
        style={{
          backgroundColor: '#203746',
          borderColor: '#90A7B4',
          borderWidth: 1,
          height: 11,
          left: 57,
          position: 'absolute',
          top: 10,
          transform: [{ skewX: '-12deg' }],
          width: 15,
        }}
      />
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.38)',
          height: 2,
          left: 8,
          position: 'absolute',
          right: 9,
          top: 20,
        }}
      />
      <View
        style={{
          backgroundColor: metadata.accentColor,
          bottom: 9,
          height: 6,
          left: 7,
          position: 'absolute',
          transform: [{ skewX: '-22deg' }],
          width: 91,
        }}
      />
      <View
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          bottom: 6,
          height: 5,
          left: 8,
          position: 'absolute',
          right: 7,
        }}
      />
      <View
        style={{
          backgroundColor: '#111820',
          height: 8,
          left: 8,
          position: 'absolute',
          top: 9,
          width: 3,
        }}
      />
      <View
        style={{
          backgroundColor: '#111820',
          height: 4,
          left: 2,
          position: 'absolute',
          top: 6,
          transform: [{ rotateZ: '-4deg' }],
          width: 18,
        }}
      />
      <View
        style={{
          backgroundColor: '#111820',
          bottom: 5,
          height: 3,
          position: 'absolute',
          right: 0,
          width: 13,
        }}
      />
      <Text
        selectable={false}
        style={{
          color: metadata.numberColor,
          fontSize: carNumber.length > 1 ? 13 : 15,
          fontWeight: '900',
          left: carNumber.length > 1 ? 46 : 50,
          position: 'absolute',
          top: 21,
        }}>
        {carNumber}
      </Text>
    </Animated.View>
  );
}
