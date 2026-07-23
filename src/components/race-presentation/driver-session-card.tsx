import { Pressable, View } from 'react-native';

import { DriverCommandArea } from '@/components/race-presentation/driver-command-area';
import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { theme } from '@/theme';
import type {
  DriverPaceMode,
  RacePresentationEntrant,
  RunningOrderEntry,
} from '@/types/race-presentation';

type DriverSessionCardProps = {
  activeCamera: boolean;
  compact: boolean;
  currentLap: number;
  entry: RacePresentationEntrant;
  runningEntry: RunningOrderEntry;
  selectedMode: DriverPaceMode;
  sessionState: string;
  showPaceControls: boolean;
  totalLaps: number;
  onSelectCamera: () => void;
  onSelectMode: (mode: DriverPaceMode) => void;
};

export function DriverSessionCard({
  activeCamera,
  compact,
  currentLap,
  entry,
  runningEntry,
  selectedMode,
  sessionState,
  showPaceControls,
  totalLaps,
  onSelectCamera,
  onSelectMode,
}: DriverSessionCardProps) {
  return (
    <AppCard
      style={{
        backgroundColor: activeCamera ? theme.colors.panelStrong : theme.colors.garage,
        borderColor: activeCamera ? theme.colors.fuel : theme.colors.border,
        gap: compact ? 4 : theme.spacing.sm,
        padding: compact ? 6 : theme.spacing.sm,
      }}>
      <Pressable
        accessibilityLabel={`Follow Car #${entry.carNumber}, ${entry.driverName}`}
        accessibilityRole="button"
        accessibilityState={{ selected: activeCamera }}
        onPress={onSelectCamera}
        style={({ pressed }) => ({ gap: 3, opacity: pressed ? 0.78 : 1 })}>
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            gap: 5,
          }}>
          <AppText variant="body" style={{ fontSize: compact ? 13 : 15 }}>#{entry.carNumber}</AppText>
          <AppText numberOfLines={1} variant="caption" tone="muted" style={{ flex: 1, fontSize: compact ? 9 : 11 }}>
            {entry.driverName}
          </AppText>
          <StatusBadge compact label={`P${runningEntry.position}`} tone="red" />
          {activeCamera ? <StatusBadge compact label="CAM" tone="blue" /> : null}
        </View>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5, justifyContent: 'space-between' }}>
          <AppText numberOfLines={1} variant="caption" tone="soft" style={{ fontSize: 8 }}>
            {sessionState}
          </AppText>
          <AppText variant="caption" style={{ fontSize: 8, fontVariant: ['tabular-nums'] }}>
            {currentLap}/{totalLaps}
          </AppText>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Telemetry label="Tires" value={`${runningEntry.tirePercent}%`} />
        <Telemetry label="Fuel" value={`${runningEntry.fuelPercent}%`} />
        <Telemetry label="Condition" value={`${entry.carCondition ?? 100}%`} />
      </View>

      {showPaceControls ? (
        <DriverCommandArea
          compact={compact}
          selectedMode={selectedMode}
          onSelectMode={onSelectMode}
        />
      ) : null}
    </AppCard>
  );
}

function Telemetry({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 0, minWidth: 0 }}>
      <AppText variant="eyebrow" tone="soft" style={{ fontSize: 7, lineHeight: 10 }}>{label}</AppText>
      <AppText numberOfLines={1} variant="caption" style={{ fontSize: 9, lineHeight: 11 }}>{value}</AppText>
    </View>
  );
}
