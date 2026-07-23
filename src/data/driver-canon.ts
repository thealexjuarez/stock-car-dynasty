import type { DriverArchetype, SponsorLead } from '@/types/game';

export const aidenVossCanon = {
  id: 'driver-aiden-voss',
  name: 'Aiden Voss',
  carNumber: '46',
  overall: 57,
  potential: 76,
  archetypes: [
    'Development Prospect',
    'Aggressive Driver',
  ] as [DriverArchetype, DriverArchetype],
} as const;

export const aidenVossSponsorLead: SponsorLead = {
  id: 'sponsor-lead-coastal-marine-supply',
  sponsorName: 'Coastal Marine Supply',
  projectedRaceBacking: { minimum: 3_000, maximum: 5_000 },
  activationCondition:
    'Aiden Voss must start seven races if the package is confirmed.',
  status: 'dormant',
};
