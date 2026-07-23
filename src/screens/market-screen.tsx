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

type SortKey = 'overall' | 'potential' | 'interest' | 'cost' | 'scouting' | 'age';

function rangeLabel(exact: number | null, range: [number, number] | null) {
  if (exact !== null) return `${exact}`;
  return range ? `${range[0]}–${range[1]}` : 'Unknown';
}

export function MarketScreen() {
  const { state } = useGameSession();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('scouting');
  const [selected, setSelected] = useState<string[]>([]);
  const { recruiting } = state.game;

  const prospects = useMemo(() => {
    const views = recruiting.prospects
      .map((prospect) => ({
        prospect,
        progress: recruiting.campaigns[prospect.id],
        view: selectProspectReveal(state.game, prospect.id),
      }))
      .filter(({ progress }) => !progress.signed)
      .filter(({ view }) =>
        `${view.name} ${view.racingBackground}`.toLowerCase().includes(query.toLowerCase()),
      );
    const knownValue = (item: (typeof views)[number]) => {
      const { view } = item;
      if (sort === 'age') return -view.age;
      if (sort === 'scouting') return view.scoutingConfidence;
      if (sort === 'interest') return view.interest ?? -1;
      if (sort === 'cost') return -(view.salaryDemand ?? view.salaryRange?.[1] ?? 999_999);
      if (sort === 'potential') return view.potential ?? view.potentialRange?.[1] ?? -1;
      return view.overall ?? view.overallRange?.[1] ?? -1;
    };
    return views.sort((left, right) => {
      if (left.progress.signed !== right.progress.signed) return left.progress.signed ? 1 : -1;
      return knownValue(right) - knownValue(left) || left.prospect.name.localeCompare(right.prospect.name);
    });
  }, [query, recruiting.campaigns, recruiting.prospects, sort, state.game]);

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
        <AppText variant="hero">Build the Pipeline</AppText>
        <AppText tone="muted">
          Scout the field, build trust, and secure one Reserve / Development driver.
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {[
          [`${recruiting.spendableRp} RP`, 'Spendable'],
          [`V ${recruiting.visibility}`, 'Visibility'],
          [`Pull ${state.game.team.recruitingPull}`, 'Team rating'],
        ].map(([value, label]) => (
          <AppCard key={label} style={{ flex: 1, padding: theme.spacing.md, gap: 2 }}>
            <AppText variant="title" style={{ fontSize: 18 }}>{value}</AppText>
            <AppText variant="caption" tone="soft">{label}</AppText>
          </AppCard>
        ))}
      </View>

      <AppCard style={{ padding: theme.spacing.md }}>
        <TextInput
          accessibilityLabel="Search prospects"
          onChangeText={setQuery}
          placeholder="Search driver or background"
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {(['overall', 'potential', 'interest', 'cost', 'scouting', 'age'] as SortKey[]).map((key) => (
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
              <AppText variant="caption" style={{ textTransform: 'capitalize' }}>{key}</AppText>
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
          Select two drivers to compare without exposing hidden scouting data.
        </AppText>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="caption" tone="soft">{prospects.length} available prospects</AppText>
        <StatusBadge
          compact
          label={recruiting.reserveDriver ? 'Reserve Slot Filled' : 'Reserve Slot Open'}
          tone={recruiting.reserveDriver ? 'neutral' : 'green'}
        />
      </View>

      {prospects.map(({ progress, view }) => {
        const band = getScoutingBand(view.scoutingConfidence);
        const active = selected.includes(view.id);
        return (
          <AppCard key={view.id} style={{ padding: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="title" style={{ fontSize: 19 }}>{view.name}</AppText>
                <AppText variant="caption" tone="muted">
                  Age {view.age} · {view.racingBackground}
                </AppText>
              </View>
              <StatusBadge
                compact
                label={view.availability}
                tone={view.availability === 'Available' ? 'green' : 'neutral'}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
              <AppText variant="caption">OVR {rangeLabel(view.overall, view.overallRange)}</AppText>
              <AppText variant="caption">POT {rangeLabel(view.potential, view.potentialRange)}</AppText>
              <AppText variant="caption">
                {view.interestLabel ? `${view.interestLabel} ${view.interest}` : 'Interest unknown'}
              </AppText>
            </View>
            <AppText variant="caption" tone="soft">
              {band.label} · S {view.scoutingConfidence} · {Math.max(0, 3 - progress.weeklyActionCount)} actions left
            </AppText>
            <AppText variant="caption" tone="muted">
              {view.archetypes?.join(' / ') ?? 'Archetypes not yet confirmed'}
            </AppText>
            <AppText variant="caption" tone="soft">
              {view.relationshipPaths.length > 0
                ? `Pathways: ${view.relationshipPaths.join(', ')}`
                : 'Relationship: no pathway established'}
            </AppText>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Link
                href={{ pathname: '/recruiting/[id]', params: { id: view.id } }}
                asChild>
                <AppButton label="Scouting Report" variant="secondary" style={{ flex: 1 }} />
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
