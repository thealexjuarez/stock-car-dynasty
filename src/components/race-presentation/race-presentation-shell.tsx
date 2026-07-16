import { View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverSessionCard } from '@/components/race-presentation/driver-session-card';
import { RaceScene } from '@/components/race-presentation/race-scene';
import { SessionControlBar } from '@/components/race-presentation/session-control-bar';
import { SessionStatusStrip } from '@/components/race-presentation/session-status-strip';
import { TimingTower } from '@/components/race-presentation/timing-tower';
import { getRacePresentationContext } from '@/data/race-presentation-data';
import { useRacePresentation } from '@/hooks/use-race-presentation';
import { theme } from '@/theme';
import type { RacePresentationEntrant, RaceSessionKind } from '@/types/race-presentation';

type RacePresentationShellProps = {
  kind: RaceSessionKind;
};

export function RacePresentationShell({ kind }: RacePresentationShellProps) {
  const { height, width } = useWindowDimensions();
  const compact = height < 500 || width < 900;
  const timingWidth = Math.max(132, Math.min(160, width * 0.18));
  const driverWidth = Math.max(188, Math.min(218, width * 0.25));
  const framePadding = height < 430 ? 6 : 8;
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

  const activeRunIndex = playerEntries.findIndex(
    (entry) => entry.id === model.activeQualifyingEntryId,
  );

  const getDriverState = (entry: RacePresentationEntrant) => {
    if (kind === 'race') {
      return isPaused ? 'Paused' : 'Running';
    }

    if (model.isComplete) {
      return 'Run Complete';
    }

    if (!model.activeQualifyingEntryId) {
      return 'Provisional Result';
    }

    const driverIndex = playerEntries.findIndex((playerEntry) => playerEntry.id === entry.id);

    if (entry.id === model.activeQualifyingEntryId) {
      return 'On Track';
    }

    return driverIndex < activeRunIndex ? 'Run Complete' : 'Up Next';
  };

  const resultSummary = playerEntries
    .map((entry) => {
      const result = model.runningOrder.find((item) => item.id === entry.id);
      return `#${entry.carNumber} P${result?.position ?? '—'}`;
    })
    .join(' · ');
  const activeEntry = playerEntries.find(
    (entry) => entry.id === model.activeQualifyingEntryId,
  );
  const statusMessage =
    kind === 'race'
      ? `${model.ovalPhase} · presentation controls only`
      : model.isComplete
        ? `Provisional result · ${resultSummary}`
        : activeEntry
          ? `#${activeEntry.carNumber} on track · ${model.ovalPhase}`
          : `Compiling provisional result · ${resultSummary}`;
  const progressLabel =
    kind === 'race'
      ? `Lap ${model.currentLap}/${config.totalLaps}`
      : model.isComplete
        ? 'Qualifying complete'
        : model.qualifyingRunNumber
          ? `Run ${model.qualifyingRunNumber}/${config.totalLaps}`
          : 'Provisional result';

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={{ backgroundColor: theme.colors.asphalt, flex: 1 }}>
      <View
        style={{
          flex: 1,
          gap: 6,
          minHeight: 0,
          paddingBottom: framePadding,
          paddingHorizontal: framePadding,
          paddingTop: framePadding,
        }}>
        <SessionStatusStrip
          config={config}
          currentLap={model.currentLap}
          trackName={track.name}
        />

        <View
          style={{
            alignItems: 'stretch',
            flex: 1,
            flexDirection: 'row',
            gap: 6,
            minHeight: 0,
          }}>
          <TimingTower
            compact={compact}
            runningOrder={model.runningOrder}
            style={{ height: '100%', width: timingWidth }}
          />
          <RaceScene
            cars={model.visibleCars}
            config={config}
            focusedCarNumber={model.focusedEntry.carNumber}
            isPaused={isPaused || model.isComplete}
            ovalPhase={model.ovalPhase}
            playbackSpeed={playbackSpeed}
            style={{ flex: 1 }}
          />
          <View
            style={{
              gap: 6,
              justifyContent: 'space-between',
              minHeight: 0,
              width: driverWidth,
            }}>
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
                  sessionState={getDriverState(entry)}
                  showPaceControls={kind === 'race'}
                  totalLaps={config.totalLaps}
                />
              );
            })}
          </View>
        </View>

        <SessionControlBar
          isComplete={model.isComplete}
          isPaused={isPaused}
          kind={kind}
          onSetPaused={setIsPaused}
          onSetPlaybackSpeed={setPlaybackSpeed}
          playbackSpeed={playbackSpeed}
          progress={model.sessionProgress}
          progressLabel={progressLabel}
          statusMessage={statusMessage}
        />
      </View>
    </SafeAreaView>
  );
}
