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
    <Tabs style={{ backgroundColor: theme.colors.asphalt, flex: 1 }}>
      <TabSlot style={{ flex: 1, minHeight: 0 }} />
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
        flex: 1,
        minWidth: 0,
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
          paddingHorizontal: 2,
          width: '100%',
        }}>
        <AppText
          numberOfLines={1}
          variant="caption"
          style={{
            color: theme.colors.white,
            fontSize: 10,
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
        backgroundColor: theme.colors.rubber,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        flexDirection: 'row',
        flexShrink: 0,
        flexWrap: 'nowrap',
        gap: 4,
        height: 64,
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: 8,
        width: '100%',
      }}>
      {props.children}
    </View>
  );
}
