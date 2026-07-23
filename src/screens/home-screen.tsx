import { Link } from 'expo-router';
import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { SectionHeader } from '@/components/shared/section-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { RACE_READY_THRESHOLD } from '@/data/repair-config';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import {
  getNextRace,
  getTeamManufacturer,
} from '@/data/starter-game-state';
import { getRaceReadinessBlockers } from '@/simulation/vehicle-repair';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function HomeScreen() {
  const { state: session } = useGameSession();
  const state = session.game;
  const { race, track } = getNextRace(state);
  const manufacturer = getTeamManufacturer(state);
  const readinessBlockers = getRaceReadinessBlockers(state);
  const repairCandidates = state.vehicles.filter(
    (vehicle) => vehicle.active && vehicle.damage > 0,
  ).sort((left, right) => left.condition - right.condition);

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">Team Command Center</AppText>
        <AppText variant="hero">{state.team.name}</AppText>
        <AppText tone="muted">
          Season {state.season}, Week {state.week} · {state.series} ·{' '}
          {manufacturer.displayName}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <Hud label="Cash" value={money.format(state.team.cash)} />
        <Hud label="Reputation" value={`${state.team.reputation}`} />
        <Hud label="Brand Power" value={`${state.team.brandPower}`} />
        <Hud label="Date" value={state.currentDate} />
      </View>

      {repairCandidates.length > 0 ? (
        <AppCard
          style={{
            borderColor:
              readinessBlockers.length > 0
                ? theme.colors.trackRed
                : theme.colors.caution,
            backgroundColor: theme.colors.panelStrong,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: theme.spacing.md,
            }}>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <AppText variant="eyebrow" tone="accent">Repair Bay</AppText>
              <AppText variant="title">
                {readinessBlockers.length > 0
                  ? 'Weekend Entry on Hold'
                  : 'Post-Race Inspection'}
              </AppText>
            </View>
            <StatusBadge
              label={readinessBlockers.length > 0 ? 'Needs Work' : 'Race Ready'}
              tone={readinessBlockers.length > 0 ? 'red' : 'yellow'}
            />
          </View>
          <AppText tone="muted">
            {readinessBlockers.length > 0
              ? `Both entries must reach ${RACE_READY_THRESHOLD}% condition before the team can roll into the next weekend.`
              : 'The cars are clear to race, but fresh damage is waiting for a shop decision.'}
          </AppText>
          {state.vehicles.filter((vehicle) => vehicle.active).map((vehicle) => (
            <AppRow
              key={vehicle.id}
              label={`Car #${vehicle.number} · ${vehicle.readiness}`}
              detail={`${vehicle.condition}% · ${vehicle.damage}% damage`}
            />
          ))}
          <Link
            href={{
              pathname: '/vehicles/[number]',
              params: {
                number: (readinessBlockers[0] ?? repairCandidates[0]).number,
              },
            }}
            asChild>
            <AppButton
              label={
                readinessBlockers.length > 0 ? 'Repair Cars to Race' : 'Open Repair Bay'
              }
            />
          </Link>
        </AppCard>
      ) : null}

      <AppCard style={{ borderColor: theme.colors.trackRed, backgroundColor: theme.colors.panelStrong }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <AppText variant="eyebrow" tone="accent">
              {raceWeekendCopy.home.nextAction}
            </AppText>
            <AppText variant="title">
              {track?.name} {raceWeekendCopy.home.weekendBriefing}
            </AppText>
          </View>
          <StatusBadge label={`Race ${race?.round ?? '—'} of ${state.calendar.length}`} tone="red" />
        </View>
        <AppText tone="muted">
          The next ERCA weekend is at {track?.name}, a {track?.type.toLowerCase()} where the
          track-specific driver ratings and car preparation will shape the result.
        </AppText>
        {readinessBlockers.length > 0 ? (
          <>
            <AppText tone="muted">
              Race control will not accept the entry until both cars clear the{' '}
              {RACE_READY_THRESHOLD}% line.
            </AppText>
            <AppButton disabled label="Clear Both Cars First" />
          </>
        ) : (
          <Link href="/race-preview" asChild>
            <AppButton label={raceWeekendCopy.home.openWeekend} />
          </Link>
        )}
      </AppCard>

      <SectionHeader title="Drivers" subtitle="Active lineup and development outlook" />
      {state.drivers.map((driver) => (
        <AppCard key={driver.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
            <View style={{ flex: 1 }}>
              <AppText variant="title">{driver.name}</AppText>
              <AppText tone="muted" variant="caption">
                Car #{driver.carNumber} · {driver.archetypes.join(' / ')}
              </AppText>
            </View>
            <StatusBadge label={`OVR ${driver.overall}`} tone="blue" />
          </View>
          <Link href={{ pathname: '/drivers/[id]', params: { id: driver.id } }} asChild>
            <AppButton label="View Profile" variant="secondary" />
          </Link>
        </AppCard>
      ))}

      <SectionHeader title="Vehicle Readiness" subtitle={`Garage status before ${track?.name}`} />
      {state.vehicles.map((vehicle) => (
        <AppCard key={vehicle.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
            <AppText variant="title">Car #{vehicle.number}</AppText>
            <StatusBadge
              label={vehicle.readiness}
              tone={
                vehicle.readiness === 'Ready'
                  ? 'green'
                  : vehicle.readiness === 'At Risk'
                    ? 'yellow'
                    : 'red'
              }
            />
          </View>
          <AppRow label="Condition" detail={`${vehicle.condition}%`} />
          <AppRow label="Damage" detail={`${vehicle.damage}%`} />
          <AppRow label="Performance" detail={`${vehicle.performance}`} />
          <AppRow label="Wear" detail={`${vehicle.chassisWear} chassis / ${vehicle.engineWear} engine`} />
          <Link href={{ pathname: '/vehicles/[number]', params: { number: vehicle.number } }} asChild>
            <AppButton label="View Vehicle" variant="secondary" />
          </Link>
        </AppCard>
      ))}

      <SectionHeader title="Sponsor Goals" subtitle={`${money.format(260_000)} annual starter package`} />
      {state.sponsors.map((sponsor) => (
        <AppCard key={sponsor.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
            <View style={{ flex: 1 }}>
              <AppText variant="title">{sponsor.name}</AppText>
              <AppText tone="muted" variant="caption">{sponsor.slot} · {sponsor.personality}</AppText>
            </View>
            <StatusBadge label={money.format(sponsor.annualValue)} tone="green" />
          </View>
          <AppRow label="Goal" detail={sponsor.goal} />
          <AppRow label="Bonus" detail={sponsor.bonus} />
        </AppCard>
      ))}
    </Screen>
  );
}

function Hud({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ backgroundColor: theme.colors.pitWall, borderColor: theme.colors.border, borderRadius: theme.cards.radius, borderWidth: 1, flexBasis: '47%', flexGrow: 1, gap: theme.spacing.xs, minHeight: 78, padding: theme.spacing.md }}>
      <AppText variant="eyebrow" tone="soft">{label}</AppText>
      <AppText style={{ fontVariant: ['tabular-nums'] }}>{value}</AppText>
    </View>
  );
}
