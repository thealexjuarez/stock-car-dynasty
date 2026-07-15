import type { Driver, DriverStat } from '@/types/game';

export type ProvisionalDriverPresentation = Pick<
  Driver,
  | 'age'
  | 'hometown'
  | 'role'
  | 'stats'
  | 'salary'
  | 'contract'
  | 'morale'
  | 'confidence'
  | 'fatigue'
  | 'exp'
  | 'nextRatingExp'
  | 'developmentTrend'
  | 'growthModifiers'
>;

const stats = (values: number[]): Record<DriverStat, number> =>
  Object.fromEntries(
    [
      'Speed',
      'Cornering',
      'Braking',
      'Throttle Control',
      'Racecraft',
      'Qualifying',
      'Restarts',
      'Tire Management',
      'Consistency',
      'Awareness',
    ].map((key, index) => [key, values[index]]),
  ) as Record<DriverStat, number>;

/**
 * PROVISIONAL STARTER PRESENTATION DATA - NOT LOCKED CANON.
 *
 * These values only keep the current profile UI populated where the latest
 * design direction does not lock a value. Keeping them outside the canonical
 * starter driver records prevents temporary UX fixtures from being mistaken
 * for game-balance decisions. Replace or remove each field when a future Bible
 * explicitly defines it.
 */
export const provisionalDriverPresentation: Record<
  'driver-cole-mercer' | 'driver-aiden-voss',
  ProvisionalDriverPresentation
> = {
  'driver-cole-mercer': {
    age: 28,
    hometown: 'Hickory, NC',
    role: 'Lead Driver',
    stats: stats([61, 66, 64, 62, 67, 58, 68, 63, 69, 66]),
    salary: 58_000,
    contract: '1-year',
    morale: 'Happy',
    confidence: 'Steady',
    fatigue: 'Fresh',
    exp: 860,
    nextRatingExp: 1_500,
    developmentTrend: 'Steady',
    growthModifiers: ['Training Center Level 1', 'Ray Hollis: Development-Minded'],
  },
  'driver-aiden-voss': {
    age: 21,
    hometown: 'Mobile, AL',
    role: 'Development Driver',
    stats: stats([60, 57, 54, 52, 55, 56, 62, 50, 49, 53]),
    salary: 42_000,
    contract: '1-year',
    exp: 1_020,
    nextRatingExp: 1_500,
    developmentTrend: 'Rising',
    morale: 'Neutral',
    confidence: 'Steady',
    fatigue: 'Fresh',
    growthModifiers: [
      'Development Prospect: +15% development',
      'Training Center Level 1',
      'Ray Hollis: Development-Minded',
    ],
  },
};
