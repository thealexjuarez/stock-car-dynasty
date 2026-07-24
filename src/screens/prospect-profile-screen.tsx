import { Link } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { getArchetypeDefinition } from '@/data/archetype-config';
import {
  getRecruitingActionUsageTags,
  scoutingBands,
} from '@/data/recruiting-config';
import {
  recruitingActionCopy,
  recruitingActionGroups,
  type RecruitingActionGroup,
} from '@/data/recruiting-copy';
import {
  DEFAULT_COMPACT_ACTION_COUNT,
  getOrderedRecruitingActions,
  getRecruitingActionRowState,
  RECRUITING_ACTION_ROW_HEIGHT,
  toggleExpandedRecruitingAction,
} from '@/presentation/recruiting-actions';
import {
  getActionAvailability,
  getOfferAvailability,
  getRecommendedRecruitingAction,
  getRecruitingRiskWarning,
  getScoutingBand,
  previewRecruitingActionEffects,
  selectProspectReveal,
  type CalculatedEffects,
} from '@/simulation/recruiting';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';
import type { RecruitingActionDefinition, RecruitingActionId } from '@/types/recruiting';

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
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
}

function CompactMeter({
  color,
  label,
  markerLabel,
  value,
}: {
  color: string;
  label: string;
  markerLabel: string;
  value: number;
}) {
  return (
    <View style={{ flex: 1, gap: 5, minWidth: 132 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
        <AppText variant="caption" style={{ fontSize: 11 }}>{label}</AppText>
        <AppText
          variant="caption"
          tone="soft"
          style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
          {value}
        </AppText>
      </View>
      <View style={{ backgroundColor: theme.colors.panel, borderRadius: 999, height: 7 }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: 999,
            height: '100%',
            width: `${Math.max(0, Math.min(100, value))}%`,
          }}
        />
      </View>
      <AppText variant="caption" tone="soft" style={{ fontSize: 10, lineHeight: 13 }}>
        {markerLabel}
      </AppText>
    </View>
  );
}

function Disclosure({
  children,
  subtitle,
  title,
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <AppCard style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={{ paddingHorizontal: theme.spacing.md, paddingVertical: 11 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="title" style={{ fontSize: 16 }}>{title}</AppText>
            <AppText variant="caption" tone="soft" style={{ fontSize: 11 }}>
              {subtitle}
            </AppText>
          </View>
          <AppText variant="title" tone="accent">{open ? '−' : '+'}</AppText>
        </View>
      </Pressable>
      {open ? (
        <View
          style={{
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            gap: theme.spacing.sm,
            padding: theme.spacing.md,
          }}>
          {children}
        </View>
      ) : null}
    </AppCard>
  );
}

function effectLabel(effects: CalculatedEffects) {
  if (effects.scouting) return `+${effects.scouting} Scouting`;
  if (effects.interest) return `+${effects.interest} Interest`;
  if (effects.engagement) return `+${effects.engagement} Engagement`;
  if (effects.visibility) return `+${effects.visibility} Visibility`;
  return 'Review terms';
}

function effectDetails(effects: CalculatedEffects) {
  return [
    effects.scouting ? `Scouting Knowledge +${effects.scouting}` : null,
    effects.interest ? `Apex Interest +${effects.interest}` : null,
    effects.engagement ? `Prospect Engagement +${effects.engagement}` : null,
    effects.visibility ? `Recruiting Visibility +${effects.visibility}` : null,
  ].filter(Boolean).join(' · ') || 'Prepares the contract path.';
}

function actionMarker(action: RecruitingActionDefinition) {
  const group = recruitingActionCopy[action.id].group;
  if (group === 'Scout') return 'S';
  if (group === 'Recruit') return 'R';
  if (group === 'Relationship') return 'P';
  return 'O';
}

export function ProspectProfileScreen({ prospectId }: { prospectId: string }) {
  const { state, completeRecruitingAction } = useGameSession();
  const [actionGroup, setActionGroup] = useState<RecruitingActionGroup>('All');
  const [expandedAction, setExpandedAction] = useState<RecruitingActionId | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const actionPanelY = useRef(0);
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
  const riskWarning = getRecruitingRiskWarning(state.game, prospectId);
  const actionsLeft = Math.max(0, 3 - progress.weeklyActionCount);
  const lostTeam = progress.signedByTeamId
    ? state.game.raceField.organizations.find((team) => team.id === progress.signedByTeamId)
    : undefined;
  const orderedActions = getOrderedRecruitingActions(
    state.game,
    prospectId,
    actionGroup,
    recommended?.id,
  );
  const visibleActions =
    actionGroup === 'All' && !showAllActions
      ? orderedActions.slice(0, DEFAULT_COMPACT_ACTION_COUNT)
      : orderedActions;
  const topRivals = view.recruitingBattle.teams
    .filter((team) => !team.isApex)
    .slice(0, 2);

  const footer = offer.wouldAccept ? (
    <Link href={{ pathname: '/recruiting/offer/[id]', params: { id: prospectId } }} asChild>
      <AppButton label="Review Signing Offer · 300 RP" />
    </Link>
  ) : undefined;

  const focusRecommendedAction = () => {
    if (!recommended) return;
    setActionGroup('All');
    setShowAllActions(true);
    setExpandedAction(recommended.id);
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(0, actionPanelY.current - theme.spacing.sm),
      });
    }, 0);
  };

  const captureActionPanelPosition = (event: LayoutChangeEvent) => {
    actionPanelY.current = event.nativeEvent.layout.y;
  };

  return (
    <Screen compact contentRef={scrollRef} footer={footer}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
        <View
          accessibilityLabel={`${view.name} portrait placeholder`}
          style={{
            alignItems: 'center',
            backgroundColor: theme.colors.panelStrong,
            borderRadius: 999,
            height: 52,
            justifyContent: 'center',
            width: 52,
          }}>
          <AppText variant="title" tone="accent">{initials(view.name)}</AppText>
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <AppText variant="eyebrow" tone="accent">Recruiting Report</AppText>
          <AppText variant="hero" style={{ fontSize: 25, lineHeight: 29 }}>{view.name}</AppText>
          <AppText variant="caption" tone="muted" style={{ fontSize: 11 }}>
            Age {view.age} · {view.racingBackground}
          </AppText>
        </View>
        <StatusBadge
          compact
          label={view.availability}
          tone={view.availability === 'Available' ? 'green' : 'neutral'}
        />
      </View>

      <AppCard style={{ gap: 10, padding: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
          <CompactMeter
            color={theme.colors.fuel}
            label="Scouting Knowledge"
            markerLabel={`${band.label} · next report at ${
              scoutingBands.find((item) => item.minimum > view.scoutingKnowledge)?.minimum ?? 100
            }`}
            value={view.scoutingKnowledge}
          />
          <CompactMeter
            color={theme.colors.victory}
            label="Apex Interest"
            markerLabel={
              view.signingThresholdKnown
                ? `Signing line ${view.signingThreshold}`
                : 'Signing line unknown'
            }
            value={view.interest}
          />
        </View>
        <View
          style={{
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            flexDirection: 'row',
            gap: theme.spacing.sm,
            paddingTop: 9,
          }}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" tone="soft" style={{ fontSize: 10 }}>RECRUITING RANK</AppText>
            <AppText variant="title" style={{ fontSize: 16 }}>
              P{view.recruitingBattle.apexRank} of {progress.rivals.length + 1}
            </AppText>
          </View>
          <View style={{ flex: 2 }}>
            <AppText variant="caption" tone="soft" style={{ fontSize: 10 }}>TOP RIVALS</AppText>
            <AppText variant="caption" style={{ fontSize: 12 }}>
              {topRivals.length
                ? topRivals.map((team) => team.teamName).join(' · ')
                : 'No outside pressure'}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="caption" tone="soft" style={{ fontSize: 10 }}>MOVES</AppText>
            <AppText variant="title" style={{ fontSize: 16 }}>{actionsLeft}</AppText>
          </View>
        </View>
      </AppCard>

      {riskWarning ? (
        <AppCard style={{ borderColor: theme.colors.caution, gap: 2, padding: 10 }}>
          <AppText variant="caption" tone="accent">Recruiting Battle Warning</AppText>
          <AppText variant="caption" style={{ fontSize: 12 }}>
            {riskWarning.message}
          </AppText>
        </AppCard>
      ) : null}

      {recommended ? (
        <Pressable
          accessibilityRole="button"
          onPress={focusRecommendedAction}
          style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
          <AppCard
            style={{
              borderColor: theme.colors.fuel,
              gap: 2,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: 9,
            }}>
            <AppText variant="caption" tone="accent">Best Next Move</AppText>
            <AppText variant="title" style={{ fontSize: 16 }}>
              {recommended.contextualName ?? recommended.canonicalName}
              {' · '}
              {recommended.id === 'film-review'
                ? 'reveals more of his ability'
                : recommended.id === 'contract-offer'
                  ? 'he is ready to sign'
                  : riskWarning
                    ? 'Apex is losing ground'
                    : recruitingActionCopy[recommended.id].purpose}
            </AppText>
          </AppCard>
        </Pressable>
      ) : null}

      <View onLayout={captureActionPanelPosition} style={{ gap: theme.spacing.sm }}>
        <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText variant="title" style={{ fontSize: 20 }}>Recruiting Moves</AppText>
            <AppText variant="caption" tone="soft">
              {state.game.recruiting.spendableRp} RP · {actionsLeft} moves left
            </AppText>
          </View>
          <StatusBadge compact label={`${visibleActions.length} shown`} tone="neutral" />
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={{ gap: 4 }}
          showsHorizontalScrollIndicator={false}>
          {recruitingActionGroups.map((group) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: actionGroup === group }}
              key={group}
              onPress={() => {
                setActionGroup(group);
                if (group !== 'All') setShowAllActions(true);
              }}
              style={{
                backgroundColor:
                  actionGroup === group ? theme.colors.fuel : theme.colors.panelStrong,
                borderRadius: 999,
                minWidth: 52,
                paddingHorizontal: 10,
                paddingVertical: 7,
              }}>
              <AppText variant="caption" style={{ textAlign: 'center' }}>{group}</AppText>
            </Pressable>
          ))}
        </ScrollView>

        <AppCard style={{ gap: 0, overflow: 'hidden', padding: 0 }}>
          {visibleActions.map((action, index) => {
            const availability = getActionAvailability(state.game, prospectId, action.id);
            const expanded = expandedAction === action.id;
            const rowState = getRecruitingActionRowState(availability, expanded);
            const preview = previewRecruitingActionEffects(
              state.game,
              prospectId,
              action.id,
              state.weekend.raceId,
            );
            const isOffer = action.id === 'contract-offer';
            const label = action.contextualName ?? action.canonicalName;
            const dimmed = !availability.available && !expanded;
            const usageTags = getRecruitingActionUsageTags(action);
            const staffVoice =
              action.staffGroup === 'development'
                ? 'Ray Hollis can strengthen the eligible action effect.'
                : action.staffGroup === 'social'
                  ? 'Ava Larkin can strengthen the eligible social effect.'
                  : 'No staff bonus applies to this action.';
            return (
              <View
                key={action.id}
                style={{
                  borderTopColor: index === 0 ? 'transparent' : theme.colors.border,
                  borderTopWidth: index === 0 ? 0 : 1,
                }}>
                <Pressable
                  accessibilityLabel={`${label}, ${rowState}${
                    availability.primaryReason ? `, ${availability.primaryReason}` : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() =>
                    setExpandedAction((current) =>
                      toggleExpandedRecruitingAction(current, action.id),
                    )
                  }
                  style={{
                    backgroundColor: expanded ? theme.colors.panelStrong : 'transparent',
                    borderLeftColor: expanded ? theme.colors.fuel : 'transparent',
                    borderLeftWidth: 3,
                    minHeight: RECRUITING_ACTION_ROW_HEIGHT,
                    opacity: dimmed ? 0.62 : 1,
                    paddingHorizontal: 9,
                    paddingVertical: 7,
                  }}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
                    <View
                      style={{
                        alignItems: 'center',
                        backgroundColor: expanded ? theme.colors.fuel : theme.colors.panel,
                        borderRadius: 7,
                        height: 28,
                        justifyContent: 'center',
                        width: 28,
                      }}>
                      <AppText variant="caption">{actionMarker(action)}</AppText>
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5 }}>
                        <AppText
                          numberOfLines={1}
                          variant="title"
                          style={{ flex: 1, fontSize: 14, lineHeight: 17 }}>
                          {label}
                        </AppText>
                        {recommended?.id === action.id ? (
                          <AppText variant="caption" tone="accent" style={{ fontSize: 9 }}>
                            BEST
                          </AppText>
                        ) : null}
                      </View>
                      <AppText
                        numberOfLines={1}
                        variant="caption"
                        tone={availability.available ? 'soft' : 'muted'}
                        style={{ fontSize: 11, lineHeight: 14 }}>
                        {availability.available
                          ? `${effectLabel(preview)} · ${rowState}`
                          : availability.primaryReason}
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end', minWidth: 54 }}>
                      <AppText
                        variant="caption"
                        tone={rowState === 'Insufficient RP' ? 'muted' : 'accent'}
                        style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
                        {action.rpCost} RP
                      </AppText>
                      {action.cashCost ? (
                        <AppText variant="caption" tone="soft" style={{ fontSize: 9 }}>
                          +${action.cashCost.toLocaleString()}
                        </AppText>
                      ) : null}
                    </View>
                  </View>
                </Pressable>

                {expanded ? (
                  <View
                    style={{
                      backgroundColor: theme.colors.panel,
                      gap: 8,
                      padding: theme.spacing.md,
                    }}>
                    <AppText variant="caption" style={{ fontSize: 12 }}>
                      {action.id === 'film-review'
                        ? action.revealBehavior
                        : recruitingActionCopy[action.id].purpose}
                    </AppText>
                    <AppRow
                      compact
                      detail={effectDetails(preview)}
                      detailTone="muted"
                      label="Exact effect"
                    />
                    <AppRow
                      compact
                      detailTone="muted"
                      label="Use rules"
                      detail={[
                        ...usageTags,
                        action.maximumLifetimeUses === null
                          ? 'Unlimited lifetime uses'
                          : `${action.maximumLifetimeUses} lifetime ${
                              action.maximumLifetimeUses === 1 ? 'use' : 'uses'
                            }`,
                      ].join(' · ')}
                    />
                    {preview.reasons.map((reason) => (
                      <AppText key={reason} variant="caption" tone="muted" style={{ fontSize: 11 }}>
                        • {reason}
                      </AppText>
                    ))}
                    <AppText variant="caption" tone="muted" style={{ fontSize: 11 }}>
                      {staffVoice}
                    </AppText>
                    {availability.blockers.length > 0 ? (
                      <View style={{ gap: 3 }}>
                        <AppText variant="caption" tone="accent">Requirements</AppText>
                        {availability.blockers.map((blocker) => (
                          <AppText
                            key={`${blocker.code}:${blocker.detail}`}
                            variant="caption"
                            tone="muted"
                            style={{ fontSize: 11 }}>
                            • {blocker.detail}
                          </AppText>
                        ))}
                      </View>
                    ) : (
                      <AppText variant="caption" tone="muted" style={{ fontSize: 11 }}>
                        All requirements met.
                      </AppText>
                    )}
                    {isOffer ? (
                      <Link
                        href={{ pathname: '/recruiting/offer/[id]', params: { id: prospectId } }}
                        asChild>
                        <AppButton label="Review Contract Readiness" variant="secondary" />
                      </Link>
                    ) : (
                      <AppButton
                        label={`Confirm ${label} · ${action.rpCost} RP`}
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
                  </View>
                ) : null}
              </View>
            );
          })}
        </AppCard>

        {actionGroup === 'All' ? (
          <AppButton
            label={
              showAllActions
                ? 'Show Recommended Moves'
                : `Show All Recruiting Actions (${orderedActions.length})`
            }
            onPress={() => {
              setShowAllActions((value) => !value);
              if (showAllActions) setExpandedAction(null);
            }}
            variant="secondary"
          />
        ) : null}
      </View>

      <Disclosure
        title="Full Evaluation"
        subtitle={`${band.label} · detailed fit, ratings, and scouting bands`}>
        <AppRow label="Overall" detail={valueLabel(view.overall, view.overallRange)} />
        <AppRow label="Potential" detail={valueLabel(view.potential, view.potentialRange)} />
        <AppRow
          label="Archetypes"
          detail={view.archetypes?.join(' / ') ?? 'Revealed at Prospect Profile'}
        />
        <AppRow label="Role" detail={view.roleExpectation ?? 'Revealed at Full Evaluation'} />
        <AppRow label="Current Series" detail={view.currentSeries ?? 'Not confirmed'} />
        <AppRow label="Salary Outlook" detail={moneyLabel(view.salaryDemand, view.salaryRange)} />
        <AppRow label="Prospect Engagement" detail={`${view.engagement}`} />
        <AppRow label="Sponsor Backing" detail={view.sponsorInformation ?? 'Not confirmed'} />
        {view.archetypes?.map((archetype, index) => {
          const definition = getArchetypeDefinition(archetype);
          const effect = index === 0 ? definition.primary : definition.secondary;
          const boosts = Object.entries(effect.statBoosts)
            .map(([stat, boost]) => `${stat} +${boost}`)
            .join(', ');
          return (
            <AppRow
              key={`${archetype}-${index}`}
              label={`${index === 0 ? 'Primary' : 'Secondary'} · ${archetype}`}
              detail={boosts || 'Scouting and future development effect'}
            />
          );
        })}
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
        {scoutingBands.map((item) => (
          <AppRow
            compact
            key={item.id}
            label={`${item.minimum}–${item.maximum}`}
            detail={item.label}
          />
        ))}
      </Disclosure>

      <Disclosure
        title="Complete Rival Details"
        subtitle={view.recruitingBattle.competitionSummary}>
        {view.recruitingBattle.teams.map((team) => (
          <AppRow
            compact
            key={team.id}
            label={`${team.rank ? `${team.rank}. ` : ''}${team.teamName}`}
            detail={[
              team.interest !== null ? `${team.interest}` : null,
              team.interestRange ? `${team.interestRange[0]}–${team.interestRange[1]}` : null,
              team.weeklyChange && team.weeklyChange > 0 ? `+${team.weeklyChange}` : null,
              team.status,
            ].filter(Boolean).join(' · ')}
          />
        ))}
        {view.recruitingBattle.latestHeadline ? (
          <AppText variant="caption" tone="soft">{view.recruitingBattle.latestHeadline}</AppText>
        ) : null}
      </Disclosure>

      <Disclosure
        title="Contract Requirements"
        subtitle={offer.wouldAccept ? 'Clear to offer' : offer.reasons[0] ?? 'Requirements remain'}>
        {offer.reasons.length > 0 ? (
          offer.reasons.map((reason) => (
            <AppText key={reason} variant="caption" tone="muted">• {reason}</AppText>
          ))
        ) : (
          <AppText variant="caption" tone="soft">
            Every visible requirement is satisfied. A valid offer signs the driver immediately.
          </AppText>
        )}
        <Link href={{ pathname: '/recruiting/offer/[id]', params: { id: prospectId } }} asChild>
          <AppButton label="Review Contract Readiness" variant="secondary" />
        </Link>
      </Disclosure>

      <Disclosure
        title="Historical Weekly Movement"
        subtitle="Recent recruiting moves and rival momentum">
        {progress.actionHistory.slice(-5).reverse().map((entry) => (
          <AppRow
            compact
            key={entry.id}
            label={entry.actionName}
            detail={[
              entry.scoutingGain ? `Scouting +${entry.scoutingGain}` : null,
              entry.interestGain ? `Interest +${entry.interestGain}` : null,
              `${entry.rpCost} RP`,
            ].filter(Boolean).join(' · ')}
          />
        ))}
        {progress.battleHistory.slice(-4).reverse().map((entry) => (
          <View key={entry.id} style={{ gap: 2 }}>
            <AppText variant="caption">{entry.headline}</AppText>
            <AppText variant="caption" tone="soft" style={{ fontSize: 10 }}>
              {entry.details.join(' · ')}
            </AppText>
          </View>
        ))}
        {progress.actionHistory.length === 0 && progress.battleHistory.length === 0 ? (
          <AppText variant="caption" tone="soft">No weekly movement recorded yet.</AppText>
        ) : null}
      </Disclosure>

      {progress.signed ? (
        <AppButton label="Signed to Apex Development Roster" disabled />
      ) : progress.signedByTeamId ? (
        <AppButton label={`Signed by ${lostTeam?.name ?? 'Another Team'}`} disabled />
      ) : null}
    </Screen>
  );
}
