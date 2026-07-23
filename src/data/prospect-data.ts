import { recruitingTuning } from '@/data/recruiting-config';
import type { DriverStat } from '@/types/game';
import type {
  ProspectRecruitingProgress,
  RecruitingProspect,
  RecruitingState,
} from '@/types/recruiting';

const statKeys: DriverStat[] = [
  'Speed','Cornering','Braking','Throttle Control','Racecraft','Qualifying',
  'Restarts','Tire Management','Consistency','Awareness',
];

function prospectStats(overall: number, seed: number): Record<DriverStat, number> {
  return Object.fromEntries(
    statKeys.map((stat, index) => [
      stat,
      Math.max(35, Math.min(82, overall + ((seed * 3 + index * 5) % 11) - 5)),
    ]),
  ) as Record<DriverStat, number>;
}

type ProspectInput = Omit<RecruitingProspect, 'stats' | 'availability'> & {
  seed: number;
};

const prospect = (input: ProspectInput): RecruitingProspect => ({
  ...input,
  stats: prospectStats(input.overall, input.seed),
  availability: 'Available',
});

/**
 * PROVISIONAL prototype market. These drivers are persistent game data, but
 * are not permanent canon until individually approved.
 */
export const prototypeProspects: RecruitingProspect[] = [
  prospect({id:'prospect-mason-riggs',name:'Mason Riggs',age:19,hometown:'Florence, SC',racingBackground:'Late-model short-track winner',currentSeries:'Southern Late Model Tour',overall:55,potential:74,archetypes:['Short Track Specialist','Development Prospect'],salaryDemand:48_000,preferredTerm:2,baseInterest:53,roleExpectation:'Reserve / Development',sponsorPackage:{label:'Palmetto Machine Works',projectedRaceBacking:{minimum:2_000,maximum:4_000},conditions:['Regional starts required']},dealbreakers:['Wants a written development review'],blockingDealbreaker:'none',competingPressure:'Medium',developmentOutlook:'High ceiling with strong restart instincts.',recruitingPullSensitivity:1,manufacturerFit:['chevrolat','fard'],trackStrengths:['Short Track'],minimumReputation:40,regionalProspect:true,shortTrackProspect:true,seed:1}),
  prospect({id:'prospect-elias-crowe',name:'Elias Crowe',age:24,hometown:'Toledo, OH',racingBackground:'Regional stock-car regular',currentSeries:'Great Lakes Stock Tour',overall:62,potential:68,archetypes:['Reliable Journeyman','Complete Driver'],salaryDemand:72_000,preferredTerm:2,baseInterest:61,roleExpectation:'Flexible',dealbreakers:['Avoids unstable team programs'],blockingDealbreaker:'none',competingPressure:'Low',developmentOutlook:'Near-ready reserve with dependable feedback.',recruitingPullSensitivity:0,manufacturerFit:['chevrolat','toyoda'],trackStrengths:['Intermediate','Long Oval'],minimumReputation:42,regionalProspect:true,shortTrackProspect:false,seed:2}),
  prospect({id:'prospect-jace-hollander',name:'Jace Hollander',age:21,hometown:'Mesa, AZ',racingBackground:'Desert oval prospect',currentSeries:'Western Pro Stock Series',overall:58,potential:72,archetypes:['Long Run Driver','Development Prospect'],salaryDemand:54_000,preferredTerm:3,baseInterest:47,roleExpectation:'Reserve / Development',personalFundingPackage:18_000,dealbreakers:['Prefers a three-year runway'],blockingDealbreaker:'none',competingPressure:'Medium',developmentOutlook:'Patient long-run driver with room to grow.',recruitingPullSensitivity:2,manufacturerFit:['toyoda','chevrolat'],trackStrengths:['Intermediate','Long Oval'],minimumReputation:44,regionalProspect:true,shortTrackProspect:false,seed:3}),
  prospect({id:'prospect-theo-barrett',name:'Theo Barrett',age:28,hometown:'Richmond, VA',racingBackground:'Veteran touring-series racer',currentSeries:'Atlantic Stock Challenge',overall:68,potential:69,archetypes:['Complete Driver','Reliable Journeyman'],salaryDemand:102_000,preferredTerm:1,baseInterest:39,roleExpectation:'Active Seat',dealbreakers:['Requires an immediate active seat'],blockingDealbreaker:'active-seat-only',competingPressure:'High',developmentOutlook:'Polished now, with limited remaining growth.',recruitingPullSensitivity:2,manufacturerFit:['fard','chevrolat'],trackStrengths:['Intermediate','Road Course'],minimumReputation:55,regionalProspect:false,shortTrackProspect:false,seed:4}),
  prospect({id:'prospect-camden-vale',name:'Camden Vale',age:20,hometown:'Mobile, AL',racingBackground:'Gulf Coast super late-model standout',currentSeries:'Gulf Super Late Models',overall:57,potential:75,archetypes:['Aggressive Driver','Short Track Specialist'],salaryDemand:50_000,preferredTerm:3,baseInterest:58,roleExpectation:'Reserve / Development',sponsorPackage:{label:'Bayline Fabrication',projectedRaceBacking:{minimum:3_000,maximum:5_500},conditions:['Seven starts if activated']},dealbreakers:['Needs clear coaching access'],blockingDealbreaker:'none',competingPressure:'Medium',developmentOutlook:'Fast, forceful prospect who needs polish.',recruitingPullSensitivity:1,manufacturerFit:['chevrolat'],trackStrengths:['Short Track'],minimumReputation:38,regionalProspect:true,shortTrackProspect:true,seed:5}),
  prospect({id:'prospect-nico-salas',name:'Nico Salas',age:23,hometown:'San Antonio, TX',racingBackground:'Road-racing convert',currentSeries:'National Club Stock Series',overall:60,potential:70,archetypes:['Road Course Specialist','Complete Driver'],salaryDemand:64_000,preferredTerm:2,baseInterest:50,roleExpectation:'Flexible',personalFundingPackage:12_000,dealbreakers:['Values road-course opportunities'],blockingDealbreaker:'none',competingPressure:'Low',developmentOutlook:'Technically sharp and adaptable.',recruitingPullSensitivity:0,manufacturerFit:['toyoda','chevrolat'],trackStrengths:['Road Course'],minimumReputation:43,regionalProspect:false,shortTrackProspect:false,seed:6}),
  prospect({id:'prospect-wade-kessler',name:'Wade Kessler',age:26,hometown:'Knoxville, TN',racingBackground:'Appalachian short-track veteran',currentSeries:'Mountain Stock Tour',overall:64,potential:66,archetypes:['Short Track Specialist','Reliable Journeyman'],salaryDemand:79_000,preferredTerm:1,baseInterest:66,roleExpectation:'Flexible',dealbreakers:['Wants a stable one-year opportunity'],blockingDealbreaker:'none',competingPressure:'Low',developmentOutlook:'Known quantity with immediate setup value.',recruitingPullSensitivity:0,manufacturerFit:['chevrolat','fard'],trackStrengths:['Short Track'],minimumReputation:41,regionalProspect:true,shortTrackProspect:true,seed:7}),
  prospect({id:'prospect-owen-lark',name:'Owen Lark',age:18,hometown:'Dover, DE',racingBackground:'Quarter-mile development standout',currentSeries:'Mid-Atlantic Late Models',overall:50,potential:78,archetypes:['Development Prospect','Long Run Driver'],salaryDemand:36_000,preferredTerm:3,baseInterest:44,roleExpectation:'Reserve / Development',sponsorPackage:{label:'Lark Family Logistics',projectedRaceBacking:{minimum:1_500,maximum:3_000},conditions:['Development role required']},dealbreakers:['Requires reserve development placement'],blockingDealbreaker:'none',competingPressure:'High',developmentOutlook:'Rawest driver in the market and highest ceiling.',recruitingPullSensitivity:3,manufacturerFit:['chevrolat','toyoda'],trackStrengths:['Long Oval'],minimumReputation:45,regionalProspect:true,shortTrackProspect:true,seed:8}),
  prospect({id:'prospect-darius-moon',name:'Darius Moon',age:22,hometown:'Savannah, GA',racingBackground:'Coastal touring-series winner',currentSeries:'Southeast Stock Tour',overall:61,potential:73,archetypes:['Superspeedway Specialist','Aggressive Driver'],salaryDemand:68_000,preferredTerm:2,baseInterest:55,roleExpectation:'Reserve / Development',dealbreakers:['Wants manufacturer alignment explained'],blockingDealbreaker:'none',competingPressure:'Medium',developmentOutlook:'Excellent pack instincts with manageable risk.',recruitingPullSensitivity:1,manufacturerFit:['chevrolat'],trackStrengths:['Superspeedway'],minimumReputation:44,regionalProspect:true,shortTrackProspect:false,seed:9}),
  prospect({id:'prospect-levi-banks',name:'Levi Banks',age:29,hometown:'Madison, WI',racingBackground:'Independent regional champion',currentSeries:'Northern Stock League',overall:69,potential:70,archetypes:['Reliable Journeyman','Long Run Driver'],salaryDemand:118_000,preferredTerm:2,baseInterest:35,roleExpectation:'Active Seat',sponsorPackage:{label:'Northline Bearings',projectedRaceBacking:{minimum:5_000,maximum:8_000},conditions:['Active-seat exposure preferred']},dealbreakers:['Minimum team reputation must be met'],blockingDealbreaker:'minimum-reputation',competingPressure:'High',developmentOutlook:'Premium veteran reserve only if role expectations soften.',recruitingPullSensitivity:2,manufacturerFit:['fard'],trackStrengths:['Long Oval','Intermediate'],minimumReputation:58,regionalProspect:false,shortTrackProspect:false,seed:10}),
  prospect({id:'prospect-silas-reed',name:'Silas Reed',age:20,hometown:'Bakersfield, CA',racingBackground:'West Coast late-model graduate',currentSeries:'Pacific Stock Series',overall:54,potential:71,archetypes:['Development Prospect','Road Course Specialist'],salaryDemand:44_000,preferredTerm:2,baseInterest:49,roleExpectation:'Reserve / Development',personalFundingPackage:22_000,dealbreakers:['Prefers Toyoda or Chevrolat support'],blockingDealbreaker:'none',competingPressure:'Medium',developmentOutlook:'Smooth learner with useful road-course upside.',recruitingPullSensitivity:1,manufacturerFit:['toyoda','chevrolat'],trackStrengths:['Road Course'],minimumReputation:40,regionalProspect:true,shortTrackProspect:false,seed:11}),
  prospect({id:'prospect-bryce-maddox',name:'Bryce Maddox',age:25,hometown:'Tulsa, OK',racingBackground:'Dirt-to-asphalt convert',currentSeries:'Heartland Pro Stocks',overall:59,potential:67,archetypes:['Aggressive Driver','Complete Driver'],salaryDemand:58_000,preferredTerm:1,baseInterest:63,roleExpectation:'Flexible',dealbreakers:['Expects competitive-growth pitch'],blockingDealbreaker:'none',competingPressure:'Low',developmentOutlook:'Quick adaptation and strong restart value.',recruitingPullSensitivity:0,manufacturerFit:['chevrolat','fard'],trackStrengths:['Short Track','Intermediate'],minimumReputation:39,regionalProspect:true,shortTrackProspect:true,seed:12}),
  prospect({id:'prospect-remy-cole',name:'Remy Cole',age:22,hometown:'Portland, ME',racingBackground:'New England modified prospect',currentSeries:'Northeast Modified Alliance',overall:56,potential:70,archetypes:['Short Track Specialist','Aggressive Driver'],salaryDemand:49_000,preferredTerm:2,baseInterest:46,roleExpectation:'Reserve / Development',dealbreakers:['Needs regular sim access'],blockingDealbreaker:'none',competingPressure:'Medium',developmentOutlook:'High-intensity short-track specialist.',recruitingPullSensitivity:2,manufacturerFit:['fard','chevrolat'],trackStrengths:['Short Track'],minimumReputation:43,regionalProspect:true,shortTrackProspect:true,seed:13}),
  prospect({id:'prospect-finn-dalton',name:'Finn Dalton',age:27,hometown:'Lexington, KY',racingBackground:'National support-series journeyman',currentSeries:'American Sportsman Series',overall:66,potential:68,archetypes:['Complete Driver','Long Run Driver'],salaryDemand:91_000,preferredTerm:2,baseInterest:52,roleExpectation:'Flexible',sponsorPackage:{label:'Bluegrass Industrial',projectedRaceBacking:{minimum:4_000,maximum:6_000},conditions:['Team stability required']},dealbreakers:['Manufacturer must match preferred list'],blockingDealbreaker:'manufacturer-mismatch',competingPressure:'Medium',developmentOutlook:'Balanced profile with immediate technical value.',recruitingPullSensitivity:1,manufacturerFit:['toyoda','fard'],trackStrengths:['Intermediate','Long Oval'],minimumReputation:48,regionalProspect:false,shortTrackProspect:false,seed:14}),
  prospect({id:'prospect-quincy-hale',name:'Quincy Hale',age:19,hometown:'Macon, GA',racingBackground:'Rookie-of-the-year contender',currentSeries:'Georgia Late Model Cup',overall:52,potential:76,archetypes:['Development Prospect','Superspeedway Specialist'],salaryDemand:39_000,preferredTerm:3,baseInterest:60,roleExpectation:'Reserve / Development',personalFundingPackage:15_000,dealbreakers:['Requires a development plan'],blockingDealbreaker:'none',competingPressure:'High',developmentOutlook:'Strong awareness base and major growth runway.',recruitingPullSensitivity:2,manufacturerFit:['chevrolat'],trackStrengths:['Superspeedway'],minimumReputation:42,regionalProspect:true,shortTrackProspect:true,seed:15}),
  prospect({id:'prospect-devon-sutter',name:'Devon Sutter',age:31,hometown:'Fort Wayne, IN',racingBackground:'Experienced regional crew-driver',currentSeries:'Midwest Stock Championship',overall:67,potential:67,archetypes:['Reliable Journeyman','Complete Driver'],salaryDemand:96_000,preferredTerm:1,baseInterest:57,roleExpectation:'Flexible',dealbreakers:['One-year term preferred'],blockingDealbreaker:'none',competingPressure:'Low',developmentOutlook:'Minimal growth, maximum reliability.',recruitingPullSensitivity:0,manufacturerFit:['chevrolat','toyoda','fard'],trackStrengths:['Intermediate','Long Oval'],minimumReputation:40,regionalProspect:true,shortTrackProspect:false,seed:16}),
  prospect({id:'prospect-arden-knox',name:'Arden Knox',age:21,hometown:'Reno, NV',racingBackground:'High-desert speedway racer',currentSeries:'Nevada Pro Stocks',overall:57,potential:69,archetypes:['Superspeedway Specialist','Long Run Driver'],salaryDemand:52_000,preferredTerm:2,baseInterest:48,roleExpectation:'Reserve / Development',dealbreakers:['Wants competitive equipment access'],blockingDealbreaker:'none',competingPressure:'Medium',developmentOutlook:'Calm in traffic and improving over long runs.',recruitingPullSensitivity:1,manufacturerFit:['toyoda','chevrolat'],trackStrengths:['Superspeedway','Long Oval'],minimumReputation:41,regionalProspect:true,shortTrackProspect:false,seed:17}),
  prospect({id:'prospect-malcolm-pryor',name:'Malcolm Pryor',age:24,hometown:'Baltimore, MD',racingBackground:'Road-course club champion',currentSeries:'Eastern Touring Cars',overall:63,potential:71,archetypes:['Road Course Specialist','Reliable Journeyman'],salaryDemand:76_000,preferredTerm:2,baseInterest:42,roleExpectation:'Flexible',sponsorPackage:{label:'HarborTech Systems',projectedRaceBacking:{minimum:3_500,maximum:6_500},conditions:['Road-course appearances valued']},dealbreakers:['Requires honest role expectations'],blockingDealbreaker:'none',competingPressure:'High',developmentOutlook:'Mature technique with remaining upside.',recruitingPullSensitivity:2,manufacturerFit:['chevrolat','toyoda'],trackStrengths:['Road Course'],minimumReputation:50,regionalProspect:false,shortTrackProspect:false,seed:18}),
  prospect({id:'prospect-beck-rowan',name:'Beck Rowan',age:18,hometown:'Asheville, NC',racingBackground:'Mountain late-model rookie',currentSeries:'Carolina Development Tour',overall:48,potential:80,archetypes:['Development Prospect','Short Track Specialist'],salaryDemand:32_000,preferredTerm:3,baseInterest:64,roleExpectation:'Reserve / Development',personalFundingPackage:9_000,dealbreakers:['Development role must be protected'],blockingDealbreaker:'none',competingPressure:'Medium',developmentOutlook:'Long project with exceptional potential.',recruitingPullSensitivity:3,manufacturerFit:['chevrolat','fard'],trackStrengths:['Short Track'],minimumReputation:36,regionalProspect:true,shortTrackProspect:true,seed:19}),
  prospect({id:'prospect-tobin-wells',name:'Tobin Wells',age:23,hometown:'Little Rock, AR',racingBackground:'Central states stock-car winner',currentSeries:'Delta Stock Tour',overall:60,potential:66,archetypes:['Complete Driver','Aggressive Driver'],salaryDemand:62_000,preferredTerm:1,baseInterest:69,roleExpectation:'Flexible',dealbreakers:['Wants a clear seat-opportunity path'],blockingDealbreaker:'none',competingPressure:'Low',developmentOutlook:'Affordable all-rounder with strong motivation.',recruitingPullSensitivity:0,manufacturerFit:['chevrolat'],trackStrengths:['Intermediate','Short Track'],minimumReputation:38,regionalProspect:true,shortTrackProspect:true,seed:20}),
];

