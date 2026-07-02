import type {
  Driver,
  Facility,
  GameState,
  Manufacturer,
  RaceEvent,
  Sponsor,
  StaffMember,
  Track,
  Vehicle,
} from '@/types/game';

const sanctioningBody = 'NSCRA';
const series = 'ERCA Stock Series';

export const starterDrivers: Driver[] = [
  {
    id: 'driver-cole-mercer',
    name: 'Cole Mercer',
    age: 27,
    overall: 57,
    role: 'Lead Driver',
    archetype: 'Grinder',
    trait: 'Short Track Dog',
    morale: 'Happy',
    confidence: 'Steady',
    fatigue: 'Fresh',
    active: true,
  },
  {
    id: 'driver-aiden-voss',
    name: 'Aiden Voss',
    age: 18,
    overall: 44,
    role: 'Raw Prospect',
    archetype: 'Raw Prospect',
    trait: 'Hidden',
    morale: 'Neutral',
    confidence: 'Shaken',
    fatigue: 'Tired',
    active: true,
  },
];

export const starterVehicles: Vehicle[] = [
  {
    id: 'vehicle-45',
    number: '45',
    assignedDriverId: 'driver-cole-mercer',
    condition: 86,
    wear: 22,
    engine: 'Good',
    transmission: 'Worn',
    raceReady: 'Yes',
    active: true,
  },
  {
    id: 'vehicle-46',
    number: '46',
    assignedDriverId: 'driver-aiden-voss',
    condition: 71,
    wear: 36,
    engine: 'Good',
    transmission: 'Tired',
    raceReady: 'At Risk',
    active: true,
  },
];

export const starterStaff: StaffMember[] = [
  {
    id: 'staff-ray-mullins',
    name: 'Ray "Clipboard" Mullins',
    role: 'Team Manager',
    overall: 52,
    active: true,
  },
  {
    id: 'staff-dale-pritchett',
    name: 'Dale Pritchett',
    role: 'Crew Chief',
    overall: 48,
    active: true,
  },
  {
    id: 'staff-marisol-vega',
    name: 'Marisol Vega',
    role: 'Mechanic Lead',
    overall: 50,
    active: true,
  },
  {
    id: 'staff-tessa-rowe',
    name: 'Tessa Rowe',
    role: 'Marketing Admin',
    overall: 43,
    active: true,
  },
];

export const starterSponsors: Sponsor[] = [
  {
    id: 'sponsor-big-earls-bbq',
    name: "Big Earl's BBQ",
    tier: 'Title Sponsor',
    payoutPerRace: 30000,
    goal: 'Both cars finish Top 25',
    active: true,
  },
  {
    id: 'sponsor-titan-brake-supply',
    name: 'Titan Brake Supply',
    tier: 'Secondary Sponsor',
    payoutPerRace: 12000,
    goal: 'One car finishes Top 20',
    active: true,
  },
];

export const starterManufacturer: Manufacturer = {
  id: 'manufacturer-ranger-performance',
  name: 'Ranger Performance',
  relationship: 46,
  supportLevel: 'Basic Parts + Small Discount',
  partsDiscountPercent: 6,
};

export const starterFacilities: Facility[] = [
  'Main Team Facility',
  'Garage & Mechanics Bay',
  'R&D Department',
  'Aero Department',
  'Simulator Center',
  'Media Studio',
  'Development Center',
  'Gym & Recovery',
  'Manufacturer Parts Facility',
  'Sponsor Row',
  'Hauler Stop / Logistics',
  'Scout Speedway',
].map((name) => ({
  id: `facility-${name.toLowerCase().replaceAll('&', 'and').replaceAll('/', '').replaceAll(' ', '-')}`,
  name,
  level: 1,
}));

export const starterTracks: Track[] = [
  { id: 'track-queen-city-motorplex', name: 'Queen City Motorplex', type: 'Intermediate Oval' },
  { id: 'track-ridgeway-paperclip', name: 'Ridgeway Paperclip', type: 'Paperclip' },
  { id: 'track-thunder-bowl', name: 'Thunder Bowl', type: 'Short Track' },
  { id: 'track-daybreak-superspeedway', name: 'Daybreak Superspeedway', type: 'Superspeedway' },
  { id: 'track-carolina-stripeway', name: 'Carolina Stripeway', type: 'Tire-Wear Oval' },
  { id: 'track-finger-lakes-gp', name: 'Finger Lakes GP', type: 'Road Course' },
  { id: 'track-lone-star-bay-speedway', name: 'Lone Star Bay Speedway', type: 'Intermediate Oval' },
  { id: 'track-tall-pines-superspeedway', name: 'Tall Pines Superspeedway', type: 'Superspeedway' },
  { id: 'track-bayfront-street-circuit', name: 'Bayfront Street Circuit', type: 'Street Course' },
  { id: 'track-crown-valley-speedway', name: 'Crown Valley Speedway', type: 'Intermediate Oval' },
];

export const starterCalendar: RaceEvent[] = [
  { id: 'race-queen-city-40', round: 1, week: 1, name: 'Queen City 40', trackId: 'track-queen-city-motorplex' },
  { id: 'race-ridgeway-60', round: 2, week: 2, name: 'Ridgeway 60', trackId: 'track-ridgeway-paperclip' },
  { id: 'race-thunder-bowl-75', round: 3, week: 3, name: 'Thunder Bowl 75', trackId: 'track-thunder-bowl' },
  { id: 'race-daybreak-100', round: 4, week: 4, name: 'Daybreak 100', trackId: 'track-daybreak-superspeedway' },
  {
    id: 'race-carolina-stripeway-80',
    round: 5,
    week: 5,
    name: 'Carolina Stripeway 80',
    trackId: 'track-carolina-stripeway',
  },
  { id: 'race-finger-lakes-55', round: 6, week: 6, name: 'Finger Lakes 55', trackId: 'track-finger-lakes-gp' },
  {
    id: 'race-lone-star-bay-90',
    round: 7,
    week: 7,
    name: 'Lone Star Bay 90',
    trackId: 'track-lone-star-bay-speedway',
  },
  {
    id: 'race-tall-pines-100',
    round: 8,
    week: 8,
    name: 'Tall Pines 100',
    trackId: 'track-tall-pines-superspeedway',
  },
  {
    id: 'race-bayfront-street-50',
    round: 9,
    week: 9,
    name: 'Bayfront Street 50',
    trackId: 'track-bayfront-street-circuit',
  },
  {
    id: 'race-crown-valley-championship-100',
    round: 10,
    week: 10,
    name: 'Crown Valley Championship 100',
    trackId: 'track-crown-valley-speedway',
  },
];

export const starterGameState: GameState = {
  sanctioningBody,
  series,
  season: 1,
  week: 1,
  currentDate: 'May 1, 2028',
  team: {
    id: 'team-apex-motorsports',
    name: 'Apex Motorsports',
    cash: 525000,
    brandPower: 100,
    series,
    sanctioningBody,
    manufacturerId: starterManufacturer.id,
  },
  drivers: starterDrivers,
  vehicles: starterVehicles,
  staff: starterStaff,
  sponsors: starterSponsors,
  manufacturer: starterManufacturer,
  facilities: starterFacilities,
  tracks: starterTracks,
  calendar: starterCalendar,
  nextRaceId: 'race-queen-city-40',
};

export function getNextRace(state: GameState = starterGameState) {
  const race = state.calendar.find((event) => event.id === state.nextRaceId);
  const track = state.tracks.find((item) => item.id === race?.trackId);

  return { race, track };
}
