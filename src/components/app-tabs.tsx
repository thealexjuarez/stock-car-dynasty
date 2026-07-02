import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { tabs } from '@/data/app-shell';
import { theme } from '@/theme';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={theme.colors.rubber}
      indicatorColor={theme.colors.trackRed}
      labelStyle={{ selected: { color: theme.colors.text } }}>
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.key} name={tab.key}>
          <NativeTabs.Trigger.Label>{tab.title}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={tab.icon.ios as never} md={tab.icon.android as never} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