export function getRecruitingPullAdjustment(recruitingPull: number) {
  return Math.max(-10, Math.min(10, Math.round((recruitingPull - 50) * 0.2)));
}

export function getVisibilityAdjustment(visibility: number) {
  return Math.max(-3, Math.min(5, Math.round((visibility - 50) / 10)));
}

export function createProspectProgress(
  prospect: RecruitingProspect,
  recruitingPull: number,
  visibility: number,
): ProspectRecruitingProgress {
  return {
    prospectId: prospect.id,
    scoutingConfidence: 0,
    interest: Math.max(
      0,
      Math.min(
        100,
        prospect.baseInterest +
          getRecruitingPullAdjustment(recruitingPull) +
          getVisibilityAdjustment(visibility),
      ),
    ),
    engagement: 0,
    completedActionUses: {},
    actionsUsedThisWeekend: [],
    weeklyActionCount: 0,
    actionHistory: [],
    relationshipPaths: [],
    offerHistory: [],
    offerCooldown: false,
    signed: false,
    recruitingCostToDate: { rp: 0, cash: 0 },
  };
}

export function createInitialRecruitingState(
  recruitingPull: number,
  brandPower: number,
): RecruitingState {
  const visibility = Math.max(0, Math.min(100, brandPower));
  const prospects = prototypeProspects.map((item) => ({
    ...item,
    stats: { ...item.stats },
    archetypes: [...item.archetypes],
    manufacturerFit: [...item.manufacturerFit],
    trackStrengths: [...item.trackStrengths],
    dealbreakers: [...item.dealbreakers],
    ...(item.sponsorPackage
      ? {
          sponsorPackage: {
            ...item.sponsorPackage,
            projectedRaceBacking: {
              ...item.sponsorPackage.projectedRaceBacking,
            },
            conditions: [...item.sponsorPackage.conditions],
          },
        }
      : {}),
  })) as RecruitingProspect[];

  return {
    spendableRp: recruitingTuning.startingRp,
    visibility,
    prospects,
    campaigns: Object.fromEntries(
      prospects.map((item) => [
        item.id,
        createProspectProgress(item, recruitingPull, visibility),
      ]),
    ),
    processedTransactionIds: [],
  };
}
