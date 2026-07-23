import { useRouter, type Href } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverSessionCard } from '@/components/race-presentation/driver-session-card';
import { RaceScene } from '@/components/race-presentation/race-scene';
import { SessionControlBar } from '@/components/race-presentation/session-control-bar';
import { SessionStatusStrip } from '@/components/race-presentation/session-status-strip';
import { TimingTower } from '@/components/race-presentation/timing-tower';
import { getRacePresentationContext } from '@/data/race-presentation-data';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { useRacePresentation } from '@/hooks/use-race-presentation';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';
import type { RacePresentationEntrant, RaceSessionKind } from '@/types/race-presentation';

type RacePresentationShellProps = {
  kind: RaceSessionKind;
};

export function RacePresentationShell({ kind }: RacePresentationShellProps) {
  const router = useRouter();
  const { state, showGrid, showResults } = useGameSession();
  const { height, width } = useWindowDimensions();
  const compact = width < 430 || height < 760;
  const compactDriverCards = height < 760;
  const timingWidth = Math.max(104, Math.min(122, width * 0.31));
  const trackHeight = Math.max(210, Math.min(270, height * 0.34));
  const framePadding = compact ? 6 : 8;
  const { track } = getRacePresentationContext(state.game);
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
  } = useRacePresentation(kind, state.game, state.weekend);
  const continueSession = () => {
    if (kind === 'qualifying') {
      showGrid();
      router.push('/starting-grid' as Href);
      return;
    }

    showResults();
    router.push('/race-results' as Href);
  };

  const activeRunIndex = playerEntries.findIndex(
    (entry) => entry.id === model.activeQualifyingEntryId,
  );

  const getDriverState = (entry: RacePresentationEntrant) => {
    if (kind === 'race') {
      return isPaused ? raceWeekendCopy.presentation.pause : raceWeekendCopy.presentation.greenFlagRun;
    }

    if (model.isComplete) {
      return raceWeekendCopy.presentation.runComplete;
    }

    if (!model.activeQualifyingEntryId) {
      return raceWeekendCopy.presentation.provisional;
    }

    const driverIndex = playerEntries.findIndex((playerEntry) => playerEntry.id === entry.id);

    if (entry.id === model.activeQualifyingEntryId) {
      return raceWeekendCopy.presentation.onTrack;
    }

    return driverIndex < activeRunIndex
      ? raceWeekendCopy.presentation.runComplete
      : raceWeekendCopy.presentation.nextOut;
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
      ? `${model.ovalPhase} · ${raceWeekendCopy.presentation.greenFlagRun}`
      : model.isComplete
        ? `${raceWeekendCopy.presentation.provisional} · ${resultSummary}`
        : activeEntry
          ? `#${activeEntry.carNumber} ${raceWeekendCopy.presentation.onTrack} · ${model.ovalPhase}`
          : `${raceWeekendCopy.presentation.provisional} · ${resultSummary}`;
  const progressLabel =
    kind === 'race'
      ? `Lap ${model.currentLap}/${config.totalLaps}`
      : model.isComplete
        ? raceWeekendCopy.presentation.qualifyingComplete
        : model.qualifyingRunNumber
          ? `Run ${model.qualifyingRunNumber}/${config.totalLaps}`
          : raceWeekendCopy.presentation.provisional;

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
        <View
          style={{
            alignItems: 'stretch',
            flexDirection: 'row',
            gap: 6,
            height: trackHeight,
          }}>
          <TimingTower
            compact={compact}
            runningOrder={model.timingTowerOrder}
            style={{ width: timingWidth }}
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
        </View>

        <View
          style={{
            flex: 1,
            gap: 6,
            justifyContent: 'space-between',
            minHeight: 0,
          }}>
          <SessionStatusStrip
            config={config}
            currentLap={model.currentLap}
            trackName={track.name}
          />

          <View style={{ gap: 6 }}>
            {playerEntries.map((entry) => {
              const driverId = entry.playerDriverId!;
              const runningEntry = model.runningOrder.find((item) => item.id === entry.id);

              if (!runningEntry) {
                throw new Error(`Missing running-order entry for Car #${entry.carNumber}`);
              }

              return (
                <DriverSessionCard
                  activeCamera={driverId === focusedDriverId}
                  compact={compactDriverCards}
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

          <SessionControlBar
            isComplete={model.isComplete}
            isPaused={isPaused}
            kind={kind}
            onSetPaused={setIsPaused}
            onSetPlaybackSpeed={setPlaybackSpeed}
            onContinue={continueSession}
            playbackSpeed={playbackSpeed}
            progress={model.sessionProgress}
            progressLabel={progressLabel}
            statusMessage={statusMessage}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
