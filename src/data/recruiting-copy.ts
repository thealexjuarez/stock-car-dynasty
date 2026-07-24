import type {
  RecruitingActionId,
  RecruitingCategory,
} from '@/types/recruiting';

export type RecruitingActionGroup =
  | 'All'
  | 'Scout'
  | 'Recruit'
  | 'Relationship'
  | 'Offer';

export const recruitingActionCopy: Record<
  RecruitingActionId,
  { purpose: string; group: Exclude<RecruitingActionGroup, 'All'> }
> = {
  'text-dm': {
    purpose: 'Open a direct line and show genuine early interest.',
    group: 'Recruit',
  },
  'social-follow': {
    purpose: 'Have Ava Larkin put Apex on the driver’s radar with a light social touch.',
    group: 'Recruit',
  },
  'scout-report': {
    purpose: 'Learn the basics of the driver’s pace, background, and outlook.',
    group: 'Scout',
  },
  'film-review': {
    purpose: 'Review more race footage to keep building the scouting report.',
    group: 'Scout',
  },
  'crew-chief-call': {
    purpose: 'Let Ray Hollis explain how this driver could fit the race team.',
    group: 'Relationship',
  },
  'watch-race-tape': {
    purpose: 'Study the driver’s habits and add detail to the evaluation.',
    group: 'Scout',
  },
  'driver-highlight': {
    purpose: 'Give the driver a public spotlight and build prospect engagement.',
    group: 'Recruit',
  },
  'owner-call': {
    purpose: 'Show that Apex leadership is serious about the relationship.',
    group: 'Recruit',
  },
  'background-check': {
    purpose: 'Check the off-track fit and surface possible concerns.',
    group: 'Scout',
  },
  'behind-scenes-feature': {
    purpose: 'Bring the driver into the Apex story with a shop-focused feature.',
    group: 'Recruit',
  },
  'sponsor-research': {
    purpose: 'Learn whether personal backing or sponsor obligations may follow.',
    group: 'Scout',
  },
  'pitch-seat': {
    purpose: 'Explain the Reserve / Development seat and the path attached to it.',
    group: 'Offer',
  },
  'fan-poll': {
    purpose: 'Build public support around the prospect without making a promise.',
    group: 'Recruit',
  },
  'pitch-stability': {
    purpose: 'Sell the value of a steady team and a clear long-term direction.',
    group: 'Relationship',
  },
  'shop-tour': {
    purpose: 'Show the prospect where the team works and who will support them.',
    group: 'Relationship',
  },
  'pitch-development': {
    purpose: 'Outline a practical development plan with coaching and reviews.',
    group: 'Offer',
  },
  'sponsor-intro': {
    purpose: 'Connect the prospect with an active Apex partner.',
    group: 'Relationship',
  },
  'film-session': {
    purpose: 'Review race decisions together and sharpen the evaluation.',
    group: 'Scout',
  },
  'pitch-growth': {
    purpose: 'Show how Apex plans to become more competitive with the driver.',
    group: 'Offer',
  },
  'spotlight-video': {
    purpose: 'Produce a focused driver story that raises engagement and visibility.',
    group: 'Recruit',
  },
  'sponsor-feature': {
    purpose: 'Pair the prospect with a sponsor-backed feature and deepen alignment.',
    group: 'Relationship',
  },
  'race-weekend-visit': {
    purpose: 'Let the prospect see the team operate under race-weekend pressure.',
    group: 'Relationship',
  },
  'sim-session': {
    purpose: 'Evaluate feedback and decision-making in a controlled session.',
    group: 'Scout',
  },
  'manufacturer-pitch': {
    purpose: 'Explain how the Chevrolat relationship supports the driver’s path.',
    group: 'Offer',
  },
  'full-development-plan': {
    purpose: 'Make the complete coaching, review, and investment commitment.',
    group: 'Offer',
  },
  'private-test-day': {
    purpose: 'Run the deepest pre-signing evaluation at meaningful RP and cash cost.',
    group: 'Scout',
  },
  'contract-offer': {
    purpose: 'Sign the driver now once every visible requirement is satisfied.',
    group: 'Offer',
  },
};

export const recruitingActionGroups: RecruitingActionGroup[] = [
  'All',
  'Scout',
  'Recruit',
  'Relationship',
  'Offer',
];

export function getRecruitingActionGroup(
  category: RecruitingCategory,
): Exclude<RecruitingActionGroup, 'All'> {
  if (
    category === 'Scouting' ||
    category === 'Evaluation' ||
    category === 'Evaluation / Visit'
  ) {
    return 'Scout';
  }
  if (category === 'Direct Contact' || category === 'Social') return 'Recruit';
  if (
    category === 'Relationship' ||
    category === 'Visit' ||
    category === 'Social / Sponsor'
  ) {
    return 'Relationship';
  }
  return 'Offer';
}
