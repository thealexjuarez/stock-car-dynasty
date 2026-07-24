import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  HOME_ENTRY_ROW_HEIGHT,
  selectHomeDashboard,
  type DashboardTone,
  type HomeActionItem,
  type HomeEntrySummary,
} from '@/presentation/home-dashboard';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function compactCurrency(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1).replace('.0', '')}m`;
  }
  if (absolute >= 1_000) {
    return `$${(value / 1_000).toFixed(1).replace('.0', '')}k`;
  }
  return currency.format(value);
}

function toneColor(tone: DashboardTone) {
  return {
    red: theme.colors.trackRed,
    yellow: theme.colors.caution,
    green: theme.colors.victory,
    blue: theme.colors.fuel,
    neutral: theme.colors.line,
  }[tone];
}

function readinessTone(readiness: HomeEntrySummary['readiness']): DashboardTone {
  if (readiness === 'Ready') return 'green';
  if (readiness === 'At Risk') return 'yellow';
  return 'red';
}

function ResourceValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={{ flex: 1, gap: 1, minWidth: 76 }}>
      <AppText variant="caption" tone="soft" style={{ fontSize: 10 }}>
        {label}
      </AppText>
      <AppText
        variant="title"
        numberOfLines={1}
        style={{ fontSize: 16, fontVariant: ['tabular-nums'], lineHeight: 19 }}>
        {value}
      </AppText>
    </View>
  );
}

function EntryRow({ entry }: { entry: HomeEntrySummary }) {
  const color = toneColor(readinessTone(entry.readiness));
  return (
    <Link href={entry.href} asChild>
      <Pressable
        accessibilityLabel={`Car #${entry.carNumber}, ${entry.driverName}, OVR ${entry.overall}, P${entry.standingPosition} standings, ${entry.readiness}, ${entry.condition}% condition`}
        accessibilityRole="link"
        style={{
          backgroundColor: 'transparent',
          borderLeftColor: color,
          borderLeftWidth: 3,
          minHeight: HOME_ENTRY_ROW_HEIGHT,
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.md,
        }}>
        <View style={{ gap: 5 }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
            <AppText
              variant="title"
              numberOfLines={1}
              style={{ flex: 1, fontSize: 15, lineHeight: 18 }}>
              #{entry.carNumber} {entry.driverName}
            </AppText>
            <AppText variant="caption" tone="soft" style={{ fontSize: 11 }}>
              OVR {entry.overall}
            </AppText>
            <AppText variant="caption" style={{ fontSize: 11 }}>
              P{entry.standingPosition}
            </AppText>
          </View>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
            <AppText
              variant="caption"
              style={{ color, flex: 1, fontSize: 11 }}
              numberOfLines={1}>
              {entry.warning ?? entry.readiness}
            </AppText>
            <AppText
              variant="caption"
              tone="soft"
              style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}>
              {entry.readiness} · Condition {entry.condition}%
            </AppText>
          </View>
          <View
            style={{
              backgroundColor: theme.colors.panel,
              borderRadius: 999,
              height: 4,
              overflow: 'hidden',
            }}>
            <View
              style={{
                backgroundColor: color,
                height: '100%',
                width: `${entry.condition}%`,
              }}
            />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function CompactLinkCard({
  children,
  href,
  label,
}: {
  children: ReactNode;
  href: Href;
  label: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="link"
        style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
        <AppCard style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
          {children}
        </AppCard>
      </Pressable>
    </Link>
  );
}

function ActionRow({ action }: { action: HomeActionItem }) {
  const color = toneColor(action.tone);
  return (
    <Link href={action.href} asChild>
      <Pressable
        accessibilityLabel={`${action.title}. ${action.consequence}`}
        accessibilityRole="link"
        style={{
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderLeftColor: color,
          borderLeftWidth: 3,
          flexDirection: 'row',
          gap: theme.spacing.sm,
          minHeight: 54,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        }}>
        <View style={{ backgroundColor: color, borderRadius: 999, height: 8, width: 8 }} />
        <View style={{ flex: 1, gap: 1 }}>
          <AppText variant="title" numberOfLines={1} style={{ fontSize: 14, lineHeight: 17 }}>
            {action.title}
          </AppText>
          <AppText variant="caption" tone="soft" numberOfLines={1} style={{ fontSize: 11 }}>
            {action.consequence}
          </AppText>
        </View>
        <AppText tone="soft" style={{ fontSize: 22 }}>›</AppText>
      </Pressable>
    </Link>
  );
}

