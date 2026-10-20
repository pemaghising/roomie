import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { F } from '@/constants/theme';

/**
 * "Up for grabs" at a glance: how many chores a roommate missed, the first one, and a one-tap Claim.
 * The card opens the full list on the Chores tab; the Claim button takes the first chore without leaving Home.
 */
export function GrabCard({ count, title, sub, onClaim, onOpen }: { count: number; title: string; sub: string; onClaim?: () => void; onOpen: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${count} up for grabs. ${title}. ${sub}`} onPress={onOpen} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.emoji}><Text style={{ fontSize: 22 }}>🙌</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{count} UP FOR GRABS</Text>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.sub} numberOfLines={1}>{sub}</Text>
      </View>
      {onClaim ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Claim ${title}`} hitSlop={8} onPress={onClaim} style={({ pressed }) => [styles.claim, pressed && { transform: [{ scale: 0.95 }] }]}>
          <Text style={styles.claimText}>Claim</Text>
        </Pressable>
      ) : <Ionicons name="chevron-forward" size={20} color="#9A3412" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFEDD5', borderRadius: 22, padding: 12, borderWidth: 1.5, borderColor: '#FDBA74' },
  emoji: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, letterSpacing: 1, color: '#9A3412', fontFamily: F.bold },
  title: { fontSize: 15, color: '#7C2D12', fontFamily: F.bold, marginTop: 1 },
  sub: { fontSize: 12, color: '#9A3412', fontFamily: F.regular, marginTop: 1 },
  claim: { backgroundColor: '#111827', borderRadius: 18, paddingHorizontal: 16, height: 36, alignItems: 'center', justifyContent: 'center' },
  claimText: { color: '#FFF', fontSize: 14, fontFamily: F.bold },
});
