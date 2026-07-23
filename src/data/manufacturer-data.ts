import type { Manufacturer, ManufacturerId } from '@/types/game';

export const manufacturerCatalog: Manufacturer[] = [
  {
    id: 'fard',
    displayName: 'Fard',
    description: 'One of the three canonical Stock Car Dynasty manufacturers.',
    presentation: { compactName: 'Fard', initials: 'F' },
  },
  {
    id: 'chevrolat',
    displayName: 'Chevrolat',
    description: 'One of the three canonical Stock Car Dynasty manufacturers.',
    presentation: { compactName: 'Chevrolat', initials: 'C' },
  },
  {
    id: 'toyoda',
    displayName: 'Toyoda',
    description: 'One of the three canonical Stock Car Dynasty manufacturers.',
    presentation: { compactName: 'Toyoda', initials: 'T' },
  },
];

export const apexStartingManufacturerId: ManufacturerId = 'chevrolat';

export function getManufacturerById(
  manufacturerId: ManufacturerId,
  catalog: Manufacturer[] = manufacturerCatalog,
) {
  const manufacturer = catalog.find((item) => item.id === manufacturerId);

  if (!manufacturer) {
    throw new Error(`Missing canonical manufacturer: ${manufacturerId}`);
  }

  return manufacturer;
}
