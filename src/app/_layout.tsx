import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';

import { theme } from '@/theme';
import { GameSessionProvider } from '@/state/game-session';

export default function RootLayout() {
  return (
    <GameSessionProvider>
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
        <Stack.Screen name="practice" options={{ headerShown: true, title: 'Practice', headerBackTitle: 'Preview' }} />
        <Stack.Screen name="practice-result" options={{ headerShown: true, title: 'Practice Result', headerBackTitle: 'Practice' }} />
        <Stack.Screen name="qualifying" options={{ headerShown: true, title: 'Qualifying', headerBackTitle: 'Result' }} />
        <Stack.Screen name="starting-grid" options={{ headerShown: true, title: 'Starting Grid', headerBackTitle: 'Qualifying' }} />
        <Stack.Screen name="live-race" options={{ headerShown: true, title: 'Live Race', headerBackTitle: 'Qualifying' }} />
        <Stack.Screen name="race-results" options={{ headerShown: true, title: 'Race Results', headerBackTitle: 'Race' }} />
        <Stack.Screen name="drivers/[id]" options={{ headerShown: true, title: 'Driver Profile', headerBackTitle: 'Team' }} />
        <Stack.Screen name="vehicles/[number]" options={{ headerShown: true, title: 'Vehicle Detail', headerBackTitle: 'Team' }} />
        </Stack>
      </ThemeProvider>
    </GameSessionProvider>
  );
}
