import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { getNextRace } from '@/data/starter-game-state';
import { selectStandings } from '@/simulation/race-field';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

type LeagueView = 'drivers' | 'teams' | 'manufacturers' | 'schedule';

export function LeagueScreen() {
  const router = useRouter();
  const { state } = useGameSession();
  const [view, setView] = useState<LeagueView>('drivers');
  const [showFullStandings, setShowFullStandings] = useState(false);
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);
  const standings = selectStandings(state.game);
  const apex = standings.filter((row) => row.isPlayerTeam);
  const leader = standings[0];
  const { race: nextRace } = getNextRace(state.game);

  const teamStandings = (() => {
    const teams = new Map<string, { id: string; name: string; code: string; points: number; wins: number; starts: number }>();
    standings.forEach((row) => {
      const teamId = state.game.raceField.entries.find((entry) => entry.id === row.entryId)?.teamId;
      if (!teamId) return;
      const current = teams.get(teamId) ?? {
        id: teamId,
        name: row.teamName,
        code: row.teamCode,
        points: 0,
        wins: 0,
        starts: 0,
      };
      current.points += row.points;
      current.wins += row.wins;
      current.starts += row.starts;
      teams.set(teamId, current);
    });
    return [...teams.values()].sort((left, right) => right.points - left.points || right.wins - left.wins || left.id.localeCompare(right.id));
  })();

  const manufacturerStandings = (() => {
    const makes = new Map<string, { id: string; name: string; points: number; wins: number; entries: number }>();
    standings.forEach((row) => {
      const name = state.game.manufacturers.find((item) => item.id === row.manufacturerId)?.displayName ?? row.manufacturerId;
      const current = makes.get(row.manufacturerId) ?? { id: row.manufacturerId, name, points: 0, wins: 0, entries: 0 };
      current.points += row.points;
      current.wins += row.wins;
      current.entries += 1;
      makes.set(row.manufacturerId, current);
    });
    return [...makes.values()].sort((left, right) => right.points - left.points || right.wins - left.wins || left.id.localeCompare(right.id));
  })();
  const apexTeamPosition = teamStandings.findIndex((team) => team.id === state.game.team.id) + 1;

  const openCurrentRace = () => {
    const routeByPhase: Record<typeof state.weekend.phase, Href> = {
      preview: '/race-preview',
      'practice-result': '/practice-result',
      qualifying: '/qualifying',
      grid: '/starting-grid',
      race: '/live-race',
      results: '/race-results',
    };
    router.push(routeByPhase[state.weekend.phase]);
  };

  return (
    <Screen compact>
      <View style={{ gap: 4 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText variant="eyebrow" tone="accent">ERCA Stock Series</AppText>
            <AppText variant="title">League Center</AppText>
            <AppText numberOfLines={1} variant="caption" tone="muted">
              Season {state.game.season} · {state.game.raceField.processedRaceIds.length} complete · Next: {nextRace?.name ?? 'Season complete'}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="caption" tone="soft">POINTS LEADER</AppText>
            <AppText numberOfLines={1}>#{leader.carNumber} {leader.driverName}</AppText>
            <AppText variant="caption" tone="accent">{leader.points} pts</AppText>
            <AppText variant="caption" tone="soft">Apex team P{apexTeamPosition || '—'}</AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {([
            ['drivers', 'Drivers'],
            ['teams', 'Teams'],
            ['manufacturers', 'Makes'],
            ['schedule', 'Schedule'],
          ] as [LeagueView, string][]).map(([id, label]) => {
            const active = view === id;
            return (
              <Pressable
                accessibilityRole="button"
                key={id}
                onPress={() => setView(id)}
                style={{
                  alignItems: 'center',
                  backgroundColor: active ? theme.colors.caution : theme.colors.panelStrong,
                  borderRadius: 5,
                  flex: 1,
                  justifyContent: 'center',
                  minHeight: 44,
                  paddingHorizontal: 3,
                }}>
                <AppText
                  numberOfLines={1}
                  variant="caption"
                  style={{ color: active ? theme.colors.rubber : theme.colors.text, fontSize: 10 }}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {view !== 'schedule' ? (
        <AppCard style={{ gap: 0, padding: theme.spacing.sm }}>
          <View style={{ alignItems: 'center', borderBottomColor: theme.colors.border, borderBottomWidth: 1, flexDirection: 'row', paddingBottom: 6 }}>
            <AppText variant="caption" tone="soft" style={{ width: 30 }}>POS</AppText>
            <AppText variant="caption" tone="soft" style={{ flex: 1 }}>
              {view === 'drivers' ? 'DRIVER' : view === 'teams' ? 'TEAM' : 'MANUFACTURER'}
            </AppText>
            <AppText variant="caption" tone="soft">PTS</AppText>
          </View>
          {view === 'drivers' ? standings.slice(0, showFullStandings ? standings.length : 12).map((row) => (
            <View
              key={row.entryId}
              style={{
                backgroundColor: row.isPlayerTeam ? theme.colors.panelStrong : 'transparent',
                borderLeftColor: row.isPlayerTeam ? theme.colors.caution : 'transparent',
                borderLeftWidth: 3,
                minHeight: 46,
                paddingHorizontal: 6,
                paddingVertical: 6,
              }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5 }}>
                <AppText style={{ fontFamily: theme.typography.mono, width: 25 }}>{row.position}</AppText>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText numberOfLines={1} style={{ fontSize: 14 }}>#{row.carNumber} · {row.driverName}</AppText>
                  <AppText numberOfLines={1} tone="soft" variant="caption" style={{ fontSize: 9 }}>
                    {row.teamCode} · {row.manufacturerId} · {row.wins}W · {row.topFives} T5 · {leader.points - row.points} back
                  </AppText>
                </View>
                <AppText style={{ fontFamily: theme.typography.mono }}>{row.points}</AppText>
              </View>
            </View>
          )) : view === 'teams' ? teamStandings.map((team, index) => (
            <View key={team.id} style={{ minHeight: 48, paddingHorizontal: 6, paddingVertical: 7 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5 }}>
                <AppText style={{ fontFamily: theme.typography.mono, width: 25 }}>{index + 1}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText numberOfLines={1}>{team.name}</AppText>
                  <AppText variant="caption" tone="soft">{team.code} · {team.wins} wins · {team.starts} starts</AppText>
                </View>
                <AppText style={{ fontFamily: theme.typography.mono }}>{team.points}</AppText>
              </View>
            </View>
          )) : manufacturerStandings.map((make, index) => (
            <View key={make.id} style={{ minHeight: 48, paddingHorizontal: 6, paddingVertical: 7 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5 }}>
                <AppText style={{ fontFamily: theme.typography.mono, width: 25 }}>{index + 1}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText>{make.name}</AppText>
                  <AppText variant="caption" tone="soft">{make.entries} entries · identity-only performance</AppText>
                </View>
                <AppText style={{ fontFamily: theme.typography.mono }}>{make.points}</AppText>
              </View>
            </View>
          ))}
          {view === 'drivers' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showFullStandings }}
              onPress={() => setShowFullStandings((current) => !current)}
              style={{ alignItems: 'center', borderTopColor: theme.colors.border, borderTopWidth: 1, minHeight: 44, justifyContent: 'center' }}>
              <AppText variant="caption" tone="accent">
                {showFullStandings ? 'Show top 12' : 'Show full 32-car standings'}
              </AppText>
            </Pressable>
          ) : null}
        </AppCard>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {state.game.calendar.map((event) => {
            const track = state.game.tracks.find((item) => item.id === event.trackId);
            const settlement = state.game.economy.settlementHistory.find((item) => item.raceId === event.id);
            const current = event.id === nextRace?.id;
            const completed = Boolean(settlement);
            const expanded = expandedRaceId === event.id;
            return (
              <AppCard
                key={event.id}
                style={{
                  borderColor: current ? theme.colors.caution : theme.colors.border,
                  gap: 5,
                  padding: theme.spacing.sm,
                }}>
                <Pressable
                  accessibilityRole={current || completed ? 'button' : undefined}
                  accessibilityState={{ expanded: completed ? expanded : undefined }}
                  disabled={!current && !completed}
                  onPress={() => {
                    if (current) openCurrentRace();
                    else setExpandedRaceId(expanded ? null : event.id);
                  }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
                    <View style={{ width: 36 }}>
                      <AppText variant="caption" tone="soft">R{event.round}</AppText>
                      <AppText variant="caption">W{event.week}</AppText>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText numberOfLines={1}>{event.name}</AppText>
                      <AppText numberOfLines={1} variant="caption" tone="muted">{track?.name} · {track?.type}</AppText>
                    </View>
                    <StatusBadge
                      compact
                      label={completed ? 'Settled' : current ? state.weekend.phase.replace('-', ' ') : 'Upcoming'}
                      tone={completed ? 'green' : current ? 'yellow' : 'neutral'}
                    />
                  </View>
                </Pressable>
                {expanded && settlement ? (
                  <View style={{ borderTopColor: theme.colors.border, borderTopWidth: 1, gap: 3, paddingTop: 5 }}>
                    <AppText variant="caption" tone="accent">Apex race receipt</AppText>
                    {settlement.winningsByCar.map((line) => (
                      <AppText key={line.vehicleId} variant="caption" tone="muted">
                        Car #{line.carNumber} · P{line.finishPosition} · ${line.amount.toLocaleString()}
                      </AppText>
                    ))}
                    <AppText variant="caption" tone="soft">Full historical field results are not retained in the current save model.</AppText>
                  </View>
                ) : null}
              </AppCard>
            );
          })}
        </View>
      )}

      {view === 'drivers' ? (
        <AppCard style={{ gap: 5, padding: theme.spacing.sm }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="caption" tone="accent">APEX SNAPSHOT</AppText>
            <StatusBadge compact label={`${apex.reduce((sum, row) => sum + row.points, 0)} team pts`} tone="blue" />
          </View>
          <AppText variant="caption" tone="muted">
            {apex.map((row) => `#${row.carNumber} P${row.position} · ${row.topFives} T5 · ${row.topTens} T10`).join('  |  ')}
          </AppText>
        </AppCard>
      ) : null}
    </Screen>
  );
}
