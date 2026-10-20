import { Pressable, StyleSheet, Text, View } from 'react-native';
import { iconFor, STOCK_LABEL, tintFor, type StockLevel } from '@domain/pantry.ts';
import { F } from '@/constants/theme';
import { tintHex } from '@/lib/pantry';
import { C } from './kit';
import { Tag } from './pantry-row';

const METER: Record<StockLevel, { filled: number; color: string; label: string }> = {
  in_stock: { filled: 3, color: '#22C55E', label: '#15803D' },
  low: { filled: 1, color: '#F59E0B', label: '#B45309' },
  out: { filled: 0, color: '#EF4444', label: '#B91C1C' },
};

/** Three pips: full shelf, running low, or empty. Never colour alone: the label says it too. */
function StockMeter({ stock }: { stock: StockLevel }) {
  const m = METER[stock];
  return (
    <View style={styles.meterRow} accessible accessibilityLabel={STOCK_LABEL[stock]}>
      <View style={styles.pips}>{[0, 1, 2].map((i) => <View key={i} style={[styles.pip, i < m.filled && { backgroundColor: m.color }]} />)}</View>
      <Text style={[styles.meterText, { color: m.label }]}>{STOCK_LABEL[stock]}</Text>
    </View>
  );
}

/** A pantry item as a two-column card: big emoji, name, then its stock meter, a rule tag, or a note. */
export function PantryTile({ name, stock, tag, sub, onPress }: {
  name: string; stock?: StockLevel; tag?: { label: string; tone: { bg: string; fg: string } }; sub?: string; onPress?: () => void;
}) {
  const icon = iconFor(name);
  const needs = stock === 'low' || stock === 'out';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress} disabled={!onPress}
      style={({ pressed }) => [styles.tile, needs && { borderColor: stock === 'out' ? '#FCA5A5' : '#FCD34D' }, pressed && { transform: [{ scale: 0.97 }] }]}>
      <View style={[styles.icon, { backgroundColor: tintHex(tintFor(icon)) }]}><Text style={{ fontSize: 26 }}>{icon}</Text></View>
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
      {stock ? <StockMeter stock={stock} /> : tag ? <Tag {...tag} /> : null}
      {sub ? <Text style={styles.sub} numberOfLines={2}>{sub}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { width: '48.2%', backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1.5, borderColor: C.line, padding: 14, gap: 8, minHeight: 148,
    shadowColor: '#4C1D95', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, lineHeight: 20, color: C.text, fontFamily: F.bold },
  meterRow: { gap: 5, marginTop: 'auto' },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#E5E7EB' },
  meterText: { fontSize: 12, fontFamily: F.semibold },
  sub: { fontSize: 12, lineHeight: 16, color: C.sub, fontFamily: F.regular },
});
