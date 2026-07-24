import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { WeekendProgressStrip } from '@/components/race-presentation/weekend-progress-strip';
import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { RACE_READY_THRESHOLD } from '@/data/repair-config';
import { getNextRace, getTeamManufacturer } from '@/data/starter-game-state';
import { getRaceReadinessBlockers } from '@/simulation/vehicle-repair';
import { useGameSession } from '@/state/game-session';
import { theme } from '@/theme';

export function RacePreviewScreen() {
  const { state } = useGameSession();
  const [showDetails, setShowDetails] = useState(false);
  const { race, track } = getNextRace(state.game);
  const manufacturer = getTeamManufacturer(state.game);
  const readinessBlockers = getRaceReadinessBlockers(state.game);

  if (!race || !track) {
    return (
      <Screen>
        <AppText>Race preview unavailable.</AppText>
      </Screen>
    );
  }

  return (
    <Screen
      compact
      footer={
        readinessBlockers.length > 0 ? (
          <AppButton disabled label={raceWeekendCopy.preview.blockedAction} />
        ) : (
          <Link href="/practice" asChild>
            <AppButton label={raceWeekendCopy.preview.primaryAction} />
          </Link>
        )
      }>
      <View style={{ gap: 6 }}>
        <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="eyebrow" tone="accent">Race {race.round} of {state.game.calendar.length}</AppText>
            <AppText numberOfLines={1} variant="title">{track.name}</AppText>
            <AppText numberOfLines={1} variant="caption" tone="muted">{race.name} · Week {race.week}</AppText>
          </View>
          <StatusBadge label={track.type} tone="red" />
        </View>
        <WeekendProgressStrip phase="preview" />
      </View>

      <AppCard
        style={{
          borderColor: readinessBlockers.length ? theme.colors.trackRed : theme.colors.victory,
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
        }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title" style={{ fontSize: 18 }}>
            {readinessBlockers.length ? 'Weekend Hold' : 'Clear for the Weekend'}
          </AppText>
          <StatusBadge
            compact
            label={readinessBlockers.length ? 'Needs Work' : 'Race Ready'}
            tone={readinessBlockers.length ? 'red' : 'green'}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {state.game.vehicles.map((vehicle) => {
            const driver = state.game.drivers.find((item) => item.id === vehicle.assignedDriverId);
            return (
              <Link
                key={vehicle.id}
                href={{ pathname: '/vehicles/[number]', params: { number: vehicle.number } }}
                asChild>
                <Pressable
                  accessibilityRole="link"
                  style={({ pressed }) => ({
                    backgroundColor: theme.colors.panelStrong,
                    borderRadius: 6,
                    flex: 1,
                    gap: 2,
                    opacity: pressed ? 0.78 : 1,
                    padding: theme.spacing.sm,
                  })}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText>#{vehicle.number}</AppText>
                    <AppText variant="caption" tone="soft">{vehicle.condition}%</AppText>
                  </View>
                  <AppText numberOfLines={1} variant="caption" tone="muted">{driver?.name}</AppText>
                  <AppText
                    variant="caption"
                    style={{ color: vehicle.readiness === 'Ready' ? theme.colors.victory : theme.colors.trackRed }}>
                    {vehicle.readiness}
                  </AppText>
                </Pressable>
              </Link>
            );
          })}
        </View>
        <AppText variant="caption" tone="soft">
          {readinessBlockers.length
            ? raceWeekendCopy.preview.readinessHoldBody
            : `Both entries have cleared the ${RACE_READY_THRESHOLD}% condition line.`}
        </AppText>
      </AppCard>

      <AppCard style={{ gap: theme.spacing.sm, padding: theme.spacing.md }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="eyebrow" tone="accent">Weekend Briefing</AppText>
            <AppText variant="title" style={{ fontSize: 19 }}>{track.strategyNote}</AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {track.keyStats.map((stat) => (
            <StatusBadge compact key={stat} label={stat} tone="blue" />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="caption" tone="soft">Tire wear: {track.tireWear}</AppText>
          <AppText variant="caption" tone="soft">Caution risk: {track.cautionRisk}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showDetails }}
          onPress={() => setShowDetails((current) => !current)}
          style={{ justifyContent: 'center', minHeight: 44 }}>
          <AppText variant="caption" tone="accent">{showDetails ? 'Hide garage details' : 'More weekend details'}</AppText>
        </Pressable>
        {showDetails ? (
          <View style={{ borderTopColor: theme.colors.border, borderTopWidth: 1, paddingTop: 6 }}>
            <AppRow compact label="Manufacturer" detail={manufacturer.displayName} />
            <AppRow compact label="Field" detail="32 cars" />
            <AppRow compact label="Weekend status" detail="Practice plan due" />
          </View>
        ) : null}
      </AppCard>
    </Screen>
  );
}
