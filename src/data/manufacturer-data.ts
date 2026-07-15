import type { Manufacturer, ManufacturerId, StartingWorldOrganization } from '@/types/game';

/** The locked manufacturer system. No other organization belongs in this list. */
export const manufacturers: Manufacturer[] = [
  { id: 'manufacturer-ford', name: 'Ford' },
  { id: 'manufacturer-chevrolet', name: 'Chevrolet' },
  { id: 'manufacturer-toyota', name: 'Toyota' },
];

/**
 * The latest available vNext Bible names Ranger Performance once: page 3's
 * Apex Motorsports starting-profile row labels it "Manufacturer." That label
 * conflicts with the locked Ford/Chevrolet/Toyota system, and no other Bible
 * section identifies Ranger as a partner, affiliate, supplier, or manufacturer
 * program. Preserve the name without inventing a role or team relationship.
 */
export const startingWorldOrganizations: StartingWorldOrganization[] = [
  {
    id: 'organization-ranger-performance',
    name: 'Ranger Performance',
    role: 'Unresolved',
    teamRelationship: 'Unresolved',
    sourceNote:
      'Game Design Bible vNext, page 3: Apex Motorsports Starting Profile, row labeled Manufacturer.',
  },
];

/** No source currently assigns Apex Motorsports to Ford, Chevrolet, or Toyota. */
export const apexManufacturerId: ManufacturerId | null = null;
