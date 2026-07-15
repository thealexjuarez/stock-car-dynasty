import { View } from 'react-native';
import { AppText } from './app-text';
import { theme } from '@/theme';

export function ProgressBar({ value, max, label }: { value:number; max:number; label:string }) {
  const percent=Math.min(100, Math.round((value/max)*100));
  return <View style={{ gap:theme.spacing.sm }}><View style={{ flexDirection:'row',justifyContent:'space-between',gap:theme.spacing.md }}><AppText variant="caption">{label}</AppText><AppText variant="caption" tone="soft" style={{ fontVariant:['tabular-nums'] }}>{value.toLocaleString()} / {max.toLocaleString()}</AppText></View><View style={{ backgroundColor:theme.colors.panel,borderRadius:999,height:10,overflow:'hidden' }}><View style={{ backgroundColor:theme.colors.caution,borderRadius:999,height:'100%',width:`${percent}%` }} /></View></View>;
}
