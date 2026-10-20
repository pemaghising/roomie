import { Pressable, StyleSheet, Text, View } from 'react-native';
import { iconFor, tintFor } from '@domain/pantry.ts';
import { F } from '@/constants/theme';
import { tintHex } from '@/lib/pantry';
import { C } from './kit';

export function Tag({ label, tone }: { label: string; tone: { bg: string; fg: string } }) {
  return <View style={[styles.tag, { backgroundColor: tone.bg }]}><Text style={[styles.tagText, { color: tone.fg }]}>{label}</Text></View>;
}

/** One pantry item card: icon tile, name, optional subline, optional right-hand tag. */
export function PantryRow({ name, sub, tag, onPress }: {
  name: string; sub?: string; tag?: { label: string; tone: { bg: string; fg: string } }; onPress?: () => void;
}) {
  const icon = iconFor(name);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress} disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}>
      <View style={[styles.tile, { backgroundColor: tintHex(tintFor(icon)) }]}><Text style={{ fontSize: 22 }}>{icon}</Text></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {tag && <Tag {...tag} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  tile: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, color: C.text, fontFamily: F.semibold },
  sub: { fontSize: 13, color: C.sub, fontFamily: F.regular },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 12, fontFamily: F.semibold },
});
