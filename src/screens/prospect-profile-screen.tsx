import { Link } from 'expo-router';
import { View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { SectionHeader } from '@/components/shared/section-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { getArchetypeDefinition } from '@/data/archetype-config';
import { recruitingActions, scoutingBands } from '@/data/recruiting-config';
import {
  getActionAvailability,
  getRecommendedRecruitingAction,
  getScoutingBand,
  selectProspectReveal,
} from '@/simulation/recruiting';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';
import type { RecruitingActionId } from '@/types/recruiting';

function valueLabel(exact: number | null, range: [number, number] | null) {
  if (exact !== null) return `${exact}`;
  return range ? `${range[0]}–${range[1]}` : 'Still unknown';
}

function moneyLabel(exact: number | null, range: [number, number] | null) {
  if (exact !== null) return `$${exact.toLocaleString()}`;
  return range
    ? `$${range[0].toLocaleString()}–$${range[1].toLocaleString()}`
    : 'Not yet estimated';
}

export function ProspectProfileScreen({ prospectId }: { prospectId: string }) {
  const { state, completeRecruitingAction } = useGameSession();
  const prospect = state.game.recruiting.prospects.find((item) => item.id === prospectId);
  const progress = state.game.recruiting.campaigns[prospectId];
  if (!prospect || !progress) {
    return (
      <Screen>
        <AppText variant="title">Prospect unavailable</AppText>
      </Screen>
    );
  }

  const view = selectProspectReveal(state.game, prospectId);
  const band = getScoutingBand(view.scoutingConfidence);
  const recommended = getRecommendedRecruitingAction(state.game, prospectId);
  const offerAvailability = getActionAvailability(state.game, prospectId, 'contract-offer');
  const lastAction = progress.actionHistory.at(-1);
  const actionsLeft = Math.max(0, 3 - progress.weeklyActionCount);

  const footer = progress.signed ? (
    <AppButton label="Signed to Development Roster" disabled />
  ) : offerAvailability.available ? (
    <Link href={{ pathname: '/recruiting/offer/[id]', params: { id: prospectId } }} asChild>
      <AppButton label="Make Offer · 300 RP" />
    </Link>
  ) : recommended ? (
    <AppButton
      label={`${recommended.contextualName ?? recommended.canonicalName} · ${recommended.rpCost} RP`}
      onPress={() =>
        completeRecruitingAction(
          prospectId,
          recommended.id as Exclude<RecruitingActionId, 'contract-offer'>,
        )
      }
    />
  ) : (
    <AppButton label="No Recruiting Move Available" disabled />
  );

  return (
    <Screen compact footer={footer}>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="eyebrow" tone="accent">Recruiting Status</AppText>
        <AppText variant="hero">{view.name}</AppText>
        <AppText tone="muted">
          Age {view.age} · {view.racingBackground}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <StatusBadge label={view.availability} tone={view.availability === 'Available' ? 'green' : 'neutral'} />
        <StatusBadge label={`${band.label} · ${view.scoutingConfidence}`} tone="blue" />
        <StatusBadge label={`${actionsLeft} actions left`} tone={actionsLeft > 0 ? 'yellow' : 'neutral'} />
      </View>

      {lastAction ? (
        <AppCard style={{ borderColor: theme.colors.victory, padding: theme.spacing.md }}>
          <AppText variant="caption" tone="accent">Last Recruiting Move</AppText>
          <AppText variant="title" style={{ fontSize: 18 }}>{lastAction.actionName}</AppText>
          <AppText variant="caption" tone="muted">
            Scouting +{lastAction.scoutingGain} · Interest +{lastAction.interestGain} · Engagement +{lastAction.engagementGain} · Visibility +{lastAction.visibilityGain}
          </AppText>
          <AppText variant="caption" tone="soft">{lastAction.reasons.join(' · ')}</AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <SectionHeader
          title="What We Know"
          subtitle={`${band.minimum}–${band.maximum} confidence: ${band.label}`}
        />
        <AppRow label="Overall" detail={valueLabel(view.overall, view.overallRange)} />
        <AppRow label="Potential" detail={valueLabel(view.potential, view.potentialRange)} />
        <AppRow label="Current Series" detail={view.currentSeries ?? 'Not confirmed'} />
        <AppRow label="Salary Outlook" detail={moneyLabel(view.salaryDemand, view.salaryRange)} />
        <AppRow
          label="Team Interest"
          detail={
            view.interest !== null
              ? `${view.interest} · ${view.interestLabel}`
              : 'Needs 51 scouting'
          }
        />
        <AppRow label="Prospect Engagement" detail={`${view.engagement}`} />
        <AppRow label="Competing Pressure" detail={view.competingPressure ?? 'Unknown'} />
        <AppRow label="Contract Term" detail={view.preferredTerm ? `${view.preferredTerm} years` : 'Unknown'} />
        <AppRow label="Role Expectation" detail={view.roleExpectation ?? 'Unknown'} />
        <AppRow label="Sponsor Backing" detail={view.sponsorInformation ?? 'Unknown'} />
      </AppCard>

      {view.archetypes ? (
        <AppCard>
          <SectionHeader title="Fit for Apex" subtitle="Confirmed archetypes and track tendencies" />
          {view.archetypes.map((archetype, index) => {
            const definition = getArchetypeDefinition(archetype);
            const effect = index === 0 ? definition.primary : definition.secondary;
            const boosts = Object.entries(effect.statBoosts)
              .map(([stat, boost]) => `${stat} +${boost}`)
              .join(', ');
            return (
              <View key={`${archetype}-${index}`} style={{ gap: 2 }}>
                <AppText variant="caption" tone="accent">{index === 0 ? 'Primary' : 'Secondary'}</AppText>
                <AppText variant="title" style={{ fontSize: 18 }}>{archetype}</AppText>
                <AppText variant="caption" tone="soft">
                  {boosts || 'Improves scouting accuracy and future development work.'}
                </AppText>
              </View>
            );
          })}
          <AppRow label="Track-Type Fit" detail={view.trackStrengths.join(', ') || 'Not confirmed'} />
          <AppText tone="muted">{view.developmentOutlook}</AppText>
        </AppCard>
      ) : null}

      {Object.keys(view.stats).length > 0 || Object.keys(view.statRanges).length > 0 ? (
        <AppCard>
          <SectionHeader title="Base-Stat Outlook" subtitle="Ranges stay estimated until full evaluation" />
          {Object.entries(
            Object.keys(view.stats).length > 0 ? view.stats : view.statRanges,
          ).map(([stat, value]) => (
            <AppRow
              compact
              key={stat}
              label={stat}
              detail={Array.isArray(value) ? `${value[0]}–${value[1]}` : `${value}`}
            />
          ))}
        </AppCard>
      ) : null}

      <AppCard>
        <SectionHeader title="What We Still Need to Learn" subtitle="The four scouting bands are fixed" />
        {scoutingBands.map((item) => (
          <AppRow
            compact
            key={item.id}
            label={`${item.minimum}–${item.maximum}`}
            detail={item.label}
          />
        ))}
        <AppText variant="caption" tone="soft">
          Exact stats, true sponsor package, role expectation, and dealbreakers remain hidden until 76 confidence.
        </AppText>
      </AppCard>

      <AppCard>
        <SectionHeader title="Relationship Pathways" subtitle="Distinct paths strengthen an eventual offer" />
        <AppText tone="muted">
          {view.relationshipPaths.length > 0
            ? view.relationshipPaths.join(' · ')
            : 'No qualifying relationship path established yet.'}
        </AppText>
        <AppRow label="Recruiting Cost to Date" detail={`${view.recruitingCostToDate.rp} RP · $${view.recruitingCostToDate.cash.toLocaleString()}`} />
      </AppCard>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader
          title="Recruiting Moves"
          subtitle={`${state.game.recruiting.spendableRp} RP available · ${actionsLeft} actions left this weekend`}
        />
        {recruitingActions.map((action) => {
          const availability = getActionAvailability(state.game, prospectId, action.id);
          const isOffer = action.id === 'contract-offer';
          const label = action.contextualName ?? action.canonicalName;
          return (
            <AppCard key={action.id} style={{ padding: theme.spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="title" style={{ fontSize: 17 }}>{label}</AppText>
                  <AppText variant="caption" tone="soft">{action.category}</AppText>
                </View>
                <StatusBadge compact label={`${action.rpCost} RP${action.cashCost ? ` + $${action.cashCost.toLocaleString()}` : ''}`} tone="yellow" />
              </View>
              <AppText variant="caption" tone="muted">
                S +{action.effects.scouting} · I +{action.effects.interest} · E +{action.effects.engagement} · V +{action.effects.visibility}
              </AppText>
              <AppText variant="caption" tone={availability.available ? 'soft' : 'accent'}>
                {availability.available
                  ? `${availability.usesRemaining} uses remaining`
                  : availability.reasons.join(' · ')}
              </AppText>
              {isOffer ? (
                <Link href={{ pathname: '/recruiting/offer/[id]', params: { id: prospectId } }} asChild>
                  <AppButton label="Open Offer Sheet" variant="secondary" disabled={!availability.available} />
                </Link>
              ) : (
                <AppButton
                  label={progress.completedActionUses[action.id] ? 'Run Again' : 'Complete Move'}
                  variant="secondary"
                  disabled={!availability.available}
                  onPress={() =>
                    completeRecruitingAction(
                      prospectId,
                      action.id as Exclude<RecruitingActionId, 'contract-offer'>,
                    )
                  }
                />
              )}
            </AppCard>
          );
        })}
      </View>

      {progress.offerHistory.length > 0 ? (
        <AppCard>
          <SectionHeader title="Offer History" subtitle="Resolved deterministically" />
          {progress.offerHistory.map((offer) => (
            <AppRow
              key={offer.id}
              label={offer.accepted ? 'Accepted' : 'Rejected'}
              detail={`$${offer.annualSalary.toLocaleString()} · ${offer.termYears} years · score ${offer.breakdown.total}`}
            />
          ))}
        </AppCard>
      ) : null}
    </Screen>
  );
}