export function HomeScreen() {
  const { state } = useGameSession();
  const dashboard = selectHomeDashboard(state);
  const urgentLabel =
    dashboard.warningCount === 0
      ? 'No urgent warnings'
      : `${dashboard.warningCount} urgent ${
          dashboard.warningCount === 1 ? 'warning' : 'warnings'
        }`;

  return (
    <Screen compact>
      <AppCard
        accessibilityLabel="Apex dashboard header"
        style={{
          backgroundColor: theme.colors.pitWall,
          borderColor: theme.colors.fuel,
          gap: 8,
          padding: theme.spacing.md,
        }}>
        <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, gap: 1 }}>
            <AppText variant="eyebrow" tone="accent">{dashboard.seriesLabel}</AppText>
            <AppText variant="hero" numberOfLines={1} style={{ fontSize: 24, lineHeight: 27 }}>
              {dashboard.teamName}
            </AppText>
            <AppText variant="caption" tone="muted" style={{ fontSize: 11 }}>
              Week {dashboard.week} · {dashboard.currentDate}
            </AppText>
          </View>
          <StatusBadge
            compact
            label={dashboard.warningCount === 0 ? 'All Clear' : `${dashboard.warningCount} Alerts`}
            tone={dashboard.warningCount === 0 ? 'green' : 'red'}
          />
        </View>
        <View
          style={{
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            flexDirection: 'row',
            gap: theme.spacing.md,
            paddingTop: 8,
          }}>
          <ResourceValue label="CASH" value={compactCurrency(dashboard.cash)} />
          <ResourceValue label="RP" value={`${dashboard.rp}`} />
          <ResourceValue label="EXP" value={`${dashboard.exp}`} />
        </View>
      </AppCard>

      <AppCard
        accessibilityLabel="Apex driver and vehicle status"
        style={{ gap: 0, overflow: 'hidden', padding: 0 }}>
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
            minHeight: 34,
            paddingHorizontal: theme.spacing.md,
          }}>
          <AppText variant="eyebrow" tone="accent">Apex Entries</AppText>
          <AppText variant="caption" tone={dashboard.warningCount ? 'muted' : 'soft'} style={{ fontSize: 10 }}>
            {urgentLabel}
          </AppText>
        </View>
        {dashboard.entries.map((entry, index) => (
          <View
            key={entry.driverId}
            style={{
              borderTopColor: theme.colors.border,
              borderTopWidth: index === 0 ? 1 : 1,
            }}>
            <EntryRow entry={entry} />
          </View>
        ))}
      </AppCard>

      <AppCard
        accessibilityLabel="Next race and primary action"
        style={{
          borderColor: dashboard.race.bothCarsEligible
            ? theme.colors.victory
            : theme.colors.trackRed,
          gap: 7,
          padding: theme.spacing.md,
        }}>
        <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, gap: 1 }}>
            <AppText variant="eyebrow" tone="accent">Next Race</AppText>
            <AppText variant="title" numberOfLines={1} style={{ fontSize: 18, lineHeight: 21 }}>
              {dashboard.race.name}
            </AppText>
            <AppText variant="caption" tone="muted" style={{ fontSize: 11 }}>
              {dashboard.race.trackName} · {dashboard.race.trackType} · Week {dashboard.race.week}
            </AppText>
          </View>
          <StatusBadge
            compact
            label={`Race ${dashboard.race.round}/${dashboard.race.totalRounds}`}
            tone="blue"
          />
        </View>
        <AppText
          variant="caption"
          style={{
            color: dashboard.race.bothCarsEligible
              ? theme.colors.victory
              : theme.colors.trackRed,
            fontSize: 12,
          }}>
          {dashboard.race.eligibilityLabel} · {dashboard.race.readinessRequirement}% required
        </AppText>
        <Link href={dashboard.race.primaryAction.href} asChild>
          <AppButton
            label={dashboard.race.primaryAction.label}
            style={{ alignSelf: 'stretch' }}
          />
        </Link>
      </AppCard>

      <View style={{ gap: theme.spacing.sm }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title" style={{ fontSize: 18 }}>Action Center</AppText>
          <StatusBadge
            compact
            label={dashboard.actionCenter.items.length ? `${dashboard.actionCenter.items.length} Open` : 'All Clear'}
            tone={dashboard.actionCenter.items.length ? 'yellow' : 'green'}
          />
        </View>
        <AppCard style={{ gap: 0, overflow: 'hidden', padding: 0 }}>
          {dashboard.actionCenter.items.length ? (
            dashboard.actionCenter.items.map((action, index) => (
              <View
                key={action.id}
                style={{
                  borderTopColor: theme.colors.border,
                  borderTopWidth: index === 0 ? 0 : 1,
                }}>
                <ActionRow action={action} />
              </View>
            ))
          ) : (
            <View style={{ minHeight: 54, justifyContent: 'center', paddingHorizontal: theme.spacing.md }}>
              <AppText variant="title" style={{ color: theme.colors.victory, fontSize: 14 }}>
                No urgent actions
              </AppText>
              <AppText variant="caption" tone="soft" style={{ fontSize: 11 }}>
                The garage is clear and the next decision is the race weekend.
              </AppText>
            </View>
          )}
          {dashboard.actionCenter.hiddenCount > 0 ? (
            <AppText
              variant="caption"
              tone="soft"
              style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm }}>
              View {dashboard.actionCenter.hiddenCount} more in the relevant team screens
            </AppText>
          ) : null}
        </AppCard>
      </View>

      {dashboard.recruiting ? (
        <CompactLinkCard
          href={dashboard.recruiting.href}
          label={`Recruiting summary for ${dashboard.recruiting.prospectName}`}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <AppText variant="eyebrow" tone="accent">Recruiting Snapshot</AppText>
              <AppText variant="title" style={{ fontSize: 16, lineHeight: 19 }}>
                {dashboard.recruiting.prospectName} · P{dashboard.recruiting.apexRank} of {dashboard.recruiting.fieldSize}
              </AppText>
            </View>
            <AppText tone="soft" style={{ fontSize: 22 }}>›</AppText>
          </View>
          <AppText
            variant="caption"
            style={{
              color: dashboard.recruiting.riskMessage
                ? theme.colors.caution
                : theme.colors.textMuted,
              fontSize: 11,
            }}>
            {dashboard.recruiting.battleSummary} · {dashboard.recruiting.actionsRemaining} actions left · {dashboard.recruiting.rpRemaining} RP
          </AppText>
          <AppText variant="caption" tone="soft" numberOfLines={1} style={{ fontSize: 11 }}>
            Best move: {dashboard.recruiting.recommendedAction}
          </AppText>
        </CompactLinkCard>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <View style={{ flexBasis: 160, flexGrow: 1 }}>
          <CompactLinkCard href={dashboard.standings.href} label="Open league standings">
            <AppText variant="eyebrow" tone="accent">Standings</AppText>
            {dashboard.standings.apex.map((standing) => (
              <View
                key={standing.driverId}
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="caption" style={{ fontSize: 11 }}>
                  #{standing.carNumber} {standing.driverName.split(' ')[0]}
                </AppText>
                <AppText variant="caption" tone="soft" style={{ fontSize: 11 }}>
                  P{standing.position}
                </AppText>
              </View>
            ))}
            <AppText variant="caption" tone="soft" numberOfLines={1} style={{ fontSize: 10 }}>
              Leader: #{dashboard.standings.leader.carNumber} {dashboard.standings.leader.driverName}
            </AppText>
          </CompactLinkCard>
        </View>
        <View style={{ flexBasis: 160, flexGrow: 1 }}>
          <CompactLinkCard href={dashboard.finances.href} label="Open team finances">
            <AppText variant="eyebrow" tone="accent">Weekend Outlook</AppText>
            <AppText variant="caption" style={{ fontSize: 11 }}>
              Sponsor payment {compactCurrency(dashboard.finances.sponsorIncome)}
            </AppText>
            <AppText variant="caption" tone="soft" style={{ fontSize: 11 }}>
              Shop quotes {compactCurrency(dashboard.finances.knownRepairEstimate)}
            </AppText>
          </CompactLinkCard>
        </View>
      </View>
    </Screen>
  );
}
