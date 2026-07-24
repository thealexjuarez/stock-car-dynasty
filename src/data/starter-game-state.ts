import { provisionalDriverPresentation } from '@/data/provisional-driver-presentation';
import {
  aidenVossCanon,
  aidenVossSponsorLead,
} from '@/data/driver-canon';
import {
  apexStartingManufacturerId,
  getManufacturerById,
  manufacturerCatalog,
} from '@/data/manufacturer-data';
import { createInitialRecruitingState } from '@/data/prospect-data';
import { createInitialRaceFieldState } from '@/data/erca-field-data';
import type { Driver, DriverStat, GameState, TrackRisk, TrackType } from '@/types/game';

export const starterDrivers: Driver[] = [
  {
    id: 'driver-cole-mercer',
    name: 'Cole Mercer',
    carNumber: '45',
    overall: 64,
    potential: 72,
    archetypes: ['Short Track Specialist', 'Reliable Journeyman'],
    sponsorLeads: [],
    active: true,
    ...provisionalDriverPresentation['driver-cole-mercer'],
  },
  {
    ...aidenVossCanon,
    sponsorLeads: [aidenVossSponsorLead],
    active: true,
    ...provisionalDriverPresentation['driver-aiden-voss'],
  },
];

const trackInfo: [string,string,TrackType,DriverStat[],TrackRisk,TrackRisk,string][] = [
  ['daytono','Daytono','Superspeedway',['Awareness','Racecraft','Restarts','Speed','Consistency'],'Low','High','Protect both cars early; draft with discipline and prioritize a clean opening finish.'],
  ['bristel','Bristel','Short Track',['Cornering','Restarts','Racecraft','Braking','Awareness'],'Medium','High','Track position and restart execution matter more than outright speed.'],
  ['atlantia','Atlantia','Intermediate',['Speed','Cornering','Tire Management','Racecraft','Consistency'],'High','Medium','Balance short-run pace against tire falloff.'],
  ['watkins-glyn','Watkins Glyn','Road Course',['Braking','Cornering','Throttle Control','Racecraft','Consistency'],'Medium','Medium','Avoid entry mistakes and protect rear grip on exit.'],
  ['charlotta','Charlotta','Long Oval',['Speed','Tire Management','Throttle Control','Consistency','Racecraft'],'Medium','Medium','Long-run balance and clean air will shape the final stint.'],
  ['martinsvulle','Martinsvulle','Short Track',['Cornering','Restarts','Racecraft','Braking','Awareness'],'Low','High','Brake management and traffic patience prevent costly contact.'],
  ['darlingten','Darlingten','Long Oval',['Speed','Tire Management','Throttle Control','Consistency','Racecraft'],'High','Medium','Save the right side and let long-run pace develop.'],
  ['talladego','Talladego','Superspeedway',['Awareness','Racecraft','Restarts','Speed','Consistency'],'Low','High','Stay connected to the draft without forcing low-percentage moves.'],
  ['phoenex','Phoenex','Intermediate',['Speed','Cornering','Tire Management','Racecraft','Consistency'],'Medium','Medium','Versatility and restart lane choice can create track position.'],
  ['homesteed','Homesteed','Intermediate',['Speed','Cornering','Tire Management','Racecraft','Consistency'],'High','Medium','Tire management is essential for the championship finale.'],
];
const tracks = trackInfo.map(([id,name,type,keyStats,tireWear,cautionRisk,strategyNote]) => ({ id:`track-${id}`,name,type,keyStats,tireWear,cautionRisk,strategyNote }));
const calendar = trackInfo.map(([id,name], index) => ({ id:`race-${index+1}`, round:index+1, week:index+1, name:`${name} ERCA ${index+1}`, trackId:`track-${id}` }));

