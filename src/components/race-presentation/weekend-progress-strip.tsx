import { View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { theme } from '@/theme';
import type { RaceWeekendPhase } from '@/types/race-weekend';

const steps = [
  { id: 'preview', label: 'Briefing' },
  { id: 'practice-result', label: 'Practice' },
  { id: 'qualifying', label: 'Qualify' },
  { id: 'race', label: 'Race' },
  { id: 'results', label: 'Results' },
] as const;

const phaseIndex: Record<RaceWeekendPhase, number> = {
  preview: 0,
  'practice-result': 1,
  qualifying: 2,
  grid: 3,
  race: 3,
  results: 4,
};

export function WeekendProgressStrip({ phase }: { phase: RaceWeekendPhase }) {
  const activeIndex = phaseIndex[phase];

  return (
    <View
      accessibilityLabel={`Weekend progress: ${steps[activeIndex].label}`}
      style={{ flexDirection: 'row', gap: 3 }}>
      {steps.map((step, index) => {
        const active = index === activeIndex;
        return (
          <View
            key={step.id}
            style={{
              alignItems: 'center',
              backgroundColor: active
                ? theme.colors.caution
                : index < activeIndex
                  ? theme.colors.victory
                  : theme.colors.panelStrong,
              borderRadius: 4,
              flex: 1,
              minWidth: 0,
              paddingHorizontal: 2,
              paddingVertical: 5,
            }}>
            <AppText
              numberOfLines={1}
              variant="caption"
              style={{
                color: active ? theme.colors.rubber : theme.colors.white,
                fontSize: 8,
                lineHeight: 10,
              }}>
              {step.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
