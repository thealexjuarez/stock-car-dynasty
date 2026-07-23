import type { PracticeChoice, PracticeChoiceId } from '@/types/practice';

/**
 * Practice tuning is centralized here because the vNext Bible defines the
 * session shape, but not its exact focus names or balance values. These
 * conservative values can be replaced without touching UI or resolution code.
 */
export const practiceChoices = [
  {
    id: 'one-lap-speed',
    name: 'One-Lap Speed',
    intent: 'Improve qualifying preparation',
    description: 'Trim both cars for a cleaner, faster qualifying lap.',
    effectSummary: '+2 qualifying pace; a small setup-confidence gain.',
    ratingEmphasis: ['Qualifying', 'Speed', 'Consistency'],
    effects: { setupConfidence: 3, qualifyingPace: 2, racePace: 0 },
  },
  {
    id: 'long-run-balance',
    name: 'Long-Run Balance',
    intent: 'Improve race-run stability',
    description: 'Prioritize tire life and predictable balance over a full run.',
    effectSummary: '+2 race pace; a moderate setup-confidence gain.',
    ratingEmphasis: ['Tire Management', 'Throttle Control', 'Consistency'],
    effects: { setupConfidence: 4, qualifyingPace: 0, racePace: 2 },
  },
  {
    id: 'driver-feedback',
    name: 'Driver Feedback',
    intent: 'Build confidence in the baseline',
    description: 'Use extra feedback runs to make both cars easier to trust.',
    effectSummary: '+1 qualifying and race pace; the largest confidence gain.',
    ratingEmphasis: ['Consistency', 'Awareness', 'Racecraft'],
    effects: { setupConfidence: 6, qualifyingPace: 1, racePace: 1 },
  },
] as const satisfies readonly PracticeChoice[];

export const practiceResolutionTuning = {
  weights: {
    trackRelevantDriverStats: 0.3,
    driverOverall: 0.1,
    vehiclePerformance: 0.2,
    vehicleCondition: 0.08,
    engineeringQuality: 0.2,
    crewChiefQuality: 0.1,
  },
  varianceMaximum: 2,
  confidenceBounds: {
    minimum: 35,
    maximum: 85,
  },
  feedbackThresholds: {
    strong: 68,
    usable: 60,
  },
} as const;

export function isPracticeChoiceId(value: string | undefined): value is PracticeChoiceId {
  return practiceChoices.some((choice) => choice.id === value);
}

export function getPracticeChoice(id: PracticeChoiceId) {
  return practiceChoices.find((choice) => choice.id === id)!;
}
