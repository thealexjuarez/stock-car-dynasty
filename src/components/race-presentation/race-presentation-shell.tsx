import { Link } from 'expo-router';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { DriverSessionCard } from '@/components/race-presentation/driver-session-card';
import { RaceScene } from '@/components/race-presentation/race-scene';
import { SessionControlBar } from '@/components/race-presentation/session-control-bar';
import { SessionStatusStrip } from '@/components/race-presentation/session-status-strip';
import { TimingTower } from '@/components/race-presentation/timing-tower';
import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { getRacePresentationContext } from '@/data/race-presentation-data';
import { useRacePresentation } from '@/hooks/use-race-presentation';
import { theme } from '@/theme';
import type { RaceSessionKind } from '@/types/race-presentation';

type RacePresentationShellProps = {
  kind: RaceSessionKind;
};

export function RacePresentationShell({ kind }: RacePresentationShellProps) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const sceneHeight = compact ? 250 : 400;
  const { track } = getRacePresentationContext();
  const {
    config,
    model,
    playerEntries,
    focusedDriverId,
    isPaused,
    playbackSpeed,
    paceModes,
    setFocusedDriverId,
    setIsPaused,
    setPlaybackSpeed,
    setPaceMode,
  } = useRacePresentation(kind);

  const driverCards = (
    <View style={{ gap: theme.spacing.sm }}>
      {playerEntries.map((entry) => {
        const driverId = entry.playerDriverId!;
        const runningEntry = model.runningOrder.find((item) => item.id === entry.id);

        if (!runningEntry) {
          throw new Error(`Missing running-order entry for Car #${entry.carNumber}`);
        }

        return (
          <DriverSessionCard
            activeCamera={driverId === focusedDriverId}
            compact={compact}
            currentLap={model.currentLap}
            entry={entry}
            key={entry.id}
            onSelectCamera={() => setFocusedDriverId(driverId)}
            onSelectMode={(mode) => setPaceMode(driverId, mode)}
            runningEntry={runningEntry}
            selectedMode={paceModes[driverId] ?? 'Balanced'}
            sessionState={kind === 'qualifying' ? 'On Track' : isPaused ? 'Paused' : 'Running'}
            totalLaps={config.totalLaps}
          />
        );
      })}
    </View>
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.asphalt, flex: 1 }}
      contentContainerStyle={{
        gap: theme.spacing.sm,
        padding: compact ? theme.spacing.sm : theme.spacing.md,
        paddingBottom: theme.spacing.xxxl,
      }}>
      <View
        style={{
          alignSelf: 'center',
          gap: theme.spacing.sm,
          maxWidth: 1180,
          width: '100%',
        }}>
        <SessionStatusStrip
          config={config}
          currentLap={model.currentLap}
          trackName={track.name}
        />

        {compact ? (
          <>
            <RaceScene
              cars={model.visibleCars}
              config={config}
              focusedCarNumber={model.focusedEntry.carNumber}
              height={sceneHeight}
            />
            <View style={{ alignItems: 'stretch', flexDirection: 'row', gap: theme.spacing.sm }}>
              <TimingTower
                compact
                runningOrder={model.runningOrder}
                style={{ flex: 0.9, height: 410 }}
              />
              <View style={{ flex: 1.1 }}>{driverCards}</View>
            </View>
          </>
        ) : (
          <View style={{ alignItems: 'stretch', flexDirection: 'row', gap: theme.spacing.sm }}>
            <TimingTower
              compact={false}
              runningOrder={model.runningOrder}
              style={{ height: sceneHeight, width: 178 }}
            />
            <RaceScene
              cars={model.visibleCars}
              config={config}
              focusedCarNumber={model.focusedEntry.carNumber}
              height={sceneHeight}
              style={{ flex: 1 }}
            />
            <View style={{ width: 226 }}>{driverCards}</View>
          </View>
        )}

        <SessionControlBar
          isPaused={isPaused}
          onSetPaused={setIsPaused}
          onSetPlaybackSpeed={setPlaybackSpeed}
          playbackSpeed={playbackSpeed}
          progress={model.sessionProgress}
          progressLabel={`${config.kind === 'qualifying' ? 'Attempt' : 'Lap'} ${model.currentLap} of ${config.totalLaps}`}
          strategyMessage={
            kind === 'qualifying'
              ? 'Provisional order updates from deterministic sample laps.'
              : 'Pit window and strategy messaging will occupy this lane.'
          }
        />

        {kind === 'qualifying' ? (
          <AppCard>
            <AppText variant="title">Next Weekend Step</AppText>
            <AppText tone="muted">
              Qualifying results and Pre-Race Strategy will connect here when their simulation
              rules are defined.
            </AppText>
            <Link href="/live-race" asChild>
              <AppButton label="View Live Race Presentation" variant="secondary" />
            </Link>
          </AppCard>
        ) : (
          <AppCard>
            <AppText variant="title">Race Presentation Active</AppText>
            <AppText tone="muted">
              Race completion and Post-Race Recap remain separate from this visual foundation.
            </AppText>
            <AppButton label="Post-Race Recap" disabled />
          </AppCard>
        )}
      </View>
    </ScrollView>
  );
}
