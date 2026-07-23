import type {
  RecruitingActionDefinition,
  RecruitingActionId,
  RelationshipPath,
  ScoutingBandId,
} from '@/types/recruiting';

const action = (
  definition: Omit<
    RecruitingActionDefinition,
    'effects' | 'prerequisites' | 'unlocks' | 'cashCost' | 'futureSystemNotes'
  > & {
    effects?: Partial<RecruitingActionDefinition['effects']>;
    prerequisites?: RecruitingActionDefinition['prerequisites'];
    unlocks?: RecruitingActionId[];
    cashCost?: number;
    futureSystemNotes?: string;
  },
): RecruitingActionDefinition => {
  const { effects, ...rest } = definition;
  return {
    prerequisites: {},
    unlocks: [],
    cashCost: 0,
    futureSystemNotes: '',
    ...rest,
    effects: {
      scouting: 0,
      interest: 0,
      engagement: 0,
      visibility: 0,
      ...effects,
    },
  };
};

export const recruitingActions = [
  action({ id:'text-dm', canonicalName:'Text / DM', rpCost:10, category:'Direct Contact', repeatable:true, maximumLifetimeUses:3, oncePerWeekend:true, effects:{interest:2}, revealBehavior:'Establishes contact without revealing scouting data.', staffGroup:'none', relationshipPaths:['Direct Contact'], futureSystemNotes:'Establishes contact.' }),
  action({ id:'social-follow', canonicalName:'Social Media Follow / Engage', rpCost:20, category:'Social', repeatable:true, maximumLifetimeUses:3, oncePerWeekend:true, effects:{interest:1,engagement:8,visibility:1}, unlocks:['driver-highlight'], revealBehavior:'No scouting reveal.', staffGroup:'social', relationshipPaths:['Social Campaign'] }),
  action({ id:'scout-report', canonicalName:'Scout Report', rpCost:25, category:'Scouting', repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{scouting:20}, revealBehavior:'Reveals only the resulting confidence band.', staffGroup:'none', relationshipPaths:[] }),
  action({ id:'crew-chief-call', canonicalName:'Crew Chief Call', rpCost:35, category:'Relationship', prerequisites:{completedAll:['text-dm']}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{scouting:3,interest:6}, unlocks:['pitch-development'], revealBehavior:'No threshold bypass.', staffGroup:'development', relationshipPaths:['Direct Contact'] }),
  action({ id:'watch-race-tape', canonicalName:'Watch Race Tape', rpCost:50, category:'Evaluation', repeatable:true, maximumLifetimeUses:2, oncePerWeekend:true, effects:{scouting:12}, unlocks:['film-session'], revealBehavior:'Reveals only the resulting confidence band.', staffGroup:'none', relationshipPaths:['Evaluation'] }),
  action({ id:'driver-highlight', canonicalName:'Driver Highlight Post', rpCost:60, category:'Social', prerequisites:{completedAll:['social-follow']}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:3,engagement:12,visibility:2}, unlocks:['behind-scenes-feature'], revealBehavior:'No scouting reveal.', staffGroup:'social', relationshipPaths:['Social Campaign'] }),
  action({ id:'owner-call', canonicalName:'Owner Call', rpCost:60, category:'Direct Contact', prerequisites:{completedAll:['text-dm']}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:7}, unlocks:['pitch-seat'], revealBehavior:'No scouting reveal.', staffGroup:'none', relationshipPaths:['Direct Contact'] }),
  action({ id:'background-check', canonicalName:'Background Check', rpCost:65, category:'Evaluation', prerequisites:{minimumScouting:26}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{scouting:15}, revealBehavior:'May record a concern; exact dealbreakers remain gated at 76.', staffGroup:'none', relationshipPaths:['Evaluation'] }),
  action({ id:'behind-scenes-feature', canonicalName:'Social Media Feature / Behind-the-Scenes Feature', contextualName:'Behind-the-Scenes Feature', rpCost:75, category:'Social', prerequisites:{completedAll:['driver-highlight'],minimumEngagement:15}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:5,engagement:16,visibility:3}, unlocks:['spotlight-video'], revealBehavior:'No scouting reveal.', staffGroup:'social', relationshipPaths:['Social Campaign'] }),
  action({ id:'sponsor-research', canonicalName:'Sponsor Backing Research', rpCost:75, category:'Scouting', prerequisites:{minimumScouting:26}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{scouting:12}, revealBehavior:'Sponsor rumors at 51; true package at 76.', staffGroup:'none', relationshipPaths:['Sponsor Connection'] }),
  action({ id:'pitch-seat', canonicalName:'Pitch Seat Opportunity', rpCost:75, category:'Pitch', prerequisites:{completedAny:['owner-call','crew-chief-call'],minimumInterest:35}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:9}, unlocks:['shop-tour'], revealBehavior:'Records the Reserve / Development role.', staffGroup:'none', relationshipPaths:['Seat Opportunity'] }),
  action({ id:'fan-poll', canonicalName:'Fan Poll / Hype Post', contextualName:'Hype Post', rpCost:80, category:'Social', prerequisites:{completedAll:['social-follow'],minimumEngagement:8}, repeatable:true, maximumLifetimeUses:2, oncePerWeekend:true, effects:{interest:2,engagement:15,visibility:4}, revealBehavior:'No scouting reveal.', staffGroup:'social', relationshipPaths:['Social Campaign'] }),
  action({ id:'pitch-stability', canonicalName:'Pitch Team Stability', rpCost:90, category:'Pitch', prerequisites:{contactEstablished:true,minimumInterest:35}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:8}, revealBehavior:'Adds Stability relationship factor.', staffGroup:'none', relationshipPaths:['Team Stability'] }),
  action({ id:'shop-tour', canonicalName:'Shop Tour', rpCost:90, category:'Visit', prerequisites:{completedAll:['pitch-seat'],minimumInterest:35}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{scouting:6,interest:10}, unlocks:['race-weekend-visit'], revealBehavior:'Reveals only the resulting confidence band.', staffGroup:'none', relationshipPaths:['Team Visit'] }),
  action({ id:'pitch-development', canonicalName:'Pitch Development Plan', rpCost:100, category:'Pitch', prerequisites:{minimumScouting:26,minimumInterest:35}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:10}, unlocks:['full-development-plan'], revealBehavior:'No scouting reveal.', staffGroup:'development', relationshipPaths:['Development Path'] }),
  action({ id:'sponsor-intro', canonicalName:'Sponsor Intro', rpCost:100, category:'Relationship', prerequisites:{completedAll:['sponsor-research'],activeSponsor:true,minimumInterest:35}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:6}, unlocks:['sponsor-feature'], revealBehavior:'Sponsor terms remain informational.', staffGroup:'none', relationshipPaths:['Sponsor Connection'] }),
  action({ id:'film-session', canonicalName:'Film Session', rpCost:110, category:'Evaluation', prerequisites:{completedAll:['watch-race-tape'],minimumScouting:26}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{scouting:18,interest:3}, unlocks:['sim-session'], revealBehavior:'No permanent stat bonus; band-gated reveal only.', staffGroup:'none', relationshipPaths:['Evaluation'] }),
  action({ id:'pitch-growth', canonicalName:'Pitch Competitive Growth', rpCost:125, category:'Pitch', prerequisites:{minimumScouting:51,minimumInterest:55}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:11}, revealBehavior:'Adds Competitive Growth factor.', staffGroup:'none', relationshipPaths:['Competitive Growth'] }),
  action({ id:'spotlight-video', canonicalName:'Recruit Spotlight Video', rpCost:125, category:'Social', prerequisites:{completedAll:['behind-scenes-feature'],minimumInterest:35}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:7,engagement:20,visibility:5}, revealBehavior:'No scouting reveal.', staffGroup:'social', relationshipPaths:['Social Campaign'] }),
  action({ id:'sponsor-feature', canonicalName:'Sponsor-Branded Feature', rpCost:140, category:'Social / Sponsor', prerequisites:{completedAll:['sponsor-intro','spotlight-video']}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:8,engagement:18,visibility:6}, revealBehavior:'Records sponsor alignment without activating income.', staffGroup:'social', relationshipPaths:['Sponsor Connection'] }),
  action({ id:'race-weekend-visit', canonicalName:'Race Weekend Visit', rpCost:150, category:'Visit', prerequisites:{completedAll:['shop-tour'],minimumInterest:55}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{scouting:10,interest:12}, unlocks:['private-test-day'], revealBehavior:'No race-stat bonus; band-gated reveal only.', staffGroup:'none', relationshipPaths:['Team Visit'] }),
  action({ id:'sim-session', canonicalName:'Sim Session', rpCost:175, category:'Evaluation', prerequisites:{completedAll:['film-session'],minimumScouting:51,minimumInterest:55}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{scouting:20,interest:7}, unlocks:['private-test-day'], revealBehavior:'Band-gated reveal only.', staffGroup:'development', relationshipPaths:['Evaluation'], futureSystemNotes:'Simulator performance consequences deferred.' }),
  action({ id:'manufacturer-pitch', canonicalName:'Manufacturer Pitch', rpCost:175, category:'Pitch', prerequisites:{minimumScouting:51,minimumInterest:55}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:10}, revealBehavior:'Records Chevrolat fit; no payment or contract consequence.', staffGroup:'none', relationshipPaths:['Manufacturer Fit'] }),
  action({ id:'full-development-plan', canonicalName:'Full Development Plan', rpCost:200, category:'Pitch', prerequisites:{completedAll:['pitch-development'],minimumScouting:51,minimumInterest:55}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{interest:14}, revealBehavior:'Completes the Development Path.', staffGroup:'development', relationshipPaths:['Development Path'], futureSystemNotes:'Development consequences deferred.' }),
  action({ id:'private-test-day', canonicalName:'Private Test Day', rpCost:250, category:'Evaluation / Visit', prerequisites:{completedAll:['sim-session','race-weekend-visit'],minimumInterest:75}, repeatable:false, maximumLifetimeUses:1, oncePerWeekend:false, effects:{scouting:20,interest:15}, revealBehavior:'May reach full evaluation at confidence 76+.', staffGroup:'none', cashCost:20_000, relationshipPaths:['Evaluation','Team Visit'] }),
  action({ id:'contract-offer', canonicalName:'Development Contract Offer / Contract Offer', contextualName:'Development Contract Offer', rpCost:300, category:'Offer', prerequisites:{completedAll:['pitch-seat'],minimumScouting:76,minimumInterest:75,openReserveSlot:true}, repeatable:true, maximumLifetimeUses:3, oncePerWeekend:true, revealBehavior:'Runs deterministic offer evaluation.', staffGroup:'development', relationshipPaths:['Contract'], futureSystemNotes:'Annual payroll, promotion, renewal, release, and active-seat assignment deferred.' }),
] as const satisfies readonly RecruitingActionDefinition[];

