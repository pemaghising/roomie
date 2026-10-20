import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { effortLabel } from '@domain/copy.ts';
import { F } from '@/constants/theme';
import type { Assignment, Chore } from '@/lib/types';
import { Avatar } from './avatar';
import { C } from './kit';

export const EFFORT = {
  Light: { bg: '#D1FAE5', text: '#065F46' }, // brand mint
  Medium: { bg: '#FEF3C7', text: '#92400E' }, // brand butter
  Heavy: { bg: '#FEE2E2', text: '#991B1B' }, // brand soft pink
} as const;

/** One chore card. `onToggle` makes it a checklist row; `onClaim` makes it a pool row with a Claim button. */
export function TaskRow({ a, chore, sub, showEffort, readOnly, badge, onToggle, onClaim, onInfo }: {
  a: Assignment; chore?: Chore; sub?: string; showEffort?: boolean; readOnly?: boolean; badge?: ReactNode; onToggle?: () => void; onClaim?: () => void; onInfo?: () => void;
}) {
  const done = a.status === 'done';
  const effort = EFFORT[effortLabel(a.effort)];
  const name = chore?.name ?? 'Chore';
  return (
    <Pressable
      accessibilityRole={onToggle ? 'checkbox' : undefined} accessibilityState={onToggle ? { checked: done } : undefined}
      accessibilityLabel={name} disabled={!onToggle} onPress={onToggle}
      style={({ pressed }) => [styles.card, onClaim && styles.pool, pressed && { transform: [{ scale: 0.98 }] }]}>
      <View style={[styles.icon, { backgroundColor: done ? C.lavender : effort.bg }]}><Text style={{ fontSize: 20 }}>{chore?.icon ?? '✨'}</Text></View>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={[styles.name, done && styles.done]} numberOfLines={2}>{name}</Text>
        {showEffort && (
          <View style={[styles.chip, { backgroundColor: effort.bg }]}><Text style={[styles.chipText, { color: effort.text }]}>{effortLabel(a.effort)}</Text></View>
        )}
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {onInfo && (
        <Pressable accessibilityRole="button" accessibilityLabel={`Why ${name}`} hitSlop={10} onPress={onInfo}>
          <Ionicons name="information-circle-outline" size={20} color={C.faint} />
        </Pressable>
      )}
      {onClaim ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Claim ${name}`} onPress={onClaim} hitSlop={6}
          style={({ pressed }) => [styles.claim, pressed && { transform: [{ scale: 0.95 }] }]}>
          <Text style={styles.claimText}>Claim</Text>
        </Pressable>
      ) : badge ? badge : readOnly && !done ? null : (
        <View style={[styles.check, done && styles.checkOn]}>{done && <Text style={styles.tick}>✓</Text>}</View>
      )}
    </Pressable>
  );
}

/** Who a chore belongs to: their avatar, with a small check once it is done. */
export function AssigneeBadge({ name, color, path, done }: { name: string; color: string; path?: string | null; done: boolean }) {
  return (
    <View accessible accessibilityLabel={done ? `${name}, done` : name}>
      <Avatar name={name} color={color} path={path} size={34} />
      {done && <View style={styles.badgeCheck}><Ionicons name="checkmark" size={10} color="#FFF" /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeCheck: { position: 'absolute', right: -3, bottom: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  pool: { backgroundColor: C.peach, borderColor: C.peach },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, color: C.text, fontFamily: F.semibold },
  done: { textDecorationLine: 'line-through', color: C.faint, fontFamily: F.medium },
  sub: { fontSize: 13, color: C.sub, fontFamily: F.regular },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 12, fontFamily: F.semibold },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: C.text, borderColor: C.text },
  tick: { color: '#FFF', fontSize: 14, fontFamily: F.bold },
  claim: { backgroundColor: C.text, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  claimText: { color: '#FFF', fontSize: 14, fontFamily: F.semibold },
});
