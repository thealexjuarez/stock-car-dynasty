import { Link } from 'expo-router';

import { RacePresentationShell } from '@/components/race-presentation/race-presentation-shell';
import { AppButton } from '@/components/shared/app-button';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { useGameSession } from '@/state/game-session';

export function LiveRaceScreen() {
  const { state } = useGameSession();

  if (!state.weekend.race) {
    return (
      <Screen>
        <AppText variant="title">The race is not ready</AppText>
        <AppText tone="muted">Set the starting grid before beginning the race.</AppText>
        <Link href="/race-preview" asChild>
          <AppButton label="Return to Race Preview" />
        </Link>
      </Screen>
    );
  }

  return <RacePresentationShell kind="race" />;
}
