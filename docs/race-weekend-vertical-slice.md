# Race-weekend vertical slice

## Architecture

The active game and its current weekend have one owner: `GameSessionProvider`. Its reducer is a
plain TypeScript module so the complete state transition can be tested without rendering React.
Screens read state and dispatch intent; they do not calculate or retain authoritative outcomes.

Pure simulation modules own practice, qualifying, race, and settlement calculations. The existing
race-presentation hook remains responsible only for elapsed playback time, camera focus, and visual
controls. It receives the seeded grid and finishing order from weekend state.

## State flow

1. The race preview reads the event identified by `GameState.nextRaceId`.
2. Completing practice stores one `PracticeResult`, including numeric qualifying and race bonuses.
3. Beginning qualifying resolves and stores a seeded `QualifyingResult` for the complete 32-car
   field.
4. Completing qualifying reveals the stored starting grid.
5. Starting the race resolves and stores a seeded `RaceResult`; playback presents that outcome.
6. The results screen shows pending payout, EXP, and car-condition changes.
7. Advancing applies those changes once, selects the next calendar event, moves the date forward
   seven days, and creates a fresh weekend state.

## Determinism and assumptions

- The weekend seed is derived from season and race ID. Per-entry qualifying, incident, race, and
  damage values use stable namespaced hashes, so call order cannot change an outcome.
- The field uses two canonical Apex entries and 30 provisional fictional
  opponents. Their identities, organizations, numbers, manufacturers, ratings,
  and assignments live in persistent state instead of regenerating per event.
- Opponent baseline strength combines track-aware driver rating at 60% and
  organization/equipment rating at 40%. Player strength uses
  current driver ratings, track-relevant stats, vehicle performance/condition, team quality, and
  the stored practice bonus.
- Manufacturer is identity-only and contributes no performance modifier.
- Standings use a centralized provisional 32-to-1 finish-points scale with no
  bonus points because no Bible-aligned points table exists yet.
- Exact payout, EXP, variance, incident, and damage values are not locked by the available Bible
  data. Conservative vertical-slice values are centralized in `src/data/race-weekend-config.ts` so
  they can be replaced without changing screens or state transitions.
- State remains in memory, but state version 4 normalization safely adds the
  persistent field to older campaigns. Facilities, sponsorship expansion,
  transfers, and opponent finances remain out of scope.
- Live-race pace buttons remain presentation controls and do not alter the seeded result in this
  slice.

## Verification

`npm test` checks stable seeded outcomes, required phase order, atomic settlement, calendar advance,
and prevention of double settlement. Lint and TypeScript checks cover the app integration.
