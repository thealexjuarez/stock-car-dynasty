import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  getImmediateRecruitingRiskWarnings,
  getRecommendedRecruitingAction,
  getScoutingBand,
  selectProspectReveal,
} from '@/simulation/recruiting';
import {
  sortCompactRows,
  toggleCompactTarget,
  toggleSingleExpanded,
} from '@/presentation/core-screen-density';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

type SortKey = 'recommended' | 'interest' | 'scouting' | 'overall' | 'potential' | 'age' | 'risk';
type MarketStatus = 'All' | 'Targeted' | 'Ready to Offer' | 'At Risk' | 'Fully Scouted' | 'Signed' | 'Lost';

const sortLabels: Record<SortKey, string> = {
  recommended: 'Recommended',
  interest: 'Interest',
  scouting: 'Scouting',
  overall: 'OVR',
  potential: 'Potential',
  age: 'Age',
  risk: 'Risk',
};
const statusOptions: MarketStatus[] = [
  'All',
  'Targeted',
  'Ready to Offer',
  'At Risk',
  'Fully Scouted',
  'Signed',
  'Lost',
];

function rangeLabel(exact: number | null, range: [number, number] | null) {
  if (exact !== null) return `${exact}`;
  return range ? `${range[0]}–${range[1]}` : 'Unknown';
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2);
}

function ProgressBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={{ flex: 1, gap: 3 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="caption" tone="soft" style={{ fontSize: 9 }}>{label}</AppText>
        <AppText variant="caption" style={{ fontSize: 9 }}>{value}</AppText>
      </View>
      <View style={{ backgroundColor: theme.colors.panelStrong, borderRadius: 99, height: 4, overflow: 'hidden' }}>
        <View style={{ backgroundColor: color, height: 4, width: `${Math.max(0, Math.min(100, value))}%` }} />
      </View>
    </View>
  );
}

