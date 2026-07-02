import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/shared/app-text';
import { tabs } from '@/data/app-shell';
import { theme } from '@/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {tabs.map((tab) => (
            <TabTrigger key={tab.key} name={tab.key} href={`/${tab.key}`} asChild>
              <TabButton>{tab.title}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
      })}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: isFocused ? theme.colors.trackRed : theme.colors.panel,
          borderColor: isFocused ? theme.colors.trackRed : theme.colors.border,
          borderRadius: theme.buttons.radius,
          borderWidth: 1,
          justifyContent: 'center',
          minHeight: 40,
          minWidth: 74,
          paddingHorizontal: theme.spacing.sm,
        }}>
        <AppText
          variant="caption"
          style={{
            color: theme.colors.white,
            fontWeight: '900',
          }}>
          {children}
        </AppText>
      </View>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  return (
    <View
      {...props}
      style={{
        alignItems: 'center',
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        padding: theme.spacing.lg,
        position: 'absolute',
        right: 0,
      }}>
      <View
        style={{
          backgroundColor: theme.colors.rubber,
          borderColor: theme.colors.border,
          borderRadius: theme.cards.radius,
          borderWidth: 1,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
          justifyContent: 'center',
          maxWidth: theme.layout.maxContentWidth,
          padding: theme.spacing.sm,
          width: '100%',
        }}>
        {props.children}
      </View>
    </View>
  );
}
