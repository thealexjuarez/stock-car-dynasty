export type TabKey = 'home' | 'team' | 'market' | 'race' | 'league';

export type BadgeTone = 'red' | 'yellow' | 'green' | 'blue' | 'neutral';

export type TabDefinition = {
  key: TabKey;
  title: string;
  purpose: string;
  icon: {
    ios: string;
    android: string;
    web: string;
  };
};

export type PlaceholderSection = {
  title: string;
  badge: string;
  badgeTone: BadgeTone;
  rows: string[];
};
