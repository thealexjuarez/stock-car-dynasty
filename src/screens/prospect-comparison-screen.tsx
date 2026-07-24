import { Link } from 'expo-router';
import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { SectionHeader } from '@/components/shared/section-header';
import { selectProspectReveal } from '@/simulation/recruiting';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';
import type { ProspectRevealView } from '@/types/recruiting';

function rating(exact: number | null, range: [number, number] | null) {
  return exact !== null ? `${exact}` : range ? `${range[0]}–${range[1]}` : 'Unknown';
}

function salary(view: ProspectRevealView) {
  if (view.salaryDemand !== null) return `$${view.salaryDemand.toLocaleString()}`;
  return view.salaryRange
    ? `$${view.salaryRange[0].toLocaleString()}–$${view.salaryRange[1].toLocaleString()}`
    : 'Unknown';
}

function statOutlook(view: ProspectRevealView) {
  if (Object.keys(view.stats).length > 0) {
    return Object.entries(view.stats).map(([stat, value]) => `${stat} ${value}`).join(' · ');
  }
  if (Object.keys(view.statRanges).length > 0) {
    return Object.entries(view.statRanges)
      .map(([stat, value]) => `${stat} ${value?.[0]}–${value?.[1]}`)
      .join(' · ');
  }
  return 'Unknown';
}

export function ProspectComparisonScreen({ prospectIds }: { prospectIds: string[] }) {
  const { state } = useGameSession();
  const views = prospectIds
    .slice(0, 2)
    .filter((id) => Boolean(state.game.recruiting.campaigns[id]))
    .map((id) => selectProspectReveal(state.game, id));

  if (views.length !== 2) {
    return (
      <Screen>
        <AppText variant="title">Select two drivers in the Market to compare.</AppText>
        <Link href="/(tabs)/market" asChild><AppButton label="Back to Driver Market" /></Link>
      </Screen>
    );
  }

  const rows: { label: string; value: (view: ProspectRevealView) => string }[] = [
    { label: 'Overall', value: (view) => rating(view.overall, view.overallRange) },
    { label: 'Potential', value: (view) => rating(view.potential, view.potentialRange) },
    { label: 'Base-Stat Outlook', value: statOutlook },
    { label: 'Archetypes', value: (view) => view.archetypes?.join(' / ') ?? 'Unknown' },
    { label: 'Track Fit', value: (view) => view.trackStrengths.join(', ') || 'Unknown' },
    { label: 'Development', value: (view) => view.developmentOutlook },
    { label: 'Apex Interest', value: (view) => `${view.interest} · ${view.interestLabel}` },
    { label: 'Salary', value: salary },
    { label: 'Term', value: (view) => view.preferredTerm ? `${view.preferredTerm} years` : 'Unknown' },
    { label: 'Scouting Knowledge', value: (view) => `${view.scoutingKnowledge}` },
    { label: 'Sponsor Backing', value: (view) => view.sponsorInformation ?? 'Unknown' },
    { label: 'Competition', value: (view) => view.competingPressure ?? 'Unknown' },
    { label: 'Pathways', value: (view) => view.relationshipPaths.join(', ') || 'None' },
    { label: 'Recruiting Cost', value: (view) => `${view.recruitingCostToDate.rp} RP · $${view.recruitingCostToDate.cash.toLocaleString()}` },
    { label: 'Reserve Fit', value: (view) => view.roleExpectation === null ? 'Unknown' : view.roleExpectation === 'Active Seat' ? 'Poor' : view.roleExpectation === 'Flexible' ? 'Workable' : 'Strong' },
  ];

  return (
    <Screen compact>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="eyebrow" tone="accent">Driver Comparison</AppText>
        <AppText variant="hero">Choose the Better Fit</AppText>
        <AppText tone="muted">Only currently scouted information appears here.</AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {views.map((view) => (
          <AppCard key={view.id} style={{ flex: 1, padding: theme.spacing.md }}>
            <AppText variant="title" style={{ fontSize: 18 }}>{view.name}</AppText>
            <AppText variant="caption" tone="soft">Age {view.age} · {view.availability}</AppText>
            <Link href={{ pathname: '/recruiting/[id]', params: { id: view.id } }} asChild>
              <AppButton label="Open Report" variant="secondary" />
            </Link>
          </AppCard>
        ))}
      </View>
      {rows.map((row) => (
        <AppCard key={row.label} style={{ padding: theme.spacing.md }}>
          <SectionHeader title={row.label} subtitle="Side-by-side outlook" />
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            {views.map((view) => (
              <AppText key={view.id} variant="caption" tone="muted" style={{ flex: 1 }}>
                {row.value(view)}
              </AppText>
            ))}
          </View>
        </AppCard>
      ))}
    </Screen>
  );
}
