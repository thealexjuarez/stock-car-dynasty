import { useEffect, useMemo, useState } from 'react';

import {
  getRacePresentationConfig,
  getRacePresentationEntrants,
} from '@/data/race-presentation-data';
import {
  createRacePresentationModel,
  getQualifyingRunState,
} from '@/simulation/race-presentation';
import type {
  DriverPaceMode,
  PlaybackSpeed,
  RaceSessionKind,
} from '@/types/race-presentation';

export function useRacePresentation(kind: RaceSessionKind) {
  const config = useMemo(() => getRacePresentationConfig(kind), [kind]);
  const entrants = useMemo(() => getRacePresentationEntrants(), []);
  const playerEntries = useMemo(
    () => entrants.filter((entrant) => entrant.isPlayerTeam && entrant.playerDriverId),
    [entrants],
  );
  const initialDriverId = playerEntries[0]?.playerDriverId;

  if (!initialDriverId) {
    throw new Error('Race presentation requires at least one player driver');
  }

  const [manualFocusedDriverId, setManualFocusedDriverId] = useState<string>();
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paceModes, setPaceModes] = useState<Record<string, DriverPaceMode>>(() =>
    Object.fromEntries(
      playerEntries.map((entry) => [entry.playerDriverId!, 'Balanced' as const]),
    ),
  );
  const isComplete = elapsedMs >= config.sessionDurationMs;

  useEffect(() => {
    if (isPaused || isComplete) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedMs((current) =>
        Math.min(
          config.sessionDurationMs,
          current + config.sampleIntervalMs * playbackSpeed,
        ),
      );
    }, config.sampleIntervalMs);

    return () => clearInterval(interval);
  }, [
    config.sampleIntervalMs,
    config.sessionDurationMs,
    isComplete,
    isPaused,
    playbackSpeed,
  ]);

  const qualifyingRunState = useMemo(
    () => getQualifyingRunState(entrants, config, elapsedMs),
    [config, elapsedMs, entrants],
  );
  const activeQualifyingDriverId = entrants.find(
    (entrant) => entrant.id === qualifyingRunState.activeEntryId,
  )?.playerDriverId;
  const focusedDriverId =
    manualFocusedDriverId ?? activeQualifyingDriverId ?? initialDriverId;
  const model = useMemo(
    () => createRacePresentationModel(entrants, config, elapsedMs, focusedDriverId),
    [config, elapsedMs, entrants, focusedDriverId],
  );

  const setPaceMode = (driverId: string, paceMode: DriverPaceMode) => {
    setPaceModes((current) => ({ ...current, [driverId]: paceMode }));
  };

  return {
    config,
    model,
    playerEntries,
    focusedDriverId,
    isPaused,
    playbackSpeed,
    paceModes,
    setFocusedDriverId: setManualFocusedDriverId,
    setIsPaused,
    setPlaybackSpeed,
    setPaceMode,
  };
}
