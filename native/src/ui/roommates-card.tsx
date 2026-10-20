import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { F } from '@/constants/theme';
import { Avatar } from './avatar';
import { C } from './kit';
import { Ring } from './ring';

export interface Mate { user_id: string; name: string; color: string; avatar_path?: string | null; today: number; done: number }

/** A fully-done ring turns brand purple, light to deep. */
const PURPLE = ['#C4B5FD', '#8B5CF6', '#5B21B6'] as const;

/** Darken a #rrggbb colour so a pastel member colour is strong enough to draw a ring with. */
export const shade = (hex: string, amount = 0.38) => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  if (Number.isNaN(n)) return '#7C3AED';
  const ch = (v: number) => Math.round(v * (1 - amount)).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};

/** Who has finished today, in member order and never ranked: an avatar in a progress ring, a check once someone is all done. */
export function RoommatesCard({ people, me, canInvite, onInvite, onCheer }: { people: Mate[]; me: string; canInvite: boolean; onInvite: () => void; onCheer: (userId: string) => void }) {
  return (
    <View style={styles.card}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {people.map((p) => {
          const finished = p.today > 0 && p.done === p.today;
          return (
            <Pressable key={p.user_id} disabled={p.user_id === me} onPress={() => onCheer(p.user_id)} style={({ pressed }) => [styles.mate, pressed && { opacity: 0.6 }]}
              accessibilityRole={p.user_id === me ? undefined : 'button'} accessibilityHint={p.user_id === me ? undefined : 'Send a cheer'}
              accessibilityLabel={`${p.user_id === me ? 'You' : p.name}: ${p.today === 0 ? 'no chores today' : `${p.done} of ${p.today} done`}`}>
              <View>
                <Ring value={p.done} total={p.today} size={52} stroke={3} color={shade(p.color)} gradient={finished ? PURPLE : undefined}>
                  <Avatar name={p.name} color={p.color} path={p.avatar_path} size={40} />
                </Ring>
                {finished && <View style={styles.check}><Ionicons name="checkmark" size={12} color="#FFF" /></View>}
              </View>
              <Text style={styles.name} numberOfLines={1}>{p.user_id === me ? 'You' : p.name.split(' ')[0]}</Text>
              <Text style={[styles.count, finished && { color: '#15803D' }]}>{p.today === 0 ? 'free' : `${p.done}/${p.today}`}</Text>
            </Pressable>
          );
        })}
        {canInvite && (
          <Pressable accessibilityRole="button" accessibilityLabel="Invite a roommate" onPress={onInvite} style={({ pressed }) => [styles.mate, pressed && { opacity: 0.6 }]}>
            <View style={styles.invite}><Ionicons name="add" size={22} color={C.sub} /></View>
            <Text style={styles.name}>Invite</Text>
            <Text style={styles.count}> </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 10, borderWidth: 1, borderColor: C.line,
    shadowColor: '#4C1D95', shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  row: { paddingHorizontal: 14, gap: 4 },
  mate: { alignItems: 'center', width: 68, gap: 2 },
  check: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13, color: C.text, fontFamily: F.bold, marginTop: 2 },
  count: { fontSize: 12, color: C.sub, fontFamily: F.medium },
  invite: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
});