export function MarketScreen() {
  const { state } = useGameSession();
  const { recruiting } = state.game;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recommended');
  const [status, setStatus] = useState<MarketStatus>('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openControl, setOpenControl] = useState<'filter' | 'sort' | null>(null);
  const [targetedIds, setTargetedIds] = useState(() =>
    recruiting.prospects
        .filter((prospect) => {
          const progress = recruiting.campaigns[prospect.id];
          return progress.actionHistory.length > 0 ||
            progress.recruitingCostToDate.rp > 0 ||
            progress.recruitingCostToDate.cash > 0;
        })
        .map((prospect) => prospect.id),
  );
  const warnings = getImmediateRecruitingRiskWarnings(state.game);
  const warningById = useMemo(
    () => new Map(warnings.map((warning) => [warning.prospectId, warning])),
    [warnings],
  );

  const prospects = useMemo(() => {
    const entries = recruiting.prospects.map((prospect) => {
      const progress = recruiting.campaigns[prospect.id];
      const view = selectProspectReveal(state.game, prospect.id);
      const warning = warningById.get(prospect.id);
      const signed = progress.signed;
      const lost = Boolean(progress.signedByTeamId);
      const ready = view.contractReadiness === 'Will Sign';
      const targeted = targetedIds.includes(prospect.id);
      const recommended = getRecommendedRecruitingAction(state.game, prospect.id);
      return { prospect, progress, view, warning, signed, lost, ready, targeted, recommended };
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
    }).filter((entry) => {
      if (status === 'All') return true;
      if (status === 'Targeted') return entry.targeted;
      if (status === 'Ready to Offer') return entry.ready;
      if (status === 'At Risk') return Boolean(entry.warning);
      if (status === 'Fully Scouted') return entry.view.scoutingKnowledge >= 76;
      if (status === 'Signed') return entry.signed;
      return entry.lost;
    });

    const value = (entry: (typeof entries)[number]) => {
      if (sort === 'recommended') {
        return (entry.ready ? 400 : 0) + (entry.warning ? 250 : 0) +
          (entry.targeted ? 100 : 0) + entry.view.scoutingKnowledge + entry.view.interest;
      }
      if (sort === 'interest') return entry.view.interest;
      if (sort === 'scouting') return entry.view.scoutingKnowledge;
      if (sort === 'potential') return entry.view.potential ?? entry.view.potentialRange?.[1] ?? -1;
      if (sort === 'overall') return entry.view.overall ?? entry.view.overallRange?.[1] ?? -1;
      if (sort === 'risk') return entry.warning ? 1_000 + entry.progress.rivals.length : 0;
      return -entry.view.age;
    };

    return sortCompactRows(entries, value, (entry) => entry.prospect.name);
  }, [
    query,
    recruiting.campaigns,
    recruiting.prospects,
    sort,
    state.game,
    status,
    targetedIds,
    warningById,
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

  const toggleTarget = (id: string) => {
    setTargetedIds((current) => toggleCompactTarget(current, id));
  };

  return (
    <Screen compact>
      <View style={{ gap: 2 }}>
        <AppText variant="eyebrow" tone="accent">Driver Market</AppText>
        <AppText variant="title">Recruiting Board</AppText>
        <AppText numberOfLines={1} variant="caption" tone="muted">
          Scout the field, protect priority targets, and make the next move.
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[
          [`${recruiting.spendableRp}`, 'RP'],
          [`${targetedIds.length}`, 'Targets'],
          [`${recruiting.reserveDriver ? 0 : 1}`, 'Open Slot'],
          [`${prospects.filter((entry) => entry.ready).length}`, 'Can Sign'],
        ].map(([value, label]) => (
          <AppCard key={label} style={{ flex: 1, gap: 0, padding: 7 }}>
            <AppText variant="title" style={{ fontSize: 17 }}>{value}</AppText>
            <AppText variant="caption" tone="soft" style={{ fontSize: 9 }}>{label}</AppText>
          </AppCard>
        ))}
      </View>
      <AppText variant="caption" tone="soft">
        {targetedIds.reduce((sum, id) => sum + Math.max(0, 3 - recruiting.campaigns[id].weeklyActionCount), 0)} target moves left · {warnings.length} at risk
      </AppText>

      <AppCard style={{ gap: 6, padding: theme.spacing.sm }}>
        <TextInput
          accessibilityLabel="Search prospects"
          onChangeText={setQuery}
          placeholder="Search drivers, traits, tracks, or roles"
          placeholderTextColor={theme.colors.textSoft}
          style={{
            backgroundColor: theme.colors.pitWall,
            borderColor: theme.colors.border,
            borderRadius: 7,
            borderWidth: 1,
            color: theme.colors.text,
            fontSize: 14,
            minHeight: 38,
            paddingHorizontal: theme.spacing.sm,
          }}
          value={query}
        />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpenControl(openControl === 'filter' ? null : 'filter')}
            style={{ backgroundColor: theme.colors.panelStrong, borderRadius: 6, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 7 }}>
            <AppText numberOfLines={1} variant="caption">Show: {status}</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpenControl(openControl === 'sort' ? null : 'sort')}
            style={{ backgroundColor: theme.colors.panelStrong, borderRadius: 6, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 7 }}>
            <AppText numberOfLines={1} variant="caption">Sort: {sortLabels[sort]}</AppText>
          </Pressable>
        </View>
        {openControl ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
            {(openControl === 'filter' ? statusOptions : (Object.keys(sortLabels) as SortKey[])).map((item) => {
              const label = openControl === 'filter' ? item : sortLabels[item as SortKey];
              const active = openControl === 'filter' ? status === item : sort === item;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={item}
                  onPress={() => {
                    if (openControl === 'filter') setStatus(item as MarketStatus);
                    else setSort(item as SortKey);
                    setOpenControl(null);
                  }}
                  style={{
                    backgroundColor: active ? theme.colors.caution : theme.colors.panelStrong,
                    borderRadius: 999,
                    paddingHorizontal: 9,
                    justifyContent: 'center',
                    minHeight: 44,
                  }}>
                  <AppText
                    variant="caption"
                    style={{ color: active ? theme.colors.rubber : theme.colors.text, fontSize: 10 }}>
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </AppCard>

      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="caption" tone="soft">{prospects.length} drivers · tap a row for detail</AppText>
        {selected.length === 2 ? (
          <Link href={{ pathname: '/recruiting/compare', params: { ids: selected.join(',') } }} asChild>
            <Pressable accessibilityRole="link">
              <AppText variant="caption" tone="accent">Compare 2 →</AppText>
            </Pressable>
          </Link>
        ) : (
          <StatusBadge compact label={recruiting.reserveDriver ? 'Slot Filled' : 'Slot Open'} tone={recruiting.reserveDriver ? 'neutral' : 'green'} />
        )}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        {prospects.map(({ progress, view, warning, signed, lost, ready, targeted, recommended }) => {
          const band = getScoutingBand(view.scoutingKnowledge);
          const expanded = expandedId === view.id;
          const compared = selected.includes(view.id);
          const statusLabel = signed ? 'Signed' : lost ? 'Lost' : ready ? 'Ready' : warning ? 'At Risk' : band.label;
          return (
            <AppCard key={view.id} style={{ gap: 7, padding: theme.spacing.sm }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpandedId((current) => toggleSingleExpanded(current, view.id))}
                style={({ pressed }) => ({ gap: 7, opacity: pressed ? 0.78 : 1 })}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
                  <View style={{ alignItems: 'center', backgroundColor: theme.colors.panelStrong, borderRadius: 999, height: 38, justifyContent: 'center', width: 38 }}>
                    <AppText variant="caption" tone="accent">{initials(view.name)}</AppText>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText numberOfLines={1} style={{ fontSize: 14 }}>{view.name}</AppText>
                    <AppText numberOfLines={1} variant="caption" tone="muted" style={{ fontSize: 10 }}>
                      Age {view.age} · OVR {rangeLabel(view.overall, view.overallRange)} · POT {rangeLabel(view.potential, view.potentialRange)}
                    </AppText>
                  </View>
                  <StatusBadge
                    compact
                    label={statusLabel}
                    tone={warning ? 'red' : ready || signed ? 'green' : 'neutral'}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                  <ProgressBar label="Scouting" value={view.scoutingKnowledge} color={theme.colors.fuel} />
                  <ProgressBar label="Apex Interest" value={view.interest} color={theme.colors.caution} />
                </View>
                <AppText variant="caption" tone="soft" style={{ fontSize: 9, paddingRight: 92 }}>
                  Apex rank P{view.recruitingBattle.apexRank} · {progress.rivals.length} rival{progress.rivals.length === 1 ? '' : 's'} · {Math.max(0, 3 - progress.weeklyActionCount)} moves
                </AppText>
              </Pressable>

              {expanded ? (
                <View style={{ borderTopColor: theme.colors.border, borderTopWidth: 1, gap: 5, paddingTop: 6 }}>
                  <AppText variant="caption" tone="muted">
                    {view.archetypes?.join(' / ') ?? 'Archetypes not yet confirmed'}
                  </AppText>
                  <AppText variant="caption" tone="soft">{view.recruitingBattle.competitionSummary}</AppText>
                  {warning ? <AppText variant="caption" style={{ color: theme.colors.trackRed }}>{warning.message}</AppText> : null}
                  <AppText variant="caption">
                    Best next move: {recommended?.canonicalName ?? (signed || lost ? 'Campaign closed' : 'Review the profile')}
                  </AppText>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Link href={{ pathname: '/recruiting/[id]', params: { id: view.id } }} asChild>
                      <AppButton label="Open Profile" variant="secondary" style={{ flex: 1 }} />
                    </Link>
                    <AppButton
                      label={compared ? 'Compared' : 'Compare'}
                      onPress={() => toggleCompare(view.id)}
                      variant={compared ? 'primary' : 'secondary'}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              ) : null}

              <Pressable
                accessibilityLabel={`${targeted ? 'Remove' : 'Add'} ${view.name} ${targeted ? 'from' : 'to'} targets`}
                accessibilityRole="button"
                onPress={() => toggleTarget(view.id)}
                style={{
                  bottom: 2,
                  justifyContent: 'center',
                  minHeight: 44,
                  paddingHorizontal: 8,
                  position: 'absolute',
                  right: 2,
                }}>
                <AppText variant="caption" tone={targeted ? 'accent' : 'soft'}>
                  {targeted ? '★ Targeted' : '☆ Add target'}
                </AppText>
              </Pressable>
            </AppCard>
          );
        })}
      </View>
    </Screen>
  );
}
