import { View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { getNextRace, starterGameState } from '@/data/starter-game-state';
import { theme } from '@/theme';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
});

export function HomeScreen() {
  const state = starterGameState;
  const { race, track } = getNextRace(state);
  const nextRaceLabel = race && track ? `${race.name} at ${track.name}` : 'Calendar pending';

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          {state.sanctioningBody} / Season {state.season}
        </AppText>
        <AppText variant="hero">Home</AppText>
        <AppText tone="muted">
          What is happening, why it matters, and what the team can do next.
        </AppText>
      </View>

      <AppCard>
        <View
          style={{
            alignItems: 'flex-start',
            flexDirection: 'row',
            gap: theme.spacing.md,
            justifyContent: 'space-between',
          }}>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <AppText variant="title">{state.team.name}</AppText>
            <AppText tone="soft" variant="caption">
              {state.series}
            </AppText>
          </View>
          <StatusBadge label={`Week ${state.week}`} tone="red" />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <AppRow label="Cash" detail={currencyFormatter.format(state.team.cash)} />
          <AppRow label="Brand Power" detail={`${state.team.brandPower}`} />
          <AppRow label="Season / Week" detail={`Season ${state.season} / Week ${state.week}`} />
          <AppRow label="Current Date" detail={state.currentDate} />
          <AppRow label="Next Race" detail={nextRaceLabel} />
        </View>
      </AppCard>

      <AppCard>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="title">Driver Lineup</AppText>
          <AppText tone="soft" variant="caption">
            Active ERCA roster for the opening race week
          </AppText>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          {state.drivers.map((driver) => (
            <AppRow
              key={driver.id}
              label={driver.name}
              detail={`${driver.role} / OVR ${driver.overall}`}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="title">Vehicle Readiness</AppText>
          <AppText tone="soft" variant="caption">
            Placeholder garage status, no simulation logic attached
          </AppText>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          {state.vehicles.map((vehicle) => {
            const driver = state.drivers.find((item) => item.id === vehicle.assignedDriverId);

            return (
              <AppRow
                key={vehicle.id}
                label={`Car #${vehicle.number}${driver ? ` / ${driver.name}` : ''}`}
                detail={vehicle.raceReady}
              />
            );
          })}
        </View>
      </AppCard>
    </Screen>
  );
}
