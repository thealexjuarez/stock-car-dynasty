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
  totalLaps,
  onSelectCamera,
  onSelectMode,
}: DriverSessionCardProps) {
  return (
    <AppCard
      style={{
        backgroundColor: activeCamera ? theme.colors.panelStrong : theme.colors.garage,
        borderColor: activeCamera ? theme.colors.fuel : theme.colors.border,
        gap: compact ? theme.spacing.sm : theme.spacing.md,
        padding: compact ? theme.spacing.sm : theme.spacing.md,
      }}>
      <Pressable
        accessibilityLabel={`Follow Car #${entry.carNumber}, ${entry.driverName}`}
        accessibilityRole="button"
        accessibilityState={{ selected: activeCamera }}
        onPress={onSelectCamera}
        style={({ pressed }) => ({ gap: theme.spacing.xs, opacity: pressed ? 0.78 : 1 })}>
        <View
          style={{
            alignItems: 'flex-start',
            flexDirection: 'row',
            gap: theme.spacing.sm,
            justifyContent: 'space-between',
          }}>
          <View style={{ flex: 1 }}>
            <AppText variant={compact ? 'body' : 'title'}>#{entry.carNumber}</AppText>
            <AppText numberOfLines={1} variant="caption" tone="muted">
              {entry.driverName}
            </AppText>
          </View>
          {activeCamera ? <StatusBadge label="CAM" tone="blue" /> : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <StatusBadge label={`P${runningEntry.position}`} tone="red" />
          <StatusBadge label={sessionState} tone="neutral" />
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <Telemetry label="Progress" value={`${currentLap} / ${totalLaps}`} />
        <Telemetry label="Tires" value={`${runningEntry.tirePercent}% · ${runningEntry.tireStatus}`} />
        <Telemetry label="Fuel" value={`${runningEntry.fuelPercent}%`} />
        <Telemetry label="Condition" value={`${entry.carCondition ?? 100}%`} />
        <Telemetry label="Mode" value={selectedMode} />
      </View>

      <DriverCommandArea
        compact={compact}
        selectedMode={selectedMode}
        onSelectMode={onSelectMode}
      />
    </AppCard>
  );
}

function Telemetry({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexBasis: '45%', flexGrow: 1, gap: 1 }}>
      <AppText variant="eyebrow" tone="soft" style={{ fontSize: 8 }}>{label}</AppText>
      <AppText numberOfLines={1} variant="caption" style={{ fontSize: 10 }}>{value}</AppText>
    </View>
  );
}
