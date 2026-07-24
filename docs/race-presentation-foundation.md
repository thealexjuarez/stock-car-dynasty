# Race Presentation Foundation

## Scope

The Qualifying and Live Race screens share a fixed elevated side-follow 2.5D scene. The application shell is a safe-area-aware portrait layout with a focused timing tower to the left of the track viewport, followed by race status, player-driver cards, strategy controls, and fixed session controls below. The route itself does not scroll. This layer is presentation-only: it does not decide final qualifying results, race results, incidents, pit outcomes, tire balance, fuel balance, or caution behavior.

## Prototype assumptions

- Canonical ERCA field: 32 cars, as locked by the vNext Bible.
- Active timing field: all 32 persistent ERCA cars and drivers.
- Focused timing tower: leader plus windows around both Apex entries, merged
  without duplicates and capped at 10 portrait-safe rows.
- Simultaneously rendered scene cars: at most 7, centered around the selected Apex Motorsports driver.
- Player cars: #45 Cole Mercer and #46 Aiden Voss from current starter state.
- Original placeholder sprite footprint: 108 by 44 logical pixels per car.
- Track depth: 3 lanes with scale and draw order based on lane.
- Deterministic sample-state interval: 500 milliseconds.
- Visual target interpolation: 540 milliseconds using linear UI-thread transforms.
- Camera window: 0.065 normalized track distance ahead of and behind the selected car.
- Qualifying sample: two 24-second driver runs plus a 6-second provisional-result window.
- Qualifying duration: 54 seconds at 1x, 27 seconds at 2x, and 13.5 seconds at 4x.
- Qualifying presentation travel: 1.8 normalized laps.
- Live Race sample: 40 laps, beginning on presentation Lap 8.
- Live Race presentation duration/travel: 180 seconds and 32.5 normalized laps.
- Oval presentation cycle: 12 seconds, divided into front straight, Turns 1–2, back straight, and Turns 3–4.
- World-motion rate: 300 logical pixels per second at 1x.
- Maximum banking treatment: 3.5 degrees; maximum car turn angle: 2.25 degrees.
- Environment sample: clear, dry, 78 degrees Fahrenheit, green track.

The qualifying format, sample lap counts, weather, telemetry, camera window, and movement rates are not locked by the Bible. They are centralized in `src/data/race-presentation-data.ts` for replacement by future simulation data.

## Performance approach

- React session state advances every 500 ms rather than every animation frame.
- Reanimated interpolates car targets and advances the parallax world on the UI thread.
- Repeating wall, infield, asphalt, lane, and texture layers move at different speeds.
- A deterministic four-phase oval cycle adds opposing bank angles, car attitude, and subtle lane drift in turns.
- The center scene renders only the closest cars inside the camera window, capped at seven.
- The timing tower receives a pure focused selector result rather than rendering
  or scrolling through all 32 entries.
- The timing list is not nested inside a route-level vertical scroll container.
- Cars use original transparent vector-style placeholder geometry with a low body, greenhouse, glass, spoiler, wheels, highlights, shade, livery stripe, and readable number.
- Cars and track layers remain code-native placeholders, so this slice adds no raster texture memory.
- Qualifying filters the visible on-track set while retaining the complete
  32-entry timing order.

## Before showing a full field in the scene

- Profile low-end Android devices with production sprite assets.
- Replace placeholder car bodies with final transparent livery sprites or a small sprite atlas.
- Memoize unchanged timing rows and telemetry cards if future simulation updates become more frequent.
- Consider a dedicated canvas renderer only if profiling shows that seven visible animated cars is too restrictive.
- Add asset-size budgets, texture reuse, and off-screen culling for final track and livery art.
