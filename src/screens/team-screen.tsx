import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { getTeamManufacturer } from '@/data/starter-game-state';
import { TEAM_ACTION_CENTER_LIMIT } from '@/presentation/core-screen-density';
import { selectStandings } from '@/simulation/race-field';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function TeamScreen() {
  const { state } = useGameSession();
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const { team, drivers, vehicles, staff } = state.game;
  const manufacturer = getTeamManufacturer(state.game);
  const nextRace = state.game.calendar.find((event) => event.id === state.game.nextRaceId);
  const reserveDriver = state.game.recruiting.reserveDriver;
  const apexStandings = selectStandings(state.game).filter((row) => row.isPlayerTeam);
  const teamPointTotals = new Map<string, number>();
  selectStandings(state.game).forEach((row) => {
    const teamId = state.game.raceField.entries.find((entry) => entry.id === row.entryId)?.teamId;
    if (teamId) teamPointTotals.set(teamId, (teamPointTotals.get(teamId) ?? 0) + row.points);
  });
  const teamStanding = [...teamPointTotals.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .findIndex(([teamId]) => teamId === team.id) + 1;
  const activeStaff = staff.filter(
    (member) =>
      member.active &&
      ['Crew Chief', 'Social Media Manager', 'Engineer'].includes(member.role),
  );
  const repairBlockers = vehicles.filter((vehicle) => vehicle.readiness !== 'Ready');
  const contractWarnings = drivers.filter((driver) =>
    driver.contract.toLowerCase().includes('1 year'),
  );
  const actions = [
    ...repairBlockers.map((vehicle) => ({
      id: `repair-${vehicle.id}`,
      title: `Car #${vehicle.number} needs shop work`,
      detail: `${vehicle.condition}% condition · ${vehicle.readiness}`,
      href: { pathname: '/vehicles/[number]' as const, params: { number: vehicle.number } },
      color: theme.colors.trackRed,
    })),
    ...contractWarnings.map((driver) => ({
      id: `contract-${driver.id}`,
      title: `${driver.name} contract watch`,
      detail: driver.contract,
      href: { pathname: '/drivers/[id]' as const, params: { id: driver.id } },
      color: theme.colors.caution,
    })),
    ...(reserveDriver
      ? []
      : [{
          id: 'reserve-open',
          title: 'Development slot is open',
          detail: 'Review the Driver Market',
          href: '/(tabs)/market' as const,
          color: theme.colors.fuel,
        }]),
  ].slice(0, TEAM_ACTION_CENTER_LIMIT);

  return (
    <Screen compact>
      <AppCard style={{ gap: 6, padding: theme.spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="eyebrow" tone="accent">Team Operations</AppText>
            <AppText numberOfLines={1} variant="title" style={{ fontSize: 21 }}>
              {team.name}
            </AppText>
            <AppText numberOfLines={1} variant="caption" tone="muted">
              {manufacturer.displayName} · ERCA Week {state.game.week} · {state.game.recruiting.spendableRp} RP
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <AppText variant="title" style={{ fontSize: 18 }}>{money.format(team.cash)}</AppText>
            <AppText variant="caption" tone="soft">
              Team {state.game.raceField.processedRaceIds.length ? `P${teamStanding}` : '—'} · Entries {apexStandings.map((row) => `P${row.position}`).join('/')}
            </AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="caption" tone="soft">REP {team.reputation}</AppText>
          <AppText variant="caption" tone="soft">BRAND {team.brandPower}</AppText>
          <AppText variant="caption" tone="soft">CAR {team.carPerformance}</AppText>
          <AppText variant="caption" tone="soft">MORALE {team.morale}</AppText>
        </View>
        <AppText numberOfLines={1} variant="caption" tone="muted">
          Next race: {nextRace?.name ?? 'Season complete'}
        </AppText>
      </AppCard>

      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="title" style={{ fontSize: 18 }}>Race Entries</AppText>
        {drivers.filter((driver) => driver.active).map((driver) => {
          const vehicle = vehicles.find((item) => item.assignedDriverId === driver.id);
          const standing = apexStandings.find((row) => row.driverId === driver.id);
          if (!vehicle) return null;
          return (
            <Link
              key={driver.id}
              href={{ pathname: '/drivers/[id]', params: { id: driver.id } }}
              asChild>
              <Pressable
                accessibilityRole="link"
                style={({ pressed }) => ({
                  backgroundColor: theme.colors.garage,
                  borderColor: vehicle.readiness === 'Ready'
                    ? theme.colors.border
                    : theme.colors.trackRed,
                  borderRadius: theme.cards.radius,
                  borderWidth: 1,
                  opacity: pressed ? 0.78 : 1,
                  padding: theme.spacing.sm,
                })}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
                  <View style={{ width: 44 }}>
                    <AppText variant="title" style={{ fontSize: 19 }}>#{vehicle.number}</AppText>
                    <AppText variant="caption" tone="soft">P{standing?.position ?? '—'}</AppText>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText numberOfLines={1}>{driver.name}</AppText>
                    <AppText numberOfLines={1} variant="caption" tone="muted">
                      OVR {driver.overall} · {driver.contract}
                    </AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <StatusBadge
                      compact
                      label={vehicle.readiness}
                      tone={vehicle.readiness === 'Ready' ? 'green' : vehicle.readiness === 'At Risk' ? 'yellow' : 'red'}
                    />
                    <AppText variant="caption" tone="soft">{vehicle.condition}% condition</AppText>
                  </View>
                </View>
              </Pressable>
            </Link>
          );
        })}
      </View>

      <AppCard style={{ gap: 0, padding: theme.spacing.md }}>
        <AppText variant="title" style={{ fontSize: 18 }}>Staff Wall</AppText>
        {activeStaff.map((member) => {
          const expanded = member.id === expandedStaffId;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              key={member.id}
              onPress={() => setExpandedStaffId(expanded ? null : member.id)}
              style={({ pressed }) => ({
                borderBottomColor: theme.colors.border,
                borderBottomWidth: 1,
                gap: 4,
                opacity: pressed ? 0.78 : 1,
                paddingVertical: theme.spacing.sm,
              })}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AppText>{member.name}</AppText>
                  <AppText variant="caption" tone="muted">{member.role} · Q{member.quality}</AppText>
                </View>
                <StatusBadge compact label={member.trait} tone="blue" />
              </View>
              {expanded ? (
                <AppText variant="caption" tone="soft">{member.effect}</AppText>
              ) : null}
            </Pressable>
          );
        })}
      </AppCard>

      <AppCard style={{ gap: 6, padding: theme.spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title" style={{ fontSize: 18 }}>Repair Bay</AppText>
          <StatusBadge
            compact
            label={repairBlockers.length ? 'Needs Work' : 'Both Ready'}
            tone={repairBlockers.length ? 'red' : 'green'}
          />
        </View>
        {repairBlockers.length ? repairBlockers.map((vehicle) => (
          <Link
            href={{ pathname: '/vehicles/[number]', params: { number: vehicle.number } }}
            key={vehicle.id}
            asChild>
            <Pressable accessibilityRole="link" style={{ paddingVertical: 3 }}>
              <AppText variant="caption" tone="accent">
                Car #{vehicle.number} · {vehicle.condition}% condition · Open repairs →
              </AppText>
            </Pressable>
          </Link>
        )) : (
          <AppText variant="caption" tone="muted">Both cars are above the 75% race-ready line.</AppText>
        )}
      </AppCard>

      <AppCard style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
        <AppText variant="title" style={{ fontSize: 18 }}>Contracts & Reserve</AppText>
        {drivers.map((driver) => (
          <AppRow
            compact
            key={driver.id}
            label={`${driver.name} · ${driver.contract}`}
            detail={`${money.format(driver.salary)}/yr`}
          />
        ))}
        {reserveDriver ? (
          <AppRow
            compact
            label={`${reserveDriver.name} · Reserve`}
            detail={`${reserveDriver.termYears} yr · ${money.format(reserveDriver.annualSalary)}`}
          />
        ) : (
          <Link href="/(tabs)/market" asChild>
            <Pressable accessibilityRole="link" style={{ justifyContent: 'center', minHeight: 44 }}>
              <AppText tone="accent">Open development slot →</AppText>
            </Pressable>
          </Link>
        )}
      </AppCard>

      <AppCard style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title" style={{ fontSize: 18 }}>Action Center</AppText>
          <StatusBadge
            compact
            label={actions.length ? `${actions.length} Open` : 'Clear'}
            tone={actions.length ? 'yellow' : 'green'}
          />
        </View>
        {actions.length ? actions.map((action) => (
          <Link href={action.href} key={action.id} asChild>
            <Pressable
              accessibilityRole="link"
              style={({ pressed }) => ({
                alignItems: 'center',
                flexDirection: 'row',
                gap: theme.spacing.sm,
                opacity: pressed ? 0.78 : 1,
                paddingVertical: 4,
              })}>
              <View style={{ backgroundColor: action.color, borderRadius: 999, height: 8, width: 8 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption">{action.title}</AppText>
                <AppText variant="caption" tone="soft">{action.detail}</AppText>
              </View>
              <AppText tone="accent">›</AppText>
            </Pressable>
          </Link>
        )) : (
          <AppText variant="caption" tone="muted">No repairs, contract watches, or roster decisions need attention.</AppText>
        )}
      </AppCard>
    </Screen>
  );
}
