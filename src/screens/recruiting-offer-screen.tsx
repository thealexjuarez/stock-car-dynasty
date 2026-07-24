import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Screen } from '@/components/shared/screen';
import { SectionHeader } from '@/components/shared/section-header';
import { StatusBadge } from '@/components/shared/status-badge';
import {
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
  const fullyEvaluated = (progress?.scoutingKnowledge ?? 0) >= 76;
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
  const cashAfter = state.game.team.cash - availability.signingBonus;

  return (
    <Screen
      compact
      footer={
        <AppButton
          disabled={!availability.available}
          label={
            availability.available
              ? `Sign ${prospect.name} · 300 RP + $${availability.signingBonus.toLocaleString()}`
              : availability.breakdown.status
          }
          onPress={() => makeRecruitingOffer(prospectId, annualSalary, termYears)}
        />
      }>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="eyebrow" tone="accent">Development Contract</AppText>
        <AppText variant="hero">{view.name}</AppText>
        <AppText tone="muted">
          A valid offer signs the driver immediately. Apex spends nothing until every requirement passes.
        </AppText>
      </View>

      <AppCard style={{ borderColor: availability.available ? theme.colors.victory : theme.colors.caution }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="eyebrow" tone="accent">Contract Readiness</AppText>
            <AppText variant="title">{availability.breakdown.status}</AppText>
          </View>
          <StatusBadge
            label={availability.available ? 'Clear to Sign' : 'Not Ready'}
            tone={availability.available ? 'green' : 'yellow'}
          />
        </View>
        <ProgressBar
          color={theme.colors.victory}
          label={`Apex Interest · ${view.interestLabel}`}
          marker={view.signingThreshold ?? undefined}
          markerLabel={
            view.signingThresholdKnown
              ? `Signing line: ${view.signingThreshold}`
              : 'Complete the Full Evaluation to reveal the signing line'
          }
          max={100}
          value={view.interest}
        />
      </AppCard>

      {latest ? (
        <AppCard style={{ borderColor: theme.colors.victory }}>
          <AppText variant="eyebrow" tone="accent">Signed</AppText>
          <AppText variant="title">Welcome to Apex</AppText>
          <AppText tone="muted">
            ${latest.annualSalary.toLocaleString()} for {latest.termYears} years · ${latest.signingBonus.toLocaleString()} signing bonus paid once
          </AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <SectionHeader
          title="Offer Terms"
          subtitle="Annual salary is committed; the signing bonus is paid now"
        />
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
                backgroundColor:
                  termYears === term ? theme.colors.fuel : theme.colors.panelStrong,
                borderRadius: 8,
                flex: 1,
                padding: theme.spacing.md,
              }}>
              <AppText variant="caption">{term} Year{term > 1 ? 's' : ''}</AppText>
            </Pressable>
          ))}
        </View>
        <AppRow label="Role" detail="Reserve / Development" />
        <AppRow
          label="Known Salary Demand"
          detail={
            view.salaryDemand
              ? `$${view.salaryDemand.toLocaleString()}`
              : 'Revealed at Full Evaluation'
          }
        />
      </AppCard>

      <AppCard>
        <SectionHeader
          title="Signing Checklist"
          subtitle="Every line must pass before Apex can submit"
        />
        {availability.breakdown.requirements.map((requirement) => (
          <View key={requirement.id} style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
              <AppText style={{ flex: 1 }}>{requirement.label}</AppText>
              <AppText tone={requirement.met ? 'accent' : 'muted'}>
                {requirement.met ? 'Ready' : 'Needs Work'}
              </AppText>
            </View>
            <AppText variant="caption" tone="soft">{requirement.detail}</AppText>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <SectionHeader title="Cost Preview" subtitle="These charges post once with the signed contract" />
        <AppRow
          label="Recruiting Points"
          detail={`${state.game.recruiting.spendableRp} → ${Math.max(0, state.game.recruiting.spendableRp - 300)}`}
        />
        <AppRow
          label="Signing Bonus"
          detail={`$${availability.signingBonus.toLocaleString()}`}
        />
        <AppRow
          label="Team Cash"
          detail={`$${state.game.team.cash.toLocaleString()} → $${Math.max(0, cashAfter).toLocaleString()}`}
        />
        <AppText variant="caption" tone="soft">
          A blocked offer cannot be submitted and spends no Recruiting Points or cash.
        </AppText>
      </AppCard>
    </Screen>
  );
}
