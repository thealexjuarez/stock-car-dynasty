import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';

import { raceWeekendCopy } from '@/data/race-weekend-copy';
import { GameSessionProvider } from '@/state/game-session';
import { theme } from '@/theme';

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
          <Stack.Screen
            name="race-preview"
            options={{
              headerShown: true,
              title: raceWeekendCopy.preview.eyebrow,
              headerBackTitle: 'Home',
            }}
          />
          <Stack.Screen
            name="practice"
            options={{
              headerShown: true,
              title: raceWeekendCopy.practice.eyebrow,
              headerBackTitle: 'Weekend',
            }}
          />
          <Stack.Screen
            name="practice-result"
            options={{
              headerShown: true,
              title: raceWeekendCopy.practiceResult.eyebrow,
              headerBackTitle: 'Plan',
            }}
          />
          <Stack.Screen
            name="qualifying"
            options={{
              headerShown: true,
              title: raceWeekendCopy.qualifying.sessionLabel,
              headerBackTitle: 'Practice',
            }}
          />
          <Stack.Screen
            name="starting-grid"
            options={{
              headerShown: true,
              title: raceWeekendCopy.grid.title,
              headerBackTitle: 'Qualifying',
            }}
          />
          <Stack.Screen
            name="full-grid"
            options={{
              headerShown: true,
              title: 'Full Starting Grid',
              headerBackTitle: 'Grid',
            }}
          />
          <Stack.Screen
            name="live-race"
            options={{
              headerShown: true,
              title: raceWeekendCopy.race.sessionLabel,
              headerBackTitle: 'Grid',
            }}
          />
          <Stack.Screen
            name="race-results"
            options={{
              headerShown: true,
              title: raceWeekendCopy.results.title,
              headerBackTitle: 'Race',
            }}
          />
          <Stack.Screen
            name="full-results"
            options={{
              headerShown: true,
              title: 'Full Official Results',
              headerBackTitle: 'Results',
            }}
          />
          <Stack.Screen
            name="drivers/[id]"
            options={{ headerShown: true, title: 'Driver Profile', headerBackTitle: 'Team' }}
          />
          <Stack.Screen
            name="vehicles/[number]"
            options={{ headerShown: true, title: 'Vehicle Detail', headerBackTitle: 'Team' }}
          />
          <Stack.Screen
            name="recruiting/[id]"
            options={{ headerShown: true, title: 'Scouting Report', headerBackTitle: 'Market' }}
          />
          <Stack.Screen
            name="recruiting/compare"
            options={{ headerShown: true, title: 'Driver Comparison', headerBackTitle: 'Market' }}
          />
          <Stack.Screen
            name="recruiting/offer/[id]"
            options={{ headerShown: true, title: 'Offer Sheet', headerBackTitle: 'Report' }}
          />
        </Stack>
      </ThemeProvider>
    </GameSessionProvider>
  );
}
