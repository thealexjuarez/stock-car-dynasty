import { useLocalSearchParams } from 'expo-router';

import { RecruitingOfferScreen } from '@/screens/recruiting-offer-screen';

export default function RecruitingOfferRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RecruitingOfferScreen prospectId={id} />;
}
