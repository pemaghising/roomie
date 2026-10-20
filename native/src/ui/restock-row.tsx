import { Pressable, StyleSheet, Text, View } from 'react-native';
import { effortLabel } from '@domain/copy.ts';
import type { Restock } from '@domain/pantry.ts';
import { F } from '@/constants/theme';
import { C } from './kit';
import { EFFORT } from './task-row';

/** An open restock request in the Up for grabs pool: Claim reserves it, Done completes it, the requester can Cancel. */
export function RestockRow({ r, me, requester, claimerName, onClaim, onUnclaim, onDone, onCancel }: {
  r: Restock; me: string; requester: string; claimerName?: string;
  onClaim: () => void; onUnclaim: () => void; onDone: () => void; onCancel: () => void;
}) {
  const effort = EFFORT[effortLabel(r.effort)];
  const mineClaim = r.claimed_by === me;
  const sub = r.requested_by === me ? 'Requested by you' : `Requested by ${requester}`;
  const claimed = r.claimed_by ? (mineClaim ? "You're on it" : `${claimerName ?? 'A roommate'}'s on it`) : null;
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: effort.bg }]}><Text style={{ fontSize: 22 }}>🛒</Text></View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={styles.name} numberOfLines={2}>Buy {r.name}</Text>
          <View style={[styles.chip, { backgroundColor: effort.bg }]}><Text style={[styles.chipText, { color: effort.text }]}>{effortLabel(r.effort)}</Text></View>
          <Text style={styles.sub}>{claimed ? `${sub} · ${claimed}` : sub}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {r.claimed_by === null && <Btn label="Claim" onPress={onClaim} />}
        {mineClaim && <Btn label="Unclaim" ghost onPress={onUnclaim} />}
        {(r.claimed_by === null || mineClaim) && <Btn label="Done" onPress={onDone} dark />}
        {r.requested_by === me && <Btn label="Cancel" ghost onPress={onCancel} />}
      </View>
    </View>
  );
}

const Btn = ({ label, onPress, dark, ghost }: { label: string; onPress: () => void; dark?: boolean; ghost?: boolean }) => (
  <Pressable accessibilityRole="button" onPress={onPress} hitSlop={4}
    style={({ pressed }) => [styles.btn, dark && styles.btnDark, ghost && styles.btnGhost, pressed && { transform: [{ scale: 0.96 }] }]}>
    <Text style={[styles.btnText, dark && { color: '#FFF' }, ghost && { color: C.sub }]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: { backgroundColor: C.peach, borderRadius: 22, padding: 16, gap: 12, marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, color: C.text, fontFamily: F.semibold },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 12, fontFamily: F.semibold },
  sub: { fontSize: 13, color: C.sub, fontFamily: F.regular },
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' },
  btn: { paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  btnDark: { backgroundColor: C.text },
  btnGhost: { backgroundColor: 'transparent' },
  btnText: { fontSize: 14, color: C.text, fontFamily: F.semibold },
});

/** A restock request I claimed, shown as an errand in Today's Tasks: tap the circle once it is bought. */
export function RestockTaskRow({ r, requester, onDone, onUnclaim }: { r: Restock; requester: string; onDone: () => void; onUnclaim: () => void }) {
  const effort = EFFORT[effortLabel(r.effort)];
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: false }} accessibilityLabel={`Buy ${r.name}`} onPress={onDone}
      onLongPress={onUnclaim} style={({ pressed }) => [taskStyles.card, pressed && { transform: [{ scale: 0.98 }] }]}>
      <View style={[taskStyles.icon, { backgroundColor: effort.bg }]}><Text style={{ fontSize: 20 }}>🛒</Text></View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={taskStyles.name} numberOfLines={2}>Buy {r.name}</Text>
        <Text style={taskStyles.sub}>Requested by {requester} · hold to give it back</Text>
      </View>
      <View style={taskStyles.check} />
    </Pressable>
  );
}

const taskStyles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, color: C.text, fontFamily: F.semibold },
  sub: { fontSize: 12, color: C.sub, fontFamily: F.regular },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#D1D5DB' },
});
