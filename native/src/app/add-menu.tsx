// H8 · Add menu: what the gradient + opens.
import { useRouter } from 'expo-router';
import { ClipboardList, ShoppingBag, ShoppingCart, UserPlus, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { color } from '@/ui/tokens';
import { Sheet, Tap, Txt } from '@/ui/v2';

const OPTIONS: { icon: LucideIcon; title: string; sub: string; href: string }[] = [
  { icon: ClipboardList, title: 'Chore', sub: 'Effort, rotation, who', href: '/add-chore' },
  { icon: ShoppingBag, title: 'Pantry item', sub: 'Shared or just yours', href: '/add-item' },
  { icon: ShoppingCart, title: 'Restock', sub: 'Running low? Ask', href: '/restock' },
  { icon: UserPlus, title: 'Invite', sub: 'Bring a roommate in', href: '/invite' },
];

export default function AddMenu() {
  const router = useRouter();
  const go = (href: string) => { router.back(); setTimeout(() => router.push(href as never), 120); };
  return (
    <Sheet onClose={() => router.back()} title="Add to your home" sub="What are we adding today?">
      <View style={styles.grid}>
        {OPTIONS.map((o) => (
          <Tap key={o.title} onPress={() => go(o.href)} style={styles.cell} accessibilityLabel={`${o.title}. ${o.sub}`}>
            <View style={styles.opt}>
              <View style={styles.icon}><o.icon size={20} color={color.text.onAccent} strokeWidth={1.75} /></View>
              <View style={{ gap: 2 }}>
                <Txt v="Body/Row">{o.title}</Txt>
                <Txt v="Meta" c={color.text.secondary}>{o.sub}</Txt>
              </View>
            </View>
          </Tap>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47.5%', flexGrow: 1 },
  opt: { borderRadius: 24, padding: 16, gap: 16, minHeight: 136, backgroundColor: 'rgba(135,107,222,0.07)', borderWidth: 1, borderColor: 'rgba(135,107,222,0.12)' },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.action.primary, alignItems: 'center', justifyContent: 'center' },
});
