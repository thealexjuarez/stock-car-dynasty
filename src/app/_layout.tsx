import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';

import { theme } from '@/theme';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.asphalt },
          headerShown: false,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="race-preview" options={{ headerShown: true, title: 'Race Preview', headerBackTitle: 'Home' }} />
        <Stack.Screen name="drivers/[id]" options={{ headerShown: true, title: 'Driver Profile', headerBackTitle: 'Team' }} />
        <Stack.Screen name="vehicles/[number]" options={{ headerShown: true, title: 'Vehicle Detail', headerBackTitle: 'Team' }} />
      </Stack>
    </ThemeProvider>
  );
}
