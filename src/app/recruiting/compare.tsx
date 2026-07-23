import { useLocalSearchParams } from 'expo-router';

import { ProspectComparisonScreen } from '@/screens/prospect-comparison-screen';

export default function ProspectComparisonRoute() {
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  return <ProspectComparisonScreen prospectIds={ids?.split(',') ?? []} />;
}
