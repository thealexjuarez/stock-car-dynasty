import type { PlaceholderSection, TabDefinition } from '@/types/shell';

export const tabs: TabDefinition[] = [
  {
    key: 'home',
    title: 'Home',
    purpose: 'Interactive team hub, campus, and next action',
    icon: { ios: 'house.fill', android: 'home', web: 'house.fill' },
  },
  {
    key: 'team',
    title: 'Team',
    purpose: 'Drivers, staff, vehicles, facilities, and finances',
    icon: { ios: 'person.3.fill', android: 'groups', web: 'person.3.fill' },
  },
  {
    key: 'market',
    title: 'Market',
    purpose: 'Recruiting, sponsors, staff market, and manufacturer',
    icon: { ios: 'chart.line.uptrend.xyaxis', android: 'storefront', web: 'chart.line.uptrend.xyaxis' },
  },
  {
    key: 'race',
    title: 'Race',
    purpose: 'Calendar, next event, and race weekend flow',
    icon: { ios: 'flag.checkered', android: 'sports_score', web: 'flag.checkered' },
  },
  {
    key: 'league',
    title: 'League',
    purpose: 'Standings, points, schedule, results, and rival teams',
    icon: { ios: 'trophy.fill', android: 'emoji_events', web: 'trophy.fill' },
  },
];

export const placeholderSections: Record<string, PlaceholderSection[]> = {
  home: [
    {
      title: 'Garage Campus',
      badge: 'Hub',
      badgeTone: 'red',
      rows: ['Team command center', 'Next decision board', 'Weekly overview'],
    },
    {
      title: 'Next Action',
      badge: 'Ready',
      badgeTone: 'green',
      rows: ['Review race prep', 'Check team priorities', 'Open expansion lane'],
    },
  ],
  team: [
    {
      title: 'Roster',
      badge: 'Team',
      badgeTone: 'blue',
      rows: ['Drivers', 'Crew chiefs', 'Pit crew and staff'],
    },
    {
      title: 'Operations',
      badge: 'Garage',
      badgeTone: 'neutral',
      rows: ['Vehicles', 'Facilities', 'Finances'],
    },
  ],
  market: [
    {
      title: 'Opportunities',
      badge: 'Live',
      badgeTone: 'yellow',
      rows: ['Recruiting board', 'Sponsor conversations', 'Staff market'],
    },
    {
      title: 'Partners',
      badge: 'Fit',
      badgeTone: 'blue',
      rows: ['Manufacturer alignment', 'Program identity', 'Long-term offers'],
    },
  ],
  race: [
    {
      title: 'Race Week',
      badge: 'Event',
      badgeTone: 'red',
      rows: ['Calendar', 'Next event', 'Weekend checklist'],
    },
    {
      title: 'Flow',
      badge: 'Soon',
      badgeTone: 'neutral',
      rows: ['Practice', 'Qualifying', 'Race day'],
    },
  ],
  league: [
    {
      title: 'Championship',
      badge: 'Points',
      badgeTone: 'yellow',
      rows: ['Standings', 'Schedule', 'Season stats'],
    },
    {
      title: 'Archive',
      badge: 'History',
      badgeTone: 'neutral',
      rows: ['Results', 'Records', 'League timeline'],
    },
  ],
};
