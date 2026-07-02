import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { getNextRace, starterGameState } from '@/data/starter-game-state';
import { theme } from '@/theme';
import type { Driver, Sponsor, Vehicle } from '@/types/game';
import type { BadgeTone } from '@/types/shell';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
});

type CampusShortcut = {
  name: string;
  purpose: string;
  badge: string;
  tone: BadgeTone;
};

const campusShortcuts: CampusShortcut[] = [
  {
    name: 'Garage',
    purpose: 'Prep cars and watch risk',
    badge: 'Car #46 At Risk',
    tone: 'yellow',
  },
  {
    name: 'Sponsor Row',
    purpose: 'Keep partners confident',
    badge: '2 Active',
    tone: 'green',
  },
  {
    name: 'Scout Speedway',
    purpose: 'Find future talent',
    badge: 'Locked',
    tone: 'neutral',
  },
  {
    name: 'Facilities',
    purpose: 'Review campus levels',
    badge: 'Level 1',
    tone: 'blue',
  },
  {
    name: 'Hauler Stop',
    purpose: 'Check race-week logistics',
    badge: 'Race Ready',
    tone: 'green',
  },
  {
    name: 'Media Studio',
    purpose: 'Shape public momentum',
    badge: 'Quiet',
    tone: 'neutral',
  },
  {
    name: 'Development Center',
    purpose: 'Build the driver pipeline',
    badge: '2 Drivers',
    tone: 'blue',
  },
  {
    name: 'Manufacturer Parts',
    purpose: 'Ranger support hub',
    badge: 'Ranger',
    tone: 'red',
  },
];

export function HomeScreen() {
  const state = starterGameState;
  const { race, track } = getNextRace(state);
  const nextRaceLabel = race && track ? `${race.name} / ${track.name}` : 'Calendar pending';

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          Team Command Center
        </AppText>
        <AppText variant="hero">{state.team.name}</AppText>
        <AppText tone="muted">
          Opening week command hub for the ERCA program. Scan the team, see what matters, and pick
          the next prep step.
        </AppText>
      </View>

      <TopHud nextRaceLabel={nextRaceLabel} />
      <NextActionCard />
      <CampusGrid />
      <DriverSnapshot drivers={state.drivers.filter((driver) => driver.active)} />
      <VehicleReadiness vehicles={state.vehicles.filter((vehicle) => vehicle.active)} />
      <SponsorGoals sponsors={state.sponsors.filter((sponsor) => sponsor.active)} />
    </Screen>
  );
}

function TopHud({ nextRaceLabel }: { nextRaceLabel: string }) {
  const state = starterGameState;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      <HudTile label="Series" value={state.series} />
      <HudTile label="Cash" value={currencyFormatter.format(state.team.cash)} emphasis />
      <HudTile label="Brand Power" value={`${state.team.brandPower}`} />
      <HudTile label="Season / Week" value={`S${state.season} / W${state.week}`} />
      <HudTile label="Date" value={state.currentDate} />
      <HudTile label="Next Race" value={nextRaceLabel} wide />
    </View>
  );
}

function HudTile({
  label,
  value,
  emphasis = false,
  wide = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  wide?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.pitWall,
        borderColor: emphasis ? theme.colors.caution : theme.colors.border,
        borderCurve: 'continuous',
        borderRadius: theme.cards.radius,
        borderWidth: 1,
        flexBasis: wide ? '100%' : '48%',
        flexGrow: 1,
        gap: theme.spacing.xs,
        minHeight: 82,
        padding: theme.spacing.md,
      }}>
      <AppText variant="eyebrow" tone="soft">
        {label}
      </AppText>
      <AppText variant="body" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </AppText>
    </View>
  );
}

function NextActionCard() {
  return (
    <AppCard
      style={{
        backgroundColor: theme.colors.panelStrong,
        borderColor: theme.colors.trackRed,
      }}>
      <View
        style={{
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: theme.spacing.md,
          justifyContent: 'space-between',
        }}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <AppText variant="eyebrow" tone="accent">
            Next Recommended Action
          </AppText>
          <AppText variant="title">Race Week Prep</AppText>
        </View>
        <StatusBadge label="Week 1" tone="red" />
      </View>

      <AppText tone="muted">
        Ray "Clipboard" Mullins: "Boss, Queen City is up first. Cars are loaded, sponsors are
        watching, and we need a clean opening week."
      </AppText>

      <View style={{ gap: theme.spacing.sm }}>
        <AppButton label="Review Race Preview" />
        <AppText tone="soft" variant="caption">
          Race flow will be connected later.
        </AppText>
      </View>
    </AppCard>
  );
}

