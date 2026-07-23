import { Link } from 'expo-router';

import { RacePresentationShell } from '@/components/race-presentation/race-presentation-shell';
import { AppButton } from '@/components/shared/app-button';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { useGameSession } from '@/state/game-session';

export function QualifyingScreen() {
  const { state } = useGameSession();

  if (!state.weekend.qualifying) {
    return (
      <Screen>
        <AppText variant="title">{raceWeekendCopy.qualifying.notReadyTitle}</AppText>
        <AppText tone="muted">{raceWeekendCopy.qualifying.notReadyBody}</AppText>
        <Link href="/practice" asChild>
          <AppButton label={raceWeekendCopy.qualifying.returnAction} />
        </Link>
      </Screen>
    );
  }

  return <RacePresentationShell kind="qualifying" />;
}
