import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Screen } from '@/components/shared/screen';
import { SectionHeader } from '@/components/shared/section-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { getArchetypeDefinition } from '@/data/archetype-config';
import { recruitingActions, scoutingBands } from '@/data/recruiting-config';
import {
  recruitingActionCopy,
  recruitingActionGroups,
  type RecruitingActionGroup,
} from '@/data/recruiting-copy';
import {
  getActionAvailability,
  getOfferAvailability,
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

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2);
}

export function ProspectProfileScreen({ prospectId }: { prospectId: string }) {
  const { state, completeRecruitingAction } = useGameSession();
  const [actionGroup, setActionGroup] = useState<RecruitingActionGroup>('Scouting');
  const [expandedAction, setExpandedAction] = useState<RecruitingActionId | null>(null);
  const prospect = state.game.recruiting.prospects.find((item) => item.id === prospectId);
  const progress = state.game.recruiting.campaigns[prospectId];
  if (!prospect || !progress) {
    return <Screen><AppText variant="title">Prospect unavailable</AppText></Screen>;
  }

  const view = selectProspectReveal(state.game, prospectId);
  const band = getScoutingBand(view.scoutingKnowledge);
  const recommended = getRecommendedRecruitingAction(state.game, prospectId);
  const offer = getOfferAvailability(
    state.game,
    prospectId,
    prospect.salaryDemand,
    prospect.preferredTerm,
  );
  const lastAction = progress.actionHistory.at(-1);
  const actionsLeft = Math.max(0, 3 - progress.weeklyActionCount);
  const lostTeam = progress.signedByTeamId
    ? state.game.raceField.organizations.find((team) => team.id === progress.signedByTeamId)
    : undefined;

  const footer = progress.signed ? (
    <AppButton label="Signed to Apex Development Roster" disabled />
  ) : progress.signedByTeamId ? (
    <AppButton label={`Signed by ${lostTeam?.name ?? 'Another Team'}`} disabled />
  ) : offer.wouldAccept ? (
    <Link href={{ pathname: '/recruiting/offer/[id]', params: { id: prospectId } }} asChild>
      <AppButton label="Review Signing Offer · 300 RP" />
    </Link>
  ) : recommended && recommended.id !== 'contract-offer' ? (
    <AppButton
      label={`Next: ${recommended.contextualName ?? recommended.canonicalName} · ${recommended.rpCost} RP`}
      onPress={() =>
        completeRecruitingAction(
          prospectId,
          recommended.id as Exclude<RecruitingActionId, 'contract-offer'>,
        )
      }
    />
  ) : (
    <Link href={{ pathname: '/recruiting/offer/[id]', params: { id: prospectId } }} asChild>
      <AppButton label="Review Contract Readiness" variant="secondary" />
    </Link>
  );

  return (
    <Screen compact footer={footer}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
        <View
          accessibilityLabel={`${view.name} portrait placeholder`}
          style={{
            alignItems: 'center',
            backgroundColor: theme.colors.panelStrong,
            borderRadius: 999,
            height: 64,
            justifyContent: 'center',
            width: 64,
          }}>
          <AppText variant="title" tone="accent">{initials(view.name)}</AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="eyebrow" tone="accent">Recruiting Report</AppText>
          <AppText variant="hero" style={{ fontSize: 30 }}>{view.name}</AppText>
          <AppText variant="caption" tone="muted">
            Age {view.age} · {view.racingBackground}
          </AppText>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <StatusBadge
          label={view.availability}
          tone={view.availability === 'Available' ? 'green' : 'neutral'}
        />
        <StatusBadge label={view.contractReadiness} tone={offer.wouldAccept ? 'green' : 'yellow'} />
        <StatusBadge
          label={`${actionsLeft} moves left`}
          tone={actionsLeft > 0 ? 'yellow' : 'neutral'}
        />
      </View>

      <AppCard style={{ padding: theme.spacing.md }}>
        <ProgressBar
          color={theme.colors.fuel}
          label={`Scouting Knowledge · ${band.label}`}
          max={100}
          value={view.scoutingKnowledge}
        />
        <ProgressBar
          color={theme.colors.victory}
          label={`Apex Interest · ${view.interestLabel}`}
          marker={view.signingThreshold ?? undefined}
          markerLabel={
            view.signingThresholdKnown
              ? `Signing line: ${view.signingThreshold}`
              : 'Signing line revealed at Full Evaluation'
          }
          max={100}
          value={view.interest}
        />
      </AppCard>

      <AppCard style={{ padding: theme.spacing.md }}>
        <SectionHeader
          title="Recruiting Battle"
          subtitle={view.recruitingBattle.competitionSummary}
        />
        {view.recruitingBattle.teams.map((team) => (
          <AppRow
            compact
            key={team.id}
            label={`${team.rank ? `${team.rank}. ` : ''}${team.teamName}`}
            detail={[
              team.interest !== null ? `${team.interest}` : null,
              team.interestRange ? `${team.interestRange[0]}–${team.interestRange[1]}` : null,
              team.weeklyChange && team.weeklyChange > 0 ? `+${team.weeklyChange}` : null,
              team.status !== 'Unknown'
                ? team.status
                : team.isApex
                  ? view.interestLabel
                  : 'Interest unclear',
            ].filter(Boolean).join(' · ')}
          />
        ))}
        {view.recruitingBattle.latestHeadline ? (
          <AppText variant="caption" tone="soft">{view.recruitingBattle.latestHeadline}</AppText>
        ) : null}
      </AppCard>

      {lastAction ? (
        <AppCard style={{ borderColor: theme.colors.victory, padding: theme.spacing.md }}>
          <AppText variant="caption" tone="accent">Last Recruiting Move</AppText>
          <AppText variant="title" style={{ fontSize: 18 }}>{lastAction.actionName}</AppText>
          <AppText variant="caption" tone="muted">
            {[
              lastAction.scoutingGain ? `Scouting Knowledge +${lastAction.scoutingGain}` : null,
              lastAction.interestGain ? `Apex Interest +${lastAction.interestGain}` : null,
              lastAction.engagementGain ? `Prospect Engagement +${lastAction.engagementGain}` : null,
              lastAction.visibilityGain ? `Recruiting Visibility +${lastAction.visibilityGain}` : null,
            ].filter(Boolean).join(' · ')}
          </AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <SectionHeader title="Key Fit" subtitle="The four details that matter most right now" />
        <AppRow label="Overall" detail={valueLabel(view.overall, view.overallRange)} />
        <AppRow label="Potential" detail={valueLabel(view.potential, view.potentialRange)} />
        <AppRow
          label="Archetypes"
          detail={view.archetypes?.join(' / ') ?? 'Revealed at Prospect Profile'}
        />
        <AppRow
          label="Role"
          detail={view.roleExpectation ?? 'Revealed at Full Evaluation'}
        />
      </AppCard>

      <AppCard>
        <SectionHeader
          title="Driver Evaluation"
          subtitle={`${band.label}: Apex only sees information earned through scouting`}
        />
        <AppRow label="Current Series" detail={view.currentSeries ?? 'Not confirmed'} />
        <AppRow label="Salary Outlook" detail={moneyLabel(view.salaryDemand, view.salaryRange)} />
        <AppRow label="Prospect Engagement" detail={`${view.engagement}`} />
        <AppRow label="Competing Teams" detail={view.competingPressure ?? 'Not confirmed'} />
        <AppRow
          label="Preferred Term"
          detail={view.preferredTerm ? `${view.preferredTerm} years` : 'Not confirmed'}
        />
        <AppRow label="Sponsor Backing" detail={view.sponsorInformation ?? 'Not confirmed'} />
        <AppText tone="muted">{view.developmentOutlook}</AppText>
      </AppCard>

      {view.archetypes ? (
        <AppCard>
          <SectionHeader title="Archetype Fit" subtitle="Primary effect and secondary effect stay separate" />
          {view.archetypes.map((archetype, index) => {
            const definition = getArchetypeDefinition(archetype);
            const effect = index === 0 ? definition.primary : definition.secondary;
            const boosts = Object.entries(effect.statBoosts)
              .map(([stat, boost]) => `${stat} +${boost}`)
              .join(', ');
            return (
              <View key={`${archetype}-${index}`} style={{ gap: 2 }}>
                <AppText variant="caption" tone="accent">
                  {index === 0 ? 'Primary' : 'Secondary'}
                </AppText>
                <AppText variant="title" style={{ fontSize: 18 }}>{archetype}</AppText>
                <AppText variant="caption" tone="soft">
                  {boosts || 'Supports scouting and future development without changing base stats.'}
                </AppText>
              </View>
            );
          })}
          <AppRow
            label="Track Fit"
            detail={view.trackStrengths.join(', ') || 'Not confirmed'}
          />
        </AppCard>
      ) : null}

      {Object.keys(view.stats).length > 0 || Object.keys(view.statRanges).length > 0 ? (
        <AppCard>
          <SectionHeader title="Driver Ratings" subtitle="Exact ratings arrive with Full Evaluation" />
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
        <SectionHeader title="Scouting Guide" subtitle="Each band opens a deeper part of the report" />
        {scoutingBands.map((item) => (
          <AppRow
            compact
            key={item.id}
            label={`${item.minimum}–${item.maximum}`}
            detail={item.label}
          />
        ))}
      </AppCard>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader
          title="Recruiting Moves"
          subtitle={`${state.game.recruiting.spendableRp} Recruiting Points · ${actionsLeft} moves left`}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {recruitingActionGroups.map((group) => (
            <Pressable
              accessibilityRole="button"
              key={group}
              onPress={() => setActionGroup(group)}
              style={{
                backgroundColor:
                  actionGroup === group ? theme.colors.fuel : theme.colors.panelStrong,
                borderRadius: 999,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: 7,
              }}>
              <AppText variant="caption">{group}</AppText>
            </Pressable>
          ))}
        </View>
        {recruitingActions
          .filter((action) => recruitingActionCopy[action.id].group === actionGroup)
          .map((action) => {
            const availability = getActionAvailability(state.game, prospectId, action.id);
            const isOffer = action.id === 'contract-offer';
            const expanded = expandedAction === action.id;
            const label = action.contextualName ?? action.canonicalName;
            return (
              <AppCard key={action.id} style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setExpandedAction(expanded ? null : action.id)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="title" style={{ fontSize: 17 }}>{label}</AppText>
                      <AppText variant="caption" tone="soft">
                        {recruitingActionCopy[action.id].purpose}
                      </AppText>
                    </View>
                    <StatusBadge
                      compact
                      label={`${action.rpCost} RP${action.cashCost ? ` + $${action.cashCost.toLocaleString()}` : ''}`}
                      tone="yellow"
                    />
                  </View>
                </Pressable>
                <AppText variant="caption" tone={availability.available ? 'soft' : 'accent'}>
                  {availability.available
                    ? `${availability.usesRemaining} ${availability.usesRemaining === 1 ? 'use' : 'uses'} remaining`
                    : availability.reasons[0]}
                </AppText>
                {expanded ? (
                  <>
                    <AppText variant="caption" tone="muted">
                      {[
                        action.effects.scouting ? `Scouting Knowledge +${action.effects.scouting}` : null,
                        action.effects.interest ? `Apex Interest +${action.effects.interest}` : null,
                        action.effects.engagement ? `Prospect Engagement +${action.effects.engagement}` : null,
                        action.effects.visibility ? `Recruiting Visibility +${action.effects.visibility}` : null,
                      ].filter(Boolean).join(' · ') || 'Prepares the contract path.'}
                    </AppText>
                    {isOffer ? (
                      <Link href={{ pathname: '/recruiting/offer/[id]', params: { id: prospectId } }} asChild>
                        <AppButton label="Review Contract Readiness" variant="secondary" />
                      </Link>
                    ) : (
                      <AppButton
                        label={progress.completedActionUses[action.id] ? 'Use Again' : 'Complete Move'}
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
                  </>
                ) : null}
              </AppCard>
            );
          })}
      </View>

      {progress.offerHistory.length > 0 ? (
        <AppCard>
          <SectionHeader title="Contract History" subtitle="Signed offers are recorded once" />
          {progress.offerHistory.map((history) => (
            <AppRow
              key={history.id}
              label="Signed by Apex"
              detail={`$${history.annualSalary.toLocaleString()} · ${history.termYears} years`}
            />
          ))}
        </AppCard>
      ) : null}
    </Screen>
  );
}
