import { View } from 'react-native';

import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { StatusBadge } from '@/components/shared/status-badge';
import { placeholderSections, tabs } from '@/data/app-shell';
import { appState } from '@/state/app-state';
import { theme } from '@/theme';
import type { TabKey } from '@/types/shell';

type TabPlaceholderScreenProps = {
  tabKey: TabKey;
};

export function TabPlaceholderScreen({ tabKey }: TabPlaceholderScreenProps) {
  const tab = tabs.find((item) => item.key === tabKey)!;
  const sections = placeholderSections[tabKey];

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText variant="eyebrow" tone="accent">
          {appState.teamName}
        </AppText>
        <AppText variant="hero">{tab.title}</AppText>
        <AppText tone="muted">{tab.purpose}</AppText>
      </View>

      {sections.map((section) => (
        <AppCard key={section.title}>
          <View
            style={{
              alignItems: 'flex-start',
              flexDirection: 'row',
              gap: theme.spacing.md,
              justifyContent: 'space-between',
            }}>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <AppText variant="title">{section.title}</AppText>
              <AppText tone="soft" variant="caption">
                Structured for future expansion
              </AppText>
            </View>
            <StatusBadge label={section.badge} tone={section.badgeTone} />
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            {section.rows.map((row) => (
              <AppRow key={row} label={row} detail="Queued" />
            ))}
          </View>
        </AppCard>
      ))}
    </Screen>
  );
}
