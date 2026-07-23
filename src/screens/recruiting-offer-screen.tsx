import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { SectionHeader } from '@/components/shared/section-header';
import {
  getActionAvailability,
  getOfferAvailability,
  selectProspectReveal,
} from '@/simulation/recruiting';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';
import type { ContractTermYears } from '@/types/recruiting';

export function RecruitingOfferScreen({ prospectId }: { prospectId: string }) {
  const { state, makeRecruitingOffer } = useGameSession();
  const prospect = state.game.recruiting.prospects.find((item) => item.id === prospectId);
  const progress = state.game.recruiting.campaigns[prospectId];
  const fullyEvaluated = (progress?.scoutingConfidence ?? 0) >= 76;
  const [salaryText, setSalaryText] = useState(() =>
    `${fullyEvaluated ? prospect?.salaryDemand ?? 50_000 : 50_000}`,
  );
  const [termYears, setTermYears] = useState<ContractTermYears>(
    fullyEvaluated ? prospect?.preferredTerm ?? 2 : 2,
  );
  const annualSalary = Number(salaryText.replace(/[^0-9]/g, ''));

  const availability = useMemo(
    () =>
      prospect
        ? getOfferAvailability(state.game, prospectId, annualSalary, termYears)
        : null,
    [annualSalary, prospect, prospectId, state.game, termYears],
  );

  if (!prospect || !progress || !availability) {
    return <Screen><AppText variant="title">Offer sheet unavailable</AppText></Screen>;
  }

  const view = selectProspectReveal(state.game, prospectId);
  const latest = progress.offerHistory.at(-1);
  const cashCharge =
    fullyEvaluated && availability.wouldAccept ? availability.signingBonus : 0;
  const baseAvailability = getActionAvailability(
    state.game,
    prospectId,
    'contract-offer',
  );
  const displayReasons = fullyEvaluated
    ? availability.reasons
    : baseAvailability.reasons;

  return (
    <Screen
      compact
      footer={
        <AppButton
          disabled={!availability.available}
          label={`Submit Offer · 300 RP${cashCharge ? ` + $${cashCharge.toLocaleString()}` : ''}`}
          onPress={() => makeRecruitingOffer(prospectId, annualSalary, termYears)}
        />
      }>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="eyebrow" tone="accent">Development Contract Offer</AppText>
        <AppText variant="hero">{view.name}</AppText>
        <AppText tone="muted">Reserve / Development assignment only. Active cars #45 and #46 remain unchanged.</AppText>
      </View>

      {latest ? (
        <AppCard style={{ borderColor: latest.accepted ? theme.colors.victory : theme.colors.trackRed }}>
          <AppText variant="eyebrow" tone="accent">Offer Result</AppText>
          <AppText variant="title">{latest.accepted ? 'Welcome to Apex' : 'Offer Declined'}</AppText>
          <AppText tone="muted">
            Score {latest.breakdown.total} / {latest.breakdown.threshold} · 300 RP spent · {latest.accepted ? `$${latest.signingBonus.toLocaleString()} signing bonus paid` : 'no cash charged'}
          </AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <SectionHeader title="Offer Terms" subtitle="Annual salary is committed; only the signing bonus is paid now" />
        <AppText variant="caption" tone="soft">Annual Salary</AppText>
        <TextInput
          accessibilityLabel="Annual salary"
          keyboardType="number-pad"
          onChangeText={setSalaryText}
          style={{
            backgroundColor: theme.colors.pitWall,
            borderColor: theme.colors.border,
            borderRadius: 8,
            borderWidth: 1,
            color: theme.colors.text,
            fontSize: 20,
            fontWeight: '800',
            minHeight: 48,
            paddingHorizontal: theme.spacing.md,
          }}
          value={salaryText}
        />
        <AppText variant="caption" tone="soft">Contract Length</AppText>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {([1, 2, 3] as ContractTermYears[]).map((term) => (
            <Pressable
              accessibilityRole="button"
              key={term}
              onPress={() => setTermYears(term)}
              style={{
                alignItems: 'center',
                backgroundColor: termYears === term ? theme.colors.fuel : theme.colors.panelStrong,
                borderRadius: 8,
                flex: 1,
                padding: theme.spacing.md,
              }}>
              <AppText variant="caption">{term} Year{term > 1 ? 's' : ''}</AppText>
            </Pressable>
          ))}
        </View>
        <AppRow label="Role" detail="Reserve / Development" />
        <AppRow label="Known Demand" detail={view.salaryDemand ? `$${view.salaryDemand.toLocaleString()}` : 'Requires full evaluation'} />
      </AppCard>

      <AppCard>
        <SectionHeader title="Commitment Preview" subtitle="Exact-once charges if the offer is submitted" />
        <AppRow label="Recruiting Points" detail={`${state.game.recruiting.spendableRp} → ${Math.max(0, state.game.recruiting.spendableRp - 300)}`} />
        <AppRow label="Signing Bonus" detail={`$${availability.signingBonus.toLocaleString()} if accepted`} />
        <AppRow label="Team Cash" detail={`$${state.game.team.cash.toLocaleString()} → $${(state.game.team.cash - cashCharge).toLocaleString()}`} />
        <AppText variant="caption" tone="soft">A rejected offer spends RP but does not charge cash.</AppText>
      </AppCard>

      {fullyEvaluated ? (
        <AppCard>
          <SectionHeader title="Acceptance Scorecard" subtitle={`Threshold ${availability.breakdown.threshold}; no unmet dealbreakers allowed`} />
          {[
            ['Current Interest', availability.breakdown.interest],
            ['Salary Fit', availability.breakdown.salaryFit],
            ['Term Fit', availability.breakdown.termFit],
            ['Role Fit', availability.breakdown.roleFit],
            ['Distinct Pathways', availability.breakdown.relationshipDepth],
            ['Team Reputation', availability.breakdown.reputationFit],
            ['Recruiting Visibility', availability.breakdown.visibilityFit],
            ['Competing Pressure', availability.breakdown.competingPressure],
          ].map(([label, value]) => (
            <AppRow key={`${label}`} label={`${label}`} detail={`${Number(value) >= 0 ? '+' : ''}${value}`} />
          ))}
          <AppRow label="Projected Score" detail={`${availability.breakdown.total}`} />
          {availability.breakdown.developmentStaffBonus > 0 ? (
            <AppText variant="caption" tone="soft">
              Development-minded Crew Chief adds +{availability.breakdown.developmentStaffBonus} across eligible positive salary, term, and role fit.
            </AppText>
          ) : null}
          {availability.breakdown.unmetDealbreakers.map((reason) => (
            <AppText key={reason} variant="caption" tone="accent">{reason}</AppText>
          ))}
        </AppCard>
      ) : (
        <AppCard>
          <SectionHeader
            title="Scorecard Locked"
            subtitle="Reach 76 scouting confidence before package fit and dealbreakers can be reviewed"
          />
        </AppCard>
      )}

      {!availability.available ? (
        <AppCard style={{ borderColor: theme.colors.trackRed }}>
          <SectionHeader title="Offer Window Closed" subtitle="Clear these items before submitting" />
          {displayReasons.map((reason) => (
            <AppText key={reason} tone="accent">• {reason}</AppText>
          ))}
        </AppCard>
      ) : null}
    </Screen>
  );
}
