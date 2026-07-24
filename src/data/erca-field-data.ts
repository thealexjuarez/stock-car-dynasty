import type { DriverStat } from '@/types/game';
import type {
  OpponentDriver,
  RaceFieldEntry,
  RaceFieldOrganization,
  RaceFieldState,
} from '@/types/race-field';

const statKeys: DriverStat[] = [
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
];

function fieldStats(overall: number, seed: number): Record<DriverStat, number> {
  return Object.fromEntries(
    statKeys.map((stat, index) => [
      stat,
      Math.max(42, Math.min(82, overall + ((seed * 5 + index * 3) % 13) - 6)),
    ]),
  ) as Record<DriverStat, number>;
}

/**
 * PROVISIONAL ERCA organizations. Manufacturer is identity-only in this
 * bundle; performance and equipment ratings are independently tunable.
 */
export const prototypeFieldOrganizations: RaceFieldOrganization[] = [
  { id:'team-apex-motorsports',name:'Apex Motorsports',shortCode:'APX',manufacturerId:'chevrolat',teamPerformance:54,equipmentStrength:54,reliability:55,tier:'Underfunded',primaryColor:'#D93A32',accentColor:'#F4F1E8',isPlayerTeam:true },
  { id:'team-ironwood-racing',name:'Ironwood Racing',shortCode:'IWR',manufacturerId:'chevrolat',teamPerformance:76,equipmentStrength:75,reliability:73,tier:'Elite',primaryColor:'#17212B',accentColor:'#E6B84A',isPlayerTeam:false },
  { id:'team-harborline-motorsports',name:'Harborline Motorsports',shortCode:'HLM',manufacturerId:'chevrolat',teamPerformance:71,equipmentStrength:70,reliability:69,tier:'Strong',primaryColor:'#146C86',accentColor:'#E9E2D0',isPlayerTeam:false },
  { id:'team-redline-ridge-racing',name:'Redline Ridge Racing',shortCode:'RRR',manufacturerId:'chevrolat',teamPerformance:67,equipmentStrength:66,reliability:64,tier:'Strong',primaryColor:'#A52A32',accentColor:'#F3D5D8',isPlayerTeam:false },
  { id:'team-summit-peak-autosport',name:'Summit Peak Autosport',shortCode:'SPA',manufacturerId:'chevrolat',teamPerformance:62,equipmentStrength:63,reliability:65,tier:'Midfield',primaryColor:'#315B96',accentColor:'#E8EDF4',isPlayerTeam:false },
  { id:'team-granite-state-racing',name:'Granite State Racing',shortCode:'GSR',manufacturerId:'chevrolat',teamPerformance:57,equipmentStrength:58,reliability:60,tier:'Midfield',primaryColor:'#59616C',accentColor:'#D9DEE4',isPlayerTeam:false },
  { id:'team-northstar-competition',name:'Northstar Competition',shortCode:'NSC',manufacturerId:'fard',teamPerformance:74,equipmentStrength:73,reliability:72,tier:'Elite',primaryColor:'#E9E2D0',accentColor:'#B52832',isPlayerTeam:false },
  { id:'team-blue-river-racing',name:'Blue River Racing',shortCode:'BRR',manufacturerId:'fard',teamPerformance:69,equipmentStrength:68,reliability:70,tier:'Strong',primaryColor:'#225A9C',accentColor:'#DCE8F5',isPlayerTeam:false },
  { id:'team-frontier-lane-motorsports',name:'Frontier Lane Motorsports',shortCode:'FLM',manufacturerId:'fard',teamPerformance:65,equipmentStrength:64,reliability:61,tier:'Strong',primaryColor:'#D36D20',accentColor:'#171C24',isPlayerTeam:false },
  { id:'team-keystone-speedworks',name:'Keystone Speedworks',shortCode:'KSW',manufacturerId:'fard',teamPerformance:61,equipmentStrength:60,reliability:63,tier:'Midfield',primaryColor:'#5F4A8B',accentColor:'#E6DCF2',isPlayerTeam:false },
  { id:'team-copperhead-racing',name:'Copperhead Racing',shortCode:'CPR',manufacturerId:'fard',teamPerformance:58,equipmentStrength:57,reliability:56,tier:'Midfield',primaryColor:'#A96127',accentColor:'#F0D5BA',isPlayerTeam:false },
  { id:'team-stonebridge-autosport',name:'Stonebridge Autosport',shortCode:'SBA',manufacturerId:'fard',teamPerformance:51,equipmentStrength:52,reliability:54,tier:'Underfunded',primaryColor:'#454D58',accentColor:'#C9CED6',isPlayerTeam:false },
  { id:'team-pacific-crown-racing',name:'Pacific Crown Racing',shortCode:'PCR',manufacturerId:'toyoda',teamPerformance:72,equipmentStrength:71,reliability:74,tier:'Elite',primaryColor:'#7B2342',accentColor:'#E7C4D1',isPlayerTeam:false },
  { id:'team-meridian-motorsports',name:'Meridian Motorsports',shortCode:'MRD',manufacturerId:'toyoda',teamPerformance:68,equipmentStrength:69,reliability:67,tier:'Strong',primaryColor:'#1C7A68',accentColor:'#D6F0EA',isPlayerTeam:false },
  { id:'team-crescent-valley-racing',name:'Crescent Valley Racing',shortCode:'CVR',manufacturerId:'toyoda',teamPerformance:63,equipmentStrength:62,reliability:64,tier:'Midfield',primaryColor:'#7C5A2C',accentColor:'#F2E1C6',isPlayerTeam:false },
  { id:'team-high-plains-competition',name:'High Plains Competition',shortCode:'HPC',manufacturerId:'toyoda',teamPerformance:56,equipmentStrength:55,reliability:58,tier:'Underfunded',primaryColor:'#2D6B45',accentColor:'#D7E9DD',isPlayerTeam:false },
  { id:'team-evergreen-speed',name:'Evergreen Speed',shortCode:'EVS',manufacturerId:'toyoda',teamPerformance:50,equipmentStrength:49,reliability:52,tier:'Underfunded',primaryColor:'#244B38',accentColor:'#C8DACF',isPlayerTeam:false },
];