export const starterGameState: GameState = {
  stateVersion: 4,
  sanctioningBody:'NSCRA', series:'ERCA Stock Series', season:1, week:1, currentDate:'May 1, 2028',
  team:{ id:'team-apex-motorsports', name:'Apex Motorsports', cash:525000, series:'ERCA Stock Series', sanctioningBody:'NSCRA', manufacturerId:apexStartingManufacturerId, reputation:46, brandPower:44, recruitingPull:45, sponsorAppeal:48, carPerformance:54, pitCrewQuality:42, engineeringQuality:46, garageEfficiency:45, morale:55 },
  drivers:starterDrivers,
  // Locked by the vNext Bible's Apex Motorsports Starting Cars table.
  vehicles:[
    { id:'vehicle-45', number:'45', assignedDriverId:'driver-cole-mercer', condition:91, damage:9, damageClass:'minor', readiness:'Ready', performance:55, chassisWear:'Light', engineWear:'Light', note:'Stable baseline entry.', active:true },
    { id:'vehicle-46', number:'46', assignedDriverId:'driver-aiden-voss', condition:86, damage:14, damageClass:'minor', readiness:'Ready', performance:52, chassisWear:'Moderate', engineWear:'Light', note:'Slightly more worn; monitor damage stacking.', active:true },
  ],
  staff:[
    { id:'staff-ray-hollis',name:'Ray Hollis',role:'Crew Chief',quality:51,trait:'Development-Minded',salary:38000,effect:'+10% development recruiting actions; young driver growth; average race strategy.',active:true },
    { id:'staff-mia-torres',name:'Mia Torres',role:'Social Media Manager',quality:48,trait:'Local Buzz Builder',salary:28000,effect:'+10% social recruiting actions; +5% Brand Power from positive social events.',active:true },
    { id:'staff-hank-brewer',name:'Hank Brewer',role:'Lead Mechanic',quality:46,trait:'Budget Fixer',salary:32000,effect:'-10% eligible repair costs and weekend operating cost.',active:true },
    { id:'staff-dana-pierce',name:'Dana Pierce',role:'Regional Scout',quality:44,trait:'Short Track Network',salary:26000,effect:'+10% scouting effectiveness on short-track and regional prospects.',active:true },
  ],
  sponsors:[
    { id:'sponsor-bayfront-tools',name:'Bayfront Tools',slot:'Main Sponsor',personality:'Safe Partner',annualValue:150000,goal:'Top 24 team standings',bonus:'$25,000 for top 20',active:true },
    { id:'sponsor-lone-star-auto-parts',name:'Lone Star Auto Parts',slot:'Secondary Sponsor 1',personality:'Local Supporter',annualValue:65000,goal:'Both cars finish 7 races',bonus:'$8,000 for 8+ finishes',active:true },
    { id:'sponsor-gulf-coast-wraps',name:'Gulf Coast Wraps',slot:'Secondary Sponsor 2',personality:'Performance Brand-lite',annualValue:45000,goal:'Score one top 20',bonus:'$10,000 for one top 15',active:true },
  ],
  manufacturers:manufacturerCatalog,
  facilities:[
    ['garage','Garage','Repairs, condition recovery, mechanical risk.'],['engineering','Engineering Shop','Setup confidence, practice gains, race pace notes.'],['scouting','Scouting Office','Scouting speed, weekly RP, info accuracy, discovery.'],['sponsor','Sponsor Office','Offer quality, renewals, relationship growth, market size.'],['training','Training Center','Driver development, morale, confidence recovery.'],['pit-crew','Pit Crew Program','Pit speed, consistency, mistake chance, stage execution.'],
  ].map(([id,name,purpose]) => ({ id:`facility-${id}`,name,level:1,cap:3,purpose })),
  tracks, calendar, nextRaceId:'race-1',
  economy: {
    processedTransactionIds: [],
    repairTransactions: [],
    settlementHistory: [],
  },
  recruiting: createInitialRecruitingState(45, 44),
  raceField: createInitialRaceFieldState(),
};

export function getNextRace(state: GameState = starterGameState) {
  const race = state.calendar.find((event) => event.id === state.nextRaceId);
  return { race, track: state.tracks.find((item) => item.id === race?.trackId) };
}
export const getDriver = (id: string) => starterGameState.drivers.find((driver) => driver.id === id);
export const getVehicle = (number: string) => starterGameState.vehicles.find((vehicle) => vehicle.number === number);
export const getTeamManufacturer = (state: GameState = starterGameState) =>
  getManufacturerById(state.team.manufacturerId, state.manufacturers);
