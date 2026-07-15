import { Link } from 'expo-router';
import { View } from 'react-native';
import { AppButton } from '@/components/shared/app-button';
import { AppCard } from '@/components/shared/app-card';
import { AppRow } from '@/components/shared/app-row';
import { AppText } from '@/components/shared/app-text';
import { Screen } from '@/components/shared/screen';
import { SectionHeader } from '@/components/shared/section-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { starterGameState } from '@/data/starter-game-state';
import { theme } from '@/theme';

export function TeamScreen() {
  const { team, drivers, vehicles, manufacturer }=starterGameState;
  return <Screen>
    <View style={{ gap:theme.spacing.sm }}><AppText variant="eyebrow" tone="accent">Team Operations</AppText><AppText variant="hero">Apex Motorsports</AppText><AppText tone="muted">Lower mid-pack ERCA team · {manufacturer.name} · two equal entries</AppText></View>
    <AppCard><SectionHeader title="Team Overview" subtitle="Where the program stands entering Week 1" /><AppRow label="Team Reputation" detail={`${team.reputation}`} /><AppRow label="Brand Power" detail={`${team.brandPower}`} /><AppRow label="Car Performance" detail={`${team.carPerformance}`} /><AppRow label="Team Morale" detail={`${team.morale}`} /></AppCard>
    <View style={{ gap:theme.spacing.md }}><SectionHeader title="Drivers" subtitle="Tap a driver to review ratings, archetypes, and development" />{drivers.map(d=><AppCard key={d.id}><View style={{ flexDirection:'row',justifyContent:'space-between',gap:theme.spacing.md }}><View style={{ flex:1,gap:theme.spacing.xs }}><AppText variant="title">{d.name}</AppText><AppText tone="muted" variant="caption">Car #{d.carNumber} · {d.archetypes.join(' / ')}</AppText></View><StatusBadge label={`OVR ${d.overall}`} tone="blue" /></View><Link href={{pathname:'/drivers/[id]',params:{id:d.id}}} asChild><AppButton label="View Driver Profile" variant="secondary" /></Link></AppCard>)}</View>
    <View style={{ gap:theme.spacing.md }}><SectionHeader title="Vehicles" subtitle="Car-specific condition and wear; upgrades apply evenly" />{vehicles.map(v=><AppCard key={v.id}><View style={{ flexDirection:'row',justifyContent:'space-between',gap:theme.spacing.md }}><AppText variant="title">Car #{v.number}</AppText><StatusBadge label={`${v.condition}% condition`} tone={v.condition>=90?'green':'yellow'} /></View><AppRow label="Performance" detail={`${v.performance}`} /><AppRow label="Assigned Driver" detail={drivers.find(d=>d.id===v.assignedDriverId)?.name} /><Link href={{pathname:'/vehicles/[number]',params:{number:v.number}}} asChild><AppButton label={`Open Car #${v.number}`} variant="secondary" /></Link></AppCard>)}</View>
  </Screen>;
}
