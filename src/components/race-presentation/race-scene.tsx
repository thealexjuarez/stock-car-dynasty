import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { StockCarSprite } from '@/components/race-presentation/stock-car-sprite';
import { AppText } from '@/components/shared/app-text';
import { theme } from '@/theme';
import type { RacePresentationConfig, SceneCar } from '@/types/race-presentation';

type RaceSceneProps = {
  cars: readonly SceneCar[];
  config: RacePresentationConfig;
  focusedCarNumber: string;
  height: number;
  style?: StyleProp<ViewStyle>;
};

export function RaceScene({
  cars,
  config,
  focusedCarNumber,
  height,
  style,
}: RaceSceneProps) {
  const [sceneWidth, setSceneWidth] = useState(420);
  const trackTop = height * 0.38;
  const laneStep = Math.max(35, height * 0.115);

  return (
    <View
      accessibilityLabel={`Fixed elevated race view. Car #${focusedCarNumber} is centered with ${cars.length - 1} nearby cars visible.`}
      onLayout={(event) => setSceneWidth(event.nativeEvent.layout.width)}
      style={[
        {
          backgroundColor: '#91A9B8',
          borderColor: theme.colors.border,
          borderCurve: 'continuous',
          borderRadius: theme.cards.radius,
          borderWidth: 1,
          height,
          overflow: 'hidden',
          position: 'relative',
        },
        style,
      ]}>
      <View
        style={{
          backgroundColor: '#315F3F',
          height: height * 0.22,
          left: 0,
          position: 'absolute',
          right: 0,
          top: height * 0.17,
        }}
      />
      <View
        style={{
          backgroundColor: '#D7D9D5',
          borderBottomColor: '#8B9196',
          borderBottomWidth: 3,
          height: 13,
          left: 0,
          position: 'absolute',
          right: 0,
          top: trackTop - 12,
        }}
      />
      <View
        style={{
          backgroundColor: '#3E444B',
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: trackTop,
        }}
      />
      {[1, 2].map((laneLine) => (
        <View
          key={laneLine}
          style={{
            backgroundColor: 'rgba(238, 241, 244, 0.5)',
            height: 2,
            left: 0,
            position: 'absolute',
            right: 0,
            top: trackTop + laneStep * laneLine,
          }}
        />
      ))}
      <View
        style={{
          backgroundColor: 'rgba(7, 9, 13, 0.78)',
          borderBottomRightRadius: theme.cards.radius,
          left: 0,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          position: 'absolute',
          top: 0,
          zIndex: 30,
        }}>
        <AppText variant="eyebrow" style={{ color: theme.colors.white }}>
          Fixed Side Follow · {cars.length} Cars In View
        </AppText>
      </View>
      {cars.map(({ entrant, relativeTrackPosition }) => {
        const normalized = relativeTrackPosition / config.cameraWindow;
        const sceneX = sceneWidth / 2 + normalized * sceneWidth * 0.42;
        const scale = 0.82 + entrant.lane * 0.08;
        const sceneY = trackTop + laneStep * (entrant.lane + 0.62);

        return (
          <StockCarSprite
            key={entrant.id}
            carNumber={entrant.carNumber}
            metadata={entrant.sprite}
            scale={scale}
            sceneX={sceneX}
            sceneY={sceneY}
            zIndex={10 + entrant.lane}
          />
        );
      })}
    </View>
  );
}
