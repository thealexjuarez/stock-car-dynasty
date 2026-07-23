import { View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { selectStandings } from '@/simulation/race-field';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

export function LeagueScreen() {
  const { state } = useGameSession();
  const standings = selectStandings(state.game);
  const apex = standings.filter((row) => row.isPlayerTeam);
  const leader = standings[0];

  return (
    <Screen compact>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">ERCA Stock Series</AppText>
        <AppText variant="hero">League</AppText>
        <AppText tone="muted">Season {state.game.season} driver standings · 32 active entries</AppText>
      </View>

      <AppCard style={{ borderColor: theme.colors.caution, padding: theme.spacing.md }}>
        <AppText variant="eyebrow" tone="accent">Championship Watch</AppText>
        <AppRow
          compact
          label={`P1 · #${leader.carNumber} ${leader.driverName}`}
          detail={`${leader.points} pts`}
        />
        {apex.map((row) => (
          <AppRow
            compact
            key={row.entryId}
            label={`P${row.position} · #${row.carNumber} ${row.driverName}`}
            detail={`${row.points} pts`}
          />
        ))}
      </AppCard>

      <AppCard style={{ gap: theme.spacing.xs, padding: theme.spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title">Driver Standings</AppText>
          <StatusBadge label={`Round ${state.game.week}`} tone="neutral" />
        </View>
        {standings.map((row) => (
          <View
            key={row.entryId}
            style={{
              backgroundColor: row.isPlayerTeam ? theme.colors.panelStrong : 'transparent',
              borderLeftColor: row.isPlayerTeam ? theme.colors.caution : 'transparent',
              borderLeftWidth: 3,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.sm,
            }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
              <AppText style={{ fontFamily: theme.typography.mono, width: 28 }}>
                {row.position}
              </AppText>
              <View style={{ flex: 1 }}>
                <AppText>#{row.carNumber} · {row.driverName}</AppText>
                <AppText tone="soft" variant="caption">
                  {row.teamCode} · {row.manufacturerId} · {row.starts} starts
                </AppText>
              </View>
              <AppText style={{ fontFamily: theme.typography.mono }}>
                {row.points}
              </AppText>
            </View>
          </View>
        ))}
      </AppCard>
    </Screen>
  );
}
