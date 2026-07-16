import { useEffect, useMemo, useState } from 'react';

import {
  getRacePresentationConfig,
  getRacePresentationEntrants,
} from '@/data/race-presentation-data';
import { createRacePresentationModel } from '@/simulation/race-presentation';
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

  const [focusedDriverId, setFocusedDriverId] = useState(initialDriverId);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [tick, setTick] = useState(0);
  const [paceModes, setPaceModes] = useState<Record<string, DriverPaceMode>>(() =>
    Object.fromEntries(
      playerEntries.map((entry) => [entry.playerDriverId!, 'Balanced' as const]),
    ),
  );

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setTick((current) => current + playbackSpeed);
    }, config.updateIntervalMs);

    return () => clearInterval(interval);
  }, [config.updateIntervalMs, isPaused, playbackSpeed]);

  const model = useMemo(
    () => createRacePresentationModel(entrants, config, tick, focusedDriverId),
    [config, entrants, focusedDriverId, tick],
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
    setFocusedDriverId,
    setIsPaused,
    setPlaybackSpeed,
    setPaceMode,
  };
}