type DriverInput = Omit<OpponentDriver, 'stats' | 'active'> & { seed: number };
const opponent = (input: DriverInput): OpponentDriver => ({
  ...input,
  stats: fieldStats(input.overall, input.seed),
  active: true,
});

/** PROVISIONAL persistent opponent roster for later canon review. */
export const prototypeOpponentDrivers: OpponentDriver[] = [
  opponent({id:'field-driver-dale-iverson',name:'Dale Iverson',age:31,overall:74,potential:74,archetypes:['Complete Driver','Long Run Driver'],careerBackground:'Two-time regional touring champion',teamId:'team-ironwood-racing',carNumber:'2',manufacturerId:'chevrolat',consistencyTendency:76,incidentTendency:'Low',developmentOutlook:'Established title favorite.',seed:1}),
  opponent({id:'field-driver-nolan-briggs',name:'Nolan Briggs',age:27,overall:69,potential:71,archetypes:['Long Run Driver','Reliable Journeyman'],careerBackground:'National late-model graduate',teamId:'team-ironwood-racing',carNumber:'20',manufacturerId:'chevrolat',consistencyTendency:72,incidentTendency:'Low',developmentOutlook:'Prime-age contender with room to refine qualifying.',seed:2}),
  opponent({id:'field-driver-spencer-vale',name:'Spencer Vale',age:29,overall:70,potential:71,archetypes:['Complete Driver','Superspeedway Specialist'],careerBackground:'Veteran all-oval winner',teamId:'team-harborline-motorsports',carNumber:'7',manufacturerId:'chevrolat',consistencyTendency:69,incidentTendency:'Medium',developmentOutlook:'Championship-ready veteran.',seed:3}),
  opponent({id:'field-driver-marcus-wynn',name:'Marcus Wynn',age:25,overall:67,potential:72,archetypes:['Short Track Specialist','Aggressive Driver'],careerBackground:'Modified and bullring standout',teamId:'team-harborline-motorsports',carNumber:'71',manufacturerId:'chevrolat',consistencyTendency:63,incidentTendency:'High',developmentOutlook:'High-upside winner still smoothing rough edges.',seed:4}),
  opponent({id:'field-driver-parker-bell',name:'Parker Bell',age:28,overall:66,potential:68,archetypes:['Reliable Journeyman','Complete Driver'],careerBackground:'Southeast stock-car regular',teamId:'team-redline-ridge-racing',carNumber:'5',manufacturerId:'chevrolat',consistencyTendency:71,incidentTendency:'Low',developmentOutlook:'Dependable playoff-caliber regular.',seed:5}),
  opponent({id:'field-driver-austin-keene',name:'Austin Keene',age:23,overall:64,potential:73,archetypes:['Development Prospect','Long Run Driver'],careerBackground:'Late-model development graduate',teamId:'team-redline-ridge-racing',carNumber:'55',manufacturerId:'chevrolat',consistencyTendency:64,incidentTendency:'Medium',developmentOutlook:'Strong ceiling with patient racecraft.',seed:6}),
  opponent({id:'field-driver-logan-price',name:'Logan Price',age:26,overall:62,potential:68,archetypes:['Road Course Specialist','Complete Driver'],careerBackground:'Road-racing convert',teamId:'team-summit-peak-autosport',carNumber:'18',manufacturerId:'chevrolat',consistencyTendency:66,incidentTendency:'Low',developmentOutlook:'Versatile regular with technical feedback.',seed:7}),
  opponent({id:'field-driver-trey-maddox',name:'Trey Maddox',age:22,overall:59,potential:71,archetypes:['Aggressive Driver','Short Track Specialist'],careerBackground:'Carolina late-model winner',teamId:'team-summit-peak-autosport',carNumber:'81',manufacturerId:'chevrolat',consistencyTendency:59,incidentTendency:'High',developmentOutlook:'Fast prospect who needs cleaner execution.',seed:8}),
  opponent({id:'field-driver-evan-rourke',name:'Evan Rourke',age:30,overall:56,potential:69,archetypes:['Reliable Journeyman','Long Run Driver'],careerBackground:'Midwest touring champion',teamId:'team-granite-state-racing',carNumber:'1',manufacturerId:'chevrolat',consistencyTendency:74,incidentTendency:'Low',developmentOutlook:'Experienced driver outperforming modest equipment.',seed:9}),
  opponent({id:'field-driver-caleb-stroud',name:'Caleb Stroud',age:21,overall:52,potential:75,archetypes:['Development Prospect','Superspeedway Specialist'],careerBackground:'Draft-track development standout',teamId:'team-granite-state-racing',carNumber:'3',manufacturerId:'chevrolat',consistencyTendency:61,incidentTendency:'Medium',developmentOutlook:'Major potential limited by current equipment.',seed:10}),
  opponent({id:'field-driver-grant-calder',name:'Grant Calder',age:32,overall:72,potential:72,archetypes:['Complete Driver','Reliable Journeyman'],careerBackground:'ERCA race winner and team leader',teamId:'team-northstar-competition',carNumber:'12',manufacturerId:'fard',consistencyTendency:77,incidentTendency:'Low',developmentOutlook:'Polished title contender.',seed:11}),
  opponent({id:'field-driver-wesley-boone',name:'Wesley Boone',age:28,overall:70,potential:71,archetypes:['Long Run Driver','Complete Driver'],careerBackground:'National sportsman champion',teamId:'team-northstar-competition',carNumber:'13',manufacturerId:'fard',consistencyTendency:73,incidentTendency:'Low',developmentOutlook:'Consistent front-runner in peak form.',seed:12}),
  opponent({id:'field-driver-miles-tatum',name:'Miles Tatum',age:26,overall:67,potential:69,archetypes:['Superspeedway Specialist','Reliable Journeyman'],careerBackground:'Regional speedway specialist',teamId:'team-blue-river-racing',carNumber:'4',manufacturerId:'fard',consistencyTendency:68,incidentTendency:'Medium',developmentOutlook:'Strong regular with pack-racing upside.',seed:13}),
  opponent({id:'field-driver-reid-lawson',name:'Reid Lawson',age:24,overall:66,potential:70,archetypes:['Road Course Specialist','Long Run Driver'],careerBackground:'Touring-car and stock-car crossover',teamId:'team-blue-river-racing',carNumber:'6',manufacturerId:'fard',consistencyTendency:67,incidentTendency:'Low',developmentOutlook:'Still improving on traditional ovals.',seed:14}),
  opponent({id:'field-driver-jonas-creed',name:'Jonas Creed',age:29,overall:65,potential:65,archetypes:['Aggressive Driver','Reliable Journeyman'],careerBackground:'Hard-nosed short-track veteran',teamId:'team-frontier-lane-motorsports',carNumber:'8',manufacturerId:'fard',consistencyTendency:60,incidentTendency:'High',developmentOutlook:'Known quantity with restart strength.',seed:15}),
  opponent({id:'field-driver-bennett-shaw',name:'Bennett Shaw',age:23,overall:64,potential:70,archetypes:['Short Track Specialist','Development Prospect'],careerBackground:'Northern modified prospect',teamId:'team-frontier-lane-motorsports',carNumber:'9',manufacturerId:'fard',consistencyTendency:62,incidentTendency:'Medium',developmentOutlook:'Useful upside across technical tracks.',seed:16}),
  opponent({id:'field-driver-carter-vane',name:'Carter Vane',age:27,overall:63,potential:66,archetypes:['Complete Driver','Road Course Specialist'],careerBackground:'Independent touring-series winner',teamId:'team-keystone-speedworks',carNumber:'10',manufacturerId:'fard',consistencyTendency:65,incidentTendency:'Low',developmentOutlook:'Steady midfield anchor.',seed:17}),
  opponent({id:'field-driver-luke-harlan',name:'Luke Harlan',age:20,overall:62,potential:72,archetypes:['Development Prospect','Aggressive Driver'],careerBackground:'Rookie late-model champion',teamId:'team-keystone-speedworks',carNumber:'11',manufacturerId:'fard',consistencyTendency:55,incidentTendency:'High',developmentOutlook:'Raw speed and substantial runway.',seed:18}),
  opponent({id:'field-driver-emmett-cross',name:'Emmett Cross',age:25,overall:58,potential:65,archetypes:['Long Run Driver','Reliable Journeyman'],careerBackground:'Heartland stock-car graduate',teamId:'team-copperhead-racing',carNumber:'14',manufacturerId:'fard',consistencyTendency:67,incidentTendency:'Low',developmentOutlook:'Long-run specialist in developing equipment.',seed:19}),
  opponent({id:'field-driver-rylan-fox',name:'Rylan Fox',age:22,overall:55,potential:68,archetypes:['Superspeedway Specialist','Aggressive Driver'],careerBackground:'Regional draft-track winner',teamId:'team-copperhead-racing',carNumber:'15',manufacturerId:'fard',consistencyTendency:56,incidentTendency:'High',developmentOutlook:'Exciting but volatile developing regular.',seed:20}),
  opponent({id:'field-driver-hayes-monroe',name:'Hayes Monroe',age:31,overall:51,potential:59,archetypes:['Reliable Journeyman','Short Track Specialist'],careerBackground:'Owner-driver and local champion',teamId:'team-stonebridge-autosport',carNumber:'16',manufacturerId:'fard',consistencyTendency:70,incidentTendency:'Low',developmentOutlook:'Veteran maximizing limited resources.',seed:21}),
  opponent({id:'field-driver-zane-porter',name:'Zane Porter',age:26,overall:73,potential:73,archetypes:['Long Run Driver','Complete Driver'],careerBackground:'West Coast touring regular',teamId:'team-pacific-crown-racing',carNumber:'17',manufacturerId:'toyoda',consistencyTendency:64,incidentTendency:'Low',developmentOutlook:'Equipment gives him upset potential.',seed:22}),
  opponent({id:'field-driver-garrett-rainer',name:'Garrett Rainer',age:19,overall:69,potential:73,archetypes:['Development Prospect','Road Course Specialist'],careerBackground:'Club-racing development prospect',teamId:'team-pacific-crown-racing',carNumber:'19',manufacturerId:'toyoda',consistencyTendency:54,incidentTendency:'Medium',developmentOutlook:'Long-term project in elite equipment.',seed:23}),
  opponent({id:'field-driver-clint-calloway',name:'Clint Calloway',age:28,overall:67,potential:67,archetypes:['Reliable Journeyman','Complete Driver'],careerBackground:'Southern touring-series veteran',teamId:'team-meridian-motorsports',carNumber:'21',manufacturerId:'toyoda',consistencyTendency:69,incidentTendency:'Low',developmentOutlook:'Reliable points scorer.',seed:24}),
  opponent({id:'field-driver-seth-durham',name:'Seth Durham',age:21,overall:64,potential:67,archetypes:['Development Prospect','Short Track Specialist'],careerBackground:'Bullring rookie-of-the-year',teamId:'team-meridian-motorsports',carNumber:'22',manufacturerId:'toyoda',consistencyTendency:57,incidentTendency:'Medium',developmentOutlook:'Early-career prospect with useful backing.',seed:25}),
  opponent({id:'field-driver-blake-temple',name:'Blake Temple',age:24,overall:62,potential:62,archetypes:['Road Course Specialist','Reliable Journeyman'],careerBackground:'Road-course club champion',teamId:'team-crescent-valley-racing',carNumber:'23',manufacturerId:'toyoda',consistencyTendency:63,incidentTendency:'Low',developmentOutlook:'Specialist learning oval discipline.',seed:26}),
  opponent({id:'field-driver-ian-kincaid',name:'Ian Kincaid',age:20,overall:59,potential:69,archetypes:['Development Prospect','Long Run Driver'],careerBackground:'Development-tour graduate',teamId:'team-crescent-valley-racing',carNumber:'24',manufacturerId:'toyoda',consistencyTendency:55,incidentTendency:'Medium',developmentOutlook:'Patient prospect needing seat time.',seed:27}),
  opponent({id:'field-driver-drew-ellery',name:'Drew Ellery',age:27,overall:57,potential:58,archetypes:['Complete Driver','Reliable Journeyman'],careerBackground:'Independent regional racer',teamId:'team-high-plains-competition',carNumber:'25',manufacturerId:'toyoda',consistencyTendency:62,incidentTendency:'Low',developmentOutlook:'Workmanlike underdog program leader.',seed:28}),
  opponent({id:'field-driver-max-sharp',name:'Max Sharp',age:19,overall:54,potential:70,archetypes:['Development Prospect','Aggressive Driver'],careerBackground:'Dirt-to-asphalt rookie',teamId:'team-high-plains-competition',carNumber:'27',manufacturerId:'toyoda',consistencyTendency:49,incidentTendency:'High',developmentOutlook:'High variance with meaningful upside.',seed:29}),
  opponent({id:'field-driver-brody-ames',name:'Brody Ames',age:33,overall:50,potential:50,archetypes:['Reliable Journeyman','Superspeedway Specialist'],careerBackground:'Part-time owner-driver',teamId:'team-evergreen-speed',carNumber:'28',manufacturerId:'toyoda',consistencyTendency:61,incidentTendency:'Low',developmentOutlook:'Experienced survivor in the smallest program.',seed:30}),
];