export const recruitingTuning = {
  startingRp: 100,
  rpPerSettledWeekend: 100,
  startingVisibilityFromBrandPower: true,
  maximumActionsPerProspectPerWeekend: 3,
  meterMinimum: 0,
  meterMaximum: 100,
  repeatMultipliers: [1, 0.6, 0.3],
  variancePercent: 10,
  staffEffectivenessPercent: 10,
  danaScoutingPercent: 10,
  privateTestDayCashCost: 20_000,
  acceptanceThreshold: 75,
  signingBonusPercent: 10,
  minimumSigningBonus: 5_000,
  maximumOfferAttempts: 3,
} as const;

export const scoutingBands = [
  { id:'basic', minimum:0, maximum:25, label:'Basic Information' },
  { id:'profile', minimum:26, maximum:50, label:'Prospect Profile' },
  { id:'evaluation', minimum:51, maximum:75, label:'Working Evaluation' },
  { id:'exact', minimum:76, maximum:100, label:'Full Evaluation' },
] as const satisfies readonly { id: ScoutingBandId; minimum:number; maximum:number; label:string }[];

export const qualifyingRelationshipPaths: readonly RelationshipPath[] = [
  'Direct Contact','Evaluation','Team Visit','Development Path','Social Campaign',
  'Sponsor Connection','Seat Opportunity','Team Stability','Competitive Growth','Manufacturer Fit',
];

export const salaryDemandBands = [
  { minimumOverall:48, maximumOverall:54, minimumSalary:30_000, maximumSalary:45_000 },
  { minimumOverall:55, maximumOverall:59, minimumSalary:40_000, maximumSalary:60_000 },
  { minimumOverall:60, maximumOverall:64, minimumSalary:55_000, maximumSalary:80_000 },
  { minimumOverall:65, maximumOverall:68, minimumSalary:75_000, maximumSalary:105_000 },
  { minimumOverall:69, maximumOverall:72, minimumSalary:100_000, maximumSalary:140_000 },
] as const;

export function getRecruitingAction(id: RecruitingActionId) {
  const found = recruitingActions.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown recruiting action: ${id}`);
  return found;
}
