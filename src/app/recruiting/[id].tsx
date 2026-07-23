import { useLocalSearchParams } from 'expo-router';

import { ProspectProfileScreen } from '@/screens/prospect-profile-screen';

export default function ProspectRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProspectProfileScreen prospectId={id} />;
}