export function createInitialRaceFieldState(): RaceFieldState {
  const organizations = prototypeFieldOrganizations.map((organization) => ({
    ...organization,
  }));
  const opponentDrivers = prototypeOpponentDrivers.map((driver) => ({
    ...driver,
    archetypes: [
      driver.archetypes[0],
      driver.archetypes[1],
    ] as OpponentDriver['archetypes'],
    stats: { ...driver.stats },
  }));
  const entries: RaceFieldEntry[] = [
    { id:'field-entry-45',carNumber:'45',driverId:'driver-cole-mercer',teamId:'team-apex-motorsports',manufacturerId:'chevrolat',active:true,series:'ERCA Stock Series',isPlayerTeam:true },
    { id:'field-entry-46',carNumber:'46',driverId:'driver-aiden-voss',teamId:'team-apex-motorsports',manufacturerId:'chevrolat',active:true,series:'ERCA Stock Series',isPlayerTeam:true },
    ...opponentDrivers.map((driver): RaceFieldEntry => ({
      id: `field-entry-${driver.carNumber}`,
      carNumber: driver.carNumber,
      driverId: driver.id,
      teamId: driver.teamId,
      manufacturerId: driver.manufacturerId,
      active: driver.active,
      series: 'ERCA Stock Series' as const,
      isPlayerTeam: false,
    })),
  ];

  return {
    organizations,
    opponentDrivers,
    entries,
    standings: entries.map((entry) => ({
      entryId: entry.id,
      driverId: entry.driverId,
      points: 0,
      starts: 0,
      wins: 0,
      topFives: 0,
      topTens: 0,
      totalFinish: 0,
      averageFinish: null,
      lastFinish: null,
    })),
    processedRaceIds: [],
  };
}
