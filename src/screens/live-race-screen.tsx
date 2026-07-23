import { Link } from 'expo-router';

import { RacePresentationShell } from '@/components/race-presentation/race-presentation-shell';
import { AppButton } from '@/components/shared/app-button';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { useGameSession } from '@/state/game-session';

export function LiveRaceScreen() {
  const { state } = useGameSession();

  if (!state.weekend.race) {
    return (
      <Screen>
        <AppText variant="title">{raceWeekendCopy.race.notReadyTitle}</AppText>
        <AppText tone="muted">{raceWeekendCopy.race.notReadyBody}</AppText>
        <Link href="/race-preview" asChild>
          <AppButton label={raceWeekendCopy.race.returnAction} />
        </Link>
      </Screen>
    );
  }

  return <RacePresentationShell kind="race" />;
}
