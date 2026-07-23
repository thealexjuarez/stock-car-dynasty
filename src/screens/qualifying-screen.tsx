import { Link } from 'expo-router';

import { RacePresentationShell } from '@/components/race-presentation/race-presentation-shell';
import { AppButton } from '@/components/shared/app-button';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { useGameSession } from '@/state/game-session';

export function QualifyingScreen() {
  const { state } = useGameSession();

  if (!state.weekend.qualifying) {
    return (
      <Screen>
        <AppText variant="title">Qualifying is not ready</AppText>
        <AppText tone="muted">Complete practice before beginning qualifying.</AppText>
        <Link href="/practice" asChild>
          <AppButton label="Go to Practice" />
        </Link>
      </Screen>
    );
  }

  return <RacePresentationShell kind="qualifying" />;
}
