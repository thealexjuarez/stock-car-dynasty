import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { getScoutingBand, selectProspectReveal } from '@/simulation/recruiting';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

type SortKey =
  | 'scouting'
  | 'interest'
  | 'competition'
  | 'overall'
  | 'potential'
  | 'salary'
  | 'age';
type MarketStatus = 'All' | 'Available' | 'Negotiating' | 'Signed' | 'Lost';

const sortLabels: Record<SortKey, string> = {
  scouting: 'Scouting',
  interest: 'Apex Interest',
  competition: 'Competition',
  overall: 'Overall',
  potential: 'Potential',
  salary: 'Salary',
  age: 'Age',
};

function rangeLabel(exact: number | null, range: [number, number] | null) {
  if (exact !== null) return `${exact}`;
  return range ? `${range[0]}–${range[1]}` : 'Unknown';
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2);
}

export function MarketScreen() {
  const { state } = useGameSession();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('scouting');
  const [status, setStatus] = useState<MarketStatus>('All');
  const [selected, setSelected] = useState<string[]>([]);
  const { recruiting } = state.game;

  const prospects = useMemo(() => {
    const entries = recruiting.prospects.map((prospect) => {
      const progress = recruiting.campaigns[prospect.id];
      const view = selectProspectReveal(state.game, prospect.id);
      const marketStatus: Exclude<MarketStatus, 'All'> =
        progress.signed ? 'Signed' :
        progress.signedByTeamId ? 'Lost' :
        view.signingThresholdKnown &&
          view.interest >= (view.signingThreshold ?? 101) ? 'Negotiating' :
        'Available';
      return { prospect, progress, view, marketStatus };
    }).filter(({ prospect, view }) => {
      const searchText = [
        view.name,
        view.racingBackground,
        view.currentSeries,
        ...(view.archetypes ?? []),
        ...view.trackStrengths,
        prospect.roleExpectation,
      ].join(' ').toLowerCase();
      return searchText.includes(query.trim().toLowerCase());
    }).filter((entry) => status === 'All' || entry.marketStatus === status);

    const value = (entry: (typeof entries)[number]) => {
      if (sort === 'scouting') return entry.view.scoutingKnowledge;
      if (sort === 'interest') return entry.view.interest;
      if (sort === 'competition') return entry.progress.rivals.length;
      if (sort === 'potential') {
        return entry.view.potential ?? entry.view.potentialRange?.[1] ?? -1;
      }
      if (sort === 'overall') {
        return entry.view.overall ?? entry.view.overallRange?.[1] ?? -1;
      }
      if (sort === 'salary') {
        return -(entry.view.salaryDemand ?? entry.view.salaryRange?.[1] ?? 999_999);
      }
      return -entry.view.age;
    };
    return entries.sort(
      (left, right) =>
        value(right) - value(left) ||
        left.prospect.name.localeCompare(right.prospect.name),
    );
  }, [
    query,
    recruiting.campaigns,
    recruiting.prospects,
    sort,
    state.game,
    status,
  ]);

  const toggleCompare = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 2
          ? [...current, id]
          : [current[1], id],
    );
  };

  return (
    <Screen compact>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="eyebrow" tone="accent">Driver Market</AppText>
        <AppText variant="hero">Find the Next Driver</AppText>
        <AppText tone="muted">
          Learn who they are, build Apex Interest, and beat other teams to the deal.
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {[
          [`${recruiting.spendableRp}`, 'Recruiting Points'],
          [`${recruiting.visibility}`, 'Recruiting Visibility'],
          [`${state.game.team.recruitingPull}`, 'Recruiting Pull'],
        ].map(([value, label]) => (
          <AppCard key={label} style={{ flex: 1, gap: 2, padding: theme.spacing.sm }}>
            <AppText variant="title" style={{ fontSize: 18 }}>{value}</AppText>
            <AppText variant="caption" tone="soft">{label}</AppText>
          </AppCard>
        ))}
      </View>

      <AppCard style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
        <TextInput
          accessibilityLabel="Search prospects"
          onChangeText={setQuery}
          placeholder="Search name, archetype, track, or role"
          placeholderTextColor={theme.colors.textSoft}
          style={{
            backgroundColor: theme.colors.pitWall,
            borderColor: theme.colors.border,
            borderRadius: 8,
            borderWidth: 1,
            color: theme.colors.text,
            fontSize: 15,
            minHeight: 44,
            paddingHorizontal: theme.spacing.md,
          }}
          value={query}
        />
        <AppText variant="caption" tone="soft">Sort drivers</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {(Object.keys(sortLabels) as SortKey[]).map((key) => (
            <Pressable
              accessibilityRole="button"
              key={key}
              onPress={() => setSort(key)}
              style={{
                backgroundColor: sort === key ? theme.colors.fuel : theme.colors.panelStrong,
                borderRadius: 999,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: 7,
              }}>
              <AppText variant="caption">{sortLabels[key]}</AppText>
            </Pressable>
          ))}
        </View>
        <AppText variant="caption" tone="soft">Show</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {(['All', 'Available', 'Negotiating', 'Signed', 'Lost'] as MarketStatus[]).map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => setStatus(item)}
              style={{
                backgroundColor: status === item ? theme.colors.caution : theme.colors.panelStrong,
                borderRadius: 999,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: 7,
              }}>
              <AppText variant="caption">{item}</AppText>
            </Pressable>
          ))}
        </View>
      </AppCard>

      {selected.length === 2 ? (
        <Link
          href={{ pathname: '/recruiting/compare', params: { ids: selected.join(',') } }}
          asChild>
          <AppButton label="Compare Selected Drivers" />
        </Link>
      ) : (
        <AppText variant="caption" tone="soft">
          Select two drivers to compare only what Apex has learned.
        </AppText>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="caption" tone="soft">{prospects.length} drivers shown</AppText>
        <StatusBadge
          compact
          label={recruiting.reserveDriver ? 'Reserve Slot Filled' : 'Reserve Slot Open'}
          tone={recruiting.reserveDriver ? 'neutral' : 'green'}
        />
      </View>

      {prospects.map(({ progress, view, marketStatus }) => {
        const band = getScoutingBand(view.scoutingKnowledge);
        const active = selected.includes(view.id);
        return (
          <AppCard key={view.id} style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <View
                accessibilityLabel={`${view.name} portrait placeholder`}
                style={{
                  alignItems: 'center',
                  backgroundColor: theme.colors.panelStrong,
                  borderRadius: 999,
                  height: 44,
                  justifyContent: 'center',
                  width: 44,
                }}>
                <AppText variant="caption" tone="accent">{initials(view.name)}</AppText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="title" style={{ fontSize: 18 }}>{view.name}</AppText>
                <AppText variant="caption" tone="muted">
                  Age {view.age} · {view.racingBackground}
                </AppText>
              </View>
              <StatusBadge
                compact
                label={marketStatus}
                tone={marketStatus === 'Available' || marketStatus === 'Negotiating' ? 'green' : 'neutral'}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
              <AppText variant="caption">OVR {rangeLabel(view.overall, view.overallRange)}</AppText>
              <AppText variant="caption">POT {rangeLabel(view.potential, view.potentialRange)}</AppText>
              <AppText variant="caption">{view.interestLabel} · {view.interest}</AppText>
            </View>
            <AppText variant="caption" tone="soft">
              {band.label} · Scouting Knowledge {view.scoutingKnowledge} · {Math.max(0, 3 - progress.weeklyActionCount)} moves left
            </AppText>
            <AppText variant="caption" tone="muted">
              {view.archetypes?.join(' / ') ?? 'Archetypes not yet confirmed'}
            </AppText>
            <AppText variant="caption" tone="soft">
              {view.recruitingBattle.competitionSummary}
            </AppText>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Link
                href={{ pathname: '/recruiting/[id]', params: { id: view.id } }}
                asChild>
                <AppButton label="Open Driver" variant="secondary" style={{ flex: 1 }} />
              </Link>
              <AppButton
                label={active ? 'Selected' : 'Compare'}
                onPress={() => toggleCompare(view.id)}
                variant={active ? 'primary' : 'secondary'}
                style={{ flex: 1 }}
              />
            </View>
          </AppCard>
        );
      })}
    </Screen>
  );
}
