import type { OvalPresentationPhase } from '@/types/race-presentation';

/**
 * Presentation-only oval cycle. This is intentionally independent from race
 * simulation so final track geometry can replace it without changing results.
 */
export function getOvalPresentationPhase(
  elapsedMs: number,
  cycleDurationMs: number,
): OvalPresentationPhase {
  const cycleProgress = (elapsedMs % cycleDurationMs) / cycleDurationMs;

  if (cycleProgress < 0.25) {
    return 'Front Straight';
  }

  if (cycleProgress < 0.5) {
    return 'Turns 1–2';
  }

  if (cycleProgress < 0.75) {
    return 'Back Straight';
  }

  return 'Turns 3–4';
}
