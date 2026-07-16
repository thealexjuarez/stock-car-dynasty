# Race Presentation Foundation

## Scope

The Qualifying and Live Race screens share a fixed elevated side-follow 2.5D scene. This layer is presentation-only: it does not decide final qualifying results, race results, incidents, pit outcomes, tire balance, fuel balance, or caution behavior.

## Prototype assumptions

- Canonical ERCA field: 32 cars, as locked by the vNext Bible.
- Prototype timing field: 12 Bible-defined cars and drivers.
- Simultaneously rendered scene cars: at most 7, centered around the selected Apex Motorsports driver.
- Player cars: #45 Cole Mercer and #46 Aiden Voss from current starter state.
- Code-native sprite footprint: 88 by 32 logical pixels per car.
- Track depth: 3 lanes with scale and draw order based on lane.
- Presentation state update interval: 750 milliseconds.
- Camera window: 0.045 normalized track distance ahead of and behind the selected car.
- Qualifying sample: 2 laps.
- Live Race sample: 40 laps, beginning on presentation Lap 8.
- Environment sample: clear, dry, 78 degrees Fahrenheit, green track.

The qualifying format, sample lap counts, weather, telemetry, camera window, and movement rates are not locked by the Bible. They are centralized in `src/data/race-presentation-data.ts` for replacement by future simulation data.

## Performance approach

- React session state advances at 750 ms rather than every animation frame.
- Reanimated moves car transforms on the UI thread between deterministic state updates.
- The center scene renders only the closest cars inside the camera window, capped at seven.
- The timing tower accepts any field length and uses a virtualized list.
- Cars and track layers are code-native placeholders, so this slice adds no raster texture memory.
- Qualifying filters the visible on-track set while retaining the complete prototype timing order.

## Before showing a full field in the scene

- Profile low-end Android devices with production sprite assets.
- Replace code-native car bodies with a small transparent sprite atlas or another batched renderer.
- Memoize unchanged timing rows and telemetry cards if future simulation updates become more frequent.
- Consider a dedicated canvas renderer only if profiling shows that seven visible animated cars is too restrictive.
- Add asset-size budgets, texture reuse, and off-screen culling for final track and livery art.
