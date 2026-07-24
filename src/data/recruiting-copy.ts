import type {
  RecruitingActionId,
  RecruitingCategory,
} from '@/types/recruiting';

export type RecruitingActionGroup =
  | 'Scouting'
  | 'Direct Contact'
  | 'Social'
  | 'Relationship'
  | 'Evaluation'
  | 'Offer Preparation';

export const recruitingActionCopy: Record<
  RecruitingActionId,
  { purpose: string; group: RecruitingActionGroup }
> = {
  'text-dm': {
    purpose: 'Open a direct line and show genuine early interest.',
    group: 'Direct Contact',
  },
  'social-follow': {
    purpose: 'Have Ava Larkin put Apex on the driver’s radar with a light social touch.',
    group: 'Social',
  },
  'scout-report': {
    purpose: 'Learn the basics of the driver’s pace, background, and outlook.',
    group: 'Scouting',
  },
  'crew-chief-call': {
    purpose: 'Let Ray Hollis explain how this driver could fit the race team.',
    group: 'Relationship',
  },
  'watch-race-tape': {
    purpose: 'Study the driver’s habits and add detail to the evaluation.',
    group: 'Evaluation',
  },
  'driver-highlight': {
    purpose: 'Give the driver a public spotlight and build prospect engagement.',
    group: 'Social',
  },
  'owner-call': {
    purpose: 'Show that Apex leadership is serious about the relationship.',
    group: 'Direct Contact',
  },
  'background-check': {
    purpose: 'Check the off-track fit and surface possible concerns.',
    group: 'Scouting',
  },
  'behind-scenes-feature': {
    purpose: 'Bring the driver into the Apex story with a shop-focused feature.',
    group: 'Social',
  },
  'sponsor-research': {
    purpose: 'Learn whether personal backing or sponsor obligations may follow.',
    group: 'Scouting',
  },
  'pitch-seat': {
    purpose: 'Explain the Reserve / Development seat and the path attached to it.',
    group: 'Offer Preparation',
  },
  'fan-poll': {
    purpose: 'Build public support around the prospect without making a promise.',
    group: 'Social',
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
    group: 'Offer Preparation',
  },
  'sponsor-intro': {
    purpose: 'Connect the prospect with an active Apex partner.',
    group: 'Relationship',
  },
  'film-session': {
    purpose: 'Review race decisions together and sharpen the evaluation.',
    group: 'Evaluation',
  },
  'pitch-growth': {
    purpose: 'Show how Apex plans to become more competitive with the driver.',
    group: 'Offer Preparation',
  },
  'spotlight-video': {
    purpose: 'Produce a focused driver story that raises engagement and visibility.',
    group: 'Social',
  },
  'sponsor-feature': {
    purpose: 'Pair the prospect with a sponsor-backed feature and deepen alignment.',
    group: 'Social',
  },
  'race-weekend-visit': {
    purpose: 'Let the prospect see the team operate under race-weekend pressure.',
    group: 'Evaluation',
  },
  'sim-session': {
    purpose: 'Evaluate feedback and decision-making in a controlled session.',
    group: 'Evaluation',
  },
  'manufacturer-pitch': {
    purpose: 'Explain how the Chevrolat relationship supports the driver’s path.',
    group: 'Offer Preparation',
  },
  'full-development-plan': {
    purpose: 'Make the complete coaching, review, and investment commitment.',
    group: 'Offer Preparation',
  },
  'private-test-day': {
    purpose: 'Run the deepest pre-signing evaluation at meaningful RP and cash cost.',
    group: 'Evaluation',
  },
  'contract-offer': {
    purpose: 'Sign the driver now once every visible requirement is satisfied.',
    group: 'Offer Preparation',
  },
};

export const recruitingActionGroups: RecruitingActionGroup[] = [
  'Scouting',
  'Direct Contact',
  'Social',
  'Relationship',
  'Evaluation',
  'Offer Preparation',
];

export function getRecruitingActionGroup(category: RecruitingCategory) {
  if (category === 'Scouting') return 'Scouting';
  if (category === 'Direct Contact') return 'Direct Contact';
  if (category === 'Social' || category === 'Social / Sponsor') return 'Social';
  if (category === 'Relationship' || category === 'Visit') return 'Relationship';
  if (category === 'Evaluation' || category === 'Evaluation / Visit') return 'Evaluation';
  return 'Offer Preparation';
}
