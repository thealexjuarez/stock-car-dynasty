import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import type { CarSpriteMetadata } from '@/types/race-presentation';

type StockCarSpriteProps = {
  carNumber: string;
  metadata: CarSpriteMetadata;
  sceneX: number;
  sceneY: number;
  scale: number;
  zIndex: number;
};

export function StockCarSprite({
  carNumber,
  metadata,
  sceneX,
  sceneY,
  scale,
  zIndex,
}: StockCarSpriteProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(sceneX - metadata.logicalWidth / 2, { duration: 620 }),
      },
      {
        translateY: withTiming(sceneY - metadata.logicalHeight / 2, { duration: 320 }),
      },
      { scale },
    ],
  }), [metadata.logicalHeight, metadata.logicalWidth, scale, sceneX, sceneY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          height: metadata.logicalHeight,
          left: 0,
          position: 'absolute',
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
          bottom: 0,
          height: 7,
          left: 7,
          position: 'absolute',
          width: 76,
        }}
      />
      <View
        style={{
          backgroundColor: metadata.accentColor,
          borderColor: '#080B10',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 8,
          borderWidth: 1,
          height: 16,
          left: 27,
          position: 'absolute',
          top: 1,
          width: 36,
        }}
      />
      <View
        style={{
          backgroundColor: '#182431',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 5,
          height: 10,
          left: 31,
          position: 'absolute',
          top: 4,
          width: 27,
        }}
      />
      <View
        style={{
          backgroundColor: metadata.bodyColor,
          borderColor: '#080B10',
          borderCurve: 'continuous',
          borderRadius: 8,
          borderWidth: 1,
          bottom: 4,
          height: 19,
          left: 3,
          position: 'absolute',
          width: 82,
        }}
      />
      <View
        style={{
          backgroundColor: metadata.accentColor,
          bottom: 11,
          height: 4,
          left: 5,
          position: 'absolute',
          width: 76,
        }}
      />
      <View
        style={{
          backgroundColor: '#111820',
          height: 8,
          left: 1,
          position: 'absolute',
          top: 6,
          width: 4,
        }}
      />
      <View
        style={{
          backgroundColor: '#0A0D12',
          borderColor: '#5B6470',
          borderRadius: 999,
          borderWidth: 1,
          bottom: 0,
          height: 13,
          left: 15,
          position: 'absolute',
          width: 13,
        }}
      />
      <View
        style={{
          backgroundColor: '#0A0D12',
          borderColor: '#5B6470',
          borderRadius: 999,
          borderWidth: 1,
          bottom: 0,
          height: 13,
          position: 'absolute',
          right: 14,
          width: 13,
        }}
      />
      <Text
        selectable={false}
        style={{
          color: metadata.numberColor,
          fontSize: 12,
          fontWeight: '900',
          left: 36,
          position: 'absolute',
          textShadowColor: '#07090D',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
          top: 13,
        }}>
        {carNumber}
      </Text>
    </Animated.View>
  );
}