function CampusGrid() {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader
        title="Team Campus"
        subtitle="Building shortcuts for the future command center"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {campusShortcuts.map((shortcut) => (
          <CampusShortcutCard key={shortcut.name} shortcut={shortcut} />
        ))}
      </View>
    </View>
  );
}

function CampusShortcutCard({ shortcut }: { shortcut: CampusShortcut }) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.garage,
        borderColor: theme.colors.border,
        borderCurve: 'continuous',
        borderRadius: theme.cards.radius,
        borderWidth: 1,
        flexBasis: '48%',
        flexGrow: 1,
        gap: theme.spacing.sm,
        minHeight: 136,
        padding: theme.spacing.md,
      }}>
      <StatusBadge label={shortcut.badge} tone={shortcut.tone} />
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="body">{shortcut.name}</AppText>
        <AppText tone="muted" variant="caption">
          {shortcut.purpose}
        </AppText>
      </View>
    </View>
  );
}

function DriverSnapshot({ drivers }: { drivers: Driver[] }) {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title="Driver Snapshot" subtitle="Active lineup for opening week" />
      {drivers.map((driver) => (
        <AppCard key={driver.id}>
          <View
            style={{
              alignItems: 'flex-start',
              flexDirection: 'row',
              gap: theme.spacing.md,
              justifyContent: 'space-between',
            }}>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <AppText variant="title">{driver.name}</AppText>
              <AppText tone="muted" variant="caption">
                {driver.role} / {driver.archetype}
              </AppText>
            </View>
            <StatusBadge label={`OVR ${driver.overall}`} tone={driver.overall >= 50 ? 'blue' : 'neutral'} />
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <AppRow label="Morale" detail={driver.morale} />
            <AppRow label="Confidence" detail={driver.confidence} />
            <AppRow label="Fatigue" detail={driver.fatigue} />
          </View>
        </AppCard>
      ))}
    </View>
  );
}

function VehicleReadiness({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title="Vehicle Readiness" subtitle="Garage status before Queen City" />
      {vehicles.map((vehicle) => {
        const driver = getDriverName(vehicle.assignedDriverId);

        return (
          <AppCard key={vehicle.id}>
            <View
              style={{
                alignItems: 'flex-start',
                flexDirection: 'row',
                gap: theme.spacing.md,
                justifyContent: 'space-between',
              }}>
              <View style={{ flex: 1, gap: theme.spacing.xs }}>
                <AppText variant="title">Car #{vehicle.number}</AppText>
                <AppText tone="muted" variant="caption">
                  Assigned to {driver}
                </AppText>
              </View>
              <StatusBadge
                label={vehicle.raceReady}
                tone={vehicle.raceReady === 'Yes' ? 'green' : 'yellow'}
              />
            </View>
            <View style={{ gap: theme.spacing.sm }}>
              <AppRow label="Condition" detail={`${vehicle.condition}`} />
              <AppRow label="Wear" detail={`${vehicle.wear}`} />
              <AppRow label="Engine" detail={vehicle.engine} />
              <AppRow label="Transmission" detail={vehicle.transmission} />
            </View>
          </AppCard>
        );
      })}
    </View>
  );
}

function SponsorGoals({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title="Sponsor Goals" subtitle="Opening week expectations" />
      {sponsors.map((sponsor) => (
        <AppCard key={sponsor.id}>
          <View
            style={{
              alignItems: 'flex-start',
              flexDirection: 'row',
              gap: theme.spacing.md,
              justifyContent: 'space-between',
            }}>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <AppText variant="title">{sponsor.name}</AppText>
              <AppText tone="muted" variant="caption">
                {sponsor.tier}
              </AppText>
            </View>
            <StatusBadge label={currencyFormatter.format(sponsor.payoutPerRace)} tone="green" />
          </View>
          <AppRow label="Current Goal" detail={sponsor.goal} />
        </AppCard>
      ))}
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <AppText variant="title">{title}</AppText>
      <AppText tone="soft" variant="caption">
        {subtitle}
      </AppText>
    </View>
  );
}

function getDriverName(driverId: string) {
  return starterGameState.drivers.find((driver) => driver.id === driverId)?.name ?? 'Unassigned';
}
