import type {
  ArchetypeRiskFlag,
  ArchetypeSlot,
  Driver,
  DriverArchetype,
  DriverStat,
  TrackType,
} from '@/types/game';

type ArchetypeSlotEffects = {
  statBoosts: Partial<Record<DriverStat, number>>;
  developmentSpeedPercent?: number;
  scoutingRevealAccuracyPercent?: number;
  moraleConfidenceStart?: 'small';
  riskFlags?: readonly ArchetypeRiskFlag[];
};

export type ArchetypeDefinition = {
  id: DriverArchetype;
  primary: ArchetypeSlotEffects;
  secondary: ArchetypeSlotEffects;
  futureSystemDependencies: readonly string[];
};

const statBoosts = (
  values: Partial<Record<DriverStat, number>>,
): Partial<Record<DriverStat, number>> => values;

/**
 * Bible-locked archetype effects. Effects are calculated at use time and never
 * rewrite a driver's permanent base ratings.
 */
export const archetypeDefinitions = [
  {
    id: 'Complete Driver',
    primary: {
      statBoosts: statBoosts({
        Speed: 5,
        Racecraft: 5,
        Consistency: 5,
        Awareness: 5,
        'Tire Management': 5,
      }),
    },
    secondary: {
      statBoosts: statBoosts({
        Speed: 3,
        Racecraft: 3,
        Consistency: 3,
        Awareness: 3,
        'Tire Management': 3,
      }),
    },
    futureSystemDependencies: [],
  },
  {
    id: 'Road Course Specialist',
    primary: {
      statBoosts: statBoosts({
        Braking: 10,
        Cornering: 10,
        'Throttle Control': 8,
        Racecraft: 5,
      }),
    },
    secondary: {
      statBoosts: statBoosts({
        Braking: 5,
        Cornering: 5,
        'Throttle Control': 4,
        Racecraft: 3,
      }),
    },
    futureSystemDependencies: [],
  },
  {
    id: 'Short Track Specialist',
    primary: {
      statBoosts: statBoosts({
        Cornering: 10,
        Restarts: 10,
        Racecraft: 8,
        Braking: 5,
      }),
    },
    secondary: {
      statBoosts: statBoosts({
        Cornering: 5,
        Restarts: 5,
        Racecraft: 4,
        Braking: 3,
      }),
    },
    futureSystemDependencies: [],
  },
  {
    id: 'Superspeedway Specialist',
    primary: {
      statBoosts: statBoosts({
        Awareness: 10,
        Racecraft: 10,
        Restarts: 8,
        Speed: 5,
      }),
    },
    secondary: {
      statBoosts: statBoosts({
        Awareness: 5,
        Racecraft: 5,
        Restarts: 4,
        Speed: 3,
      }),
    },
    futureSystemDependencies: [],
  },
  {
    id: 'Long Run Driver',
    primary: {
      statBoosts: statBoosts({
        'Tire Management': 10,
        Consistency: 8,
        'Throttle Control': 6,
        Racecraft: 5,
      }),
    },
    secondary: {
      statBoosts: statBoosts({
        'Tire Management': 5,
        Consistency: 4,
        'Throttle Control': 3,
        Racecraft: 3,
      }),
    },
    futureSystemDependencies: ['tire-wear-and-long-run-falloff'],
  },
  {
    id: 'Aggressive Driver',
    primary: {
      statBoosts: statBoosts({
        Restarts: 10,
        Racecraft: 8,
        Speed: 8,
        Cornering: 5,
      }),
      riskFlags: ['higher-contact-risk'],
    },
    secondary: {
      statBoosts: statBoosts({
        Restarts: 5,
        Racecraft: 4,
        Speed: 4,
        Cornering: 3,
      }),
      riskFlags: ['smaller-contact-risk'],
    },
    futureSystemDependencies: ['race-incident-risk'],
  },
  {
    id: 'Reliable Journeyman',
    primary: {
      statBoosts: statBoosts({
        Consistency: 10,
        Awareness: 8,
        'Tire Management': 6,
        Racecraft: 5,
      }),
      riskFlags: ['reduced-damage-risk'],
    },
    secondary: {
      statBoosts: statBoosts({
        Consistency: 5,
        Awareness: 4,
        'Tire Management': 3,
        Racecraft: 3,
      }),
      riskFlags: ['small-damage-risk-reduction'],
    },
    futureSystemDependencies: ['equipment-protection-and-damage-risk'],
  },
  {
    id: 'Development Prospect',
    primary: {
      statBoosts: {},
      developmentSpeedPercent: 15,
      scoutingRevealAccuracyPercent: 10,
      moraleConfidenceStart: 'small',
    },
    secondary: {
      statBoosts: {},
      developmentSpeedPercent: 8,
      scoutingRevealAccuracyPercent: 5,
    },
    futureSystemDependencies: [
      'driver-development',
      'recruiting-scouting',
      'driver-morale-and-confidence-starts',
    ],
  },
] as const satisfies readonly ArchetypeDefinition[];

export const archetypeTrackFit: Record<
  TrackType,
  { strengths: readonly DriverArchetype[]; risks: readonly DriverArchetype[] }
> = {
  'Short Track': {
    strengths: [
      'Short Track Specialist',
      'Aggressive Driver',
      'Reliable Journeyman',
    ],
    risks: [],
  },
  Intermediate: {
    strengths: ['Complete Driver', 'Long Run Driver', 'Reliable Journeyman'],
    risks: [],
  },
  Superspeedway: {
    strengths: ['Superspeedway Specialist', 'Reliable Journeyman'],
    risks: ['Aggressive Driver'],
  },
  'Road Course': {
    strengths: [
      'Road Course Specialist',
      'Complete Driver',
      'Long Run Driver',
    ],
    risks: [],
  },
  'Long Oval': {
    strengths: ['Long Run Driver', 'Complete Driver', 'Reliable Journeyman'],
    risks: [],
  },
};

export function getArchetypeDefinition(archetype: DriverArchetype) {
  const definition = archetypeDefinitions.find((item) => item.id === archetype);
  if (!definition) {
    throw new Error(`Missing archetype definition: ${archetype}`);
  }
  return definition;
}

export function getArchetypeSlotEffects(
  archetype: DriverArchetype,
  slot: ArchetypeSlot,
): ArchetypeSlotEffects {
  return getArchetypeDefinition(archetype)[slot];
}

export function getEffectiveDriverStats(
  driver: Pick<Driver, 'archetypes' | 'stats'>,
): Record<DriverStat, number> {
  const effective = { ...driver.stats };

  driver.archetypes.forEach((archetype, index) => {
    const effects = getArchetypeSlotEffects(
      archetype,
      index === 0 ? 'primary' : 'secondary',
    );
    for (const [stat, boost] of Object.entries(effects.statBoosts)) {
      const driverStat = stat as DriverStat;
      effective[driverStat] = Math.min(
        100,
        effective[driverStat] + (boost ?? 0),
      );
    }
  });

  return effective;
}

export function evaluateArchetypeTrackFit(
  driver: Pick<Driver, 'archetypes'>,
  trackType: TrackType,
) {
  const fit = archetypeTrackFit[trackType];
  const primaryStrength = fit.strengths.includes(driver.archetypes[0]);
  const secondaryStrength = fit.strengths.includes(driver.archetypes[1]);
  const risks = driver.archetypes.filter((archetype) =>
    fit.risks.includes(archetype),
  );

  return {
    strength: primaryStrength
      ? 'primary'
      : secondaryStrength
        ? 'secondary'
        : 'neutral',
    risks,
  } as const;
}
